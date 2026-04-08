import axios from "axios";

const API_URL = "http://localhost:8080";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Request failed";

export async function saveInvoice(payload) {
  try {
    return await axios.post(`${API_URL}/invoice`, payload);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export const getAllInvoice = async () => {
  try {
    return await axios.get(`${API_URL}/invoice`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export async function deleteInvoice(id) {
  try {
    return await axios.delete(`${API_URL}/invoice/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function saveCustomer(payload) {
  try {
    return await axios.post(`${API_URL}/customer`, payload);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAllCustomers() {
  try {
    return await axios.get(`${API_URL}/customer`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateCustomer(id, payload) {
  try {
    return await axios.put(`${API_URL}/customer/${id}`, payload);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function removeCustomer(id) {
  try {
    return await axios.delete(`${API_URL}/customer/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}