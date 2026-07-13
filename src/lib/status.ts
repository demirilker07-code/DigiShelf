export const statusOptions = [
  { value: "UNREAD", label: "Başlanmadı" },
  { value: "READING", label: "Devam Ediyor" },
  { value: "READ", label: "Okundu" },
  { value: "PAUSED", label: "Ara Verildi" },
  { value: "ABANDONED", label: "Yarım Bırakıldı" },
  { value: "WISHLIST", label: "İstek Listesi" },
] as const;

export type BookStatusValue = (typeof statusOptions)[number]["value"];

export const statusLabels: Record<BookStatusValue, string> = {
  UNREAD: "Başlanmadı",
  READING: "Devam Ediyor",
  READ: "Okundu",
  PAUSED: "Ara Verildi",
  ABANDONED: "Yarım Bırakıldı",
  WISHLIST: "İstek Listesi",
};

export const statusTone: Record<BookStatusValue, string> = {
  UNREAD: "bg-amber-100 text-amber-900",
  READING: "bg-sky-100 text-sky-900",
  READ: "bg-emerald-100 text-emerald-900",
  PAUSED: "bg-orange-100 text-orange-900",
  ABANDONED: "bg-rose-100 text-rose-900",
  WISHLIST: "bg-fuchsia-100 text-fuchsia-900",
};