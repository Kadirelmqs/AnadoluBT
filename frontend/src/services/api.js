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

export const updateProductAvailability = async (productId, isAvailable) => {
  const response = await api.put(`/products/${productId}/availability`, null, {
    params: { is_available: isAvailable },
  });
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

export const updateTableStatus = async (tableId, isOccupied) => {
  const response = await api.put(`/tables/${tableId}/status`, null, {
    params: { is_occupied: isOccupied },
  });
  return response.data;
};

// ========== CUSTOMERS ==========
export const getCustomers = async () => {
  const response = await api.get('/customers');
  return response.data;
};

export const createCustomer = async (data) => {
  const response = await api.post('/customers', data);
  return response.data;
};

// ========== COURIERS ==========
export const getCouriers = async (availableOnly = false) => {
  const response = await api.get('/couriers', { params: { available_only: availableOnly } });
  return response.data;
};

export const createCourier = async (data) => {
  const response = await api.post('/couriers', data);
  return response.data;
};

export const updateCourierAvailability = async (courierId, isAvailable) => {
  const response = await api.put(`/couriers/${courierId}/availability`, null, {
    params: { is_available: isAvailable },
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

export const assignCourierToOrder = async (orderId, courierId) => {
  const response = await api.put(`/orders/${orderId}/assign-courier`, { courier_id: courierId });
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
