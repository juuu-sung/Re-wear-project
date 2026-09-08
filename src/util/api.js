import axios from "axios";
export const API = "http://localhost:8000";
export const getArticles = async () => {
  const res = await axios.get(`${API}/v1/articles/today?limit=2`);
  return res.data;
};
