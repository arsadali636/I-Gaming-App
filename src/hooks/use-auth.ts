"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export function useAuth() {
  const { user, wallet, isLoading, setUser, setWallet, setLoading, logout } =
    useAuthStore();
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setUser(data.user);
          if (data.wallet) {
            setWallet({
              id: data.wallet.id || "wallet",
              user_id: data.user.id,
              balance: data.wallet.balance ?? 0,
              total_earned: data.wallet.total_earned ?? 0,
              total_used: data.wallet.total_used ?? 0,
            });
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setWallet, setLoading]);

  useEffect(() => {
    if (isLoading) {
      fetchUser();
    }
  }, [isLoading, fetchUser]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout cleanup
    } finally {
      logout();
      router.push("/");
      router.refresh();
    }
  };

  return {
    user,
    wallet,
    isLoading,
    logout: handleLogout,
    refreshUser: fetchUser,
    refreshWallet: fetchUser,
  };
}

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.push("/login");
    }
  }, [auth.isLoading, auth.user, router]);

  return auth;
}
