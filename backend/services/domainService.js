const axios = require('axios');

class DomainService {
  constructor() {
    this.rapidApiKey = process.env.RAPIDAPI_KEY;
    this.commonPaths = [
      '/', '/admin', '/administrator', '/login', '/wp-admin', '/wp-login.php', 
      '/dashboard', '/panel', '/cpanel', '/user', '/users', '/account', '/accounts', 
      '/profile', '/profiles', '/api', '/v1', '/graphql', '/robots.txt', '/sitemap.xml', 
      '/.env', '/config', '/backup', '/db', '/database', '/admin.php', '/index.php'
    ];
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

    try {
      const domainsArray = Array.isArray(domains) ? domains : [domains];
      const mapped = {};
      await Promise.all(domainsArray.map(async (d) => {
        try {
          const resp = await this.client.get(`https://rdap.org/domain/${encodeURIComponent(d)}`, { timeout: 8000 });
          mapped[d] = this.mapRdapToWhois(resp.data);
        } catch (error) {
          results.errors.push({ service: 'rdap_whois', error: `Failed for ${d}: ${error.response?.statusText || error.message}` });
        }
      }));
      results.whois = mapped;
      results.success = Object.keys(mapped).length > 0;
    } catch (error) {
      console.log(`Bulk RDAP lookup error for domains ${domains}:`, error.message);
      results.errors.push({ service: 'rdap_whois', error: error.message || 'Bulk RDAP lookup failed' });
    }

    return results;
  }

  async lookupDomain(domain) {
    const results = {
      domain,
      dns_records: null,
      whois: null,
      ssl_certificate: null,
      subdomains: null,
      paths: null,
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

        // DNS Records lookup
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

        // WHOIS (RDAP) lookup (free no api key bs)
        try {
          const rdapResponse = await this.client.get(`https://rdap.org/domain/${domain}`, {
            timeout: 10000,
            headers
          });
          if (rdapResponse.data) {
            results.whois = this.mapRdapToWhois(rdapResponse.data);
            results.success = true;
          }
        } catch (error) {
          console.log(`RDAP WHOIS lookup error for ${domain}:`, error.message);
          results.errors.push({
            service: 'rdap_whois',
            error: error.response?.data?.title || error.response?.statusText || error.message || 'RDAP WHOIS lookup failed'
          });
        }

        // SSL certificate lookup
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

      // subdomain discovery using crt.sh
      try {
        const subResponse = await this.findSubdomains(domain);
        results.subdomains = subResponse.subdomains;
        if (subResponse.success) {
          results.success = true;
        } else {
          subResponse.errors.forEach(err => results.errors.push(err));
        }
      } catch (error) {
        console.log(`Subdomain discovery error for ${domain}:`, error.message);
        results.errors.push({
          service: 'subdomains',
          error: error.message || 'Subdomain discovery failed'
        });
      }

      // Path discovery
      try {
        const pathResponse = await this.discoverPaths(domain);
        results.paths = pathResponse.paths;
        if (pathResponse.success) {
          results.success = true;
        } else {
          pathResponse.errors.forEach(err => results.errors.push(err));
        }
      } catch (error) {
        console.log(`Path discovery error for ${domain}:`, error.message);
        results.errors.push({
          service: 'paths',
          error: error.message || 'Path discovery failed'
        });
      }

      results.entities = this.extractEntities(results);

    } catch (error) {
      console.error(`Domain lookup error for ${domain}:`, error.message);
      results.errors.push({
        service: 'domain_service',
        error: error.message
      });
    }

    return results;
  }

  async findSubdomains(domain) {
    const subResults = {
      subdomains: [],
      success: false,
      errors: []
    };

    try {
      const response = await this.client.get(`https://crt.sh/?q=%25.${domain}&output=json`, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'osint-toolkit-Platform/1.0 (Subdomain Discovery)'
        }
      });

