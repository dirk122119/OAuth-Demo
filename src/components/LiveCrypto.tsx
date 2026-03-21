"use client";

import { useState, useCallback } from "react";
import {
  generateCodeVerifier,
  computeCodeChallenge,
  sha256,
  bytesToHex,
} from "@/lib/pkce";
import type { OAuthState } from "./StateSidebar";

interface LiveCryptoProps {
  onStateChange: (state: Partial<OAuthState>) => void;
}

type PipelineStep = "idle" | "verifier" | "hashing" | "challenge";

export function LiveCrypto({ onStateChange }: LiveCryptoProps) {
  const [verifier, setVerifier] = useState<string>("");
  const [hashHex, setHashHex] = useState<string>("");
  const [challenge, setChallenge] = useState<string>("");
  const [step, setStep] = useState<PipelineStep>("idle");
  const [isAnimating, setIsAnimating] = useState(false);

  const generate = useCallback(async () => {
    setIsAnimating(true);
    setStep("verifier");

    const v = generateCodeVerifier();
    setVerifier(v);
    onStateChange({ codeVerifier: v });

    await new Promise((r) => setTimeout(r, 400));
    setStep("hashing");

    const hash = await sha256(v);
    const hex = bytesToHex(hash);
    setHashHex(hex);
    await new Promise((r) => setTimeout(r, 600));

    setStep("challenge");
    const c = await computeCodeChallenge(v);
    setChallenge(c);
    onStateChange({ codeChallenge: c });

    setIsAnimating(false);
  }, [onStateChange]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Live Cryptography
        </h2>
        <button
          onClick={generate}
          disabled={isAnimating}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {verifier ? "Regenerate" : "Generate code_verifier"}
        </button>
      </div>

      <div className="flex flex-wrap items-stretch gap-2 md:gap-0 md:flex-nowrap">
        <div
          className={`flex-1 min-w-[140px] rounded-xl border-2 p-4 transition-all duration-300 ${
            step === "verifier" || step === "challenge" || verifier
              ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-800/50"
          }`}
        >
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            code_verifier
          </div>
          <div
            className={`break-all text-xs transition-opacity ${
              verifier ? "opacity-100" : "opacity-40"
            }`}
          >
            {verifier || "—"}
          </div>
        </div>

        <div className="hidden md:flex items-center px-2 text-zinc-300 dark:text-zinc-600">
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        <div
          className={`flex-1 min-w-[140px] rounded-xl border-2 p-4 transition-all duration-300 ${
            step === "hashing" || hashHex
              ? "border-violet-500/50 bg-violet-500/5 dark:bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-800/50"
          }`}
        >
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            SHA-256
          </div>
          <div
            className={`break-all text-xs transition-opacity ${
              hashHex ? "opacity-100" : "opacity-40"
            }`}
          >
            {hashHex ? `${hashHex.slice(0, 32)}…` : "—"}
          </div>
        </div>

        <div className="hidden md:flex items-center px-2 text-zinc-300 dark:text-zinc-600">
          <svg className={`w-6 h-6 ${step === "challenge" ? "animate-pulse" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        <div
          className={`flex-1 min-w-[140px] rounded-xl border-2 p-4 transition-all duration-300 ${
            step === "challenge" && challenge
              ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-800/50"
          }`}
        >
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            code_challenge
          </div>
          <div
            className={`break-all text-xs transition-opacity ${
              challenge ? "opacity-100" : "opacity-40"
            }`}
          >
            {challenge || "—"}
          </div>
        </div>
      </div>

      {verifier && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          verifier → SHA-256 → Base64URL encode = challenge (PKCE S256)
        </p>
      )}
    </section>
  );
}
