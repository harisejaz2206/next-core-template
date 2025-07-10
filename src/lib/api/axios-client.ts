import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_APP_URL,
  timeout: 10 * 60 * 1000, // 10 minutes
});

export default axiosClient; 