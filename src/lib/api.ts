import { getToken } from "@/lib/storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://erp.linpackjkt.com";

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Tidak bisa terhubung ke server. Cek WiFi/VPN.");
    }
    throw err;
  }
  clearTimeout(timeout);

  const data = await res.json();

  if (!res.ok) {
    const message = (data as { error?: string }).error ?? `Error ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  login(email: string, password: string) {
    return apiFetch<{ token: string; user: { id: string; code: string; name: string; role: string } }>(
      "/api/mobile/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
  },

  getMaterialBySku(sku: string) {
    return apiFetch<import("@/lib/types").Material>(
      `/api/mobile/materials/${encodeURIComponent(sku)}`,
    );
  },

  adjustStock(materialId: string, quantity: number, note?: string, referenceCode?: string) {
    return apiFetch<import("@/lib/types").AdjustResult>(
      `/api/mobile/materials/${materialId}/adjust`,
      { method: "POST", body: JSON.stringify({ quantity, note, referenceCode }) },
    );
  },

  getDashboard() {
    return apiFetch<import("@/lib/types").DashboardSummary>("/api/mobile/dashboard");
  },

  getNotifications() {
    return apiFetch<import("@/lib/types").NotificationsResult>("/api/mobile/notifications");
  },

  markNotificationRead(id: string) {
    return apiFetch<{ success: boolean; unreadCount: number }>("/api/mobile/notifications", {
      method: "PATCH",
      body: JSON.stringify({ id }),
    });
  },

  markAllNotificationsRead() {
    return apiFetch<{ success: boolean; unreadCount: number }>("/api/mobile/notifications", {
      method: "PATCH",
      body: JSON.stringify({ all: true }),
    });
  },

  getSalesOrders(q?: string) {
    const query = q ? `?q=${encodeURIComponent(q)}` : "";
    return apiFetch<{ items: import("@/lib/types").SalesOrderListItem[] }>(`/api/mobile/sales-orders${query}`);
  },

  getSalesOrderByCode(code: string) {
    return apiFetch<import("@/lib/types").SalesOrderDetail>(`/api/mobile/sales-orders/${encodeURIComponent(code)}`);
  },

  getDeliveryByCode(code: string) {
    return apiFetch<import("@/lib/types").DeliveryLookup>(`/api/mobile/delivery/${encodeURIComponent(code)}`);
  },

  advanceDelivery(code: string) {
    return apiFetch<{ code: string; stage: string; nextStage: string | null }>(
      `/api/mobile/delivery/${encodeURIComponent(code)}/advance`,
      { method: "POST" },
    );
  },

  getWorkOrders(stage?: string) {
    const query = stage ? `?stage=${encodeURIComponent(stage)}` : "";
    return apiFetch<{ items: import("@/lib/types").WorkOrderListItem[] }>(`/api/mobile/work-orders${query}`);
  },

  getWorkOrderByCode(code: string) {
    return apiFetch<import("@/lib/types").WorkOrderDetail>(`/api/mobile/work-orders/${encodeURIComponent(code)}`);
  },

  submitQcCheck(code: string, payload: { checkType: "PRINTING" | "FINISHING"; passed: boolean; note?: string }) {
    return apiFetch<import("@/lib/types").QcCheckHistoryItem>(
      `/api/mobile/work-orders/${encodeURIComponent(code)}/qc-check`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  submitQcResult(code: string, payload: { passed: boolean; rejectRatePercent?: number }) {
    return apiFetch<{ code: string; stage: string; qcPassed: boolean; rejectRatePercent: number }>(
      `/api/mobile/work-orders/${encodeURIComponent(code)}/qc-result`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },
};
