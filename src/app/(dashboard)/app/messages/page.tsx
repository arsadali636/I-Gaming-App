"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send, MessageSquare, ShieldAlert, Coins, AlertCircle, ExternalLink } from "lucide-react";
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
  other_user?: {
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

function MessagesContent() {
  const { user, wallet, refreshWallet } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Error and credit gate states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingCreditMsg, setPendingCreditMsg] = useState<{ content: string; conversation_id?: string } | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const targetReceiverId = searchParams.get("receiver_id") || searchParams.get("recipient");
  const targetConvId = searchParams.get("conversation_id");

  const fetchConversations = useCallback(async () => {
    setLoadingConvs(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        const list: ConversationItem[] = (data.conversations ?? []).map((c: any) => ({
          ...c,
          participant: c.participant || c.other_user,
        }));
        setConversations(list);
        return list;
      } else {
        const data = await res.json();
        if (res.status === 403 && data.code === "CONNECTION_REQUIRED") {
          setErrorMessage(data.error);
        }
      }
    } catch {
      setErrorMessage("Failed to load conversations");
    } finally {
      setLoadingConvs(false);
    }
    return [];
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/messages?conversation_id=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
        // Update unread count locally for selected conversation
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
        );
      } else {
        const data = await res.json();
        if (res.status === 403 && data.code === "CONNECTION_REQUIRED") {
          setErrorMessage(data.error);
        } else {
          setErrorMessage(data.error || "Failed to load messages");
        }
      }
    } catch {
      setErrorMessage("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      const convs = await fetchConversations();

      if (targetConvId) {
        const found = convs.find((c) => c.id === targetConvId);
        if (found) {
          setSelectedConv(found);
        } else {
          // Attempt to fetch direct conversation details
          fetchMessages(targetConvId);
        }
      } else if (targetReceiverId) {
        const found = convs.find(
          (c) => c.participant?.id === targetReceiverId || c.other_user?.id === targetReceiverId
        );
        if (found) {
          setSelectedConv(found);
        } else {
          // Attempt conversation lookup or creation with recipient
          try {
            const res = await fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: "Hello", receiver_id: targetReceiverId }),
            });
            const data = await res.json();
            if (res.status === 403 && data.code === "CONNECTION_REQUIRED") {
              setErrorMessage(data.error);
            } else if (res.ok && data.message) {
              await fetchConversations();
            }
          } catch {}
        }
      }
    }
    init();
  }, [fetchConversations, targetConvId, targetReceiverId, fetchMessages]);

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

  const handleSend = async (overrideContent?: string, useCredits?: boolean) => {
    const content = (overrideContent || newMessage).trim();
    if (!content || !selectedConv || sending) return;

    setSending(true);
    setErrorMessage(null);
    setInsufficientCredits(false);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          conversation_id: selectedConv.id,
          use_credits: useCredits ?? false,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        setPendingCreditMsg(null);

        if (data.credit_deducted && refreshWallet) {
          refreshWallet();
        }

        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConv.id
              ? { ...c, last_message: { content, created_at: new Date().toISOString() } }
              : c
          )
        );
      } else if (res.status === 402) {
        if (data.code === "CONTACT_MESSAGE_REQUIRES_CREDITS") {
          setPendingCreditMsg({ content, conversation_id: selectedConv.id });
        } else if (data.code === "INSUFFICIENT_CREDITS") {
          setInsufficientCredits(true);
          setPendingCreditMsg(null);
        } else {
          setErrorMessage(data.error || "Payment or credit required");
        }
      } else if (res.status === 403) {
        setErrorMessage(data.error || "Messaging is available only after the connection request is accepted");
      } else {
        setErrorMessage(data.error || "Failed to send message");
      }
    } catch {
      setErrorMessage("Network error sending message");
    } finally {
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
        <div className="p-4 border-b border-glass-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Messages</h3>
          {wallet && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
              <Coins size={13} />
              <span>{wallet.balance} Credits</span>
            </div>
          )}
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
              <p className="text-sm font-medium text-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect with professionals to start messaging.
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = selectedConv?.id === conv.id;
              const p = conv.participant || conv.other_user;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConv(conv);
                    setPendingCreditMsg(null);
                    setErrorMessage(null);
                    setInsufficientCredits(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 transition-colors text-left",
                    isActive ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-white/[0.03]"
                  )}
                >
                  <Avatar
                    src={p?.avatar_url}
                    fallback={p?.full_name || "User"}
                    size="default"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p?.full_name || "Connected User"}
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
            <div className="flex items-center justify-between p-3 border-b border-glass-border glass">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:hidden"
                  onClick={() => setSelectedConv(null)}
                >
                  &larr;
                </Button>
                <Avatar
                  src={(selectedConv.participant || selectedConv.other_user)?.avatar_url}
                  fallback={(selectedConv.participant || selectedConv.other_user)?.full_name || "User"}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {(selectedConv.participant || selectedConv.other_user)?.full_name || "Connected User"}
                  </p>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className={cn("h-10 w-48", i % 2 === 0 ? "ml-auto" : "")} />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={36} className="text-muted-foreground/30 mb-2" />
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
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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

            {/* Contact Information Credit Gate Banner */}
            {pendingCreditMsg && (
              <div className="p-4 mx-3 mb-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 glass">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-amber-300">
                      Use your credits to send this message.
                    </h4>
                    <p className="text-xs text-amber-200/80 mt-1">
                      Your message contains contact information. Sending this message will consume 1 contact credit from your wallet balance.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-1.5"
                        disabled={sending}
                        onClick={() => handleSend(pendingCreditMsg.content, true)}
                      >
                        <Coins size={14} /> Use Credits (1 Credit)
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-amber-300 hover:text-amber-100"
                        disabled={sending}
                        onClick={() => setPendingCreditMsg(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Insufficient Credits Banner */}
            {insufficientCredits && (
              <div className="p-4 mx-3 mb-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive-foreground glass">
                <div className="flex items-start gap-3">
                  <Coins size={20} className="text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">
                      Insufficient contact credits.
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      You need at least 1 credit to send contact details in a message. Please top up your wallet or upgrade your plan.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5"
                        onClick={() => router.push("/app/subscription")}
                      >
                        <ExternalLink size={14} /> Get Credits / Upgrade Plan
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setInsufficientCredits(false)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Composer */}
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
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            {errorMessage ? (
              <div className="max-w-md p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <ShieldAlert size={40} className="mx-auto text-amber-400 mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">
                  Connection Required
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {errorMessage}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/app/connections")}
                >
                  View Connections
                </Button>
              </div>
            ) : (
              <div>
                <MessageSquare size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  Select a conversation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose a conversation from the list to start messaging.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
