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

  async lookupBulkDomains(domains) {
    const results = {
      domains: domains,
      whois: null,
      success: false,
      errors: []
    };

    if (!this.rapidApiKey) {
      results.errors.push({
        service: 'bulk_whois',
        error: 'RapidAPI key not configured'
      });
      return results;
    }

    try {
      const domainsParam = Array.isArray(domains) ? domains.join('%2C') : domains;
      const whoisUrl = `https://pointsdb-bulk-whois-v1.p.rapidapi.com/whois?domains=${domainsParam}&format=split`;
      const whoisHeaders = {
        'x-rapidapi-key': this.rapidApiKey,
        'x-rapidapi-host': 'pointsdb-bulk-whois-v1.p.rapidapi.com'
      };
      
      const whoisResponse = await this.client.get(whoisUrl, { headers: whoisHeaders });
      
      if (whoisResponse.data) {
        // Parse the raw WHOIS data for all domains
        const parsedWhois = {};
        const domainsArray = Array.isArray(domains) ? domains : [domains];
        for (const domain of domainsArray) {
          parsedWhois[domain] = this.parseWhoisData(whoisResponse.data, domain);
        }
        results.whois = parsedWhois;
        results.success = true;
      }
    } catch (error) {
      console.log(`Bulk WHOIS lookup error for domains ${domains}:`, error.message);
      results.errors.push({
        service: 'bulk_whois',
        error: error.response?.data?.message || 'Bulk WHOIS lookup failed'
      });
    }

    return results;
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

        // 2. Bulk WHOIS lookup
        try {
          const whoisUrl = `https://pointsdb-bulk-whois-v1.p.rapidapi.com/whois?domains=${encodeURIComponent(domain)}&format=split`;
          const whoisHeaders = {
            'x-rapidapi-key': this.rapidApiKey,
            'x-rapidapi-host': 'pointsdb-bulk-whois-v1.p.rapidapi.com'
          };
          
          const whoisResponse = await this.client.get(whoisUrl, { headers: whoisHeaders });
          
          if (whoisResponse.data) {
            // Parse the raw WHOIS data into structured format
            results.whois = this.parseWhoisData(whoisResponse.data, domain);
            results.success = true;
          }
        } catch (error) {
          console.log(`Bulk WHOIS lookup error for ${domain}:`, error.message);
          results.errors.push({
            service: 'bulk_whois',
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

    // extract from Bulk WHOIS data
    if (domainResults.whois) {
      const whois = domainResults.whois;
      
      // Handle both single domain response and bulk response format
      const whoisData = whois.data || whois;
      const domainData = Array.isArray(whoisData) ? whoisData[0] : whoisData;

      if (domainData) {
        // registrar info
        if (domainData.registrar_name || domainData.registrar) {
          entities.push({
            type: 'registrar',
            value: domainData.registrar_name || domainData.registrar,
            source: 'bulk_whois',
            confidence: 1.0
          });
        }

        // registrant info
        if (domainData.registrant_name) {
          entities.push({
            type: 'registrant_name',
            value: domainData.registrant_name,
            source: 'bulk_whois',
            confidence: 0.9
          });
        }

        if (domainData.registrant_organization) {
          entities.push({
            type: 'registrant_organization',
            value: domainData.registrant_organization,
            source: 'bulk_whois',
            confidence: 0.9
          });
        }

        if (domainData.registrant_email) {
          entities.push({
            type: 'registrant_email',
            value: domainData.registrant_email,
            source: 'bulk_whois',
            confidence: 0.8
          });
        }

        // dates
        if (domainData.creation_date || domainData.created_date) {
          entities.push({
            type: 'creation_date',
            value: domainData.creation_date || domainData.created_date,
            source: 'bulk_whois',
            confidence: 1.0
          });
        }

        if (domainData.expiration_date || domainData.expires_date) {
          entities.push({
            type: 'expiration_date',
            value: domainData.expiration_date || domainData.expires_date,
            source: 'bulk_whois',
            confidence: 1.0
          });
        }

        // Additional fields that might be in Bulk WHOIS response
        if (domainData.updated_date) {
          entities.push({
            type: 'updated_date',
            value: domainData.updated_date,
            source: 'bulk_whois',
            confidence: 1.0
          });
        }

        if (domainData.name_servers && Array.isArray(domainData.name_servers)) {
          domainData.name_servers.forEach(ns => {
            entities.push({
              type: 'nameserver',
              value: ns.replace(/\.$/, ''), // remove trailing dot
              source: 'bulk_whois',
              confidence: 1.0
            });
          });
        }

        if (domainData.status) {
          entities.push({
            type: 'domain_status',
            value: domainData.status,
            source: 'bulk_whois',
            confidence: 1.0
          });
        }
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

  // parse raw WHOIS data from Bulk WHOIS API into structured format
  parseWhoisData(rawData, domain) {
    try {
      // Extract the domain data from the response
      const domainData = rawData[domain];
      if (!domainData || !Array.isArray(domainData)) {
        return null;
      }

      // Convert array of objects to raw text
      const rawText = domainData
        .map(item => Object.values(item)[0])
        .join('\n')
        .trim();

      // Parse the raw WHOIS text into structured data
      const parsed = {};
      const lines = rawText.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('>>>') || trimmedLine.startsWith('For more') || trimmedLine.startsWith('The registration') || trimmedLine.startsWith('The Whois') || trimmedLine.startsWith('Access to')) {
          continue;
        }

        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmedLine.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '_');
          const value = trimmedLine.substring(colonIndex + 1).trim();
          
          if (value && value !== '') {
            // Handle special cases
            if (key === 'domain_name') {
              parsed.domain_name = value;
            } else if (key === 'registry_domain_id') {
              parsed.registry_domain_id = value;
            } else if (key === 'registrar_whois_server') {
              parsed.registrar_whois_server = value;
            } else if (key === 'registrar_url') {
              parsed.registrar_url = value;
            } else if (key === 'updated_date') {
              parsed.updated_date = value;
            } else if (key === 'creation_date') {
              parsed.creation_date = value;
            } else if (key === 'registry_expiry_date') {
              parsed.expiration_date = value;
            } else if (key === 'registrar') {
              parsed.registrar_name = value;
            } else if (key === 'registrar_iana_id') {
              parsed.registrar_iana_id = value;
            } else if (key === 'domain_status') {
              if (!parsed.domain_status) {
                parsed.domain_status = [];
              }
              parsed.domain_status.push(value);
            } else if (key === 'name_server') {
              if (!parsed.name_servers) {
                parsed.name_servers = [];
              }
              parsed.name_servers.push(value);
            } else if (key === 'dnssec') {
              parsed.dnssec = value;
            } else if (key === 'registrar_abuse_contact_email') {
              parsed.registrar_abuse_contact_email = value;
            } else if (key === 'registrar_abuse_contact_phone') {
              parsed.registrar_abuse_contact_phone = value;
            } else if (key === 'url_of_the_icann_whois_inaccuracy_complaint_form') {
              parsed.icann_complaint_url = value;
            }
          }
        }
      }

      return parsed;
    } catch (error) {
      console.error('Error parsing WHOIS data:', error);
      return null;
    }
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

      // test Bulk WHOIS endpoint
      try {
        const whoisUrl = `https://pointsdb-bulk-whois-v1.p.rapidapi.com/whois?domains=${encodeURIComponent('google.com')}&format=split`;
        const whoisHeaders = {
          'x-rapidapi-key': this.rapidApiKey,
          'x-rapidapi-host': 'pointsdb-bulk-whois-v1.p.rapidapi.com'
        };
        
        const whoisResponse = await this.client.get(whoisUrl, { 
          headers: whoisHeaders, 
          timeout: 5000 
        });
        testResults.whois = !!whoisResponse.data;
      } catch (error) {
        console.log('Bulk WHOIS health check failed:', error.message);
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
