import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Send,
  MessageSquare,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
} from "lucide-react";

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Lazy initialize currentUser from token
  const [currentUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        return JSON.parse(atob(parts[1]));
      }
    } catch (err) {
      console.error("Token decode error:", err);
    }
    return null;
  });

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const isPollingRef = useRef(false);

  // Determine base path (/creator/messages or /brand/messages)
  const basePath = location.pathname.startsWith("/creator")
    ? "/creator/messages"
    : "/brand/messages";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages for a conversation
  const fetchMessages = useCallback(
    async (convId, silent = false) => {
      if (!silent) setLoadingMessages(true);
      setError(null);
      try {
        const res = await api.get(`/conversations/${convId}/messages`);
        const incomingMessages = res.data.messages || [];
        setMessages(incomingMessages);

        // Clear unread count for this conversation in list
        setConversations((prev) =>
          prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        console.error("Error fetching messages:", err);
        if (!silent) {
          setError(
            err.response?.data?.message || "Failed to load message history"
          );
        }
      } finally {
        if (!silent) {
          setLoadingMessages(false);
          setTimeout(scrollToBottom, 100);
        }
      }
    },
    []
  );

  // Initial load of conversations and initial selected conversation
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const res = await api.get("/conversations");
        const list = res.data.conversations || [];
        if (!isMounted) return;
        setConversations(list);

        if (conversationId) {
          const target = list.find((c) => c._id === conversationId);
          if (target) {
            setSelectedConversation(target);
            const msgRes = await api.get(`/conversations/${target._id}/messages`);
            if (!isMounted) return;
            setMessages(msgRes.data.messages || []);
            setTimeout(scrollToBottom, 100);
          }
        }
      } catch (err) {
        console.error("Error loading conversations:", err);
      } finally {
        if (isMounted) {
          setLoadingConversations(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  // Polling for new messages while conversation is open
  useEffect(() => {
    if (!selectedConversation?._id) return;

    const interval = setInterval(() => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      fetchMessages(selectedConversation._id, true)
        .then(() => {
          // Also refresh conversation list quietly
          api.get("/conversations").then((res) => {
            setConversations(res.data.conversations || []);
          });
        })
        .finally(() => {
          isPollingRef.current = false;
        });
    }, 6000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedConversation?._id, fetchMessages]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    navigate(`${basePath}/${conv._id}`);
    fetchMessages(conv._id);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending || !selectedConversation) return;

    const content = inputText.trim();
    if (content.length > 2000) {
      toast.error("Message exceeds maximum length of 2000 characters");
      return;
    }

    setSending(true);
    try {
      const res = await api.post(
        `/conversations/${selectedConversation._id}/messages`,
        { content }
      );
      const sentMessage = res.data.message;

      // Append message
      setMessages((prev) => [...prev, sentMessage]);
      setInputText("");

      // Update conversations list with latest message
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c._id === selectedConversation._id) {
            return {
              ...c,
              lastMessage: content,
              lastMessageAt: sentMessage.createdAt,
              lastSenderId: currentUser?.userId,
            };
          }
          return c;
        });
        return updated.sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
      });

      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      c.otherParticipant?.name?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatConversationTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
      {/* LEFT PANE: Conversation List */}
      <div
        className={`w-full md:w-80 lg:w-96 flex-col border-r border-white/10 bg-white/[0.02] ${
          selectedConversation ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <MessageSquare className="size-5 text-violet-400" />
              Messages
            </h1>
            <span className="text-xs text-zinc-400">
              {conversations.length}{" "}
              {conversations.length === 1 ? "chat" : "chats"}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {loadingConversations ? (
            <div className="flex items-center justify-center p-8 text-zinc-500 text-sm">
              <Loader2 className="size-5 animate-spin mr-2 text-violet-400" />
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-500">No conversations yet.</p>
              <p className="mt-1 text-xs text-zinc-600">
                Accept connection requests to start messaging.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?._id === conv._id;
              const hasUnread = conv.unreadCount > 0;
              const other = conv.otherParticipant;

              return (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-violet-600/15 border-l-2 border-violet-500"
                      : "hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-300">
                      {other?.name ? other.name.slice(0, 2).toUpperCase() : "??"}
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-violet-500 border-2 border-zinc-950" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm truncate font-medium ${
                          hasUnread ? "text-white font-semibold" : "text-zinc-200"
                        }`}
                      >
                        {other?.name || "User"}
                      </p>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-2">
                        {formatConversationTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-zinc-400 truncate pr-2">
                        {conv.lastMessage || "No messages yet"}
                      </p>
                      {hasUnread && (
                        <span className="inline-flex size-4.5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANE: Chat Area */}
      <div
        className={`flex-1 flex flex-col bg-zinc-950/40 ${
          !selectedConversation ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-3.5 px-4 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    navigate(basePath);
                  }}
                  className="md:hidden p-1 text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="size-5" />
                </button>

                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-300">
                  {selectedConversation.otherParticipant?.name
                    ? selectedConversation.otherParticipant.name
                        .slice(0, 2)
                        .toUpperCase()
                    : "??"}
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    {selectedConversation.otherParticipant?.name || "User"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-violet-400 capitalize">
                      {selectedConversation.otherParticipant?.role || "Member"}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-[11px] text-zinc-400">Connected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
                  <Loader2 className="size-5 animate-spin mr-2 text-violet-400" />
                  Loading messages...
                </div>
              ) : error ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6">
                  <div className="flex size-12 items-center justify-center rounded-full bg-white/5 text-violet-400 mb-3">
                    <MessageSquare className="size-6" />
                  </div>
                  <p className="text-sm text-zinc-300 font-medium">
                    No messages yet.
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Start the conversation with{" "}
                    {selectedConversation.otherParticipant?.name || "your connection"}.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine =
                    msg.senderId?.toString() === currentUser?.userId?.toString();

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${
                        isMine ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2.5 max-w-[80%] sm:max-w-[70%] break-words text-sm leading-relaxed shadow-sm ${
                          isMine
                            ? "bg-violet-600 text-white rounded-br-xs"
                            : "bg-white/10 text-zinc-100 rounded-bl-xs"
                        }`}
                      >
                        {msg.content}
                      </div>

                      <div
                        className={`flex items-center gap-1 mt-1 text-[10px] text-zinc-500 px-1 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isMine && (
                          <span>
                            {msg.readAt ? (
                              <CheckCheck className="size-3 text-violet-400 inline" />
                            ) : (
                              <Check className="size-3 text-zinc-500 inline" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="border-t border-white/10 p-3 bg-white/[0.02]"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  maxLength={2000}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Empty state when no chat is open */
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/5 text-violet-400 mb-4 border border-white/10">
              <MessageSquare className="size-8" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Your Messages
            </h3>
            <p className="mt-1 text-sm text-zinc-400 max-w-sm">
              Select a conversation from the left to start chatting with your
              collaborators.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
