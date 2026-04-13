import { logout } from "../utils/auth";

const BASE = (process.env.REACT_APP_API_URL || "http://localhost:8080").replace(/\/+$/, "");

const parseJsonSafely = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

const extractErrorMessage = (status, data, fallback) => {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.error) {
    return data.error;
  }

  return fallback || `Request failed with status ${status}`;
};

export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("ei_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    logout();
    return null;
  }

  if (response.status === 204) {
    return null;
  }

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(response.status, data, "Request failed"));
  }

  return data;
};

const api = {
  getCustomers: () => authFetch("/customer"),
  addCustomer: (data) => authFetch("/customer", { method: "POST", body: JSON.stringify(data) }),
  updateCustomer: (id, data) => authFetch(`/customer/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCustomer: (id) => authFetch(`/customer/${id}`, { method: "DELETE" }),

  getInvoices: () => authFetch("/invoice"),
  addInvoice: (data) => authFetch("/invoice", { method: "POST", body: JSON.stringify(data) }),
  updateInvoice: (id, data) => authFetch(`/invoice/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteInvoice: (id) => authFetch(`/invoice/${id}`, { method: "DELETE" }),

  getCustomerByRef: async (ref) => {
    const customers = await fetch(`${BASE}/customer`).then((response) => response.json());
    if (!Array.isArray(customers)) {
      return null;
    }

    return customers.find((customer) => String(customer.referenceCode || customer.customerRef || "").trim().toUpperCase() === String(ref || "").trim().toUpperCase()) || null;
  },
};

export async function saveInvoice(payload) {
  return api.addInvoice(payload);
}

export const getAllInvoice = async () => api.getInvoices();

export async function deleteInvoice(id) {
  return api.deleteInvoice(id);
}

export async function updateInvoiceStatus(id, status) {
  return authFetch(`/invoice/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function sendInvoiceReminder(id) {
  return authFetch(`/invoice/${id}/reminder`, {
    method: "POST",
  });
}

export async function recordInvoicePayment(id, payload) {
  return authFetch(`/invoice/${id}/payment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function saveCustomer(payload) {
  return api.addCustomer(payload);
}

export async function getAllCustomers() {
  return api.getCustomers();
}

export async function updateCustomer(id, payload) {
  return api.updateCustomer(id, payload);
}

export async function removeCustomer(id) {
  return api.deleteCustomer(id);
}

export { api };
export default api;
