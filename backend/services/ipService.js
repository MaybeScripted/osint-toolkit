const axios = require('axios');

class IpService {
  constructor() {
    this.virusTotalApiKey = process.env.VIRUSTOTAL_API_KEY;
    this.ipApiKey = process.env.IPAPI_KEY; // Optional API key for ipapi.is
    
    this.ipApiClient = axios.create({
      baseURL: 'https://api.ipapi.is',
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

  /**
   * Because ipapi.is couldnt build a proper false-positive system, 
   * I am now forced to manually clean up their mess.
   * Decodes abuser_score string: "0.0039 (Low)", "0.1234 (Elevated)", etc.
   * Returns: { score: number, level: string, isSignificant: boolean }
   * It parses its way through both number thresholds AND bad labels for actually useful detection.
   */
  parseAbuserScore(scoreString) {
    if (!scoreString || typeof scoreString !== 'string') {
      return { score: 0, level: 'Unknown', isSignificant: false };
    }

    const match = scoreString.match(/^([\d.]+)\s*\(([^)]+)\)$/);
    if (!match) {
      return { score: 0, level: 'Unknown', isSignificant: false };
    }

    const score = parseFloat(match[1]);
    const level = match[2].trim();
    
    // combine numeric threshold (score >= 0.01) and level labels ("Low", "Very Low") to robustly detect significant abuse, reducing false positives.
    const isSignificant = score >= 0.01 && !['Very Low', 'Low'].includes(level);
    
    return { score, level, isSignificant };
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
      // ipapi.is API call - using query parameter q
      const params = { q: ip };
      if (this.ipApiKey) {
        params.key = this.ipApiKey;
      }
      
      const geoResponse = await this.ipApiClient.get('/', { params });
      
      if (geoResponse.status === 200 && !geoResponse.data.error) {
        const data = geoResponse.data;
        
        // parses abuser scores to determine if abuse is significant and filters out false positives.
        const companyAbuserScore = this.parseAbuserScore(data.company?.abuser_score);
        const asnAbuserScore = this.parseAbuserScore(data.asn?.abuser_score);
        
        // Map ipapi.is response structure to expected format
        results.geolocation = {
          version: this.isValidIP(ip) ? (ip.includes(':') ? 'IPv6' : 'IPv4') : 'Unknown',
          country_name: data.location?.country || null,
          country_code: data.location?.country_code || null,
          region: data.location?.state || null,
          city: data.location?.city || null,
          postal: data.location?.zip || null,
          latitude: data.location?.latitude || null,
          longitude: data.location?.longitude || null,
          timezone: data.location?.timezone || null,
          currency_name: data.location?.currency_code || null,
          asn: data.asn?.asn || null,
          org: data.company?.name || data.asn?.org || null,
          network: data.asn?.route || data.company?.network || null,
          continent: data.location?.continent || null,
          calling_code: data.location?.calling_code || null,
          is_eu_member: data.location?.is_eu_member || false,
          is_datacenter: data.is_datacenter || false,
          is_tor: data.is_tor || false,
          is_vpn: data.is_vpn || false,
          is_proxy: data.is_proxy || false,
          is_abuser: data.is_abuser || false,
          is_mobile: data.is_mobile || false,
          is_satellite: data.is_satellite || false,
          datacenter: data.datacenter?.datacenter || null,
          crawler: data.is_crawler || null,
          abuser_score_company: data.company?.abuser_score || null,
          abuser_score_asn: data.asn?.abuser_score || null
        };

        // builds reputation object from security flags and filters out false positives.
        const hasSignificantAbuse = companyAbuserScore.isSignificant || asnAbuserScore.isSignificant;
        const isActuallyAbuser = data.is_abuser && hasSignificantAbuse;
        

        results.reputation = {
          malicious: isActuallyAbuser || false,
          suspicious: data.is_tor || data.is_proxy || data.is_vpn || false,
          is_tor: data.is_tor || false,
          is_vpn: data.is_vpn || false,
          is_proxy: data.is_proxy || false,
          is_datacenter: data.is_datacenter || false,
          is_abuser: data.is_abuser || false,
          abuser_score_company: data.company?.abuser_score || null,
          abuser_score_asn: data.asn?.abuser_score || null
        };
      } else if (geoResponse.data?.error) {
        results.errors.push({
          service: 'ipapi.is',
          error: geoResponse.data.error
        });
      }
    } catch (error) {
      results.errors.push({
        service: 'ipapi.is',
        error: error.response?.data?.error || error.message
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
          // Merge VirusTotal reputation data with existing reputation object
          if (!results.reputation) {
            results.reputation = {};
          }
          results.reputation.virustotal = {
            detected_urls: vtResponse.data.detected_urls || [],
            detected_communicating_samples: vtResponse.data.detected_communicating_samples || [],
            positives: vtResponse.data.positives || 0,
            total: vtResponse.data.total || 0,
            scan_date: vtResponse.data.scan_date
          };
          
          // updates malicious flag only if VirusTotal has significant detections
          if (vtResponse.data.positives >= 3) {
            results.reputation.malicious = true;
          }
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
        source: 'ipapi.is',
        confidence: 0.9
      });
    }

    if (geo.asn) {
      entities.push({
        type: 'asn',
        value: geo.asn,
        source: 'ipapi.is',
        confidence: 1.0
      });
    }

    if (geo.city && geo.country_name) {
      entities.push({
        type: 'location',
        value: `${geo.city}, ${geo.region}, ${geo.country_name}`,
        source: 'ipapi.is',
        confidence: 0.8
      });
    }

    if (geo.country_name) {
      entities.push({
        type: 'country',
        value: geo.country_name,
        source: 'ipapi.is',
        confidence: 0.9
      });
    }

    if (geo.timezone) {
      entities.push({
        type: 'timezone',
        value: geo.timezone,
        source: 'ipapi.is',
        confidence: 0.7
      });
    }

    // Extract suspicious domains from VirusTotal reputation
    if (ipResults.reputation?.virustotal?.detected_urls) {
      ipResults.reputation.virustotal.detected_urls.slice(0, 10).forEach(urlData => {
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
