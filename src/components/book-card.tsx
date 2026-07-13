"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import type { BookCardData } from "@/lib/books";
import { type BookStatusValue, statusOptions } from "@/lib/status";
import { clamp, formatNumber } from "@/lib/utils";

type Mode = "view" | "status" | "edit";

export function BookCard({ book }: Readonly<{ book: BookCardData }>) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("view");

  // Durum & ilerleme
  const [status, setStatus] = useState<BookStatusValue>(book.status as BookStatusValue);
  const [currentPage, setCurrentPage] = useState(String(book.currentPage));
  const [notes, setNotes] = useState(book.notes ?? "");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isStatusPending, startStatusTransition] = useTransition();

  // Kitap düzenleme
  const [editForm, setEditForm] = useState({
    title: book.title,
    author: book.author,
    categories: book.categories.join(", "),
    pageCount: book.pageCount ? String(book.pageCount) : "",
    publishedYear: book.publishedYear ? String(book.publishedYear) : "",
    isbn: book.isbn ?? "",
    coverUrl: book.coverUrl ?? "",
  });
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [isEditPending, startEditTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const maxPages = book.pageCount || 9999;

  const saveStatus = () => {
    startStatusTransition(async () => {
      setStatusMsg(null);
      const res = await fetch(`/api/library/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          currentPage: clamp(Number(currentPage || 0), 0, maxPages),
          notes,
        }),
      });
      if (!res.ok) { setStatusMsg("Güncelleme başarısız."); return; }
      setStatusMsg("Kaydedildi.");
      router.refresh();
    });
  };

  const saveEdit = () => {
    startEditTransition(async () => {
      setEditMsg(null);
      const res = await fetch(`/api/library/${book.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          author: editForm.author,
          categories: editForm.categories.split(",").map((s) => s.trim()).filter(Boolean),
          pageCount: editForm.pageCount ? Number(editForm.pageCount) : null,
          publishedYear: editForm.publishedYear ? Number(editForm.publishedYear) : null,
          isbn: editForm.isbn || null,
          coverUrl: editForm.coverUrl || null,
        }),
      });
      if (!res.ok) { setEditMsg("Kayıt başarısız."); return; }
      setEditMsg("Değişiklikler kaydedildi.");
      router.refresh();
    });
  };

  const deleteBook = () => {
    if (!window.confirm(`"${book.title}" kütüphaneden silinsin mi? Bu işlem geri alınamaz.`)) return;
    startDeleteTransition(async () => {
      const res = await fetch(`/api/library/${book.id}`, { method: "DELETE" });
      if (!res.ok) { alert("Silme başarısız oldu."); return; }
      router.refresh();
    });
  };

  const coverInitials = book.title.slice(0, 2).toUpperCase();

  return (
    <article className="rounded-[1.75rem] border border-white/60 bg-white/85 shadow-[0_18px_60px_rgba(39,63,90,0.1)] backdrop-blur overflow-hidden">
      {/* Kapak + Başlık */}
      <div className="flex gap-4 p-5">
        {/* Kapak resmi */}
        <div className="shrink-0">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-36 w-24 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <div className="flex h-36 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e3f5e] to-[#2d5a82] shadow-md">
              <span className="font-serif text-2xl font-bold text-white/90">{coverInitials}</span>
            </div>
          )}
        </div>

        {/* Bilgiler */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c8d9f]">{book.author}</p>
              <h3 className="mt-1 font-serif text-xl leading-tight text-[#17324d]">{book.title}</h3>
              {book.publishedYear ? (
                <p className="mt-0.5 text-xs text-[#8a9aaa]">{book.publishedYear}</p>
              ) : null}
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${book.statusTone}`}>
              {book.statusLabel}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {book.categories.map((c) => (
              <span key={c} className="rounded-full bg-[#f3e7d7] px-2.5 py-0.5 text-xs font-medium text-[#7a5d3a]">
                {c}
              </span>
            ))}
          </div>

          {/* İlerleme */}
          {book.pageCount > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-[#7a8fa0]">
                <span>İlerleme</span>
                <span>{formatNumber(book.currentPage)} / {formatNumber(book.pageCount)} sf</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#e4eaf0]">
                <div
                  className="h-1.5 rounded-full bg-[#17324d] transition-all"
                  style={{ width: `${Math.round(book.progress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Not (varsa) */}
      {book.notes && mode === "view" && (
        <div className="mx-5 mb-4 rounded-2xl bg-[#f4ede2] px-4 py-3 text-sm text-[#5f7387]">
          {book.notes}
        </div>
      )}

      {/* Aksiyon çubuğu */}
      <div className="flex items-center gap-2 border-t border-[#e8edf2] px-5 py-3">
        <button
          type="button"
          onClick={() => setMode(mode === "status" ? "view" : "status")}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#17324d] px-3 py-2 text-xs font-semibold text-[#f6efe5] transition hover:bg-[#102235]"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Okuma durumu
          {mode === "status" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "edit" ? "view" : "edit")}
          className="flex items-center gap-1.5 rounded-full border border-[#d8e0e8] bg-white px-3 py-2 text-xs font-semibold text-[#17324d] transition hover:bg-[#f4f7fa]"
        >
          <Pencil className="h-3.5 w-3.5" />
          Düzenle
        </button>
        <button
          type="button"
          onClick={deleteBook}
          disabled={isDeletePending}
          className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isDeletePending ? "..." : "Sil"}
        </button>
      </div>

      {/* Okuma durumu paneli */}
      {mode === "status" && (
        <div className="border-t border-[#e8edf2] bg-[#f8fafb] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#17324d]">Okuma durumu & ilerleme</p>
            <button type="button" onClick={() => setMode("view")} className="text-[#7c8d9f] hover:text-[#17324d]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
            Durum
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookStatusValue)}
              className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
            Okunan sayfa
            <input
              type="number"
              min={0}
              max={maxPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
            Kısa not
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Okuma notu veya özet..."
              className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveStatus}
              disabled={isStatusPending}
              className="rounded-full bg-[#17324d] px-4 py-2 text-sm font-semibold text-[#f6efe5] transition hover:bg-[#102235] disabled:opacity-60"
            >
              {isStatusPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            {statusMsg && <span className="text-xs text-[#5f7387]">{statusMsg}</span>}
          </div>
        </div>
      )}

      {/* Kitap düzenleme paneli */}
      {mode === "edit" && (
        <div className="border-t border-[#e8edf2] bg-[#f8fafb] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#17324d]">Kitap bilgilerini düzenle</p>
            <button type="button" onClick={() => setMode("view")} className="text-[#7c8d9f] hover:text-[#17324d]">
              <X className="h-4 w-4" />
            </button>
          </div>

          <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
            Kitap adı
            <input
              value={editForm.title}
              onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))}
              className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
            Yazar
            <input
              value={editForm.author}
              onChange={(e) => setEditForm((s) => ({ ...s, author: e.target.value }))}
              className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
            Türler (virgülle ayır)
            <input
              value={editForm.categories}
              onChange={(e) => setEditForm((s) => ({ ...s, categories: e.target.value }))}
              placeholder="Tarih, Roman, Bilim Kurgu"
              className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
              Sayfa sayısı
              <input
                type="number"
                value={editForm.pageCount}
                onChange={(e) => setEditForm((s) => ({ ...s, pageCount: e.target.value }))}
                className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
              Basım yılı
              <input
                type="number"
                value={editForm.publishedYear}
                onChange={(e) => setEditForm((s) => ({ ...s, publishedYear: e.target.value }))}
                className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
            ISBN
            <input
              value={editForm.isbn}
              onChange={(e) => setEditForm((s) => ({ ...s, isbn: e.target.value }))}
              placeholder="9780140328721"
              className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
            Kapak görseli URL
            <input
              value={editForm.coverUrl}
              onChange={(e) => setEditForm((s) => ({ ...s, coverUrl: e.target.value }))}
              placeholder="https://covers.openlibrary.org/b/id/..."
              className="rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
          </label>

          {editForm.coverUrl && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#d8e0e8] bg-white p-3">
              <img
                src={editForm.coverUrl}
                alt="Kapak önizleme"
                className="h-16 w-12 rounded-xl object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="text-xs text-[#5f7387]">Kapak önizlemesi</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveEdit}
              disabled={isEditPending || !editForm.title || !editForm.author}
              className="rounded-full bg-[#17324d] px-4 py-2 text-sm font-semibold text-[#f6efe5] transition hover:bg-[#102235] disabled:opacity-60"
            >
              {isEditPending ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
            </button>
            {editMsg && <span className="text-xs text-[#5f7387]">{editMsg}</span>}
          </div>
        </div>
      )}
    </article>
  );
}

