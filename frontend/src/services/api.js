import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

// Request interceptor to inject JWT token on every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to clear credentials and redirect/reload on 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const failedUrl = error.response?.config?.url || "";
    const isAuthEndpoint = failedUrl.includes("/auth/login") || failedUrl.includes("/auth/register");

    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Force a reload to redirect to the auth screen
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default API;