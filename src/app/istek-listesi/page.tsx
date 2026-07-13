import { AppShell } from "@/components/shell";
import { LibraryList } from "@/components/library-list";
import { SectionHeading } from "@/components/section-heading";
import { getOwnerLibrary } from "@/lib/books";

export default async function WishlistPage() {
  const data = await getOwnerLibrary();

  if (!data) {
    return null;
  }

  const wishlist = data.library.filter((b) => b.status === "WISHLIST");

  return (
    <AppShell currentPath="/istek-listesi">
      <SectionHeading
        eyebrow="İstek listesi"
        title="Okumak istediğin kitaplar"
        description="Henüz satın almadığın veya kütüphanene almadığın kitapları burada listelersin. Bir kitabı satın alınca kütüphane durumuna taşıyabilirsin."
      />
      <LibraryList books={wishlist} />
    </AppShell>
  );
}
