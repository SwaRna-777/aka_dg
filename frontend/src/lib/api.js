import axios from 'axios';

const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API  = BASE + '/api';

const api = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: d => api.post('/auth/register', d),
  login:    d => api.post('/auth/login', d),
  me:       () => api.get('/auth/me'),
};

export const habitsAPI = {
  getAll:  () => api.get('/habits'),
  create:  d  => api.post('/habits', d),
  update:  (id, d) => api.put(`/habits/${id}`, d),
  delete:  id => api.delete(`/habits/${id}`),
  toggle:  id => api.post(`/habits/${id}/toggle`),
  history: (id, days) => api.get(`/habits/${id}/history?days=${days}`),
  stats:   () => api.get('/stats'),
};

export const goalsAPI = {
  getAll:  () => api.get('/goals'),
  create:  d  => api.post('/goals', d),
  update:  (id, d) => api.put(`/goals/${id}`, d),
  delete:  id => api.delete(`/goals/${id}`),
};

export const aiAPI = {
  analyze:       () => api.post('/ai/analyze-habits'),
  chat:          d  => api.post('/ai/chat', d),
  weeklyReport:  () => api.post('/ai/weekly-report'),
  suggestHabits: d  => api.post('/ai/suggest-habits', d),
  motivate:      () => api.post('/ai/motivate'),
};

export default api;
