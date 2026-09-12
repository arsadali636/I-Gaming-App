"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email or username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid email or password.");
        } else {
          setError(data.error || "Login failed. Please check your credentials.");
        }
        return;
      }

      if (data && data.user) {
        useAuthStore.getState().setUser(data.user);
      }

      router.push("/app");
      router.refresh();
    } catch (err: unknown) {
      console.error("Login submission error:", err);
      setError("Unable to connect to authentication service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
          Log in to Your Account
        </h1>
        <p className="mt-2 text-sm text-[#A1A9B8]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#4F46E5] hover:underline transition-colors"
          >
            Register
          </Link>
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 flex items-start gap-3 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]"
        >
          <AlertCircle size={18} className="shrink-0 text-[#EF4444] mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username or Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#A1A9B8]">
            Username or Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
              <Mail size={18} />
            </div>
            <input
              id="email"
              type="text"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[#252A3A] bg-[#111522] py-2.5 pl-10 pr-4 text-sm text-[#F8FAFC] placeholder-[#6B7280] transition-all focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#A1A9B8]">
              Password
            </label>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
              <Lock size={18} />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-[#252A3A] bg-[#111522] py-2.5 pl-10 pr-11 text-sm text-[#F8FAFC] placeholder-[#6B7280] transition-all focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#6B7280] hover:text-[#F8FAFC] transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[#252A3A] bg-[#111522] text-[#4F46E5] focus:ring-[#4F46E5]/20"
            />
            <span className="text-xs font-medium text-[#A1A9B8]">Remember me</span>
          </label>

          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-[#4F46E5] hover:underline transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Primary Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] py-3 text-sm font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2 mt-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin text-white" />
              <span>Logging in...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </button>
      </form>
    </motion.div>
  );
}
