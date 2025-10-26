import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE_URL = 'http://192.168.31.10:3000';

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
};

async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
}

async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
}

async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
}

async function getUser(): Promise<any | null> {
  const userStr = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
  return userStr ? JSON.parse(userStr) : null;
}

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    await removeToken();
  }

  return response;
}

export const api = {
  async login(phone: string, pin: string): Promise<any> {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Login failed');
    }

    await storeToken(data.data.token);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, data.data.refresh_token);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(data.data.user));

    return data.data;
  },

  async signup(name: string, phone: string): Promise<any> {
    const response = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, phone }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Signup failed');
    }

    return data.data;
  },

  async getTasks(): Promise<any> {
    const response = await apiFetch('/api/tasks');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to get tasks');
    }

    // Backend returns { data: { data: tasks[], pagination: {} } }
    return data.data?.data || [];
  },

  async getOrders(): Promise<any> {
    const response = await apiFetch('/api/orders');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to get orders');
    }

    return data.data || [];
  },

  async getOrder(orderId: string): Promise<any> {
    try {
      console.log('API: Fetching order:', orderId);
      const response = await apiFetch(`/api/orders/${orderId}`);
      console.log('API: Response status:', response.status);
      
      const data = await response.json();
      console.log('API: Response data:', data);

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to get order');
      }

      return data.data;
    } catch (error: any) {
      console.error('API: Error fetching order:', error);
      throw error;
    }
  },

  async getTaskDetails(id: string): Promise<any> {
    const response = await apiFetch(`/api/tasks/${id}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to get task details');
    }

    return data.data;
  },

  async scanTaskItem(taskId: string, itemId: string, barcode: string): Promise<any> {
    const response = await apiFetch(`/api/tasks/${taskId}/scan`, {
      method: 'POST',
      body: JSON.stringify({ 
        barcode: barcode,
        lock_tag: barcode, // Backend expects lock_tag which is the same as the barcode
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to scan item');
    }

    return data.data;
  },

  async completeTask(taskId: string): Promise<any> {
    const response = await apiFetch(`/api/tasks/${taskId}/complete`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to complete task');
    }

    return data.data;
  },

  async getActiveShift(): Promise<any> {
    const response = await apiFetch('/api/shifts/active');
    const data = await response.json();

    if (!data.success) {
      // If no active shift, return null instead of throwing
      if (response.status === 404) {
        return null;
      }
      throw new Error(data.error?.message || 'Failed to get active shift');
    }

    return data.data;
  },

  async startShift(latitude: number, longitude: number, selfieUri: string): Promise<any> {
    // Convert selfie to base64
    const base64 = await FileSystem.readAsStringAsync(selfieUri, {
      encoding: 'base64',
    });

    const response = await apiFetch('/api/shifts/start', {
      method: 'POST',
      body: JSON.stringify({ 
        warehouse: 'WH1', // Default warehouse
        zone: 'Zone-A',
        gps: { latitude, longitude },
        selfie_base64: `data:image/jpeg;base64,${base64}`
      }),
    });

    const data = await response.json();

    if (!data.success) {
      console.error('Start shift error response:', data);
      throw new Error(data.error?.message || 'Failed to start shift');
    }

    return data.data;
  },

  async endShift(selfieUri: string): Promise<any> {
    // Convert selfie to base64
    const base64 = await FileSystem.readAsStringAsync(selfieUri, {
      encoding: 'base64',
    });

    const response = await apiFetch('/api/shifts/end', {
      method: 'POST',
      body: JSON.stringify({
        selfie_base64: `data:image/jpeg;base64,${base64}`
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to end shift');
    }

    return data.data;
  },

  async createException(description: string, type: string): Promise<any> {
    const response = await apiFetch('/api/exceptions', {
      method: 'POST',
      body: JSON.stringify({ description, type }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to create exception');
    }

    return data.data;
  },

  async requestOTP(phone: string): Promise<any> {
    const response = await apiFetch('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to request OTP');
    }

    return data.data;
  },

  async verifyOTPAndResetPin(phone: string, otp: string): Promise<any> {
    const response = await apiFetch('/api/auth/verify-otp-and-reset-pin', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to verify OTP');
    }

    return data.data;
  },

  async logout(): Promise<void> {
    await removeToken();
  },

  getToken,
  getUser,
  removeToken,
};
