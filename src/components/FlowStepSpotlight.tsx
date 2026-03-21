"use client";

import { useEffect, useRef, useState } from "react";
import { SEQUENCE_STEPS } from "@/components/SequenceDiagram";

/**
 * 步驟變更時跳出「目前執行順序」提示（可關閉，數秒後自動收起）
 */
export function FlowStepSpotlight({ syncedStep }: { syncedStep: number }) {
  const safe = Math.min(6, Math.max(0, syncedStep));
  const [open, setOpen] = useState(true);
  const prevStep = useRef(safe);

  useEffect(() => {
    if (prevStep.current !== safe) {
      setOpen(true);
      prevStep.current = safe;
    }
  }, [safe]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 8000);
    return () => clearTimeout(t);
  }, [safe, open]);

  if (!open) return null;

  const meta = SEQUENCE_STEPS[safe];

  return (
    <div
      className="sticky top-0 z-30 mb-6 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/95 dark:bg-emerald-950/90 dark:border-emerald-500/50 shadow-lg shadow-emerald-500/10 backdrop-blur-sm px-4 py-3 animate-flow-step-in"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            目前執行順序 · 第 {safe + 1} / 7 步
          </p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mt-1">
            {meta.label}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
            {meta.hintZh}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="shrink-0 self-end sm:self-start px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
