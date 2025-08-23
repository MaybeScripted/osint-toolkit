const axios = require('axios');

class HunterService {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.hunter.io/v2',
      timeout: 15000,
      headers: {
        'User-Agent': 'OSINT-Toolkit/1.0'
      }
    });
  }

  // email verification
  async verifyEmail(email) {
    if (!process.env.HUNTER_API_KEY) {
      throw new Error('Hunter.io API key not configured');
    }

    try {
      const response = await this.client.get('/email-verifier', {
        params: {
          email: email,
          api_key: process.env.HUNTER_API_KEY
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.details || error.message
      };
    }
  }

  // person enrichment
  async findPerson(email) {
    if (!process.env.HUNTER_API_KEY) {
      throw new Error('Hunter.io API key not configured');
    }

    try {
      const response = await this.client.get('/people/find', {
        params: {
          email: email,
          api_key: process.env.HUNTER_API_KEY
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.details || error.message
      };
    }
  }

  // domain search
  async searchDomain(domain, limit = 25) {
    if (!process.env.HUNTER_API_KEY) {
      throw new Error('Hunter.io API key not configured');
    }

    try {
      const response = await this.client.get('/domain-search', {
        params: {
          domain: domain,
          limit: limit,
          api_key: process.env.HUNTER_API_KEY
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.details || error.message
      };
    }
  }

  // company enrichment
  async findCompany(domain) {
    if (!process.env.HUNTER_API_KEY) {
      throw new Error('Hunter.io API key not configured');
    }

    try {
      const response = await this.client.get('/companies/find', {
        params: {
          domain: domain,
          api_key: process.env.HUNTER_API_KEY
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.details || error.message
      };
    }
  }

  // email finder
  async findEmail(domain, firstName, lastName) {
    if (!process.env.HUNTER_API_KEY) {
      throw new Error('Hunter.io API key not configured');
    }

    try {
      const response = await this.client.get('/email-finder', {
        params: {
          domain: domain,
          first_name: firstName,
          last_name: lastName,
          api_key: process.env.HUNTER_API_KEY
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.details || error.message
      };
    }
  }

  // combined enrichment (person + company)
  async combinedFind(email) {
    if (!process.env.HUNTER_API_KEY) {
      throw new Error('Hunter.io API key not configured');
    }

    try {
      const response = await this.client.get('/combined/find', {
        params: {
          email: email,
          api_key: process.env.HUNTER_API_KEY
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.details || error.message
      };
    }
  }

  // company discovery (free!)
  async discoverCompanies(query, filters = {}) {
    if (!process.env.HUNTER_API_KEY) {
      throw new Error('Hunter.io API key not configured');
    }

    try {
      const params = {
        api_key: process.env.HUNTER_API_KEY,
        limit: filters.limit || 25,
        offset: filters.offset || 0
      };

      if (query) {
        params.query = query;
      }

      if (filters.industry) params.industry = filters.industry;
      if (filters.headcount) params.headcount = filters.headcount;
      if (filters.headquarters_location) params.headquarters_location = filters.headquarters_location;
      if (filters.company_type) params.company_type = filters.company_type;
      if (filters.technology) params.technology = filters.technology;

      const response = await this.client.post('/discover', params);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.details || error.message
      };
    }
  }

  // email count for domain
  async getEmailCount(domain, type = null) {
    if (!process.env.HUNTER_API_KEY) {
      throw new Error('Hunter.io API key not configured');
    }

    try {
      const params = {
        domain: domain,
        api_key: process.env.HUNTER_API_KEY
      };

      if (type) params.type = type;

      const response = await this.client.get('/email-count', { params });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.details || error.message
      };
    }
  }

  isConfigured() {
    return !!process.env.HUNTER_API_KEY;
  }

  async healthCheck() {
    if (!this.isConfigured()) {
      return {
        status: 'unavailable',
        message: 'Hunter.io API key not configured'
      };
    }

    try {
      const response = await this.client.get('/email-verifier', {
        params: {
          email: 'test@example.com',
          api_key: process.env.HUNTER_API_KEY
        }
      });

      return {
        status: 'healthy',
        message: 'Hunter.io API is responding'
      };
    } catch (error) {
      if (error.response?.status === 401) {
        return {
          status: 'error',
          message: 'Hunter.io API key is invalid'
        };
      }

      return {
        status: 'error',
        message: error.response?.data?.errors?.[0]?.details || error.message
      };
    }
  }

  // extract entities for further processing
  extractEntities(hunterData, sourceType = 'hunter') {
    const entities = [];

    if (!hunterData || !hunterData.success) return entities;

    const data = hunterData.data;

    if (data.person || data.data) {
      const personData = data.person || data.data;

      if (personData.first_name || personData.last_name) {
        const fullName = [personData.first_name, personData.last_name].filter(Boolean).join(' ');
        if (fullName) {
          entities.push({
            type: 'name',
            value: fullName,
            source: sourceType,
            confidence: 0.9
          });
        }
      }

      if (personData.organization) {
        entities.push({
          type: 'company',
          value: personData.organization,
          source: sourceType,
          confidence: 0.8
        });
      }

      if (personData.domain) {
        entities.push({
          type: 'domain',
          value: personData.domain,
          source: sourceType,
          confidence: 0.8
        });
      }

      if (personData.position) {
        entities.push({
          type: 'job_title',
          value: personData.position,
          source: sourceType,
          confidence: 0.7
        });
      }
    }

    if (data.company) {
      const companyData = data.company;

      if (companyData.name) {
        entities.push({
          type: 'company',
          value: companyData.name,
          source: sourceType,
          confidence: 0.9
        });
      }

      if (companyData.domain) {
        entities.push({
          type: 'domain',
          value: companyData.domain,
          source: sourceType,
          confidence: 0.9
        });
      }
    }

    if (data.emails && Array.isArray(data.emails)) {
      data.emails.forEach(emailData => {
        if (emailData.value) {
          entities.push({
            type: 'email',
            value: emailData.value,
            source: sourceType,
            confidence: emailData.confidence || 0.7
          });
        }

        if (emailData.first_name || emailData.last_name) {
          const fullName = [emailData.first_name, emailData.last_name].filter(Boolean).join(' ');
          if (fullName) {
            entities.push({
              type: 'name',
              value: fullName,
              source: sourceType,
              confidence: 0.8
            });
          }
        }
      });
    }

    return entities;
  }
}

module.exports = new HunterService();
