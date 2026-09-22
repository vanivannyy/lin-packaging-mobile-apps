export type UserRole =
  | "OWNER"
  | "SALES_MANAGER"
  | "SALES"
  | "FINANCE"
  | "WAREHOUSE"
  | "QC"
  | "PURCHASING"
  | "PRODUCTION_PLANNER";

export type AuthUser = {
  id: string;
  code: string;
  name: string;
  role: UserRole;
  modules?: string[];
};

export function hasModule(user: AuthUser | null, moduleKey: string): boolean {
  if (!user) return false;
  const modules = user.modules ?? [];
  return modules.includes("*") || modules.includes(moduleKey);
}

export type Material = {
  id: string;
  sku: string;
  name: string;
  category: string;
  gsm: number | null;
  size: string | null;
  unit: string;
  stockQty: number;
  reservedQty: number;
  available: number;
  minStockQty: number;
  pricePerUnit: number;
  isLow: boolean;
  supplier: { id: string; name: string } | null;
};

export type AdjustResult = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  stockQty: number;
  reservedQty: number;
  available: number;
  minStockQty: number;
  isLow: boolean;
};

export type ApiError = {
  error: string;
};

export type DashboardSummary = {
  salesToday: { orderCount: number; amount: number };
  salesYesterday: { orderCount: number; amount: number };
  stock: { lowStockCount: number };
  purchaseRequest: { pendingCount: number; pendingEstimate: number };
  production: { inProductionCount: number; lateCount: number };
  delivery: { readyCount: number; inDeliveryCount: number };
  invoice: { overdueCount: number; overdueAmount: number };
  alerts: { type: "LOW_STOCK" | "OVERDUE" | "DELAY"; text: string }[];
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  module: string;
  referenceCode: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsResult = {
  unreadCount: number;
  items: NotificationItem[];
};

export type SalesOrderListItem = {
  id: string;
  code: string;
  customerName: string;
  productName: string;
  qty: number;
  totalAmount: number;
  status: string;
  requestedDeliveryDate: string | null;
  workOrderStage: string | null;
  deliveryStage: string | null;
};

export type SalesOrderDetail = {
  id: string;
  code: string;
  date: string;
  customer: { name: string; phone: string | null };
  productName: string;
  qty: number;
  totalAmount: number;
  status: string;
  requestedDeliveryDate: string | null;
  deliveredAt: string | null;
  workOrder: { code: string; stage: string; process: string; progressPercent: number; qcPassed: boolean | null } | null;
  deliveryOrder: { code: string; stage: string; note: string | null } | null;
  invoice: { code: string; status: string; dueDate: string | null } | null;
};

export type DeliveryLookup = {
  id: string;
  code: string;
  stage: "READY" | "IN_DELIVERY" | "PENDING" | "DELIVERED";
  note: string | null;
  nextStage: "IN_DELIVERY" | "DELIVERED" | null;
  canAdvance: boolean;
  salesOrder: { code: string; customerName: string; productName: string; qty: number };
};

export type WorkOrderListItem = {
  code: string;
  stage: string;
  process: string;
  progressPercent: number;
  qcPassed: boolean | null;
  deadline: string | null;
  customerName: string;
  productName: string;
  qty: number;
};

export type QcCheckHistoryItem = {
  id: string;
  checkType: "PRINTING" | "FINISHING";
  passed: boolean | null;
  note: string | null;
  userName: string | null;
  createdAt: string;
};

export type WorkOrderDetail = {
  code: string;
  stage: string;
  process: string;
  progressPercent: number;
  priority: string;
  qcPassed: boolean | null;
  rejectRatePercent: number;
  goodQtyTotal: number;
  rejectQtyTotal: number;
  deadline: string | null;
  customerName: string;
  productName: string;
  qty: number;
  soCode: string;
  qcChecks: QcCheckHistoryItem[];
};
