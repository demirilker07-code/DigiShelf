import { AppShell } from "@/components/shell";
import { AddBookPanel } from "@/components/add-book-panel";
import { SectionHeading } from "@/components/section-heading";

export default function AddPage() {
  return (
    <AppShell currentPath="/ekle">
      <SectionHeading
        eyebrow="Kütüphane girişi"
        title="Kitap ekleme merkezi"
        description="İki farklı yöntemle kitap ekleyebilirsin: ISBN veya başlık/yazar ile arayarak ya da tüm bilgileri elle girerek."
      />
      <AddBookPanel />
    </AppShell>
  );
}