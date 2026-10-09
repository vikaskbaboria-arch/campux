import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  LoaderCircle,
  MessageCircle,
  Search,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchConversation,
  fetchConversations,
  fetchMessages,
  markMessageAsRead,
  sendMessage,
} from '../services/messageService';
import { connectMessageSocket } from '../services/socketService';
import { getFriendlyErrorMessage } from '../utils/userFeedback';

const getId = (value) => String(value?._id || value || '');

const getOtherMember = (conversation, currentUserId) => {
  if (!Array.isArray(conversation?.members)) return undefined;
  return conversation.members.find((member) => getId(member) !== String(currentUserId));
};

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const formatDate = (date) => {
  if (!date) return '';
  const value = new Date(date);
  const today = new Date();
  if (value.toDateString() === today.toDateString()) return formatTime(date);
  return value.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getRequestMessage = (requestError, fallback) =>
  getFriendlyErrorMessage(requestError, fallback);

const Messages = () => {
  const { conversationId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const currentUserId = String(user?._id || '');
  const [conversations, setConversations] = useState([]);
  const [conversationQuery, setConversationQuery] = useState('');
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState('');
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const bottomRef = useRef(null);
  const markedReadRef = useRef(new Set());
  const hasConversationsLoadedRef = useRef(false);

  useEffect(() => {
    let isCurrent = true;

    const loadConversations = async () => {
      try {
        const results = await fetchConversations();
        if (isCurrent) {
          setConversations(results);
          setConversationsError('');
          hasConversationsLoadedRef.current = true;
        }
      } catch (requestError) {
        if (isCurrent && !hasConversationsLoadedRef.current) {
          setConversationsError(getRequestMessage(requestError, 'Could not load your conversations.'));
        }
      } finally {
        if (isCurrent) setConversationsLoading(false);
      }
    };

    loadConversations();
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('campux_token');
    if (!currentUserId || !token) return undefined;

    let isCurrent = true;
    setSocketConnected(false);
    const socket = connectMessageSocket();

    const refreshConversations = async () => {
      try {
        const results = await fetchConversations();
        if (isCurrent) {
          setConversations(results);
          setConversationsError('');
          hasConversationsLoadedRef.current = true;
        }
      } catch (requestError) {
        if (isCurrent && !hasConversationsLoadedRef.current) {
          setConversationsError(getRequestMessage(requestError, 'Could not load your conversations.'));
        }
      }
    };

    const syncMessages = async () => {
      if (!conversationId) return;
      try {
        const results = await fetchMessages(conversationId);
        if (!isCurrent) return;
        setMessages(results);

        const unreadIds = results.filter((message) => {
          const alreadyRead = Array.isArray(message.readBy)
            && message.readBy.some((reader) => getId(reader) === currentUserId);
          const sentByMe = getId(message.sender) === currentUserId;
          if (sentByMe || alreadyRead || markedReadRef.current.has(message._id)) return false;
          markedReadRef.current.add(message._id);
          return true;
        }).map((message) => message._id);

        unreadIds.forEach((messageId) => {
          markMessageAsRead(messageId).catch(() => markedReadRef.current.delete(messageId));
        });
      } catch (requestError) {
        if (isCurrent) {
          setThreadError(getRequestMessage(requestError, 'Could not refresh this conversation.'));
        }
      }
    };

    socket.on('connect', () => {
      if (!isCurrent) return;
      setSocketConnected(true);
      refreshConversations();
      if (conversationId) {
        socket.emit('conversation:join', { conversationId }, (result) => {
          if (!result?.success) {
            console.warn('Could not join chat room:', result?.message);
          }
        });
        syncMessages();
      }
    });

    socket.on('disconnect', () => {
      if (isCurrent) setSocketConnected(false);
    });

    socket.on('connect_error', (error) => {
      if (isCurrent) setSocketConnected(false);
      console.warn('Chat socket connection failed:', error.message);
    });

    socket.on('conversation:new', refreshConversations);

    socket.on('message:new', (message) => {
      if (!isCurrent) return;
      refreshConversations();
      if (getId(message.conversationId) !== String(conversationId || '')) return;

      setMessages((current) => {
        if (current.some((item) => item._id === message._id)) return current;
        return [...current, message].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
      });

      if (getId(message.sender) !== currentUserId) {
        markMessageAsRead(message._id)
          .then((updatedMessage) => {
            if (!isCurrent) return;
            setMessages((current) => current.map((item) =>
              item._id === updatedMessage._id ? updatedMessage : item
            ));
          })
          .catch((requestError) => {
            console.warn('Could not mark message as read:', requestError.message);
          });
      }
    });

    socket.on('message:read', ({ messageId, readerId }) => {
      if (!isCurrent) return;
      setMessages((current) => current.map((message) => {
        if (message._id !== messageId) return message;
        const readBy = Array.isArray(message.readBy) ? message.readBy : [];
        if (readBy.some((reader) => getId(reader) === String(readerId))) return message;
        return { ...message, readBy: [...readBy, readerId] };
      }));
    });

    return () => {
      isCurrent = false;
      if (conversationId) {
        socket.emit('conversation:leave', { conversationId });
      }
      socket.disconnect();
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      setThreadError('');
      setThreadLoading(false);
      return undefined;
    }

    let isCurrent = true;
    setConversation(null);
    setMessages([]);
    setThreadLoading(true);
    setThreadError('');
    setSendError('');
    setDraft('');
    markedReadRef.current = new Set();

    const loadThread = async () => {
      try {
        const [conversationResult, messageResults] = await Promise.all([
          fetchConversation(conversationId),
          fetchMessages(conversationId),
        ]);
        if (!isCurrent) return;

        setConversation(conversationResult);
        setMessages(messageResults);
        setThreadError('');

        const unreadIds = [];
        messageResults.forEach((message) => {
          const alreadyRead = Array.isArray(message.readBy)
            && message.readBy.some((reader) => getId(reader) === currentUserId);
          const sentByMe = getId(message.sender) === currentUserId;
          if (!sentByMe && !alreadyRead && !markedReadRef.current.has(message._id)) {
            markedReadRef.current.add(message._id);
            unreadIds.push(message._id);
          }
        });

        if (unreadIds.length) {
          setMessages((current) => current.map((message) =>
            unreadIds.includes(message._id)
              ? { ...message, readBy: [...(message.readBy || []), currentUserId] }
              : message
          ));
          unreadIds.forEach((messageId) => {
            markMessageAsRead(messageId).catch(() => markedReadRef.current.delete(messageId));
          });
        }
      } catch (requestError) {
        if (isCurrent) {
          setThreadError(getRequestMessage(requestError, 'Could not load this conversation.'));
        }
      } finally {
        if (isCurrent) {
          setThreadLoading(false);
        }
      }
    };

    loadThread();
    return () => {
      isCurrent = false;
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, conversationId]);

  const otherMember = useMemo(
    () => getOtherMember(conversation, currentUserId),
    [conversation, currentUserId],
  );
  const visibleConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((item) => {
      const person = getOtherMember(item, currentUserId);
      return `${person?.name || ''} ${item.lastMessage || ''}`.toLowerCase().includes(query);
    });
  }, [conversationQuery, conversations, currentUserId]);
  const chatContext = conversationId && location.state?.chatContext?.conversationId === conversationId
    ? location.state?.chatContext
    : null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !conversationId || sending) return;

    setSending(true);
    setSendError('');
    try {
      const createdMessage = await sendMessage({ conversationId, text });
      setMessages((current) => current.some((message) => message._id === createdMessage._id)
        ? current
        : [...current, createdMessage]);
      setConversations((current) => current
        .map((item) => item._id === conversationId
          ? { ...item, lastMessage: createdMessage.text, updatedAt: createdMessage.createdAt }
          : item)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      setDraft('');
    } catch (requestError) {
      setSendError(getRequestMessage(requestError, 'Your message could not be sent. Try again.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[26rem] w-full flex-1 overflow-hidden bg-[#080809]">
      <aside className={`min-h-0 w-full shrink-0 flex-col border-r border-white/[0.08] bg-[#09090b] md:w-[340px] lg:w-[380px] ${conversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Your inbox</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Messages</h1>
            </div>
            <Link to="/" className="rounded-full border border-white/10 px-3 py-2 text-[11px] font-medium text-zinc-400 transition hover:border-white/20 hover:text-white">
              Marketplace
            </Link>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Offers, pickup details, and exchanges.</p>
          <label className="mt-5 flex h-10 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-zinc-500 transition focus-within:border-white/20">
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="search"
              value={conversationQuery}
              onChange={(event) => setConversationQuery(event.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-zinc-600"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex items-center justify-center gap-2 px-5 py-10 text-xs text-zinc-500">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Loading conversations
              </div>
            ) : conversationsError ? (
              <p role="alert" className="px-5 py-6 text-xs text-red-300">{conversationsError}</p>
            ) : conversations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <MessageCircle className="mx-auto h-8 w-8 text-zinc-700" />
                <p className="mt-3 text-sm font-medium text-zinc-300">No messages found</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  New offers create a chat automatically. For older offers, open your profile and choose Chat about offer.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link to="/profile" className="rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200">
                    View my offers
                  </Link>
                  <Link to="/" className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-300 transition hover:border-white/25 hover:text-white">
                    Browse listings
                  </Link>
                </div>
              </div>
            ) : visibleConversations.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-zinc-500">No conversations match "{conversationQuery}".</p>
            ) : (
              visibleConversations.map((item) => {
                const person = getOtherMember(item, currentUserId);
                const active = item._id === conversationId;
                return (
                  <Link
                    key={item._id}
                    to={`/messages/${item._id}`}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex items-center gap-3 border-b border-white/[0.05] px-4 py-4 transition hover:bg-white/[0.04] ${active ? 'bg-white/[0.07] before:absolute before:bottom-3 before:left-0 before:top-3 before:w-0.5 before:rounded-r before:bg-white' : ''}`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-semibold text-white ring-1 ring-white/10">
                      {person?.profilePic ? (
                        <img src={person.profilePic} alt="" className="h-full w-full object-cover" />
                      ) : (
                        person?.name?.[0]?.toUpperCase() || 'S'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-zinc-100">{person?.name || 'Campus student'}</p>
                        <span className="shrink-0 text-[10px] text-zinc-600">{formatDate(item.updatedAt)}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">{item.lastMessage || 'Start the conversation'}</p>
                    </div>
                  </Link>
                );
              })
            )}
        </div>
      </aside>

      <section className={`min-h-0 min-w-0 flex-1 flex-col bg-[#0b0b0d] ${conversationId ? 'flex' : 'hidden md:flex'}`}>
        {conversationId ? (
          <>
              <header className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-4 sm:px-6">
                <Link to="/messages" className="inline-flex shrink-0 items-center gap-2 rounded-full p-2 text-xs text-zinc-400 transition hover:bg-white/[0.06] hover:text-white" aria-label="Back to all conversations">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">All conversations</span>
                </Link>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-semibold text-white">
                  {otherMember?.profilePic ? (
                    <img src={otherMember.profilePic} alt="" className="h-full w-full object-cover" />
                  ) : (
                    otherMember?.name?.[0]?.toUpperCase() || 'S'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{otherMember?.name || 'Conversation'}</p>
                  <p className="flex items-center gap-1.5 truncate text-[11px] text-zinc-500">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {socketConnected ? 'Live chat' : 'Connecting'}
                    {otherMember?.username ? ` - @${otherMember.username}` : ''}
                  </p>
                </div>
                {otherMember?._id && (
                  <Link to={`/profile/${otherMember._id}`} aria-label="View student profile" className="rounded-full p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-white">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
              </header>

              {chatContext && (
                <div className="border-b border-white/[0.06] bg-white/[0.02] px-5 py-3 sm:px-6">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    {chatContext.kind === 'offer' ? 'Offer conversation' : 'Listing conversation'}
                  </p>
                  <p className="mt-1 truncate text-xs text-zinc-300">
                    {chatContext.title || 'Marketplace listing'}
                    {chatContext.amount ? ` | Offer ${chatContext.amount}` : ''}
                    {chatContext.status ? ` | ${chatContext.status}` : ''}
                  </p>
                </div>
              )}

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
                {threadLoading && messages.length === 0 ? (
                  <div className="flex h-full min-h-48 items-center justify-center gap-2 text-xs text-zinc-500">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Loading messages
                  </div>
                ) : threadError ? (
                  <div className="mx-auto max-w-md rounded-2xl border border-red-500/20 bg-red-950/20 p-5 text-center">
                    <p role="alert" className="text-sm text-red-300">{threadError}</p>
                    <Link to="/messages" className="mt-4 inline-flex text-xs text-zinc-300 underline">Back to messages</Link>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                    <MessageCircle className="h-7 w-7 text-zinc-700" />
                    <p className="mt-3 text-sm font-medium text-zinc-300">No messages found</p>
                    <p className="mt-1 text-xs text-zinc-500">Send a message to start the conversation.</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = getId(message.sender) === currentUserId;
                    const peerHasRead = isMine && Array.isArray(message.readBy)
                      && message.readBy.some((reader) => getId(reader) !== currentUserId);
                    return (
                      <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${isMine ? 'rounded-br-md bg-white text-black' : 'rounded-bl-md border border-white/[0.08] bg-white/[0.04] text-zinc-100'}`}>
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
                          <div className={`mt-1.5 flex items-center justify-end gap-2 text-[10px] ${isMine ? 'text-zinc-500' : 'text-zinc-600'}`}>
                            <span>{formatTime(message.createdAt)}</span>
                            {peerHasRead && <span>Seen</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSubmit} className="border-t border-white/[0.08] bg-[#09090b] px-3 py-3 sm:px-5 sm:py-4">
                {sendError && <p role="alert" className="mb-2 px-1 text-xs text-red-300">{sendError}</p>}
                <div className="flex items-end gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-2 focus-within:border-white/25">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSubmit(event);
                      }
                    }}
                    maxLength={2000}
                    rows={1}
                    placeholder="Write a message..."
                    aria-label="Write a message"
                    className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-5 text-white outline-none placeholder:text-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim() || Boolean(threadError)}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-3.5 text-xs font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                <p className="mt-2 px-1 text-[10px] text-zinc-600">Enter to send - Shift + Enter for a new line</p>
              </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.025]">
              <div className="absolute inset-2 rounded-full border border-white/[0.05]" />
              <MessageCircle className="relative h-9 w-9 text-zinc-500" strokeWidth={1.3} />
            </div>
            <h2 className="mt-6 text-lg font-semibold tracking-tight text-zinc-200">Your conversations, all in one place</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              Choose a conversation to pick up where you left off, or start a chat from an offer or listing.
            </p>
            <Link to="/" className="mt-6 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200">
              Browse listings
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Messages;
