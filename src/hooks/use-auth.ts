"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";

export function useAuth() {
  const { user, wallet, isLoading, setUser, setWallet, setLoading, logout } =
    useAuthStore();
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await apiClient.get<any>("/api/v1/auth/me/");
        if (data && data.id) {
          setUser(data);
          if (data.wallet_balance !== undefined) {
            setWallet({
              id: data.id,
              user_id: data.id,
              balance: data.wallet_balance,
              total_earned: data.wallet_balance,
              total_used: 0,
            });
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    if (isLoading) fetchUser();
  }, [isLoading, setUser, setWallet, setLoading]);

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/v1/auth/logout/");
    } catch {
      // Ignore network errors on logout cleanup
    } finally {
      logout();
      router.push("/");
      router.refresh();
    }
  };

  return { user, wallet, isLoading, logout: handleLogout };
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
