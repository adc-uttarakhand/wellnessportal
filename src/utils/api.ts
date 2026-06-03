import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yoga_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('yoga_token');
      localStorage.removeItem('yoga_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (old_password: string, new_password: string) =>
    api.post('/auth/change-password', { old_password, new_password }),
};

export const appApi = {
  list: (params?: Record<string, string>) => api.get('/applications', { params }),
  get: (id: number) => api.get(`/applications/${id}`),
  submitCapitalSubsidy: (data: Record<string, unknown>) => api.post('/applications/capital-subsidy', data),
  submitResearchGrant: (data: Record<string, unknown>) => api.post('/applications/research-grant', data),
  submitTeacherCert: (data: Record<string, unknown>) => api.post('/applications/teacher-certification', data),
  submitExistingInstitution: (data: Record<string, unknown>) => api.post('/applications/existing-institution', data),
  updateStatus: (id: number, data: Record<string, unknown>) => api.patch(`/applications/${id}/status`, data),
  respondToQuery: (id: number, response: string) => api.patch(`/applications/${id}/query-response`, { response }),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  createUser: (data: Record<string, unknown>) => api.post('/admin/users', data),
  toggleUser: (id: number) => api.patch(`/admin/users/${id}/toggle`),
  budget: () => api.get('/admin/budget'),
  registrations: () => api.get('/admin/registrations'),
  verify: (type: 'centre' | 'professional', id: number) =>
    api.post(`/admin/registrations/${type}/${id}/verify`),
};

export const regApi = {
  registerCentre: (data: Record<string, unknown>) => api.post('/registrations/yoga-centre', data),
  myCentres: () => api.get('/registrations/yoga-centre/my'),
  registerProfessional: (data: Record<string, unknown>) => api.post('/registrations/yoga-professional', data),
  myProfessionals: () => api.get('/registrations/yoga-professional/my'),
};
