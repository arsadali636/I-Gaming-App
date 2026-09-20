"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  Clock,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";

interface ConnectionUser {
  id: string;
  full_name: string;
  avatar_url?: string;
  company_id?: string;
  company_name?: string;
  company_logo?: string;
}

interface TargetCompany {
  id?: string;
  name?: string;
  logo_url?: string;
}

interface ConnectionItem {
  id: string;
  requester_id: string;
  receiver_id?: string;
  target_company_id?: string;
  requester?: ConnectionUser;
  receiver?: ConnectionUser;
  target_company?: TargetCompany;
  user?: ConnectionUser;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  created_at: string;
  updated_at?: string;
  responded_at?: string;
  is_requester: boolean;
}

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("accepted");
  const [search, setSearch] = useState("");
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [discoverResults, setDiscoverResults] = useState<ConnectionUser[]>([]);
  const [searching, setSearching] = useState(false);
  const initialTabChecked = useRef(false);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        const list: ConnectionItem[] = data.connections ?? [];
        setConnections(list);

        if (!initialTabChecked.current) {
          initialTabChecked.current = true;
          const acceptedCount = list.filter((c) => c.status === "accepted").length;
          const pendingCount = list.filter((c) => c.status === "pending").length;
          if (acceptedCount === 0 && pendingCount > 0) {
            setActiveTab("pending");
          }
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleAccept = async (connectionId: string) => {
    try {
      await fetch(`/api/connections/${connectionId}/accept`, { method: "POST" });
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, status: "accepted" as const } : c))
      );
    } catch {}
  };

  const handleReject = async (connectionId: string) => {
    try {
      await fetch(`/api/connections/${connectionId}/reject`, { method: "POST" });
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch {}
  };

  const handleConnect = async (userId: string) => {
    try {
      await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: userId }),
      });
      setDiscoverResults((prev) => prev.filter((u) => u.id !== userId));
    } catch {}
  };

  const searchDiscover = useCallback(async () => {
    if (!discoverSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(discoverSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setDiscoverResults(data.users ?? []);
      }
    } catch {} finally {
      setSearching(false);
    }
  }, [discoverSearch]);

  const accepted = connections.filter((c) => c.status === "accepted");
  const pending = connections.filter((c) => c.status === "pending");
  const filteredAccepted = search
    ? accepted.filter((c) => {
        const uName = c.requester?.full_name || c.user?.full_name || c.receiver?.full_name || "";
        const cName = c.requester?.company_name || c.target_company?.name || c.user?.company_name || "";
        return (
          uName.toLowerCase().includes(search.toLowerCase()) ||
          cName.toLowerCase().includes(search.toLowerCase())
        );
      })
    : accepted;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-foreground">Connections</h2>
        <p className="text-muted-foreground mt-1">
          Manage your professional network
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accepted" className="gap-1.5">
            <UserCheck size={14} /> My Connections ({accepted.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock size={14} /> Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="discover" className="gap-1.5">
            <UserPlus size={14} /> Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accepted">
          <div className="mt-4">
            <div className="relative max-w-md mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search connections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : filteredAccepted.length === 0 ? (
              <div className="text-center py-16">
                <UserCheck size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No connections yet</h3>
                <p className="text-sm text-muted-foreground">
                  {search ? "No connections match your search." : "Start connecting with people in the Discover tab."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAccepted.map((conn, i) => {
                  const targetUser = conn.is_requester ? (conn.receiver || conn.user) : (conn.requester || conn.user);
                  const name = targetUser?.full_name || conn.target_company?.name || "Connected Partner";
                  const companyName = conn.is_requester ? (conn.target_company?.name || targetUser?.company_name) : (conn.requester?.company_name || targetUser?.company_name);
                  const avatar = targetUser?.avatar_url || conn.target_company?.logo_url;
                  const receiverId = targetUser?.id || conn.receiver_id || conn.requester_id;

                  return (
                    <motion.div
                      key={conn.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="hover:border-primary/30 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar
                              src={avatar}
                              fallback={name}
                              size="default"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {name}
                              </p>
                              {companyName && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {companyName}
                                </p>
                              )}
                            </div>
                            <Badge variant="success" className="text-[10px] shrink-0">
                              Connected
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <a href={`/app/messages?receiver_id=${receiverId}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full gap-1.5">
                                <MessageSquare size={13} /> Message
                              </Button>
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : pending.length === 0 ? (
              <div className="text-center py-16">
                <Clock size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No pending requests</h3>
                <p className="text-sm text-muted-foreground">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((conn, i) => {
                  const displayUser = conn.is_requester ? (conn.receiver || conn.user) : (conn.requester || conn.user);
                  const name = displayUser?.full_name || conn.target_company?.name || "B2B Partner";
                  const compName = conn.is_requester
                    ? (conn.target_company?.name || displayUser?.company_name)
                    : (conn.requester?.company_name || displayUser?.company_name);
                  const avatar = displayUser?.avatar_url || conn.target_company?.logo_url;

                  return (
                    <motion.div
                      key={conn.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                          <Avatar
                            src={avatar}
                            fallback={name}
                            size="default"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {name}
                            </p>
                            {compName && (
                              <p className="text-xs text-muted-foreground">
                                {compName}
                              </p>
                            )}
                            {conn.message && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                &quot;{conn.message}&quot;
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {conn.is_requester ? "Sent" : "Received"} {formatDate(conn.created_at)}
                            </p>
                          </div>
                          {!conn.is_requester && (
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                className="bg-[#10B981] hover:bg-[#059669] text-white font-bold gap-1 rounded-xl"
                                onClick={() => handleAccept(conn.id)}
                              >
                                <Check size={14} /> Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/15 text-destructive hover:bg-destructive/10 gap-1 rounded-xl"
                                onClick={() => handleReject(conn.id)}
                              >
                                <X size={14} /> Reject
                              </Button>
                            </div>
                          )}
                          {conn.is_requester && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              <Clock size={10} className="mr-1" /> Pending
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="discover">
          <div className="mt-4">
            <div className="flex gap-2 max-w-md mb-4">
              <Input
                placeholder="Search for people..."
                value={discoverSearch}
                onChange={(e) => setDiscoverSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchDiscover()}
              />
              <Button onClick={searchDiscover} disabled={searching}>
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>

            {discoverResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {discoverResults.map((person, i) => (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="hover:border-primary/30 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar
                            src={person.avatar_url}
                            fallback={person.full_name}
                            size="default"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {person.full_name}
                            </p>
                            {person.company_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {person.company_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={() => handleConnect(person.id)}
                        >
                          <UserPlus size={13} /> Connect
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {discoverResults.length === 0 && !searching && discoverSearch && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No users found matching &quot;{discoverSearch}&quot;.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
