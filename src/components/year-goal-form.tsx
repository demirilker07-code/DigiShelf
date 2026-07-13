"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function YearGoalForm({ year, targetBooks }: { year: number; targetBooks: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(targetBooks));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      setMessage(null);

      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year,
          targetBooks: Number(value),
        }),
      });

      if (!response.ok) {
        setMessage("Hedef kaydedilemedi.");
        return;
      }

      setMessage("Hedef güncellendi.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <label className="grid gap-2 text-sm text-[#587086]">
        Yıllık kitap hedefi
        <input
          type="number"
          min={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
        />
      </label>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-full bg-[#17324d] px-4 py-2 text-sm font-semibold text-[#f6efe5] transition hover:bg-[#102235] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Kaydediliyor..." : "Hedefi kaydet"}
        </button>
        {message ? <span className="text-sm text-[#5f7387]">{message}</span> : null}
      </div>
    </div>
  );
}