import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.BACKEND_URL,
});

export default api; 