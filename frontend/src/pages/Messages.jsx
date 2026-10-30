import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  LoaderCircle,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
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
    <div className="flex h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] w-full flex-1 overflow-hidden bg-[#08080a]">
      {/* Left Sidebar: Conversations List */}
      <aside className={`h-full min-h-0 w-full shrink-0 flex-col border-r border-white/[0.08] bg-[#0c0c0e] md:w-[320px] lg:w-[360px] ${conversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="border-b border-white/[0.08] px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-zinc-500">PEER CHAT</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-white font-heading">Messages</h1>
            </div>
            <Link to="/" className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-medium text-zinc-400 transition hover:border-white/20 hover:text-white">
              Feed
            </Link>
          </div>
          <p className="mt-1 text-xs text-zinc-400">Campus offers, trade discussions & pickups.</p>
          
          {/* Search bar matching template */}
          <label className="mt-3.5 flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#16161b] px-3 text-zinc-400 transition focus-within:border-amber-500/50">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <input
              type="search"
              value={conversationQuery}
              onChange={(event) => setConversationQuery(event.target.value)}
              placeholder="Search chats..."
              aria-label="Search conversations"
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-zinc-600"
            />
          </label>
        </div>

        {/* Conversations Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
          {conversationsLoading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-10 text-xs text-zinc-500">
              <LoaderCircle className="h-4 w-4 animate-spin text-amber-400" /> Loading chats...
            </div>
          ) : conversationsError ? (
            <p role="alert" className="px-5 py-6 text-xs text-red-300">{conversationsError}</p>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-zinc-700" />
              <p className="mt-3 text-sm font-semibold text-zinc-300">No chats yet</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Offers and messages from listings will appear here automatically.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link to="/" className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200">
                  Browse items
                </Link>
              </div>
            </div>
          ) : visibleConversations.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-zinc-500">No chats match "{conversationQuery}".</p>
          ) : (
            visibleConversations.map((item) => {
              const person = getOtherMember(item, currentUserId);
              const active = item._id === conversationId;
              return (
                <Link
                  key={item._id}
                  to={`/messages/${item._id}`}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-3 px-4 py-3.5 transition ${
                    active ? 'bg-[#18181f] border-l-2 border-amber-400' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-bold text-white ring-1 ring-white/10">
                    {person?.profilePic ? (
                      <img src={person.profilePic} alt="" className="h-full w-full object-cover" />
                    ) : (
                      person?.name?.[0]?.toUpperCase() || 'S'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-zinc-100">{person?.name || 'Campus student'}</p>
                      <span className="shrink-0 text-[10px] text-zinc-500 font-mono">{formatDate(item.updatedAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-400">{item.lastMessage || 'Start conversation'}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Section: Active Chat Viewport */}
      {/* LOCKED HEIGHT, OVERFLOW HIDDEN, FIXED BOTTOM INPUT */}
      <section className={`h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden relative bg-[#09090b] ${conversationId ? 'flex' : 'hidden md:flex'}`}>
        {conversationId ? (
          <>
            {/* Header: Fixed at top of chat pane */}
            <header className="shrink-0 flex items-center gap-3 border-b border-white/[0.08] bg-[#0c0c0e] px-4 py-3 sm:px-6 z-20">
              <Link to="/messages" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg p-1.5 text-xs text-zinc-400 transition hover:bg-white/[0.06] hover:text-white md:hidden" aria-label="Back to all conversations">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-bold text-white ring-1 ring-white/10">
                {otherMember?.profilePic ? (
                  <img src={otherMember.profilePic} alt="" className="h-full w-full object-cover" />
                ) : (
                  otherMember?.name?.[0]?.toUpperCase() || 'S'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs sm:text-sm font-bold text-white">{otherMember?.name || 'Conversation'}</p>
                <p className="flex items-center gap-1.5 truncate text-[11px] text-zinc-400">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {socketConnected ? 'Live' : 'Connecting'}
                  {otherMember?.username ? ` • @${otherMember.username}` : ''}
                </p>
              </div>
              {otherMember?._id && (
                <Link to={`/profile/${otherMember._id}`} aria-label="View profile" className="rounded-full p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white transition">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
            </header>

            {/* Context bar if opened from listing / offer */}
            {chatContext && (
              <div className="shrink-0 border-b border-white/[0.06] bg-amber-500/[0.04] px-4 py-2 sm:px-6">
                <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  {chatContext.kind === 'offer' ? 'Offer Negotiation' : 'Listing Discussion'}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-300 font-medium">
                  {chatContext.title || 'Marketplace Item'}
                  {chatContext.amount ? ` • Offer Amount: ${chatContext.amount}` : ''}
                  {chatContext.status ? ` • Status: ${chatContext.status}` : ''}
                </p>
              </div>
            )}

            {/* MESSAGES LIST - EXCLUSIVE SCROLLING REGION */}
            {/* Increasing messages only scroll within this area; never pushes the input container */}
            <div className="flex-1 min-h-0 w-full overflow-y-auto px-4 py-4 sm:px-6 space-y-3.5 scroll-smooth">
              {threadLoading && messages.length === 0 ? (
                <div className="flex h-full min-h-48 items-center justify-center gap-2 text-xs text-zinc-500">
                  <LoaderCircle className="h-4 w-4 animate-spin text-amber-400" /> Loading messages...
                </div>
              ) : threadError ? (
                <div className="mx-auto max-w-md rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-center">
                  <p role="alert" className="text-xs text-red-300">{threadError}</p>
                  <Link to="/messages" className="mt-3 inline-flex text-xs text-zinc-300 underline">Back to conversations</Link>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                  <MessageCircle className="h-8 w-8 text-zinc-700" />
                  <p className="mt-2 text-xs font-semibold text-zinc-300">No messages yet</p>
                  <p className="mt-1 text-[11px] text-zinc-500">Say hello or ask questions regarding the campus item.</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = getId(message.sender) === currentUserId;
                  const peerHasRead = isMine && Array.isArray(message.readBy)
                    && message.readBy.some((reader) => getId(reader) !== currentUserId);
                  return (
                    <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isMine
                          ? 'rounded-br-sm bg-white text-black font-sans shadow-sm'
                          : 'rounded-bl-sm border border-white/[0.08] bg-[#16161c] text-zinc-100 font-sans'
                      }`}>
                        <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed">{message.text}</p>
                        <div className={`mt-1 flex items-center justify-end gap-1.5 text-[9px] font-mono ${isMine ? 'text-zinc-500' : 'text-zinc-500'}`}>
                          <span>{formatTime(message.createdAt)}</span>
                          {peerHasRead && <span className="text-emerald-600 font-bold">✓ Seen</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* FIXED CHAT INPUT BAR - LOCKED POSITION AT BOTTOM */}
            {/* Will never move, displace or hide no matter how many messages are added */}
            <form
              onSubmit={handleSubmit}
              className="shrink-0 sticky bottom-0 z-30 w-full border-t border-white/[0.08] bg-[#0c0c0e] px-3 py-3 sm:px-5 sm:py-3.5 shadow-lg"
            >
              {sendError && <p role="alert" className="mb-2 px-1 text-xs text-red-300">{sendError}</p>}
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#16161b] p-1.5 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
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
                  placeholder="Write a message to student..."
                  aria-label="Write a message"
                  className="max-h-24 min-h-9 flex-1 resize-none bg-transparent px-3 py-1.5 text-xs sm:text-sm leading-5 text-white outline-none placeholder:text-zinc-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim() || Boolean(threadError)}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
              <p className="mt-1 px-1 text-[10px] text-zinc-500 font-mono">
                Enter to send · Shift + Enter for new line
              </p>
            </form>
          </>
        ) : (
          /* Empty Chat State */
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#121215]">
              <MessageCircle className="h-9 w-9 text-amber-400" />
            </div>
            <h2 className="mt-4 text-base font-bold text-zinc-200 font-heading">Direct Campus Conversations</h2>
            <p className="mt-1.5 max-w-sm text-xs text-zinc-400 leading-relaxed">
              Select a chat from the left panel to discuss prices, negotiate terms, or arrange campus handovers.
            </p>
            <Link to="/" className="mt-5 rounded-full bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition">
              Explore Listings
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Messages;
