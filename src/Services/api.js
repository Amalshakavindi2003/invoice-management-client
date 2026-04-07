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