      if (response.data && Array.isArray(response.data)) {
        const subdomainsSet = new Set();
        response.data.forEach(cert => {
          if (cert.name_value) {
            const names = cert.name_value.split(/\s*\n\s*/g).map(name => name.trim()).filter(name => 
              name && name.toLowerCase().endsWith('.' + domain.toLowerCase()) && name !== domain
            );
            names.forEach(name => subdomainsSet.add(name.toLowerCase()));
          }
        });
        subResults.subdomains = Array.from(subdomainsSet).sort();
        subResults.success = subResults.subdomains.length > 0;
      } else {
        subResults.errors.push({
          service: 'crt_sh',
          error: 'Invalid response from crt.sh'
        });
      }
    } catch (error) {
      console.log(`crt.sh error for ${domain}:`, error.message);
      subResults.errors.push({
        service: 'crt_sh',
        error: error.response?.statusText || error.message || 'Failed to fetch subdomains'
      });
    }

    return subResults;
  }

  async discoverPaths(domain) {
    const pathResults = {
      paths: [],
      success: false,
      errors: []
    };

    try {
      const candidatePaths = new Set();

      // pull from sitemap(s)
      try {
        const sitemapPaths = await this.fetchSitemapPaths(domain);
        sitemapPaths.forEach(p => candidatePaths.add(p));
      } catch (e) {
        pathResults.errors.push({ service: 'sitemap', error: e.message || 'Failed to parse sitemap' });
      }

      // add common paths (keep)
      this.commonPaths.forEach(p => candidatePaths.add(p));

      // lightweight crawl from homepage (depth 1, dont wanna crawl too much)
      try {
        const crawled = await this.crawlSite(domain, 15, 1);
        crawled.forEach(p => candidatePaths.add(p));
      } catch (e) {
        pathResults.errors.push({ service: 'crawler', error: e.message || 'Crawl failed' });
      }

      // verify candidates with HEAD, love head
      const protocol = 'https://';
      const pathsToCheck = Array.from(candidatePaths)
        .map(p => (p && p.startsWith('/') ? p : `/${(p || '').replace(/^\/+/, '')}`))
        .slice(0, 75);

      const checks = pathsToCheck.map(async (p) => {
        const url = `${protocol}${domain}${p === '/' ? '' : p}`;
        try {
          const response = await this.client.head(url, {
            timeout: 5000,
            maxRedirects: 3,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; OSINT-Toolkit/1.0; +https://osint-toolkit.com)'
            }
          });
          return {
            path: p,
            status: response.status,
            size: response.headers['content-length'],
            headers: response.headers
          };
        } catch (error) {
          if (error.response) {
            const status = error.response.status;
            if (status !== 404 && status < 500) {
              return {
                path: p,
                status,
                error: error.response.statusText
              };
            }
          }
          return null;
        }
      });

      const discovered = (await Promise.all(checks)).filter(Boolean);
      pathResults.paths = discovered;
      pathResults.success = discovered.length > 0;
    } catch (error) {
      pathResults.errors.push({
        service: 'path_discovery',
        error: error.message
      });
    }

    return pathResults;
  }

  async fetchSitemapPaths(domain) {
    const protocolCandidates = ['https://', 'http://'];
    const seenSitemaps = new Set();
    const foundPaths = new Set();

    const pushSitemap = (url) => {
      try {
        const u = new URL(url);
        if (!seenSitemaps.has(u.href)) seenSitemaps.add(u.href);
      } catch (_) {
        // relative
        for (const proto of protocolCandidates) {
          const absolute = `${proto}${domain}/${url.replace(/^\//, '')}`;
          try {
            const u = new URL(absolute);
            if (!seenSitemaps.has(u.href)) seenSitemaps.add(u.href);
          } catch (_) {}
        }
      }
    };

    // from robots.txt
    for (const proto of protocolCandidates) {
      try {
        const robotsUrl = `${proto}${domain}/robots.txt`;
        const res = await this.client.get(robotsUrl, { timeout: 5000, responseType: 'text' });
        const text = typeof res.data === 'string' ? res.data : (res.data?.toString?.() || '');
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const m = line.match(/sitemap:\s*(\S+)/i);
          if (m && m[1]) pushSitemap(m[1].trim());
        }
        break;
      } catch (_) { /* try next proto */ }
    }

    // default common sitemap locations
    ['sitemap.xml', 'sitemap_index.xml', 'sitemap-index.xml'].forEach(rel => pushSitemap(`/${rel}`));

    // fetch up to a few sitemaps
    const maxSitemaps = 5;
    let fetched = 0;

    for (const sitemapUrl of Array.from(seenSitemaps)) {
      if (fetched >= maxSitemaps) break;
      fetched += 1;
      let xml = '';
      try {
        const resp = await this.client.get(sitemapUrl, { timeout: 7000, responseType: 'text' });
        xml = typeof resp.data === 'string' ? resp.data : (resp.data?.toString?.() || '');
      } catch (_) {
        continue;
      }

      // extract the <loc>...</loc>
      const locRegex = /<loc>([^<]+)<\/loc>/gi;
      let match;
      const urls = [];
      while ((match = locRegex.exec(xml)) !== null) {
        const loc = match[1].trim();
        urls.push(loc);
      }

      for (const u of urls) {
        try {
          const urlObj = new URL(u);
          // keep same host only
          if (urlObj.hostname === domain) {
            const path = urlObj.pathname || '/';
            foundPaths.add(path);
          }
        } catch (_) {
          // ignore malformed urls
        }
      }
    }

    return Array.from(foundPaths).slice(0, 200);
  }

  async crawlSite(domain, pageLimit = 15, depth = 1) {
    const protocolCandidates = ['https://', 'http://'];
    const visited = new Set();
    const queue = [];
    const foundPaths = new Set();

    // seed with homepage
    let homepageHtml = null;
    let baseProto = 'https://';
    for (const proto of protocolCandidates) {
      try {
        const resp = await this.client.get(`${proto}${domain}/`, {
          timeout: 7000,
          headers: { 'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8' }
        });
        homepageHtml = typeof resp.data === 'string' ? resp.data : (resp.data?.toString?.() || '');
        baseProto = proto;
        break;
      } catch (_) { /* try next protocol */ }
    }
    if (!homepageHtml) return [];

    queue.push({ url: `${baseProto}${domain}/`, html: homepageHtml, d: 0 });

    while (queue.length && visited.size < pageLimit) {
      const { url, html, d } = queue.shift();
      if (visited.has(url)) continue;
      visited.add(url);

      // extract links
      const hrefRegex = /href\s*=\s*["']([^"'#]+)["']/gi;
      let m;
      const links = [];
      while ((m = hrefRegex.exec(html)) !== null) {
        links.push(m[1]);
      }

      for (const link of links) {
        if (!link) continue;
        if (link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('javascript:')) continue;

        let abs;
        try {
          abs = new URL(link, url).href;
        } catch (_) { continue; }

        try {
          const u = new URL(abs);
          if (u.hostname !== domain) continue; // keep same host
          const path = u.pathname || '/';
          foundPaths.add(path);

          if (d + 1 <= depth && visited.size + queue.length < pageLimit) {
            // fetch next page lazily
            try {
              const resp = await this.client.get(u.href, {
                timeout: 5000,
                headers: { 'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8' }
              });
              const nextHtml = typeof resp.data === 'string' ? resp.data : (resp.data?.toString?.() || '');
              queue.push({ url: u.href, html: nextHtml, d: d + 1 });
            } catch (_) { /* ignore fetch errors */ }
          }
        } catch (_) {
          continue;
        }
      }
    }

    return Array.from(foundPaths);
  }

  // stringify SSL subject/issuer objects into a readable string. otherwise it would be a mess
  formatCertName(name) {
    if (!name) return 'Unknown';
    if (typeof name === 'string') return name;
    if (Array.isArray(name)) return name.join(', ');
    if (typeof name === 'object') {
      const cn = name.commonName || name.CN;
      const o = name.organizationName || name.O;
      const ou = name.organizationalUnitName || name.OU;
      const l = name.localityName || name.L;
      const st = name.stateOrProvinceName || name.ST;
      const c = name.countryName || name.C;
      const parts = [];
      if (cn) parts.push(`CN=${cn}`);
      if (o) parts.push(`O=${o}`);
      if (ou) parts.push(`OU=${ou}`);
      if (l) parts.push(`L=${l}`);
      if (st) parts.push(`ST=${st}`);
      if (c) parts.push(`C=${c}`);
      return parts.length ? parts.join(', ') : JSON.stringify(name);
    }
    return String(name);
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
          value: this.formatCertName(ssl.issuer),
          source: 'ssl_certificate',
          confidence: 1.0
        });
      }

      if (ssl.subject) {
        entities.push({
          type: 'ssl_subject',
          value: this.formatCertName(ssl.subject),
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

    // extract subdomains
    if (domainResults.subdomains && Array.isArray(domainResults.subdomains)) {
      domainResults.subdomains.forEach(subdomain => {
        entities.push({
          type: 'subdomain',
          value: subdomain,
          source: 'crt_sh',
          confidence: 0.95
        });
      });
    }

    // extract paths
    if (domainResults.paths && Array.isArray(domainResults.paths)) {
      domainResults.paths.forEach(p => {
        if (p.status === 200 || (p.status >= 300 && p.status < 400)) {
          entities.push({
            type: 'web_path',
            value: `https://${domainResults.domain}${p.path}`,
            source: 'path_discovery',
            confidence: 0.85
          });
        }
      });
    }

    return entities;
  }

  // map RDAP response into our normalized WHOIS shape used by the UI lol
  mapRdapToWhois(rdap) {
    const whois = {};

    // status
    if (Array.isArray(rdap.status)) {
      whois.domain_status = rdap.status.slice();
    }

    // Nameservers
    if (Array.isArray(rdap.nameservers)) {
      whois.name_servers = rdap.nameservers
        .map(ns => ns.ldhName || ns.unicodeName)
        .filter(Boolean);
    }

    // Dates from events
    if (Array.isArray(rdap.events)) {
      for (const ev of rdap.events) {
        if (ev.eventAction === 'registration') whois.creation_date = ev.eventDate;
        if (ev.eventAction === 'expiration') whois.expiration_date = ev.eventDate;
        if (ev.eventAction === 'last changed') whois.updated_date = ev.eventDate;
      }
    }

    // Registrar and registrant from entities
    if (Array.isArray(rdap.entities)) {
      for (const ent of rdap.entities) {
        if (Array.isArray(ent.roles)) {
          if (ent.roles.includes('registrar')) {
            whois.registrar_name = this.getVcardValue(ent.vcardArray, ['fn', 'org']) || ent.handle || whois.registrar_name;
            const iana = this.extractRegistrarIanaId(ent);
            if (iana) whois.registrar_iana_id = iana;
          }
          if (ent.roles.includes('registrant')) {
            const name = this.getVcardValue(ent.vcardArray, ['fn', 'n']);
            const org = this.getVcardValue(ent.vcardArray, ['org']);
            const email = this.getVcardValue(ent.vcardArray, ['email']);
            if (name) whois.registrant_name = name;
            if (org) whois.registrant_organization = org;
            if (email) whois.registrant_email = email;
          }
        }
      }
    }

    // DNSSEC
    if (rdap.secureDNS) {
      whois.dnssec = rdap.secureDNS.delegationSigned ? 'signed' : 'unsigned';
    }

    return whois;
  }

  getVcardValue(vcardArray, keys) {
    if (!vcardArray || !Array.isArray(vcardArray) || vcardArray.length < 2) return null;
    const props = vcardArray[1];
    for (const key of keys) {
      const row = props.find(p => Array.isArray(p) && p[0] === key);
      if (row) {
        // Typical vCard row format: [key, params, type, value]
        const value = row[3];
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return value.filter(Boolean).join(' ');
        if (typeof value === 'object') return JSON.stringify(value);
      }
    }
    return null;
  }

  extractRegistrarIanaId(entity) {
    if (!entity) return null;
    if (Array.isArray(entity.publicIds)) {
      const rec = entity.publicIds.find(p => p.type && p.type.toLowerCase().includes('iana'));
      if (rec && rec.identifier) return rec.identifier;
    }
    // Sometimes in vCard as "org" param id
    return null;
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
      // Still allow partial health based on RDAP even without RapidAPI :)
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

      // test RDAP WHOIS endpoint
      try {
        const rdapResponse = await this.client.get('https://rdap.org/domain/google.com', { timeout: 5000 });
        testResults.whois = !!rdapResponse.data?.ldhName;
      } catch (error) {
        console.log('RDAP health check failed:', error.message);
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
          message: 'All endpoints working (DNS, RDAP WHOIS, SSL)',
          endpoints: testResults
        };
      } else if (workingEndpoints > 0) {
        return { 
          status: 'partial', 
          message: `${workingEndpoints}/3 endpoints working`,
          endpoints: testResults
        };
      } else {
        return { 
          status: 'error', 
          message: 'No endpoints responding',
          endpoints: testResults
        };
      }
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

module.exports = new DomainService();
