"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X, BookOpen, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import type { BookCardData } from "@/lib/books";
import { type BookStatusValue, statusOptions, statusTone } from "@/lib/status";
import { clamp, formatNumber } from "@/lib/utils";

// ─── Yardımcı bileşenler ────────────────────────────────────────────────────

function CoverImage({
  coverUrl,
  title,
  size = "sm",
}: {
  coverUrl: string | null;
  title: string;
  size?: "sm" | "lg";
}) {
  const initials = title.slice(0, 2).toUpperCase();
  const dim = size === "sm" ? "h-14 w-10" : "h-52 w-36";
  const textSize = size === "sm" ? "text-xs" : "text-3xl";

  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={title}
        className={`${dim} shrink-0 rounded-xl object-cover shadow`}
      />
    );
  }

  return (
    <div
      className={`${dim} shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1e3f5e] to-[#2d5a82] shadow`}
    >
      <span className={`font-serif font-bold text-white/90 ${textSize}`}>{initials}</span>
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────

function BookModal({
  book,
  onClose,
}: {
  book: BookCardData;
  onClose: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "edit">("info");

  // Durum & not
  const [status, setStatus] = useState<BookStatusValue>(book.status as BookStatusValue);
  const [currentPage, setCurrentPage] = useState(String(book.currentPage));
  const [notes, setNotes] = useState(book.notes ?? "");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isStatusPending, startStatusTransition] = useTransition();

  // Düzenleme
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

  // ESC ile kapatma
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Scroll kilidi
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

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
    if (!window.confirm(`"${book.title}" kütüphaneden silinsin mi?`)) return;
    startDeleteTransition(async () => {
      const res = await fetch(`/api/library/${book.id}`, { method: "DELETE" });
      if (!res.ok) { alert("Silme başarısız."); return; }
      onClose();
      router.refresh();
    });
  };

  const inputCls = "rounded-2xl border border-[#d8e0e8] bg-white px-4 py-3 text-sm text-[#17324d] outline-none focus:border-[#17324d] w-full";
  // Sürükleme sırasında kapanmayı önlemek için mousedown konumunu takip ediyoruz
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Arka plan — sadece direkt tıklamada (sürükleme değil) kapanır */}
      <div
        className="absolute inset-0 bg-[#0d1f2d]/60 backdrop-blur-sm"
        onMouseDown={(e) => { dragOriginRef.current = { x: e.clientX, y: e.clientY }; }}
        onClick={(e) => {
          if (!dragOriginRef.current) return;
          const dx = e.clientX - dragOriginRef.current.x;
          const dy = e.clientY - dragOriginRef.current.y;
          dragOriginRef.current = null;
          if (dx * dx + dy * dy < 64) onClose(); // 8px eşiği
        }}
      />

      {/* Kart — mousedown propagasyonunu durdurarak sürüklemede backdrop'u tetiklemiyor */}
      <div
        className="relative z-10 flex h-[92vh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-[#f7f3ed] shadow-2xl sm:h-auto sm:max-h-[88vh] sm:max-w-xl sm:rounded-[2rem]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-start gap-4 border-b border-[#e4ddd3] bg-white/80 p-5 backdrop-blur-sm">
          <CoverImage coverUrl={book.coverUrl} title={book.title} size="sm" />
          <div className="min-w-0 flex-1">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${book.statusTone}`}>
              {book.statusLabel}
            </span>
            <h2 className="mt-1 font-serif text-xl leading-tight text-[#17324d]">{book.title}</h2>
            <p className="text-sm text-[#6b8194]">{book.author}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-[#7c8d9f] hover:bg-[#e8edf2] hover:text-[#17324d]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sekme çubuğu */}
        <div className="flex gap-1 border-b border-[#e4ddd3] bg-white/60 px-5 pt-3 pb-0">
          {(["info", "edit"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-t-2xl px-5 py-2.5 text-sm font-semibold transition ${
                tab === t
                  ? "bg-[#f7f3ed] text-[#17324d]"
                  : "text-[#7c8d9f] hover:text-[#17324d]"
              }`}
            >
              {t === "info" ? "Okuma durumu" : "Bilgileri düzenle"}
            </button>
          ))}
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "info" && (
            <div className="space-y-4">
              {/* Kategori etiketleri */}
              <div className="flex flex-wrap gap-2">
                {book.categories.map((c) => (
                  <span key={c} className="rounded-full bg-[#efe6d8] px-3 py-1 text-xs font-medium text-[#7a5d3a]">
                    {c}
                  </span>
                ))}
              </div>

              {/* Sayfa ilerlemesi */}
              {book.pageCount > 0 && (
                <div className="rounded-2xl bg-white p-4 space-y-2">
                  <div className="flex justify-between text-sm text-[#587086]">
                    <span>İlerleme</span>
                    <span className="font-semibold text-[#17324d]">
                      {formatNumber(book.currentPage)} / {formatNumber(book.pageCount)} sayfa
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e4eaf0]">
                    <div
                      className="h-2 rounded-full bg-[#17324d] transition-all"
                      style={{ width: `${Math.round(book.progress * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Durum güncelleme */}
              <div className="space-y-3 rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8fa2]">Durumu güncelle</p>
                <select
                  value={status}
                  onChange={(e) => {
                    const next = e.target.value as BookStatusValue;
                    setStatus(next);
                    if (next === "READ" && book.pageCount > 0) {
                      setCurrentPage(String(book.pageCount));
                    }
                  }}
                  className={inputCls}
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min={0}
                  max={maxPages}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                  placeholder="Okunan sayfa"
                  className={inputCls}
                />

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Okuma notu veya özet..."
                  className={inputCls}
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={saveStatus}
                    disabled={isStatusPending}
                    className="flex items-center gap-2 rounded-full bg-[#17324d] px-4 py-2.5 text-sm font-semibold text-[#f6efe5] transition hover:bg-[#102235] disabled:opacity-60"
                  >
                    <BookOpen className="h-4 w-4" />
                    {isStatusPending ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  {statusMsg && <span className="text-xs text-[#5f7387]">{statusMsg}</span>}
                </div>
              </div>
            </div>
          )}

          {tab === "edit" && (
            <div className="space-y-3">
              <div className="space-y-3 rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8fa2]">Kitap bilgileri</p>

                <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
                  Kitap adı
                  <input value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} className={inputCls} />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
                  Yazar
                  <input value={editForm.author} onChange={(e) => setEditForm((s) => ({ ...s, author: e.target.value }))} className={inputCls} />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
                  Türler (virgülle ayır)
                  <input value={editForm.categories} onChange={(e) => setEditForm((s) => ({ ...s, categories: e.target.value }))} placeholder="Tarih, Roman, ..." className={inputCls} />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
                    Sayfa sayısı
                    <input type="number" value={editForm.pageCount} onChange={(e) => setEditForm((s) => ({ ...s, pageCount: e.target.value }))} className={inputCls} />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
                    Basım yılı
                    <input type="number" value={editForm.publishedYear} onChange={(e) => setEditForm((s) => ({ ...s, publishedYear: e.target.value }))} className={inputCls} />
                  </label>
                </div>

                <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
                  ISBN
                  <input value={editForm.isbn} onChange={(e) => setEditForm((s) => ({ ...s, isbn: e.target.value }))} placeholder="9786055029982" className={inputCls} />
                </label>

                <label className="grid gap-1.5 text-xs font-medium text-[#587086]">
                  Kapak görseli URL
                  <input value={editForm.coverUrl} onChange={(e) => setEditForm((s) => ({ ...s, coverUrl: e.target.value }))} placeholder="https://covers.openlibrary.org/..." className={inputCls} />
                </label>

                {editForm.coverUrl && (
                  <div className="flex items-center gap-3 rounded-2xl border border-[#e4ddd3] p-3">
                    <img
                      src={editForm.coverUrl}
                      alt="Önizleme"
                      className="h-16 w-12 rounded-xl object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className="text-xs text-[#5f7387]">Kapak önizlemesi</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={isEditPending || !editForm.title || !editForm.author}
                    className="flex items-center gap-2 rounded-full bg-[#17324d] px-4 py-2.5 text-sm font-semibold text-[#f6efe5] transition hover:bg-[#102235] disabled:opacity-60"
                  >
                    <Pencil className="h-4 w-4" />
                    {isEditPending ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
                  </button>
                  {editMsg && <span className="text-xs text-[#5f7387]">{editMsg}</span>}
                </div>
              </div>

              {/* Silme */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Tehlikeli alan</p>
                <p className="mt-2 text-sm text-rose-600">Bu kitap kütüphaneden kalıcı olarak silinir.</p>
                <button
                  type="button"
                  onClick={deleteBook}
                  disabled={isDeletePending}
                  className="mt-3 flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeletePending ? "Siliniyor..." : "Kitabı sil"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Liste satırı ────────────────────────────────────────────────────────────

function LibraryRow({
  book,
  onSelect,
}: {
  book: BookCardData;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-4 rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-left transition hover:border-[#d8e0e8] hover:bg-white hover:shadow-md"
    >
      <CoverImage coverUrl={book.coverUrl} title={book.title} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-serif text-lg leading-tight text-[#17324d]">{book.title}</p>
            <p className="mt-0.5 truncate text-sm text-[#6b8194]">{book.author}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${book.statusTone}`}>
            {book.statusLabel}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3">
          {book.categories.slice(0, 2).map((c) => (
            <span key={c} className="rounded-full bg-[#efe6d8] px-2.5 py-0.5 text-xs text-[#7a5d3a]">
              {c}
            </span>
          ))}
          {book.pageCount > 0 && (
            <span className="ml-auto text-xs text-[#8a9aaa]">
              {formatNumber(book.currentPage)} / {formatNumber(book.pageCount)} sf
            </span>
          )}
        </div>

        {book.pageCount > 0 && (
          <div className="mt-2 h-1 rounded-full bg-[#e4eaf0]">
            <div
              className="h-1 rounded-full bg-[#17324d]/60 transition-all"
              style={{ width: `${Math.round(book.progress * 100)}%` }}
            />
          </div>
        )}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-[#b0bec9] transition group-hover:text-[#17324d]" />
    </button>
  );
}

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

type SortKey = "default" | "alpha-asc" | "alpha-desc" | "pages-desc" | "pages-asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default",    label: "Son eklenen" },
  { value: "alpha-asc",  label: "Alfabetik (A→Z)" },
  { value: "alpha-desc", label: "Alfabetik (Z→A)" },
  { value: "pages-desc", label: "Sayfa sayısı (çoktan aza)" },
  { value: "pages-asc",  label: "Sayfa sayısı (azdan çoğa)" },
];

