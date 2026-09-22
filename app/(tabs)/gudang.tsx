import { useRouter } from "expo-router";
import { BarcodeScannerView } from "@/components/BarcodeScannerView";
import { api } from "@/lib/api";

// Gudang: cek stok & stok in/out. Scan SKU material -> buka detail untuk
// penyesuaian stok (adjust). Sudah ada sejak awal, kini jadi salah satu tab.
export default function GudangScreen() {
  const router = useRouter();

  async function handleSubmit(code: string) {
    const material = await api.getMaterialBySku(code);
    router.push({ pathname: "/material/[id]", params: { id: material.id, sku: material.sku } });
  }

  return (
    <BarcodeScannerView
      title="Scan Barcode Material"
      subtitle="Cek stok & stok in/out gudang"
      manualPlaceholder="Ketik SKU material"
      onSubmit={handleSubmit}
    />
  );
}
