"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, Eye, EyeOff } from "lucide-react";
import { maskEmail, maskPhone } from "@/lib/utils";

interface ContactMaskedProps {
  email: string;
  phone?: string | null;
  is_revealed: boolean;
  onReveal: () => void;
}

export default function ContactMasked({
  email,
  phone,
  is_revealed,
  onReveal,
}: ContactMaskedProps) {
  const [localRevealed, setLocalRevealed] = useState(is_revealed);

  const revealed = localRevealed || is_revealed;

  const handleReveal = () => {
    setLocalRevealed(true);
    onReveal();
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Mail size={14} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
            Email
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={revealed ? "email-revealed" : "email-masked"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-sm text-foreground font-mono truncate"
            >
              {revealed ? email : maskEmail(email)}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {phone && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <Phone size={14} className="text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Phone
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={revealed ? "phone-revealed" : "phone-masked"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-sm text-foreground font-mono"
              >
                {revealed ? phone : maskPhone(phone)}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      )}

      {!revealed && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReveal}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <Eye size={14} />
          Reveal Contact
        </motion.button>
      )}

      {revealed && (
        <div className="flex items-center gap-1.5 text-[11px] text-accent">
          <EyeOff size={12} />
          <span>Contact revealed</span>
        </div>
      )}
    </div>
  );
}
