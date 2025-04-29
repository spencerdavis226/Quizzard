// API URL configuration based on environment
const isDevelopment = import.meta.env.DEV;

// Define your API URL based on environment
export const API_URL = isDevelopment 
  ? 'http://localhost:5005/api' 
  : 'https://quizzard-backend.onrender.com/api';

export default {
  apiUrl: API_URL
};