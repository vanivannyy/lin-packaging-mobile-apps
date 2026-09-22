export const SO_STATUS_LABEL: Record<string, string> = {
  MATERIAL_CHECK: "Cek Material",
  PRODUCTION: "Produksi",
  READY_DELIVERY: "Siap Kirim",
  DELIVERED: "Terkirim",
  CANCELLED: "Dibatalkan",
};

export const WO_STAGE_LABEL: Record<string, string> = {
  WAITING: "Menunggu",
  READY: "Siap",
  IN_PRODUCTION: "Produksi",
  QC: "QC",
  PACKING: "Packing",
  REWORK: "Rework",
  DONE: "Selesai",
};

export const DELIVERY_STAGE_LABEL: Record<string, string> = {
  READY: "Siap Kirim",
  IN_DELIVERY: "Dalam Perjalanan",
  PENDING: "Tertunda",
  DELIVERED: "Terkirim",
};

export const QC_CHECK_LABEL: Record<string, string> = {
  PRINTING: "QC Printing",
  FINISHING: "QC Finishing",
};
