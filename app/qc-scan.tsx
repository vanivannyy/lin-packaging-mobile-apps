import { useRouter } from "expo-router";
import { ManualCodeEntryView } from "@/components/ManualCodeEntryView";
import { api } from "@/lib/api";

export default function QcScanScreen() {
  const router = useRouter();

  async function handleSubmit(code: string) {
    await api.getWorkOrderByCode(code);
    router.replace({ pathname: "/qc-detail/[code]", params: { code } });
  }

  return (
    <ManualCodeEntryView
      title="Cek Work Order"
      subtitle="Isi nomor WO untuk checklist inspeksi"
      placeholder="mis. WO-2026-00001"
      submitLabel="Cek Work Order"
      onSubmit={handleSubmit}
    />
  );
}
