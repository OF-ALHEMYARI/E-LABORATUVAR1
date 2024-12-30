import axios from "axios";

const API_URL = "http://192.168.1.104:3000"; // دعم المتغيرات البيئية مع عنوان افتراضي

export const fetchTests = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/tests`, {
      params: { userId },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tests:", error);
    throw error;
  }
};

export const searchTests = async (userId, query) => {
  try {
    const response = await axios.get(`${API_URL}/users/tests/search`, {
      params: { userId, query },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching tests:", error);
    throw error;
  }
};

export const fetchReferences = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/references`);
    return response.data;
  } catch (error) {
    console.error("Error fetching references:", error);
    throw error;
  }
};
