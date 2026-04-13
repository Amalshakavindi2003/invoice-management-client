const BASE_URL = "http://localhost:8080";

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return true;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const api = {
  getCustomers: async () => request("/customer"),
  addCustomer: async (data) => request("/customer", { method: "POST", body: JSON.stringify(data) }),
  updateCustomer: async (id, data) => request(`/customer/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCustomer: async (id) => request(`/customer/${id}`, { method: "DELETE" }),

  getInvoices: async () => request("/invoice"),
  addInvoice: async (data) => request("/invoice", { method: "POST", body: JSON.stringify(data) }),
  updateInvoice: async (id, data) => request(`/invoice/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteInvoice: async (id) => request(`/invoice/${id}`, { method: "DELETE" }),

  getCustomerByRef: async (ref) => {
    const customers = await request("/customer");
    if (!Array.isArray(customers)) {
      return null;
    }

    return customers.find((customer) =>
      String(customer.referenceCode || customer.customerRef || "").trim().toUpperCase() ===
      String(ref || "").trim().toUpperCase()
    ) || null;
  },
};

export const getAllCustomers = api.getCustomers;
export const saveCustomer = api.addCustomer;
export const updateCustomer = api.updateCustomer;
export const removeCustomer = api.deleteCustomer;
export const getAllInvoice = api.getInvoices;
export const saveInvoice = api.addInvoice;
export const updateInvoiceStatus = async (id, status) => request(`/invoice/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
export const deleteInvoice = api.deleteInvoice;
export const sendInvoiceReminder = async (id) => request(`/invoice/${id}/reminder`, { method: "POST" });
export const recordInvoicePayment = async (id, payload) => request(`/invoice/${id}/payment`, { method: "POST", body: JSON.stringify(payload) });

export { api };
export default api;