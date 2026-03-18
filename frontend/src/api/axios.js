import axios from "axios";
import { getBaseUrl } from "../utils/getBaseUrl";

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mq_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → clear storage and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("mq_token");
      localStorage.removeItem("mq_admin");
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

export default api;
