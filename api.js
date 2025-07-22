import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility functions
export const generateDeviceId = () => {
  let deviceId = localStorage.getItem('memorial_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('memorial_device_id', deviceId);
  }
  return deviceId;
};

export const getMemorialPages = () => {
  const pages = localStorage.getItem('memorial_pages');
  return pages ? JSON.parse(pages) : [];
};

export const addMemorialPage = (code) => {
  const pages = getMemorialPages();
  if (!pages.includes(code)) {
    pages.push(code);
    localStorage.setItem('memorial_pages', JSON.stringify(pages));
  }
};

// API calls
export const createMemorialPage = async (data) => {
  const deviceId = generateDeviceId();
  const response = await api.post('/memorial-pages', {
    ...data,
    device_id: deviceId,
  });
  
  if (response.data.success) {
    addMemorialPage(response.data.data.code);
  }
  
  return response.data;
};

export const getMemorialPage = async (code) => {
  const response = await api.get(`/memorial-pages/${code}`);
  return response.data;
};

export const getMemorialPagesByDevice = async () => {
  const deviceId = generateDeviceId();
  const response = await api.get(`/memorial-pages/by-device/${deviceId}`);
  return response.data;
};

export const uploadMedia = async (pageId, file, fileType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);
  
  const response = await api.post(`/memorial-pages/${pageId}/media`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const deleteMedia = async (mediaId) => {
  const response = await api.delete(`/media/${mediaId}`);
  return response.data;
};

export const getPremiumStatus = async () => {
  const deviceId = generateDeviceId();
  const response = await api.get(`/premium/status/${deviceId}`);
  return response.data;
};

export const subscribePremium = async () => {
  const deviceId = generateDeviceId();
  const response = await api.post('/premium/subscribe', {
    device_id: deviceId,
    stripe_token: 'mock_token', // Mock token for testing
  });
  return response.data;
};

export default api;

