"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type BookStatusValue, statusOptions } from "@/lib/status";

type Tab = "isbn" | "manual";

type BookResult = {
  sourceKey: string | null;
  title: string;
  author: string;
  publishedYear: number | null;
  pageCount: number | null;
  categories: string[];
  isbn: string | null;
  coverUrl?: string | null;
};

type ManualFormState = {
  title: string;
  author: string;
  categories: string;
  pageCount: string;
  publishedYear: string;
  isbn: string;
  status: BookStatusValue;
  owned: boolean;
};

const initialManualState: ManualFormState = {
  title: "",
  author: "",
  categories: "",
  pageCount: "",
  publishedYear: "",
  isbn: "",
  status: "UNREAD",
  owned: true,
};

function BookPreviewCard({
  book,
  onAdd,
  isPending,
  addStatus,
  onStatusChange,
}: {
  book: BookResult;
  onAdd: () => void;
  isPending: boolean;
  addStatus: BookStatusValue;
  onStatusChange: (val: BookStatusValue) => void;
}) {
  return (
    <article className="rounded-[1.5rem] bg-[#f4ede2] p-4">
      <div className="flex gap-4">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-28 w-20 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-xl bg-[#e0d5c5] text-xs text-[#7a6b55]">
            Kapak yok
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-xl text-[#17324d]">{book.title}</h3>
          <p className="mt-1 text-sm text-[#5f7387]">{book.author}</p>
          <p className="mt-1 text-sm text-[#5f7387]">
            {book.pageCount ? `${book.pageCount} sayfa` : null}
            {book.pageCount && book.publishedYear ? " · " : null}
            {book.publishedYear ?? null}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {book.categories.map((c) => (
              <span key={c} className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-[#7a5d3a]">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-[#d8cfc3] pt-4 sm:flex-row sm:items-center">
        <select
          value={addStatus}
          onChange={(e) => onStatusChange(e.target.value as BookStatusValue)}
          className="flex-1 rounded-2xl border border-[#d8e0e8] bg-white px-3 py-2 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onAdd}
          disabled={isPending}
          className="rounded-full bg-[#17324d] px-4 py-2 text-sm font-semibold text-[#f6efe5] transition hover:bg-[#102235] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Ekleniyor..." : "Kütüphaneye ekle"}
        </button>
      </div>
    </article>
  );
}

export function AddBookPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("isbn");

  // ISBN tab state
  const [isbnQuery, setIsbnQuery] = useState("");
  const [isbnResult, setIsbnResult] = useState<BookResult | null>(null);
  const [isbnMessage, setIsbnMessage] = useState<string | null>(null);
  const [isbnAddStatus, setIsbnAddStatus] = useState<BookStatusValue>("UNREAD");
  const [isIsbnPending, startIsbnTransition] = useTransition();

  // Manuel tab state
  const [manualForm, setManualForm] = useState<ManualFormState>(initialManualState);
  const [manualMessage, setManualMessage] = useState<string | null>(null);
  const [isManualPending, startManualTransition] = useTransition();

  const lookupIsbn = () => {
    startIsbnTransition(async () => {
      setIsbnMessage(null);
      setIsbnResult(null);

      const response = await fetch(`/api/books/isbn?isbn=${encodeURIComponent(isbnQuery.trim())}`);
      const payload = (await response.json()) as { book?: BookResult; error?: string };

      if (!response.ok) {
        setIsbnMessage(payload.error ?? "ISBN araması başarısız oldu.");
        return;
      }

      setIsbnResult(payload.book ?? null);
    });
  };

  const addIsbnBook = () => {
    if (!isbnResult) return;
    startIsbnTransition(async () => {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...isbnResult,
          source: "openlibrary",
          status: isbnAddStatus,
          owned: isbnAddStatus !== "WISHLIST",
        }),
      });

      if (!response.ok) {
        setIsbnMessage("Kitap eklenemedi.");
        return;
      }

      setIsbnMessage(`"${isbnResult.title}" kütüphaneye eklendi.`);
      setIsbnResult(null);
      setIsbnQuery("");
      router.refresh();
    });
  };

  const addManual = () => {
    startManualTransition(async () => {
      setManualMessage(null);

      const response = await fetch("/api/library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: manualForm.title,
          author: manualForm.author,
          categories: manualForm.categories.split(",").map((item) => item.trim()).filter(Boolean),
          pageCount: manualForm.pageCount ? Number(manualForm.pageCount) : null,
          publishedYear: manualForm.publishedYear ? Number(manualForm.publishedYear) : null,
          isbn: manualForm.isbn || null,
          status: manualForm.status,
          owned: manualForm.owned,
          source: "manual",
          sourceKey: null,
        }),
      });

      if (!response.ok) {
        setManualMessage("Manuel kitap kaydı başarısız oldu.");
        return;
      }

      setManualForm(initialManualState);
      setManualMessage("Kitap kütüphaneye eklendi.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Sekme çubuğu */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "isbn", label: "ISBN ile ara" },
            { key: "manual", label: "Elle giriş" },
          ] as { key: Tab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-[#17324d] text-[#f6efe5]"
                : "bg-white/70 text-[#17324d] hover:bg-white border border-[#d8e0e8]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ISBN sekmesi */}
      {activeTab === "isbn" && (
        <section className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_18px_60px_rgba(39,63,90,0.1)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7b8fa2]">ISBN araması</p>
          <h2 className="mt-2 font-serif text-3xl text-[#17324d]">Barkod numarasıyla kitap bul</h2>
          <p className="mt-2 mb-5 text-sm leading-7 text-[#5f7387]">
            Kitabın arka kapağındaki ISBN-10 veya ISBN-13 numarasını gir. Open Library’den kapak
            resmi, yazar, sayfa sayısı ve kategori bilgisi otomatik gelir.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={isbnQuery}
              onChange={(e) => setIsbnQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupIsbn()}
              placeholder="9780140328721 veya 0140328726"
              className="flex-1 rounded-full border border-[#d8e0e8] bg-white px-5 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
            <button
              type="button"
              onClick={lookupIsbn}
              disabled={isIsbnPending || !isbnQuery.trim()}
              className="rounded-full bg-[#17324d] px-5 py-3 text-sm font-semibold text-[#f6efe5] transition hover:bg-[#102235] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isIsbnPending ? "Aranıyor..." : "ISBN ile sorgula"}
            </button>
          </div>

          {isbnMessage && (
            <p className="mt-4 text-sm text-[#5f7387]">{isbnMessage}</p>
          )}

          {isbnResult && (
            <div className="mt-5">
              <BookPreviewCard
                book={isbnResult}
                onAdd={addIsbnBook}
                isPending={isIsbnPending}
                addStatus={isbnAddStatus}
                onStatusChange={setIsbnAddStatus}
              />
            </div>
          )}
        </section>
      )}

      {/* Manuel giriş sekmesi */}
      {activeTab === "manual" && (
        <section className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_18px_60px_rgba(39,63,90,0.1)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7b8fa2]">Manuel kayıt</p>
          <h2 className="mt-2 font-serif text-3xl text-[#17324d]">Kitabı elle ekle</h2>
          <p className="mt-2 mb-5 text-sm leading-7 text-[#5f7387]">
            API’de bulamadığın kitaplar için tüm bilgileri kendin girerek kütüphanene ekleyebilirsin.
          </p>

          <div className="grid gap-4">
            <input
              value={manualForm.title}
              onChange={(e) => setManualForm((s) => ({ ...s, title: e.target.value }))}
              placeholder="Kitap adı *"
              className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
            <input
              value={manualForm.author}
              onChange={(e) => setManualForm((s) => ({ ...s, author: e.target.value }))}
              placeholder="Yazar *"
              className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
            <input
              value={manualForm.categories}
              onChange={(e) => setManualForm((s) => ({ ...s, categories: e.target.value }))}
              placeholder="Türler, virgülle ayır (Tarih, Roman, ...)"
              className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="number"
                value={manualForm.pageCount}
                onChange={(e) => setManualForm((s) => ({ ...s, pageCount: e.target.value }))}
                placeholder="Sayfa sayısı"
                className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
              />
              <input
                type="number"
                value={manualForm.publishedYear}
                onChange={(e) => setManualForm((s) => ({ ...s, publishedYear: e.target.value }))}
                placeholder="Basım yılı"
                className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
              />
              <input
                value={manualForm.isbn}
                onChange={(e) => setManualForm((s) => ({ ...s, isbn: e.target.value }))}
                placeholder="ISBN (opsiyonel)"
                className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={manualForm.status}
                onChange={(e) =>
                  setManualForm((s) => ({
                    ...s,
                    status: e.target.value as BookStatusValue,
                    owned: e.target.value !== "WISHLIST",
                  }))
                }
                className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-3 rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d]">
                <input
                  type="checkbox"
                  checked={manualForm.owned}
                  onChange={(e) => setManualForm((s) => ({ ...s, owned: e.target.checked }))}
                />
                Kütüphanemde mevcut
              </label>
            </div>
            <button
              type="button"
              onClick={addManual}
              disabled={isManualPending || !manualForm.title || !manualForm.author}
              className="rounded-full bg-[#17324d] px-5 py-3 text-sm font-semibold text-[#f6efe5] transition hover:bg-[#102235] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isManualPending ? "Ekleniyor..." : "Kütüphaneye kaydet"}
            </button>
            {manualMessage && <p className="text-sm text-[#5f7387]">{manualMessage}</p>}
          </div>
        </section>
      )}
    </div>
  );
}