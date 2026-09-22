import { useRouter } from "expo-router";
import { ManualCodeEntryView } from "@/components/ManualCodeEntryView";
import { api } from "@/lib/api";

export default function OrderScanCheckScreen() {
  const router = useRouter();

  async function handleSubmit(code: string) {
    await api.getSalesOrderByCode(code);
    router.replace({ pathname: "/order-detail/[code]", params: { code } });
  }

  return (
    <ManualCodeEntryView
      title="Cek Order"
      subtitle="Isi nomor Sales Order untuk verifikasi"
      placeholder="mis. SO-2026-00001"
      submitLabel="Cek Order"
      onSubmit={handleSubmit}
    />
  );
}
