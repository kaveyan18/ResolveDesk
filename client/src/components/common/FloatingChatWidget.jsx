import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { MessageCircle, X, Send, Loader2, Users } from 'lucide-react';

export default function FloatingChatWidget({ complaint, onCommentAdded }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState(complaint?.comments || []);
  const [typingUsers, setTypingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const complaintId = complaint?._id;

  // Sync initial comments
  useEffect(() => {
    if (complaint?.comments) {
      setComments(complaint.comments);
    }
  }, [complaint]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, comments, typingUsers, scrollToBottom]);

  // SOCKET.IO REAL-TIME INTEGRATION
  useEffect(() => {
    if (!complaintId || !user) return;

    const socket = getSocket();

    // 1. Join room
    socket.emit('join_complaint', { complaintId, user });

    // 2. Listen for incoming new messages
    const handleNewMessage = (data) => {
      if (data.complaintId === complaintId && data.comment) {
        setComments((prev) => {
          // Avoid duplicates if added locally
          if (prev.some((c) => c._id === data.comment._id)) return prev;
          const updated = [...prev, data.comment];
          if (onCommentAdded) onCommentAdded(updated);
          return updated;
        });
      }
    };

    // 3. Listen for typing indicators
    const handleUserTyping = (data) => {
      if (data.complaintId === complaintId && data.user._id !== user._id) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u._id === data.user._id)) return prev;
          return [...prev, data.user];
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.complaintId === complaintId) {
        setTypingUsers((prev) => prev.filter((u) => u._id !== data.user._id));
      }
    };

    // 4. Listen for presence updates
    const handlePresenceUpdate = (data) => {
      if (data.complaintId === complaintId && data.activeUsers) {
        setActiveUsers(data.activeUsers);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('presence_update', handlePresenceUpdate);

    return () => {
      socket.emit('leave_complaint', { complaintId });
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('presence_update', handlePresenceUpdate);
    };
  }, [complaintId, user, onCommentAdded]);

  // Handle typing indicator keypress
  const handleInputChange = (e) => {
    const val = e.target.value;
    setCommentText(val);

    if (!complaintId || !user) return;
    const socket = getSocket();

    socket.emit('typing_start', { complaintId, user });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { complaintId, user });
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting || !complaintId) return;

    try {
      setSubmitting(true);

      const socket = getSocket();
      socket.emit('typing_stop', { complaintId, user });

      // Emit message via Socket.IO for instant low-latency delivery
      socket.emit('send_message', {
        complaintId,
        message: commentText.trim(),
        sender: user,
      });

      // Also call HTTP API as fallback / persistence guarantee
      const res = await api.addComplaintComment(complaintId, commentText.trim());
      if (res.status === 'success' && res.data) {
        const updatedComments = res.data.comments || [...comments, res.data.comment];
        setComments(updatedComments);
        if (onCommentAdded) {
          onCommentAdded(updatedComments);
        }
      }

      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getAvatarStyle = (role) => {
    if (role === 'Student') return 'bg-purple-soft text-purple';
    if (role === 'Technician') return 'bg-brand-soft text-brand-dark';
    return 'bg-amber-50 text-amber-800';
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!complaint) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* CHAT POPUP WINDOW */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[490px] bg-white rounded-2xl shadow-2xl border border-surface-border flex flex-col overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header with Online Presence Indicator */}
          <div className="bg-sidebar text-white p-4 flex items-center justify-between flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-status-success shadow-[0_0_0_2px_rgba(31,157,108,0.3)] animate-pulse" />
              <div>
                <h4 className="text-xs font-bold font-display tracking-wide">
                  Complaint Chat — {complaint.ticketId}
                </h4>
                <div className="flex items-center gap-1.5 text-[10.5px] text-sidebar-text mt-0.5">
                  <Users className="w-3 h-3 text-status-success inline" />
                  <span>
                    {activeUsers.length > 0
                      ? `${activeUsers.length} online (${activeUsers.map((u) => u.name.split(' ')[0]).join(', ')})`
                      : 'Live Thread'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-sidebar-text hover:text-white hover:bg-sidebar-soft transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-surface-bg/40">
            {comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 text-ink-muted">
                <div className="p-3 rounded-full bg-brand-soft text-brand">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-ink">No messages yet</p>
                <p className="text-[11px] max-w-[200px] text-ink-muted leading-relaxed">
                  Ask a question or post a real-time update regarding this complaint.
                </p>
              </div>
            ) : (
              comments.map((msg, idx) => {
                const isSelf = msg.sender?._id === user?._id;
                const senderName = msg.sender?.name || 'User';
                const initials = senderName.slice(0, 2).toUpperCase();
                const avatarColor = getAvatarStyle(msg.sender?.role);

                return (
                  <div
                    key={msg._id || idx}
                    className={`flex gap-2.5 items-start ${
                      isSelf ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full font-display font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-subtle ${avatarColor}`}
                    >
                      {initials}
                    </div>

                    <div
                      className={`max-w-[78%] p-3 rounded-2xl border text-xs shadow-subtle ${
                        isSelf
                          ? 'bg-brand text-white border-brand rounded-tr-xs'
                          : 'bg-white text-ink border-surface-border rounded-tl-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <b
                          className={`text-[11px] font-semibold ${
                            isSelf ? 'text-white/90' : 'text-ink'
                          }`}
                        >
                          {isSelf ? 'You' : senderName}
                        </b>
                        <time
                          className={`text-[9.5px] font-mono ${
                            isSelf ? 'text-white/70' : 'text-ink-muted'
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </time>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}

            {/* REAL-TIME TYPING INDICATOR */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-ink-muted italic py-1 animate-pulse">
                <div className="flex items-center gap-1 bg-white border border-surface-border px-3 py-1.5 rounded-full shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-semibold text-ink ml-1 font-mono">
                    {typingUsers.map((u) => u.name.split(' ')[0]).join(', ')} is typing...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-surface-border flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={commentText}
              onChange={handleInputChange}
              placeholder="Type a real-time message..."
              className="flex-1 px-3.5 py-2 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="p-2.5 bg-brand text-white rounded-xl hover:bg-brand-dark transition disabled:opacity-50 flex-shrink-0 shadow-sm"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}

      {/* PROMINENT FLOATING CHAT BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full bg-brand text-white shadow-[0_4px_20px_rgba(42,79,209,0.35)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 hover:bg-brand-dark border-2 border-white/30 group cursor-pointer"
        title="Open Complaint Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 stroke-[2.5]" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 stroke-[2.2]" />
            {comments.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-status-danger text-white text-[10.5px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                {comments.length}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
