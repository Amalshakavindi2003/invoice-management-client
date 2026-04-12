import axios from "axios";
import { getToken, logout } from "../utils/auth";

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8080").replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData?.error) {
    return responseData.error;
  }

  if (error?.code === "ERR_NETWORK") {
    return `Unable to reach the backend at ${API_URL}. Make sure the server is running and the URL is correct.`;
  }

  return error?.message || "Request failed";
};

export async function saveInvoice(payload) {
  try {
    return await api.post("/invoice", payload);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export const getAllInvoice = async () => {
  try {
    return await api.get("/invoice");
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export async function deleteInvoice(id) {
  try {
    return await api.delete(`/invoice/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateInvoiceStatus(id, status) {
  try {
    return await api.put(`/invoice/${id}/status`, { status });
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function sendInvoiceReminder(id) {
  try {
    return await api.post(`/invoice/${id}/reminder`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function recordInvoicePayment(id, payload) {
  try {
    return await api.post(`/invoice/${id}/payment`, payload);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function saveCustomer(payload) {
  try {
    return await api.post("/customer", payload);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAllCustomers() {
  try {
    return await api.get("/customer");
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateCustomer(id, payload) {
  try {
    return await api.put(`/customer/${id}`, payload);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function removeCustomer(id) {
  try {
    return await api.delete(`/customer/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}