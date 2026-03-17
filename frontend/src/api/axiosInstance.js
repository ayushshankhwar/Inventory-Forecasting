import axios from "axios";
import { auth } from "../firebase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s — Prophet can take time
});

// Attach Firebase token to every request
axiosInstance.interceptors.request.use(
  async (config) => {
    // const user = auth.currentUser;
    // if (user) {
    //   const token = await user.getIdToken();
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    const user = auth.currentUser || await new Promise(resolve => {
      const unsubscribe = auth.onAuthStateChanged(u => {
        unsubscribe();
        resolve(u);
      });
    });
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      auth.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
