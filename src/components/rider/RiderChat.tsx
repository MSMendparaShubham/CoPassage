import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Shield } from 'lucide-react';
import { supabase } from '../../supabase';
import { RideMessage, AuthedUser } from '../../types';

interface RiderChatProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  user: AuthedUser;
  partnerName: string;
}

export const RiderChat: React.FC<RiderChatProps> = ({
  isOpen,
  onClose,
  postId,
  user,
  partnerName,
}) => {
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isOpen || !postId) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('ride_messages')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (data && !error) {
        setMessages(data as RideMessage[]);
        setTimeout(scrollToBottom, 100);
      }
    };

    fetchMessages();

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`chat_post_${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_messages',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const newMsg = payload.new as RideMessage;
          setMessages((prev) => [...prev, newMsg]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, postId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setInputText('');

    try {
      const { error } = await supabase.from('ride_messages').insert({
        post_id: postId,
        sender_uid: user.uid,
        sender_name: user.name,
        body: content,
      });

      if (error) {
        console.error('Failed to send message:', error);
      }
    } catch (err) {
      console.error('Send message exception:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full sm:max-w-md h-[85vh] sm:h-[600px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-4 bg-teal-waters text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-spring-meadow/20 flex items-center justify-center text-spring-meadow font-bold">
              {partnerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Co-Rider Chat</h3>
              <p className="text-xs text-glacial-sky flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                Coordinating with {partnerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Note */}
        <div className="px-4 py-2 bg-morning-mist border-b border-gray-200 flex items-center gap-2 text-xs text-teal-waters/80">
          <Shield className="w-3.5 h-3.5 text-teal-waters shrink-0" />
          <span>Keep coordination messages respectful. End-to-end coordinated for this ride only.</span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fbfbf6]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
              <p className="font-medium text-sm text-gray-600">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Send a quick message to coordinate your meeting point or auto identification!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_uid === user.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-baseline gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-gray-500">
                      {isMe ? 'You' : msg.sender_name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-xs ${
                      isMe
                        ? 'bg-teal-waters text-white rounded-tr-xs'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.body}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message (e.g. 'Waiting by the metro gate 2')..."
            className="flex-1 py-2.5 px-4 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-waters/30 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 bg-teal-waters hover:bg-teal-waters/90 text-spring-meadow rounded-xl disabled:opacity-40 transition-colors shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
