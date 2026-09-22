/**
 * Utility for detecting restricted contact information and numeric content in messages.
 * Detects digits (0-9), formatted/obfuscated numbers, spelled-out number words,
 * email addresses, phone numbers, WhatsApp, Telegram, and social contact bypasses.
 * Includes false-positive protection for ordinary business language.
 */

export interface ContactDetectionResult {
  containsContact: boolean;
  type?: "number" | "email" | "phone" | "whatsapp" | "telegram" | "social" | "bypass_attempt";
  reason?: string;
}

const NUMBER_WORDS_SET = new Set([
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
  "eighty", "ninety", "hundred", "thousand", "million", "billion"
]);

// Single number words that are almost exclusively used for numbers/contacts
const STRICT_NUMBER_WORDS = new Set([
  "zero", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
  "eighty", "ninety", "hundred", "thousand", "million", "billion"
]);

const ORDINARY_ONE_PHRASES = [
  "one of", "one or", "one another", "one time", "one day", "one place",
  "one aspect", "one option", "one feature", "one reason", "one benefit",
  "one way", "one idea", "one solution", "one example", "one side",
  "one type", "one thing", "one year", "one month", "one week", "one step",
  "one more", "at one"
];

export function detectContactInfo(rawText: string): ContactDetectionResult {
  if (!rawText || typeof rawText !== "string") {
    return { containsContact: false };
  }

  const text = rawText.trim();
  if (!text) return { containsContact: false };

  // 1. STRICT DIGIT DETECTION: Any numeric digit (0-9) MUST trigger protection
  if (/\d/.test(text)) {
    return {
      containsContact: true,
      type: "number",
      reason: "Numeric digits detected in message",
    };
  }

  // 2. Normalize text for obfuscated numbers, words, and email checks
  let lower = text.toLowerCase();

  // A. Check for standard & obfuscated Emails
  const standardEmailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (standardEmailRegex.test(text)) {
    return { containsContact: true, type: "email", reason: "Email address detected" };
  }

  let normalizedEmail = lower;
  normalizedEmail = normalizedEmail.replace(/\s*\[\s*at\s*\]\s*/gi, "@");
  normalizedEmail = normalizedEmail.replace(/\s*\(\s*at\s*\)\s*/gi, "@");
  normalizedEmail = normalizedEmail.replace(/\s*\{\s*at\s*\}\s*/gi, "@");
  normalizedEmail = normalizedEmail.replace(/\b([a-z0-9._%+-]+)\s+at\s+([a-z0-9.-]+\.[a-z]{2,})\b/gi, "$1@$2");
  normalizedEmail = normalizedEmail.replace(/\s*\[\s*dot\s*\]\s*/gi, ".");
  normalizedEmail = normalizedEmail.replace(/\s*\(\s*dot\s*\)\s*/gi, ".");
  normalizedEmail = normalizedEmail.replace(/\s*\{\s*dot\s*\}\s*/gi, ".");
  normalizedEmail = normalizedEmail.replace(/\b([a-z0-9-]+)\s+dot\s+([a-z]{2,})\b/gi, "$1.$2");

  if (standardEmailRegex.test(normalizedEmail)) {
    return { containsContact: true, type: "email", reason: "Obfuscated email address detected" };
  }

  const phrasedEmailRegex = /\b(?:email|mail|e-mail)\s+(?:me\s+)?(?:at|is|on|to)?\s*[:\s]*([a-z0-9._%+-]+(?:\s+at\s+|\s*@\s*)[a-z0-9.-]+)/i;
  if (phrasedEmailRegex.test(text) || phrasedEmailRegex.test(normalizedEmail)) {
    return { containsContact: true, type: "email", reason: "Email contact request detected" };
  }

  // B. Check for WhatsApp
  const waLinkRegex = /\b(?:wa\.me\/|api\.whatsapp\.com\/|whatsapp\.com\/|whatsapp\s*:\s*[\+0-9a-z])/i;
  if (waLinkRegex.test(text) || waLinkRegex.test(lower)) {
    return { containsContact: true, type: "whatsapp", reason: "WhatsApp link or contact detected" };
  }

  const waIntentRegex = /\b(?:whatsapp|wa)\s+(?:me\s+)?(?:at|is|on|number|msg)?\s*[:\s]*[\+0-9a-z_]{3,}/i;
  if (waIntentRegex.test(text)) {
    if (
      !lower.includes("whatsapp integration") &&
      !lower.includes("whatsapp api") &&
      !lower.includes("whatsapp feature") &&
      !lower.includes("whatsapp support")
    ) {
      return { containsContact: true, type: "whatsapp", reason: "WhatsApp contact request detected" };
    }
  }

  // C. Check for Telegram
  const tgLinkRegex = /\b(?:t\.me|telegram\.me)\/[a-zA-Z0-9_]{3,}/i;
  if (tgLinkRegex.test(text) || tgLinkRegex.test(lower)) {
    return { containsContact: true, type: "telegram", reason: "Telegram link detected" };
  }

  // Telegram context + handle: "Telegram: @username", "telegram me @user", "contact me on telegram @user", "tg @username"
  const tgIntentRegex = /\b(?:telegram|tg)\s*(?:me\s*)?(?:at|is|on|username|handle|id|:\s*)?\s*[:\s]*@[a-zA-Z0-9_]{3,}/i;
  if (tgIntentRegex.test(text) || tgIntentRegex.test(lower)) {
    return { containsContact: true, type: "telegram", reason: "Telegram username detected" };
  }

  const tgColonRegex = /\b(?:telegram|tg)\s*:\s*[a-zA-Z0-9_]{3,}\b/i;
  if (tgColonRegex.test(text)) {
    if (
      !lower.includes("telegram bot") &&
      !lower.includes("telegram integration") &&
      !lower.includes("telegram channel")
    ) {
      return { containsContact: true, type: "telegram", reason: "Telegram handle detected" };
    }
  }

  // D. Check for Social & Bypass Phrases
  const bypassSocialRegex = /\b(?:skype|discord|wechat|line|viber)\s*(?:me\s*)?(?:at|is|on|id|handle)?\s*[:\s]*@?[a-zA-Z0-9_.-]{3,}/i;
  if (bypassSocialRegex.test(text)) {
    return { containsContact: true, type: "social", reason: "Third-party social contact handle detected" };
  }

  const directBypassRegex = /\b(?:reach\s+me\s+at|contact\s+me\s+at|text\s+me\s+at|message\s+me\s+on)\s+[:\s]*[@+0-9a-zA-Z._-]{3,}/i;
  if (directBypassRegex.test(text)) {
    return { containsContact: true, type: "bypass_attempt", reason: "Direct contact bypass request detected" };
  }

  // 3. SPELLED-OUT NUMBERS & OBFUSCATED NUMBER WORDS
  // Replace separators (-, ., /, ,, _, +) with spaces for word analysis
  const cleanSeparators = lower.replace(/[-./,_+]/g, " ");
  const tokens = cleanSeparators.split(/\s+/).filter((t) => t.length > 0);

  if (tokens.length > 0) {
    // Check if ALL tokens are number words (e.g. "three", "one two", "twenty five", "eight seven six")
    const allNumberWords = tokens.every((t) => NUMBER_WORDS_SET.has(t));
    if (allNumberWords) {
      return {
        containsContact: true,
        type: "number",
        reason: "Spelled-out number words detected",
      };
    }

    // Check for sequence of 2 or more consecutive number words anywhere in text (e.g. "one two", "nine eight seven")
    let consecutiveCount = 0;
    for (const token of tokens) {
      if (NUMBER_WORDS_SET.has(token)) {
        consecutiveCount++;
        if (consecutiveCount >= 2) {
          return {
            containsContact: true,
            type: "number",
            reason: "Sequence of spelled-out numbers detected",
          };
        }
      } else {
        consecutiveCount = 0;
      }
    }

    // Check if any strict number word (two, three, four, etc.) exists in isolation
    for (const token of tokens) {
      if (STRICT_NUMBER_WORDS.has(token)) {
        return {
          containsContact: true,
          type: "number",
          reason: "Spelled-out number word detected",
        };
      }
    }

    // Check for the word "one" when NOT part of common ordinary English phrases
    if (tokens.includes("one")) {
      const isOrdinary = ORDINARY_ONE_PHRASES.some((phrase) => lower.includes(phrase));
      if (!isOrdinary) {
        return {
          containsContact: true,
          type: "number",
          reason: "Spelled-out number detected",
        };
      }
    }
  }

  return { containsContact: false };
}
