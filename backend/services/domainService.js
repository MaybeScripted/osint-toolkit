const axios = require('axios');

class DomainService {
  constructor() {
    this.rapidApiKey = process.env.RAPIDAPI_KEY;
    this.client = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'osint-toolkit-Platform/1.0'
      }
    });
  }

  async lookupDomain(domain) {
    const results = {
      domain,
      dns_records: null,
      whois: null,
      ssl_certificate: null,
      success: false,
      errors: []
    };

    try {
      // basic domain validation and info
      if (this.isValidDomain(domain)) {
        results.basic_info = {
          domain: domain,
          tld: domain.split('.').pop(),
          subdomain: domain.includes('.') && domain.split('.').length > 2 ? domain.split('.').slice(0, -2).join('.') : null,
          sld: domain.split('.').slice(-2, -1)[0] || domain.split('.')[0]
        };
        results.success = true;
      }

      if (this.rapidApiKey) {
        const headers = {
          'x-rapidapi-key': this.rapidApiKey,
          'x-rapidapi-host': 'whois-api6.p.rapidapi.com',
          'Content-Type': 'application/json'
        };

        // 1. DNS Records lookup
        try {
          const dnsResponse = await this.client.post('https://whois-api6.p.rapidapi.com/dns/api/v1/getRecords', 
            { query: domain },
            { headers }
          );
          
          if (dnsResponse.data && dnsResponse.data.result) {
            results.dns_records = dnsResponse.data.result;
            results.success = true;
          }
        } catch (error) {
          console.log(`RapidAPI DNS lookup error for ${domain}:`, error.message);
          results.errors.push({
            service: 'rapidapi_dns',
            error: error.response?.data?.message || 'DNS lookup failed'
          });
        }

        // 2. WHOIS lookup
        try {
          const whoisResponse = await this.client.post('https://whois-api6.p.rapidapi.com/whois/api/v1/getData', 
            { query: domain },
            { headers }
          );
          
          if (whoisResponse.data && whoisResponse.data.result) {
            results.whois = whoisResponse.data.result;
            results.success = true;
          }
        } catch (error) {
          console.log(`RapidAPI WHOIS lookup error for ${domain}:`, error.message);
          results.errors.push({
            service: 'rapidapi_whois',
            error: error.response?.data?.message || 'WHOIS lookup failed'
          });
        }

        // 3. SSL Certificate lookup
        try {
          const sslResponse = await this.client.post('https://whois-api6.p.rapidapi.com/ssl/api/v1/getCertificate', 
            { query: domain },
            { headers }
          );
          
          if (sslResponse.data && sslResponse.data.result) {
            results.ssl_certificate = sslResponse.data.result;
            results.success = true;
          }
        } catch (error) {
          console.log(`RapidAPI SSL lookup error for ${domain}:`, error.message);
          results.errors.push({
            service: 'rapidapi_ssl',
            error: error.response?.data?.message || 'SSL lookup failed'
          });
        }

      } else {
        results.errors.push({
          service: 'rapidapi',
          error: 'RapidAPI key not configured'
        });
      }

    } catch (error) {
      console.error(`Domain lookup error for ${domain}:`, error.message);
      results.errors.push({
        service: 'domain_service',
        error: error.message
      });
    }

    return results;
  }



  // extract entities from domain lookup (RapidAPI format)
  extractEntities(domainResults) {
    const entities = [];

    if (!domainResults.success) return entities;

    // extract basic domain info
    if (domainResults.basic_info) {
      const info = domainResults.basic_info;
      
      entities.push({
        type: 'domain',
        value: info.domain,
        source: 'domain_analysis',
        confidence: 1.0
      });

      if (info.tld) {
        entities.push({
          type: 'tld',
          value: info.tld,
          source: 'domain_analysis',
          confidence: 1.0
        });
      }

      if (info.subdomain) {
        entities.push({
          type: 'subdomain',
          value: info.subdomain,
          source: 'domain_analysis',
          confidence: 0.9
        });
      }
    }

    // extract from RapidAPI DNS records
    if (domainResults.dns_records?.records) {
      const records = domainResults.dns_records.records;

      // A records (IPv4)
      if (records.A) {
        records.A.forEach(ip => {
          entities.push({
            type: 'ip_address',
            value: ip,
            source: 'dns_a_record',
            confidence: 1.0
          });
        });
      }

      // AAAA records (IPv6)
      if (records.AAAA) {
        records.AAAA.forEach(ip => {
          entities.push({
            type: 'ipv6_address',
            value: ip,
            source: 'dns_aaaa_record',
            confidence: 1.0
          });
        });
      }

      // Name servers
      if (records.NS) {
        records.NS.forEach(ns => {
          entities.push({
            type: 'nameserver',
            value: ns.replace(/\.$/, ''), // remove trailing dot
            source: 'dns_ns_record',
            confidence: 1.0
          });
        });
      }

      // MX records (mail servers)
      if (records.MX) {
        records.MX.forEach(mx => {
          const exchange = mx.exchange ? mx.exchange.replace(/\.$/, '') : mx;
          entities.push({
            type: 'mail_server',
            value: exchange,
            source: 'dns_mx_record',
            confidence: 1.0
          });
        });
      }

      // TXT records (might contain verification codes, SPF records, etc.)
      if (records.TXT) {
        records.TXT.forEach(txt => {
          const cleanTxt = txt.replace(/"/g, ''); // remove quotes
          
          // check for specific types
          if (cleanTxt.includes('v=spf1')) {
            entities.push({
              type: 'spf_record',
              value: cleanTxt,
              source: 'dns_txt_record',
              confidence: 1.0
            });
          } else if (cleanTxt.includes('verification')) {
            entities.push({
              type: 'domain_verification',
              value: cleanTxt,
              source: 'dns_txt_record',
              confidence: 0.8
            });
          } else {
            entities.push({
              type: 'txt_record',
              value: cleanTxt,
              source: 'dns_txt_record',
              confidence: 0.7
            });
          }
        });
      }
    }

    // extract from WHOIS data
    if (domainResults.whois) {
      const whois = domainResults.whois;

      // registrar info
      if (whois.registrar_name || whois.registrar) {
        entities.push({
          type: 'registrar',
          value: whois.registrar_name || whois.registrar,
          source: 'whois',
          confidence: 1.0
        });
      }

      // registrant info
      if (whois.registrant_name) {
        entities.push({
          type: 'registrant_name',
          value: whois.registrant_name,
          source: 'whois',
          confidence: 0.9
        });
      }

      if (whois.registrant_organization) {
        entities.push({
          type: 'registrant_organization',
          value: whois.registrant_organization,
          source: 'whois',
          confidence: 0.9
        });
      }

      if (whois.registrant_email) {
        entities.push({
          type: 'registrant_email',
          value: whois.registrant_email,
          source: 'whois',
          confidence: 0.8
        });
      }

      // dates
      if (whois.creation_date || whois.created_date) {
        entities.push({
          type: 'creation_date',
          value: whois.creation_date || whois.created_date,
          source: 'whois',
          confidence: 1.0
        });
      }

      if (whois.expiration_date || whois.expires_date) {
        entities.push({
          type: 'expiration_date',
          value: whois.expiration_date || whois.expires_date,
          source: 'whois',
          confidence: 1.0
        });
      }
    }

    // extract from SSL certificate data
    if (domainResults.ssl_certificate) {
      const ssl = domainResults.ssl_certificate;

      if (ssl.issuer) {
        entities.push({
          type: 'ssl_issuer',
          value: ssl.issuer,
          source: 'ssl_certificate',
          confidence: 1.0
        });
      }

      if (ssl.subject) {
        entities.push({
          type: 'ssl_subject',
          value: ssl.subject,
          source: 'ssl_certificate',
          confidence: 1.0
        });
      }

      if (ssl.valid_from) {
        entities.push({
          type: 'ssl_valid_from',
          value: ssl.valid_from,
          source: 'ssl_certificate',
          confidence: 1.0
        });
      }

      if (ssl.valid_to) {
        entities.push({
          type: 'ssl_valid_to',
          value: ssl.valid_to,
          source: 'ssl_certificate',
          confidence: 1.0
        });
      }

      if (ssl.fingerprint) {
        entities.push({
          type: 'ssl_fingerprint',
          value: ssl.fingerprint,
          source: 'ssl_certificate',
          confidence: 1.0
        });
      }

      // alternative names from SSL cert
      if (ssl.subject_alt_names && Array.isArray(ssl.subject_alt_names)) {
        ssl.subject_alt_names.forEach(altName => {
          entities.push({
            type: 'ssl_alt_name',
            value: altName,
            source: 'ssl_certificate',
            confidence: 0.9
          });
        });
      }
    }

    return entities;
  }

  // validate domain format
  isValidDomain(domain) {
    if (!domain || typeof domain !== 'string') return false;
    
    // basic domain regex
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain.trim());
  }

  isConfigured() {
    return !!this.rapidApiKey;
  }

  async healthCheck() {
    if (!this.rapidApiKey) {
      return { status: 'error', message: 'RapidAPI key not configured' };
    }

    const headers = {
      'x-rapidapi-key': this.rapidApiKey,
      'x-rapidapi-host': 'whois-api6.p.rapidapi.com',
      'Content-Type': 'application/json'
    };

    const testResults = {
      dns: false,
      whois: false,
      ssl: false
    };

    try {
      // test DNS endpoint
      try {
        const dnsResponse = await this.client.post('https://whois-api6.p.rapidapi.com/dns/api/v1/getRecords', 
          { query: 'google.com' },
          { headers, timeout: 5000 }
        );
        testResults.dns = !!dnsResponse.data?.result;
      } catch (error) {
        console.log('DNS health check failed:', error.message);
      }

      // test WHOIS endpoint
      try {
        const whoisResponse = await this.client.post('https://whois-api6.p.rapidapi.com/whois/api/v1/getData', 
          { query: 'google.com' },
          { headers, timeout: 5000 }
        );
        testResults.whois = !!whoisResponse.data?.result;
      } catch (error) {
        console.log('WHOIS health check failed:', error.message);
      }

      // test SSL endpoint
      try {
        const sslResponse = await this.client.post('https://whois-api6.p.rapidapi.com/ssl/api/v1/getCertificate', 
          { query: 'google.com' },
          { headers, timeout: 5000 }
        );
        testResults.ssl = !!sslResponse.data?.result;
      } catch (error) {
        console.log('SSL health check failed:', error.message);
      }

      const workingEndpoints = Object.values(testResults).filter(Boolean).length;
      
      if (workingEndpoints === 3) {
        return { 
          status: 'healthy', 
          message: 'All RapidAPI domain endpoints working (DNS, WHOIS, SSL)',
          endpoints: testResults
        };
      } else if (workingEndpoints > 0) {
        return { 
          status: 'partial', 
          message: `${workingEndpoints}/3 RapidAPI endpoints working`,
          endpoints: testResults
        };
      } else {
        return { 
          status: 'error', 
          message: 'No RapidAPI endpoints responding',
          endpoints: testResults
        };
      }
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

module.exports = new DomainService();
