import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 70000, // this is literally here because of Sherlock, sherlock is slow as fuck
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        console.error('API Request error:', error);
        return Promise.reject(error);
      }
    );

    // response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('API Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // direct lookup methods (free APIs)
  async lookupEmail(email) {
    const response = await this.client.get(`/lookup/email/${encodeURIComponent(email)}`);
    return response.data;
  }

  async lookupUsername(username) {
    const response = await this.client.get(`/lookup/username/${encodeURIComponent(username)}`);
    return response.data;
  }

  async lookupIP(ip) {
    const response = await this.client.get(`/lookup/ip/${encodeURIComponent(ip)}`);
    return response.data;
  }



  async lookupDomain(domain) {
    const response = await this.client.get(`/lookup/domain/${encodeURIComponent(domain)}`);
    return response.data;
  }

  async batchLookup(queries) {
    const response = await this.client.post('/lookup/batch', { queries });
    return response.data;
  }

  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  async sherlockHealthCheck() {
    const response = await this.client.get('/lookup/health');
    return response.data;
  }

  // Easy-ID methods
  async generateEasyIdData(params) {
    const response = await this.client.get('/lookup/easy-id/generate', { params });
    return response.data;
  }

  async getEasyIdLocales() {
    const response = await this.client.get('/lookup/easy-id/locales');
    return response.data;
  }

  async getEasyIdTypes() {
    const response = await this.client.get('/lookup/easy-id/types');
    return response.data;
  }

  // Generic get method for direct API calls
  async get(url, config = {}) {
    const response = await this.client.get(url, config);
    return response.data;
  }
}

export default new ApiService();
