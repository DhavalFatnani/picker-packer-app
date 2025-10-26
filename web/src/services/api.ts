import axios, { AxiosError } from 'axios';
import type { LoginRequest, LoginResponse, SignupRequest, SignupResponse } from '@pp/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Create axios instance with default config
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get stored auth token
 */
export function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Get stored user data
 */
export function getUser(): any | null {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Store auth data
 */
export function setAuth(token: string, user: any): void {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Clear auth data
 */
export function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Add auth token to requests
 */
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Handle auth errors
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication APIs
 */
export const authApi = {
  /**
   * Login with phone and PIN
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  /**
   * Signup new user
   */
  async signup(data: SignupRequest): Promise<SignupResponse> {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },

  /**
   * Get current user status
   */
  async getStatus() {
    const response = await api.get('/api/auth/status');
    return response.data;
  },

  /**
   * Request OTP for PIN reset
   */
  async requestOTP(phone: string) {
    const response = await api.post('/api/auth/request-otp', { phone });
    return response.data;
  },

  /**
   * Verify OTP and reset PIN
   */
  async verifyOTPAndResetPin(phone: string, otp: string) {
    const response = await api.post('/api/auth/verify-otp-and-reset-pin', { phone, otp });
    return response.data;
  },
};

/**
 * Admin APIs
 */
export const adminApi = {
  /**
   * Get all users
   */
  async getAllUsers() {
    const response = await api.get('/api/admin/users');
    return response.data;
  },

  /**
   * Get pending approvals
   */
  async getPendingApprovals() {
    const response = await api.get('/api/admin/pending-approvals');
    return response.data;
  },

  /**
   * Approve or reject user
   */
  async approveUser(userId: string, approved: boolean) {
    const action = approved ? 'approve' : 'reject';
    const response = await api.post(`/api/admin/approve/${userId}?action=${action}`);
    return response.data;
  },

  /**
   * Get announcements
   */
  async getAnnouncements() {
    const response = await api.get('/api/admin/announcements');
    return response.data;
  },

  /**
   * Create announcement
   */
  async createAnnouncement(data: any) {
    const response = await api.post('/api/admin/announcements', data);
    return response.data;
  },

  /**
   * Get geofence settings
   */
  async getGeofenceSettings() {
    const response = await api.get('/api/admin/geofence-settings');
    return response.data;
  },

  /**
   * Get specific geofence setting
   */
  async getGeofenceSetting(warehouse: string) {
    const response = await api.get(`/api/admin/geofence-settings/${warehouse}`);
    return response.data;
  },

  /**
   * Create or update geofence setting
   */
  async upsertGeofenceSetting(data: any) {
    const response = await api.post('/api/admin/geofence-settings', data);
    return response.data;
  },

  /**
   * Delete geofence setting
   */
  async deleteGeofenceSetting(warehouse: string) {
    const response = await api.delete(`/api/admin/geofence-settings/${warehouse}`);
    return response.data;
  },
};

/**
 * Tasks APIs
 */
export const tasksApi = {
  /**
   * Get packing queue
   */
  async getPackingQueue() {
    const response = await api.get('/api/tasks/packing-queue');
    return response.data;
  },

  /**
   * Get picking tasks
   */
  async getPickingTasks() {
    const response = await api.get('/api/tasks/picking');
    return response.data;
  },

  /**
   * Complete a pack task
   */
  async completeTask(taskId: string) {
    const response = await api.post(`/api/tasks/${taskId}/complete`);
    return response.data;
  },
};

export default api;
