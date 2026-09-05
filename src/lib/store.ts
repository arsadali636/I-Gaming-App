"use client";

import { create } from "zustand";
import type { User, ContactCreditWallet } from "@/types";

interface AuthState {
  user: User | null;
  wallet: ContactCreditWallet | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setWallet: (wallet: ContactCreditWallet | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  wallet: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setWallet: (wallet) => set({ wallet }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, wallet: null, isLoading: false }),
}));

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  toggleSearch: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  searchOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
}));
