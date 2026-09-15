import React, { useState, useEffect } from 'react';
import { Star, Send, SkipForward, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import { supabase } from '../../supabase';
import { AuthedUser } from '../../types';

interface ReviewScreenProps {
  user: AuthedUser;
  postId: string;
  partnerName: string;
  partnerUid: string;
  onDone: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  user,
  postId,
  partnerName,
  partnerUid,
  onDone,
}) => {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(true);

  // Check for existing review (handles page refresh / re-entry)
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const { data } = await supabase
          .from('rider_ratings')
          .select('id')
          .eq('post_id', postId)
          .eq('rater_uid', user.uid)
          .limit(1);

        if (data && data.length > 0) {
          // Already reviewed — skip straight to done
          onDone();
          return;
        }
      } catch (err) {
        console.warn('Duplicate check error:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    };
    checkExisting();
  }, [postId, user.uid]);

  const handleSubmit = async () => {
    if (stars === 0) return;
    setIsSubmitting(true);
    try {
      await supabase.from('rider_ratings').insert({
        post_id: postId,
        rater_uid: user.uid,
        rated_uid: partnerUid,
        stars,
        comment: comment.trim() || null,
      });
      setSubmitted(true);
      // Brief success flash, then exit
      setTimeout(onDone, 1200);
    } catch (err) {
      console.error('Failed to submit review:', err);
      // On error, still allow moving forward
      onDone();
    }
  };

  if (checkingDuplicate) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-teal-waters animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Review Submitted!</h3>
        <p className="text-sm text-gray-500">Thank you for helping build a safe community.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-slide-up">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-teal-waters px-6 py-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/15 flex items-center justify-center text-white font-bold text-2xl mb-3">
            {partnerName.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-lg font-bold text-white">How was your ride?</h3>
          <p className="text-xs text-glacial-sky mt-1">
            Rate your co-rider <span className="font-bold text-spring-meadow">{partnerName}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Clarification copy */}
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-morning-mist p-3 rounded-xl border border-teal-waters/10">
            <MessageSquare className="w-4 h-4 text-teal-waters shrink-0 mt-0.5" />
            <p>This reviews your <strong>fellow commuter</strong>, not the auto-rickshaw driver.</p>
          </div>

          {/* Star Rating */}
          <div className="text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Tap to rate
            </p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const isFilled = n <= (hoveredStar || stars);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    onMouseEnter={() => setHoveredStar(n)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        isFilled
                          ? 'fill-rickshaw-yellow text-rickshaw-yellow'
                          : 'fill-none text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {stars > 0 && (
              <p className="text-xs text-gray-500 mt-2 font-medium animate-fade-in">
                {stars === 5 && '⭐ Excellent co-rider!'}
                {stars === 4 && '👍 Great experience'}
                {stars === 3 && '😊 It was okay'}
                {stars === 2 && '😐 Could be better'}
                {stars === 1 && '😔 Not a great experience'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Feedback (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Punctual, friendly, good coordination..."
              rows={2}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-waters/40 focus:bg-white resize-none transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleSubmit}
              disabled={stars === 0 || isSubmitting}
              className="w-full h-12 bg-teal-waters hover:bg-logo-navy text-white font-bold text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
            </button>

            <button
              onClick={onDone}
              className="w-full h-10 text-gray-500 hover:text-gray-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
              <span>Skip Review</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
