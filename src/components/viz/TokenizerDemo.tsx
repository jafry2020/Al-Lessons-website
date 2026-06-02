"use client";

import { useMemo, useState } from "react";

/**
 * Tokenizer demo for A6.2.
 *
 * Toy BPE-style tokenizer with a hand-curated merge table that mimics the
 * patterns of a real subword tokenizer:
 *  - Common English words become single tokens.
 *  - Less common words split into subword pieces.
 *  - Numbers split into smaller chunks.
 *  - Whitespace is part of tokens (byte-level BPE style).
 *
 * User types text; widget shows the tokens as coloured chunks with IDs.
 */

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f43f5e",
  "#84cc16",
];

// Hand-curated "vocabulary" — common English words, code tokens, and pieces.
// Order matters: longer matches first (greedy left-to-right).
const VOCAB: string[] = [
  // Common words with leading space (byte-level BPE style)
  " the",
  " of",
  " and",
  " to",
  " in",
  " a",
  " is",
  " that",
  " for",
  " on",
  " with",
  " as",
  " was",
  " at",
  " by",
  " an",
  " be",
  " this",
  " it",
  " from",
  " or",
  " are",
  " but",
  " not",
  " they",
  " have",
  " had",
  " what",
  " all",
  " were",
  " can",
  " will",
  " has",
  " more",
  " when",
  " who",
  " which",
  " its",
  " their",
  " them",
  " other",
  " into",
  " than",
  " any",
  " also",
  " could",
  " would",
  " should",
  " do",
  " does",
  " did",
  " been",
  " being",
  " these",
  " those",
  " here",
  " there",
  " where",
  " how",
  " why",
  " quick",
  " brown",
  " fox",
  " jumps",
  " over",
  " lazy",
  " dog",
  " cat",
  " sat",
  " mat",
  " hello",
  " world",
  " function",
  " return",
  " import",
  " from",
  " class",
  " def",
  " print",
  " sentence",
  " token",
  " text",
  " word",
  " number",
  // Common prefixes / suffixes
  "ing",
  "ed",
  "ly",
  "tion",
  "ness",
  "ment",
  "able",
  "ful",
  "ous",
  "ity",
  "ive",
  "ize",
  "ise",
  "er",
  "est",
  "ish",
  "less",
  "ship",
  "hood",
  "ward",
  "re",
  "un",
  "pre",
  "dis",
  "mis",
  "non",
  "anti",
  "auto",
  "sub",
  "super",
  // Common short pieces
  "the",
  "and",
  "for",
  "you",
  "are",
  "can",
  "not",
  "all",
  "have",
  "this",
  "with",
  "from",
  "your",
  "what",
  "but",
  "they",
  "will",
  "one",
  "more",
  "new",
  "would",
  "like",
  "time",
  "just",
  "know",
  "take",
  "into",
  "year",
  "good",
  "some",
  "could",
  "them",
  "see",
  "other",
  "than",
  "then",
  "now",
  "look",
  "only",
  "come",
  "its",
  "over",
  "think",
  "back",
  "after",
  "use",
  "two",
  "how",
  "our",
  "work",
  "first",
  "well",
  "way",
  "even",
  "want",
  "say",
  // Digits — each its own token
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  // Punctuation
  ".",
  ",",
  "!",
  "?",
  ";",
  ":",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  "'",
  '"',
  "+",
  "-",
  "*",
  "/",
  "=",
  "<",
  ">",
  "&",
  "|",
  "@",
  "#",
  "$",
  "%",
  "^",
  // Whitespace
  " ",
  "\n",
  "\t",
];

// Sort so longest entries come first for greedy match
const SORTED_VOCAB = [...VOCAB].sort((a, b) => b.length - a.length);

function tokenize(text: string): { token: string; id: number }[] {
  const tokens: { token: string; id: number }[] = [];
  let i = 0;
  while (i < text.length) {
    let matched = "";
    for (const v of SORTED_VOCAB) {
      if (text.startsWith(v, i)) {
        matched = v;
        break;
      }
    }
    if (matched) {
      tokens.push({ token: matched, id: hashId(matched) });
      i += matched.length;
    } else {
      // Fall back to single character
      const ch = text[i];
      tokens.push({ token: ch, id: hashId(ch) });
      i += 1;
    }
  }
  return tokens;
}

function hashId(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h) % 50000;
}

const DEFAULT_TEXT = "The quick brown fox jumps over the lazy dog.";

const PRESETS: { label: string; text: string }[] = [
  { label: "Common English", text: "The quick brown fox jumps over the lazy dog." },
  { label: "Long word", text: "Incomprehensibility is a long word." },
  { label: "Numbers", text: "The total is 273489 + 192834 = 466323." },
  { label: "Code", text: "def hello():\n    return 'hello world'" },
  { label: "Repetition", text: "the the the the the" },
];

export function TokenizerDemo() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const tokens = useMemo(() => tokenize(text), [text]);

  // Display whitespace visibly
  const renderToken = (t: string) => {
    return t.replace(/ /g, "·").replace(/\n/g, "↵\n").replace(/\t/g, "→ ");
  };

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="border-b border-border-subtle bg-surface p-3">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="text-overline uppercase text-text-muted">Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setText(p.text)}
                className="rounded-sm border border-border-subtle px-2 py-0.5 text-body-sm text-text-secondary hover:border-accent-500 hover:bg-accent-500/10 hover:text-accent-500"
              >
                {p.label}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full rounded-sm border border-border-subtle bg-canvas p-3 font-mono text-body-sm text-text-primary focus:border-accent-500 focus:outline-none"
            placeholder="Type text to tokenize…"
          />
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center gap-4 text-body-sm">
            <div>
              <span className="text-overline uppercase text-text-muted">Tokens:</span>{" "}
              <span className="font-mono text-h4 text-accent-500">{tokens.length}</span>
            </div>
            <div>
              <span className="text-overline uppercase text-text-muted">Characters:</span>{" "}
              <span className="font-mono text-text-primary">{text.length}</span>
            </div>
            <div>
              <span className="text-overline uppercase text-text-muted">Tokens/word:</span>{" "}
              <span className="font-mono text-text-primary">
                {(tokens.length / Math.max(1, text.trim().split(/\s+/).length)).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="rounded-sm border border-border-subtle bg-canvas p-3">
            {tokens.length === 0 ? (
              <span className="text-text-muted">Type text above to see tokenization.</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {tokens.map((t, i) => (
                  <span
                    key={`tok-${i}`}
                    className="inline-block rounded-sm px-1.5 py-0.5 font-mono text-body-sm"
                    style={{
                      backgroundColor: COLORS[i % COLORS.length] + "30",
                      borderLeft: `3px solid ${COLORS[i % COLORS.length]}`,
                      color: "rgb(var(--text-primary))",
                    }}
                    title={`Token ID: ${t.id}`}
                  >
                    {renderToken(t.token) || "·"}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="mt-3 text-caption text-text-muted">
            Whitespace shown as <span className="font-mono">·</span>; newline as{" "}
            <span className="font-mono">↵</span>. Hover a token to see its ID.
          </p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        A toy BPE-style tokenizer with ~300 vocabulary entries. Real production tokenizers (GPT-4
        cl100k: ~100k entries; Llama-3: 128k) work the same way at scale. Try the presets to see how
        numbers, code, and repetition affect token count.
      </figcaption>
    </figure>
  );
}