function sorted(books: BookCardData[], key: SortKey): BookCardData[] {
  const c = [...books];
  if (key === "alpha-asc")  return c.sort((a, b) => a.title.localeCompare(b.title, "tr"));
  if (key === "alpha-desc") return c.sort((a, b) => b.title.localeCompare(a.title, "tr"));
  if (key === "pages-desc") return c.sort((a, b) => b.pageCount - a.pageCount);
  if (key === "pages-asc")  return c.sort((a, b) => a.pageCount - b.pageCount);
  return c;
}

export function LibraryList({ books }: { books: BookCardData[] }) {
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [search, setSearch]                 = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [authorFilter, setAuthorFilter]     = useState("");
  const [statusFilter, setStatusFilter]     = useState<BookStatusValue | "">("" as BookStatusValue | "");
  const [sortKey, setSortKey]               = useState<SortKey>("default");
  const [filtersOpen, setFiltersOpen]       = useState(false);

  const selectedBook = books.find((b) => b.id === selectedId) ?? null;

  const allCategories = Array.from(
    new Set(books.flatMap((b) => b.categories)),
  ).sort((a, b) => a.localeCompare(b, "tr"));

  const allAuthors = Array.from(new Set(books.map((b) => b.author))).sort((a, b) =>
    a.localeCompare(b, "tr"),
  );

  const q = search.trim().toLocaleLowerCase("tr");

  const visible = sorted(
    books.filter((b) => {
      const matchSearch  = !q || b.title.toLocaleLowerCase("tr").includes(q);
      const matchCat     = !categoryFilter || b.categories.includes(categoryFilter);
      const matchAuthor  = !authorFilter   || b.author === authorFilter;
      const matchStatus  = !statusFilter   || b.status === statusFilter;
      return matchSearch && matchCat && matchAuthor && matchStatus;
    }),
    sortKey,
  );

  const hasActiveFilter =
    search.trim() !== "" || categoryFilter !== "" || authorFilter !== "" || statusFilter !== "" || sortKey !== "default";

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setAuthorFilter("");
    setStatusFilter("");
    setSortKey("default");
  };

  const selectCls =
    "w-full rounded-2xl border border-[#d8e0e8] bg-white px-4 py-2.5 text-sm text-[#17324d] outline-none focus:border-[#17324d]";

  return (
    <>
      {/* ── Arama & filtre ── */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {/* Arama */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9aaa] pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kitap adıyla ara…"
              className="w-full rounded-full border border-[#d8e0e8] bg-white py-3 pl-11 pr-5 text-sm text-[#17324d] outline-none focus:border-[#17324d]"
            />
          </div>

          {/* Filtrele toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-medium transition ${
              filtersOpen || hasActiveFilter
                ? "border-[#17324d] bg-[#17324d] text-white"
                : "border-[#d8e0e8] bg-white text-[#17324d] hover:bg-[#f4f7fa]"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrele
          </button>

          {/* Sıfırla */}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-100 transition"
            >
              Sıfırla
            </button>
          )}
        </div>

        {/* Filtre paneli */}
        {filtersOpen && (
          <div className="grid gap-3 rounded-[1.5rem] border border-[#e4ddd3] bg-white/90 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a9aaa]">Durum</p>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BookStatusValue | "")} className={selectCls}>
                <option value="">Tüm durumlar</option>
                {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a9aaa]">Tür</p>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectCls}>
                <option value="">Tüm türler</option>
                {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a9aaa]">Yazar</p>
              <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className={selectCls}>
                <option value="">Tüm yazarlar</option>
                {allAuthors.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a9aaa]">Sıralama</p>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={selectCls}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Sonuç sayacı */}
        {books.length > 0 && (
          <p className="text-xs text-[#8a9aaa]">
            {visible.length === books.length
              ? `${books.length} kitap`
              : `${visible.length} / ${books.length} kitap gösteriliyor`}
          </p>
        )}
      </div>

      {/* ── Liste ── */}
      <div className="space-y-2">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-[#e4ddd3] bg-white/70 px-6 py-10 text-center text-sm text-[#8a9aaa]">
            {books.length === 0
              ? "Henüz kütüphanede kitap yok. Kitap ekle sayfasından eklemeye başlayabilirsin."
              : "Arama veya filtre koşullarına uyan kitap bulunamadı."}
          </div>
        ) : (
          visible.map((book) => (
            <LibraryRow key={book.id} book={book} onSelect={() => setSelectedId(book.id)} />
          ))
        )}
      </div>

      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}
