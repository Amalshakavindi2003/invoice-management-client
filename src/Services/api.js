import axios from "axios";

const API_URL = "http://localhost:8080";

export async function saveInvoice(payload) {
  try {
    return await axios.post(`${API_URL}/invoice`, payload);
  } catch (error) {
    console.log("Error:", error.message);
    return error.response.data;
  }
}

export const getAllInvoice = async () => {
  try {
    return await axios.get(`${API_URL}/invoice`);
  } catch (error) {
    console.log("Error:", error.message);
    return error.response.data;
  }
};

export async function deleteInvoice(id) {
    try {
      return await axios.delete(`${API_URL}/invoice/${id}`);
    } catch (error) {
      console.log("Error:", error.message);
      return error.response.data;
    }
  }
