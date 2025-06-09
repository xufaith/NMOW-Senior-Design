import axios from "axios";

const API_URL = "https://nmow-app-33048e3a88a5.herokuapp.com/";

export const fetchIngredients = async () => {
  const response = await axios.get(`${API_URL}/ingredients`);
  return response.data.ingredients;
};

export const addIngredient = async (ingredient) => {
  return axios.post(`${API_URL}/add`, ingredient);
};

export const removeIngredient = async (barcode) => {
  return axios.delete(`${API_URL}/remove/${barcode}`);
};

export const updateStock = async (barcode, amount, type) => {
  return axios.patch(`${API_URL}/${type}/${barcode}`, { amount });
};
