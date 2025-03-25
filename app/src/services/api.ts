import axios from "axios";

// Create an axios instance with common configuration

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No auth token found in localStorage");
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.warn("Unauthorized! Redirecting to login...");
      localStorage.removeItem("token"); // Clear invalid token
      window.location.href = "/login"; // Redirect user to login page
    }
    return Promise.reject(error);
  }
);

export default api;
