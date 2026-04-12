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

  const response = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    logout();
    return null;
  }

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(response.status, data, "Request failed"));
  }

  return data;
};

export async function saveInvoice(payload) {
  return authFetch("/invoice", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const getAllInvoice = async () => authFetch("/invoice");

export async function deleteInvoice(id) {
  return authFetch(`/invoice/${id}`, {
    method: "DELETE",
  });
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
  return authFetch("/customer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAllCustomers() {
  return authFetch("/customer");
}

export async function updateCustomer(id, payload) {
  return authFetch(`/customer/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function removeCustomer(id) {
  return authFetch(`/customer/${id}`, {
    method: "DELETE",
  });
}