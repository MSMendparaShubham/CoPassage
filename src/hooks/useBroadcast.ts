import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { RiderPost, JoinRequest, AuthedUser } from '../types';
import { LocationCoordinates } from './useGeolocation';

export function useBroadcast(user: AuthedUser | null, coords: LocationCoordinates) {
  const [activePost, setActivePost] = useState<RiderPost | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<JoinRequest[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const coordsRef = useRef<LocationCoordinates>(coords);

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  // Start broadcasting a found auto
  const startBroadcast = useCallback(
    async (
      destLabel: string,
      totalFare: number,
      maxRiders: number = 3,
      destCoords?: LocationCoordinates | null
    ) => {
      if (!user) {
        setError('User not authenticated.');
        return null;
      }

      setError(null);
      try {
        const { data, error: insertError } = await supabase
          .from('rider_open_posts')
          .insert({
            host_uid: user.uid,
            host_name: user.name,
            host_phone: user.phone,
            origin_lat: coordsRef.current.lat,
            origin_lng: coordsRef.current.lng,
            dest_label: destLabel,
            dest_lat: destCoords ? destCoords.lat : null,
            dest_lng: destCoords ? destCoords.lng : null,
            current_lat: coordsRef.current.lat,
            current_lng: coordsRef.current.lng,
            total_fare: totalFare,
            max_riders: maxRiders,
            current_riders: 1,
            status: 'open',
            host_marked_complete: false,
            last_seen_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setActivePost(data as RiderPost);
        setIsBroadcasting(true);
        return data as RiderPost;
      } catch (err: any) {
        console.error('Failed to start broadcast:', err);
        setError(err.message || 'Could not start broadcast.');
        return null;
      }
    },
    [user]
  );

  // Stop / Cancel broadcasting
  const stopBroadcast = useCallback(async () => {
    if (!activePost) return;

    try {
      await supabase
        .from('rider_open_posts')
        .update({ status: 'cancelled' })
        .eq('id', activePost.id);
    } catch (err) {
      console.warn('Error cancelling broadcast:', err);
    } finally {
      setActivePost(null);
      setIsBroadcasting(false);
      setIncomingRequests([]);
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    }
  }, [activePost]);

  // Accept a join request
  const acceptRequest = useCallback(
    async (request: JoinRequest) => {
      if (!activePost) return;

      try {
        // 1. Accept the join request
        const { error: reqError } = await supabase
          .from('join_requests')
          .update({ status: 'accepted' })
          .eq('id', request.id);

        if (reqError) throw reqError;

        // 2. Mark post as matched
        const { error: postError } = await supabase
          .from('rider_open_posts')
          .update({ status: 'matched' })
          .eq('id', activePost.id);

        if (postError) throw postError;

        setActivePost((prev) => (prev ? { ...prev, status: 'matched' } : null));
      } catch (err: any) {
        console.error('Error accepting join request:', err);
        setError(err.message || 'Failed to accept request.');
      }
    },
    [activePost]
  );

  // Reject a join request
  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      await supabase
        .from('join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err: any) {
      console.error('Error rejecting join request:', err);
    }
  }, []);

  // Heartbeat loop: update location & last_seen_at every 10s
  useEffect(() => {
    if (!isBroadcasting || !activePost) return;

    const intervalId = window.setInterval(async () => {
      try {
        await supabase
          .from('rider_open_posts')
          .update({
            current_lat: coordsRef.current.lat,
            current_lng: coordsRef.current.lng,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', activePost.id);
      } catch (err) {
        console.warn('Heartbeat update failed:', err);
      }
    }, 10000);

    heartbeatTimerRef.current = intervalId;

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isBroadcasting, activePost?.id]);

  // Realtime subscription for incoming join requests
  useEffect(() => {
    if (!activePost) return;

    // Fetch initial pending requests
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('join_requests')
        .select('*')
        .eq('post_id', activePost.id);

      if (data) {
        setIncomingRequests(data as JoinRequest[]);
      }
    };
    fetchRequests();

    const channel = supabase
      .channel(`requests_post_${activePost.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests',
          filter: `post_id=eq.${activePost.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setIncomingRequests((prev) => [...prev, payload.new as JoinRequest]);
          } else if (payload.eventType === 'UPDATE') {
            setIncomingRequests((prev) =>
              prev.map((r) => (r.id === payload.new.id ? (payload.new as JoinRequest) : r))
            );
          } else if (payload.eventType === 'DELETE') {
            setIncomingRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePost?.id]);

  // Best-effort beforeunload cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activePost && isBroadcasting) {
        stopBroadcast();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activePost, isBroadcasting, stopBroadcast]);

  return {
    activePost,
    setActivePost,
    incomingRequests,
    isBroadcasting,
    error,
    startBroadcast,
    stopBroadcast,
    acceptRequest,
    rejectRequest,
  };
}
