const axios = require('axios');

class IpService {
  constructor() {
    this.virusTotalApiKey = process.env.VIRUSTOTAL_API_KEY;
    
    this.ipApiClient = axios.create({
      baseURL: 'https://ipapi.co',
      timeout: 10000,
      headers: {
        'User-Agent': 'osint-toolkit-Platform/1.0'
      }
    });

    this.virusTotalClient = axios.create({
      baseURL: 'https://www.virustotal.com/vtapi/v2',
      timeout: 15000,
      headers: {
        'User-Agent': 'osint-toolkit-Platform/1.0'
      }
    });
  }

  async lookupIP(ip) {
    const results = {
      ip,
      geolocation: null,
      reputation: null,
      success: false,
      errors: []
    };

    try {
      const geoResponse = await this.ipApiClient.get(`/${ip}/json/`);
      
      if (geoResponse.status === 200 && !geoResponse.data.error) {
        results.geolocation = geoResponse.data;
      }
    } catch (error) {
      results.errors.push({
        service: 'ipapi',
        error: error.response?.data?.reason || error.message
      });
    }

    // virustotal reputation check
    if (this.virusTotalApiKey) {
      try {
        const vtResponse = await this.virusTotalClient.get('/ip-address/report', {
          params: {
            apikey: this.virusTotalApiKey,
            ip: ip
          }
        });
        
        if (vtResponse.status === 200 && vtResponse.data.response_code === 1) {
          results.reputation = {
            detected_urls: vtResponse.data.detected_urls || [],
            detected_communicating_samples: vtResponse.data.detected_communicating_samples || [],
            positives: vtResponse.data.positives || 0,
            total: vtResponse.data.total || 0,
            scan_date: vtResponse.data.scan_date
          };
        }
      } catch (error) {
        results.errors.push({
          service: 'virustotal',
          error: error.response?.data?.verbose_msg || error.message
        });
      }
    } else {
      results.errors.push({
        service: 'virustotal',
        error: 'API key not configured'
      });
    }

    results.success = results.geolocation !== null;

    return results;
  }

  // extract entities from ip lookup
  extractEntities(ipResults) {
    const entities = [];

    if (!ipResults.success || !ipResults.geolocation) return entities;

    const geo = ipResults.geolocation;

    if (geo.org) {
      entities.push({
        type: 'organization',
        value: geo.org,
        source: 'ipapi',
        confidence: 0.9
      });
    }

    if (geo.asn) {
      entities.push({
        type: 'asn',
        value: geo.asn,
        source: 'ipapi',
        confidence: 1.0
      });
    }

    if (geo.city && geo.country_name) {
      entities.push({
        type: 'location',
        value: `${geo.city}, ${geo.region}, ${geo.country_name}`,
        source: 'ipapi',
        confidence: 0.8
      });
    }

    if (geo.country_name) {
      entities.push({
        type: 'country',
        value: geo.country_name,
        source: 'ipapi',
        confidence: 0.9
      });
    }

    if (geo.timezone) {
      entities.push({
        type: 'timezone',
        value: geo.timezone,
        source: 'ipapi',
        confidence: 0.7
      });
    }

    if (ipResults.reputation && ipResults.reputation.detected_urls) {
      ipResults.reputation.detected_urls.slice(0, 10).forEach(urlData => {
        try {
          const domain = new URL(urlData.url).hostname;
          entities.push({
            type: 'suspicious_domain',
            value: domain,
            source: 'virustotal',
            confidence: 0.6
          });
        } catch (e) {
          // skip invalid urls
        }
      });
    }

    return entities;
  }

  isValidIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  isPrivateIP(ip) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;
    
    return (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 127
    );
  }
}

module.exports = new IpService();
