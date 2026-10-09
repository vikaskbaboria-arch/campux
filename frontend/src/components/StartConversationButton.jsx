import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LoaderCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createConversation } from '../services/messageService';
import { useToast } from '../context/ToastContext';
import { getFriendlyErrorMessage } from '../utils/userFeedback';

const StartConversationButton = ({
  recipientId,
  context,
  children = 'Message',
  className = '',
}) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!recipientId) return null;

  const buttonClass = `inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60 ${className}`;

  const handleClick = async () => {
    setLoading(true);
    try {
      const conversation = await createConversation(recipientId);
      if (!conversation?._id) throw new Error('Could not open this conversation.');

      navigate(`/messages/${conversation._id}`, {
        state: context
          ? { chatContext: { ...context, conversationId: conversation._id } }
          : undefined,
      });
      showToast('Conversation opened.', 'success');
    } catch (requestError) {
      showToast(getFriendlyErrorMessage(requestError, 'Could not open this conversation. Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex max-w-full flex-col items-start gap-1">
      {isAuthenticated ? (
        <button type="button" onClick={handleClick} disabled={loading} className={buttonClass}>
          {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
          {loading ? 'Opening chat' : children}
        </button>
      ) : (
        <Link to="/login" state={{ from: location }} className={buttonClass}>
          <MessageCircle className="h-3.5 w-3.5" />
          Sign in to chat
        </Link>
      )}
    </span>
  );
};

export default StartConversationButton;
