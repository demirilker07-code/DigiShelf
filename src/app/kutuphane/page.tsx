import { AppShell } from "@/components/shell";
import { LibraryList } from "@/components/library-list";
import { SectionHeading } from "@/components/section-heading";
import { getOwnerLibrary } from "@/lib/books";

export default async function LibraryPage() {
  const data = await getOwnerLibrary();

  if (!data) {
    return null;
  }

  return (
    <AppShell currentPath="/kutuphane">
      <SectionHeading
        eyebrow="Tüm kitaplar"
        title="Kütüphane listesi"
        description="Bir kitaba tıklayarak okuma durumunu güncelleyebilir, bilgilerini düzenleyebilir veya silebilirsin. İstek listesindeki kitaplar ayrı sayfada gösterilir."
      />
      <LibraryList books={data.library.filter((b) => b.status !== "WISHLIST")} />
    </AppShell>
  );
}

