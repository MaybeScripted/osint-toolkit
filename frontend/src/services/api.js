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

  // server-Sent events streaming username lookup stuff.
  lookupUsernameStream(username, onResult, onError, onComplete) {
    const eventSource = new EventSource(`${API_BASE_URL}/lookup/username/${encodeURIComponent(username)}/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            console.log('SSE Connected:', data.message);
            break;
          case 'result':
            onResult?.(data.data);
            break;
          case 'error':
            onError?.(new Error(data.error.message));
            eventSource.close();
            break;
          case 'complete':
            onComplete?.(data.data);
            eventSource.close();
            break;
          default:
            console.log('Unknown SSE event type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
        onError?.(error);
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      onError?.(new Error('Connection lost'));
      eventSource.close();
    };

    // return the event source so it can be closed manually if needed. yeah.
    return eventSource;
  }

  async lookupIP(ip) {
    const response = await this.client.get(`/lookup/ip/${encodeURIComponent(ip)}`);
    return response.data;
  }



  async lookupDomain(domain) {
    const response = await this.client.get(`/lookup/domain/${encodeURIComponent(domain)}`);
    return response.data;
  }

  async analyzeUrl(url) {
    const response = await this.client.get(`/lookup/url/${encodeURIComponent(url)}`);
    return response.data;
  }

  async expandUrl(url) {
    const response = await this.client.get(`/lookup/url/expand/${encodeURIComponent(url)}`);
    return response.data;
  }

  async analyzeUrlSecurity(url) {
    const response = await this.client.get(`/lookup/url/security/${encodeURIComponent(url)}`);
    return response.data;
  }

  async batchAnalyzeUrls(urls) {
    const response = await this.client.post('/lookup/url/batch', { urls });
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

  // Document Analysis methods
  async analyzeDocument(formData) {
    const response = await this.client.post('/lookup/document/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async getSupportedFormats() {
    const response = await this.client.get('/lookup/document/formats');
    return response.data;
  }

  // Stop username search
  async stopUsernameSearch(username) {
    const response = await this.client.post(`/lookup/username/${encodeURIComponent(username)}/stop`);
    return response.data;
  }

  // Generic get method for direct API calls
  async get(url, config = {}) {
    const response = await this.client.get(url, config);
    return response.data;
  }
}

export default new ApiService();
