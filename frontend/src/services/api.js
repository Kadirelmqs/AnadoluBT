import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// API Instance
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========== AUTH ==========
export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const login = async (data) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// ========== ADMIN ==========
export const getPendingCouriers = async () => {
  const response = await api.get('/admin/couriers/pending');
  return response.data;
};

export const approveCourier = async (courierId) => {
  const response = await api.put(`/admin/couriers/${courierId}/approve`);
  return response.data;
};

export const deleteCourier = async (courierId) => {
  const response = await api.delete(`/admin/couriers/${courierId}`);
  return response.data;
};

export const getMonthlyStats = async () => {
  const response = await api.get('/admin/stats/monthly');
  return response.data;
};

export const getYearlyStats = async () => {
  const response = await api.get('/admin/stats/yearly');
  return response.data;
};

export const exportOrders = async (month = null) => {
  const response = await api.get('/admin/export/orders', {
    params: { format: 'excel', month },
    responseType: 'blob',
  });
  return response.data;
};

// ========== COURIER ==========
export const getPackages = async () => {
  const response = await api.get('/courier/packages');
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get('/courier/my-orders');
  return response.data;
};

export const takeOrder = async (orderId) => {
  const response = await api.put(`/courier/orders/${orderId}/take`);
  return response.data;
};

export const deliverOrder = async (orderId) => {
  const response = await api.put(`/courier/orders/${orderId}/deliver`);
  return response.data;
};

export const cancelOrderCourier = async (orderId) => {
  const response = await api.put(`/courier/orders/${orderId}/cancel`);
  return response.data;
};

// ========== CATEGORIES ==========
export const getCategories = async (activeOnly = true) => {
  const response = await api.get('/categories', { params: { active_only: activeOnly } });
  return response.data;
};

export const createCategory = async (data) => {
  const response = await api.post('/categories', data);
  return response.data;
};

// ========== PRODUCTS ==========
export const getProducts = async (categoryId = null, availableOnly = true) => {
  const response = await api.get('/products', {
    params: { category_id: categoryId, available_only: availableOnly },
  });
  return response.data;
};

export const createProduct = async (data) => {
  const response = await api.post('/products', data);
  return response.data;
};

// ========== TABLES ==========
export const getTables = async () => {
  const response = await api.get('/tables');
  return response.data;
};

export const createTable = async (data) => {
  const response = await api.post('/tables', data);
  return response.data;
};

// ========== COURIERS ==========
export const getCouriers = async (availableOnly = false, approvedOnly = true) => {
  const response = await api.get('/couriers', { 
    params: { available_only: availableOnly, approved_only: approvedOnly } 
  });
  return response.data;
};

// ========== ORDERS ==========
export const getOrders = async (status = null) => {
  const response = await api.get('/orders', { params: { status } });
  return response.data;
};

export const getOrder = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export const createOrder = async (data) => {
  const response = await api.post('/orders', data);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.put(`/orders/${orderId}/status`, null, {
    params: { status },
  });
  return response.data;
};

export const downloadReceipt = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/receipt`, {
    responseType: 'blob',
  });
  return response.data;
};

// ========== STATISTICS ==========
export const getDashboardStats = async () => {
  const response = await api.get('/stats/dashboard');
  return response.data;
};

export default api;