/**
 * Authentication API tests
 */

import request from 'supertest';

describe('Auth Endpoints', () => {
  const baseURL = 'http://localhost:3000';

  describe('POST /api/auth/signup', () => {
    it('should create a new user with pending status', async () => {
      // Use random phone to avoid conflicts
      const randomPhone = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      const response = await request(baseURL)
        .post('/api/auth/signup')
        .send({
          name: 'Test User Signup',
          phone: randomPhone,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data).toHaveProperty('employee_id');
        expect(response.body.data.employee_id).toMatch(/^PP-WH\d-\d+$/);
        expect(response.body.data.status).toBe('Pending');
      }
    });

    it('should reject signup with missing fields', async () => {
      const response = await request(baseURL)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject duplicate phone numbers', async () => {
      const phone = '+19997776666';
      
      // First signup
      await request(baseURL)
        .post('/api/auth/signup')
        .send({
          name: 'First User',
          phone,
        });

      // Duplicate signup
      const response = await request(baseURL)
        .post('/api/auth/signup')
        .send({
          name: 'Second User',
          phone,
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(baseURL)
        .post('/api/auth/login')
        .send({
          phone: '+15550000001',
          pin: '123456',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.status).toBe('Approved');
    });

    it('should reject login with invalid PIN', async () => {
      const response = await request(baseURL)
        .post('/api/auth/login')
        .send({
          phone: '+15550000001',
          pin: '999999',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent phone', async () => {
      const response = await request(baseURL)
        .post('/api/auth/login')
        .send({
          phone: '+19999999999',
          pin: '123456',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login for pending users', async () => {
      // Create pending user with random phone
      const randomPhone = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      const signupResponse = await request(baseURL)
        .post('/api/auth/signup')
        .send({
          name: 'Pending Test User',
          phone: randomPhone,
        });

      if (signupResponse.body.success && signupResponse.body.data?.phone) {
        const phone = signupResponse.body.data.phone;

        // Try to login
        const response = await request(baseURL)
          .post('/api/auth/login')
          .send({
            phone,
            pin: '123456',
          });

        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('GET /api/auth/status', () => {
    let token: string;

    beforeAll(async () => {
      const response = await request(baseURL)
        .post('/api/auth/login')
        .send({
          phone: '+15550000001',
          pin: '123456',
        });
      
      token = response.body.data.token;
    });

    it('should return user info with valid token', async () => {
      const response = await request(baseURL)
        .get('/api/auth/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('name');
      expect(response.body.data.user).toHaveProperty('employee_id');
      expect(response.body.data.is_authenticated).toBe(true);
    });

    it('should reject request without token', async () => {
      const response = await request(baseURL)
        .get('/api/auth/status');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(baseURL)
        .get('/api/auth/status')
        .set('Authorization', 'Bearer invalid_token_12345');

      expect(response.status).toBe(401);
    });
  });
});
