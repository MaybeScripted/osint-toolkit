const axios = require('axios');

class SherlockService {
  constructor() {
    this.baseURL = 'http://localhost:3002';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // sherlock is slow
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'osint-toolkit-Platform/1.0'
      }
    });
  }

  async lookupUsername(username) {
    const results = {
      username,
      profiles: [],
      success: false,
      errors: []
    };

    try {
      await this.checkSherlockStatus();
      
      const response = await this.client.get(`/lookup/${encodeURIComponent(username)}`);
      
      if (response.status === 200 && response.data) {
        const data = response.data;
        
        results.profiles = (data.results || []).filter(result => result.exists);
        results.success = true;
      }
    } catch (error) {
      console.error(`Sherlock error for ${username}:`, error.response?.status || error.message);
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        results.errors.push({
          service: 'sherlock',
          error: 'Sherlock service not running. Please start Sherlock on port 3000'
        });
      } else {
        results.errors.push({
          service: 'sherlock',
          error: error.response?.data?.error || error.message
        });
      }
    }

    return results;
  }

  async checkSherlockStatus() {
    try {
      const response = await this.client.get('/status');
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      console.error(`Sherlock service check failed: ${error.response?.status || error.message}`);
      throw new Error('Sherlock service not available');
    }
  }

  // extract entities from sherlock results
  extractEntities(sherlockResults) {
    const entities = [];

    if (!sherlockResults.success || !sherlockResults.profiles) return entities;

    sherlockResults.profiles.forEach(profile => {
      entities.push({
        type: 'social_platform',
        value: profile.site,
        source: 'sherlock',
        confidence: 1.0
      });

      entities.push({
        type: 'social_profile_url',
        value: profile.url,
        source: 'sherlock',
        confidence: 1.0
      });

      try {
        const domain = new URL(profile.url).hostname;
        entities.push({
          type: 'domain',
          value: domain,
          source: 'derived',
          confidence: 0.8
        });
      } catch (e) {
        // skip invalid urls
      }

      if (profile.additional_info) {
        Object.entries(profile.additional_info).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            entities.push({
              type: `social_${key}`,
              value: value,
              source: 'sherlock',
              confidence: 0.6
            });
          }
        });
      }
    });

    return entities;
  }

  // basic username validation
  isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_-]{1,30}$/;
    return usernameRegex.test(username);
  }

  async getSupportedPlatforms() {
    try {
      const response = await this.client.get('/platforms');
      return response.data.platforms || [];
    } catch (error) {
      console.log('Could not fetch supported platforms:', error.message);
      return [];
    }
  }
}

module.exports = new SherlockService();
