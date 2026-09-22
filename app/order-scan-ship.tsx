import { useRouter } from "expo-router";
import { ManualCodeEntryView } from "@/components/ManualCodeEntryView";
import { api } from "@/lib/api";

export default function OrderScanShipScreen() {
  const router = useRouter();

  async function handleSubmit(code: string) {
    await api.getDeliveryByCode(code);
    router.replace({ pathname: "/order-ship/[code]", params: { code } });
  }

  return (
    <ManualCodeEntryView
      title="Kirim Pesanan"
      subtitle="Isi nomor SO / Delivery Order"
      placeholder="mis. SO-2026-00001 / DO-2026-00001"
      submitLabel="Cek Pengiriman"
      onSubmit={handleSubmit}
    />
  );
}
