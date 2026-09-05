"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { cn, formatDate } from "@/lib/utils";

interface ConversationItem {
  id: string;
  participant: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count: number;
}

interface MessageItem {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations ?? []);
        }
      } catch {} finally {
        setLoadingConvs(false);
      }
    }
    fetchConversations();
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {} finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    }
  }, [selectedConv, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedConv) inputRef.current?.focus();
  }, [selectedConv]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");
    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConv.id
              ? { ...c, last_message: { content, created_at: new Date().toISOString() } }
              : c
          )
        );
      }
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0 overflow-hidden rounded-xl border border-glass-border">
      {/* Conversation List */}
      <div
        className={cn(
          "w-full sm:w-80 flex-shrink-0 border-r border-glass-border flex flex-col glass",
          selectedConv && "hidden sm:flex"
        )}
      >
        <div className="p-4 border-b border-glass-border">
          <h3 className="text-sm font-semibold text-foreground">Messages</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <MessageSquare size={32} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = selectedConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 transition-colors text-left",
                    isActive ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-white/[0.03]"
                  )}
                >
                  <Avatar
                    src={conv.participant.avatar_url}
                    fallback={conv.participant.full_name}
                    size="default"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conv.participant.full_name}
                      </p>
                      {conv.last_message && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {formatDate(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.last_message.content}
                      </p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="h-5 min-w-5 rounded-full bg-neon-pink text-white text-[10px] font-bold flex items-center justify-center px-1 shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-background/50",
          !selectedConv && "hidden sm:flex"
        )}
      >
        {selectedConv ? (
          <>
            <div className="flex items-center gap-3 p-3 border-b border-glass-border glass sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedConv(null)}
              >
                &larr;
              </Button>
              <Avatar
                src={selectedConv.participant.avatar_url}
                fallback={selectedConv.participant.full_name}
                size="sm"
              />
              <p className="text-sm font-medium text-foreground">
                {selectedConv.participant.full_name}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className={cn("h-10 w-48", i % 2 === 0 ? "ml-auto" : "")} />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">
                    No messages yet. Say hello!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex", isMine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-xl px-4 py-2.5",
                          isMine
                            ? "bg-primary/20 border border-primary/20 text-foreground"
                            : "glass-card text-foreground"
                        )}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-glass-border glass">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || sending}
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                Select a conversation
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the list to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
