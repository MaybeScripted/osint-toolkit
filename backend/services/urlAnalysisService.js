const axios = require('axios');
const { URL } = require('url');

class UrlAnalysisService {
  constructor() {
    this.virustotalApiKey = process.env.VIRUSTOTAL_API_KEY;
    this.googleSafeBrowsingApiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    this.unshortenItApiKey = process.env.UNSHORTEN_IT_API_KEY;
  }

  /**
   * Main URL checker function that like, checks all the things.
   */
  async analyzeUrl(url) {
    try {
      // validate and parse URL
      const parsedUrl = this.parseUrl(url);
      if (!parsedUrl) {
        return {
          success: false,
          error: 'Invalid URL format'
        };
      }

      const results = {
        success: true,
        data: {
          originalUrl: url,
          parsedUrl: parsedUrl,
          analysis: {},
          timestamp: new Date().toISOString()
        }
      };

      // running analyses in parallel for better performance (and also because we can)
      const [
        expansionResult,
        securityResult,
        domainResult,
        structureResult
      ] = await Promise.allSettled([
        this.expandUrl(url),
        this.analyzeSecurity(url),
        this.analyzeDomain(parsedUrl.hostname),
        this.analyzeUrlStructure(parsedUrl)
      ]);

      // this entire if sections is basically just checking if the result is successful and then setting the result to the data.analysis.expansion
      if (expansionResult.status === 'fulfilled' && expansionResult.value.success) {
        results.data.analysis.expansion = expansionResult.value.data;
      }

      if (securityResult.status === 'fulfilled' && securityResult.value.success) {
        results.data.analysis.security = securityResult.value.data;
      }

      if (domainResult.status === 'fulfilled' && domainResult.value.success) {
        results.data.analysis.domain = domainResult.value.data;
      }

      if (structureResult.status === 'fulfilled' && structureResult.value.success) {
        results.data.analysis.structure = structureResult.value.data;
      }

      // and finally, if its a webpage URL, analyze content
      if (this.isWebpageUrl(parsedUrl)) {
        const contentResult = await this.analyzePageContent(url);
        if (contentResult.success) {
          results.data.analysis.content = contentResult.data;
        }
      }

      return results;

    } catch (error) {
      console.error('URL analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse and validate URL
   */
  parseUrl(url) {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const parsed = new URL(url);
      return {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
        origin: parsed.origin,
        fullUrl: parsed.href
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Expand shortened URLs and follow redirects
   */
  async expandUrl(url) {
    try {
      const redirects = [];
      let currentUrl = url;
      let finalUrl = url;
      let redirectCount = 0;
      const maxRedirects = 10;

      while (redirectCount < maxRedirects) {
        try {
          const response = await axios.head(currentUrl, {
            maxRedirects: 0,
            timeout: 10000,
            validateStatus: (status) => status < 400 || status >= 300
          });

          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.location;
            if (location) {
              redirects.push({
                from: currentUrl,
                to: location,
                status: response.status,
                statusText: response.statusText
              });
              currentUrl = location;
              finalUrl = location;
              redirectCount++;
            } else {
              break;
            }
          } else {
            break;
          }
        } catch (error) {
          if (error.response && error.response.status >= 300 && error.response.status < 400) {
            const location = error.response.headers.location;
            if (location) {
              redirects.push({
                from: currentUrl,
                to: location,
                status: error.response.status,
                statusText: error.response.statusText
              });
              currentUrl = location;
              finalUrl = location;
              redirectCount++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }

      // try to unshorten. if the API is available.
      let unshortenResult = null;
      if (this.unshortenItApiKey) {
        try {
          const response = await axios.get(`https://unshorten.it/json/${encodeURIComponent(url)}`, {
            headers: { 'Authorization': `Bearer ${this.unshortenItApiKey}` },
            timeout: 10000
          });
          unshortenResult = response.data;
        } catch (error) {
          // Silently fail if API is not available
        }
      }

      return {
        success: true,
        data: {
          originalUrl: url,
          finalUrl: finalUrl,
          redirectCount: redirectCount,
          redirects: redirects,
          isShortened: redirectCount > 0,
          unshortenResult: unshortenResult
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze URL security using multiple services
   */
  async analyzeSecurity(url) {
    try {
      const results = {
        suspiciousPatterns: this.detectSuspiciousPatterns(url),
        phishingIndicators: this.detectPhishingIndicators(url),
        malwareCheck: null,
        safeBrowsingCheck: null
      };

      // VirusTotal check if API key is available
      if (this.virustotalApiKey) {
        try {
          const vtResult = await this.checkVirusTotal(url);
          results.malwareCheck = vtResult;
        } catch (error) {
          results.malwareCheck = { error: 'VirusTotal check failed' };
        }
      }

      // Google Safe Browsing check if API key is available
      if (this.googleSafeBrowsingApiKey) {
        try {
          const sbResult = await this.checkSafeBrowsing(url);
          results.safeBrowsingCheck = sbResult;
        } catch (error) {
          results.safeBrowsingCheck = { error: 'Safe Browsing check failed' };
        }
      }

      // Calculate overall security score
      results.securityScore = this.calculateSecurityScore(results);

      return {
        success: true,
        data: results
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect suspicious patterns in URL
   */
  detectSuspiciousPatterns(url) {
    const patterns = {
      suspiciousSubdomains: [],
      suspiciousPaths: [],
      suspiciousParams: [],
      suspiciousTlds: [],
      overallScore: 0
    };

    const urlLower = url.toLowerCase();
    const parsedUrl = this.parseUrl(url);

    // Check for suspicious subdomains
    const suspiciousSubdomains = [
      'secure-', 'ssl-', 'login-', 'account-', 'verify-', 'update-', 'confirm-',
      'support-', 'help-', 'service-', 'admin-', 'portal-', 'dashboard-'
    ];

    suspiciousSubdomains.forEach(subdomain => {
      if (parsedUrl.hostname.includes(subdomain)) {
        patterns.suspiciousSubdomains.push(subdomain);
      }
    });

    // Check for suspicious paths
    const suspiciousPaths = [
      '/login', '/signin', '/account', '/verify', '/confirm', '/update',
      '/secure', '/admin', '/dashboard', '/portal'
    ];

    suspiciousPaths.forEach(path => {
      if (parsedUrl.pathname.includes(path)) {
        patterns.suspiciousPaths.push(path);
      }
    });

    // Check for suspicious parameters
    const suspiciousParams = [
      'password', 'pass', 'pwd', 'login', 'user', 'username', 'email',
      'token', 'key', 'secret', 'auth', 'session', 'cookie'
    ];

    if (parsedUrl.search) {
      const params = new URLSearchParams(parsedUrl.search);
      params.forEach((value, key) => {
        if (suspiciousParams.some(param => key.toLowerCase().includes(param))) {
          patterns.suspiciousParams.push({ key, value: value.substring(0, 10) + '...' });
        }
      });
    }

    // Check for suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.click', '.download'];
    suspiciousTlds.forEach(tld => {
      if (parsedUrl.hostname.endsWith(tld)) {
        patterns.suspiciousTlds.push(tld);
      }
    });

    // Calculate overall suspicious score
    patterns.overallScore = 
      patterns.suspiciousSubdomains.length * 2 +
      patterns.suspiciousPaths.length * 1 +
      patterns.suspiciousParams.length * 3 +
      patterns.suspiciousTlds.length * 2;

    return patterns;
  }

  /**
   * Detect phishing indicators
   */
  detectPhishingIndicators(url) {
    const indicators = {
      homographAttack: false,
      suspiciousDomain: false,
      suspiciousPath: false,
      overallScore: 0
    };

    const parsedUrl = this.parseUrl(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    // Whitelist common legitimate domains to reduce false positives
    const legitimateDomains = [
      'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
      'reddit.com', 'twitter.com', 'linkedin.com', 'facebook.com',
      'youtube.com', 'google.com', 'microsoft.com', 'apple.com',
      'amazon.com', 'netflix.com', 'spotify.com', 'discord.com',
      'slack.com', 'zoom.us', 'dropbox.com', 'onedrive.com',
      'medium.com', 'dev.to', 'hashnode.com', 'substack.com'
    ];

    // Skip phishing detection for known legitimate domains
    if (legitimateDomains.some(domain => hostname.includes(domain))) {
      return indicators;
    }

    // Check for homograph attacks (mixed scripts)
    const hasMixedScripts = /[^\x00-\x7F]/.test(hostname);
    indicators.homographAttack = hasMixedScripts;

    // Check for suspicious domain patterns
    const suspiciousPatterns = [
      /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses
      /[a-z0-9]{20,}/, // Very long random strings (20+ chars)
      /[a-z]{4,}[0-9]{4,}[a-z]{4,}/, // Mixed letters and numbers with strict pattern
      /^[a-z0-9]{25,}$/, // Very long single-word domains
      /[a-f0-9]{32,}/, // MD5-like hashes
      /[0-9]{10,}/, // Long numeric sequences
      /[a-z]{2,}[0-9]{2,}[a-z]{2,}[0-9]{2,}/ // Complex mixed patterns
    ];

    // Additional check for domains that look like they're trying to mimic legitimate sites
    const mimicPatterns = [
      /[a-z]+[0-9]+[a-z]+\.(com|org|net|co|io)$/, // Mixed alphanumeric with common TLDs
      /[a-z]{1,3}[0-9]{3,}[a-z]{1,3}\.(com|org|net)$/, // Short letters + numbers + short letters
    ];

    indicators.suspiciousDomain = suspiciousPatterns.some(pattern => pattern.test(hostname)) ||
                                  mimicPatterns.some(pattern => pattern.test(hostname));

    // Check for suspicious paths
    const suspiciousPathPatterns = [
      /\/[a-z0-9]{25,}/, // Very long random paths (25+ chars)
      /\/[0-9]{12,}/, // Very long numeric paths (12+ digits)
      /\/[a-z]{4,}[0-9]{4,}[a-z]{4,}/, // Mixed path patterns with more strict requirements
      /\/[a-f0-9]{32,}/ // MD5-like hashes or very long hex strings
    ];

    indicators.suspiciousPath = suspiciousPathPatterns.some(pattern => pattern.test(parsedUrl.pathname));

    // Calculate overall phishing score
    indicators.overallScore = 
      (indicators.homographAttack ? 5 : 0) +
      (indicators.suspiciousDomain ? 3 : 0) +
      (indicators.suspiciousPath ? 2 : 0);

    return indicators;
  }

  /**
   * Check URL against VirusTotal
   */
  async checkVirusTotal(url) {
    try {
      const response = await axios.post('https://www.virustotal.com/vtapi/v2/url/report', {
        apikey: this.virustotalApiKey,
        resource: url
      }, {
        timeout: 10000
      });

      return {
        detected: response.data.positives > 0,
        positives: response.data.positives,
        total: response.data.total,
        scanDate: response.data.scan_date,
        permalink: response.data.permalink
      };
    } catch (error) {
      throw new Error('VirusTotal API error: ' + error.message);
    }
  }

  /**
   * Check URL against Google Safe Browsing
   */
  async checkSafeBrowsing(url) {
    try {
      const response = await axios.post(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${this.googleSafeBrowsingApiKey}`, {
        client: {
          clientId: "osint-toolkit",
          clientVersion: "1.0.0"
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url: url }]
        }
      }, {
        timeout: 10000
      });

      return {
        hasThreats: response.data.matches && response.data.matches.length > 0,
        threats: response.data.matches || []
      };
    } catch (error) {
      throw new Error('Safe Browsing API error: ' + error.message);
    }
  }

  /**
   * Calculate overall security score
   */
  calculateSecurityScore(results) {
    let score = 100; // Start with perfect score

    // Deduct points for suspicious patterns
    score -= results.suspiciousPatterns.overallScore * 5;

    // Deduct points for phishing indicators
    score -= results.phishingIndicators.overallScore * 3;

    // Deduct points for malware detection
    if (results.malwareCheck && results.malwareCheck.detected) {
      score -= 50;
    }

    // Deduct points for safe browsing threats
    if (results.safeBrowsingCheck && results.safeBrowsingCheck.hasThreats) {
      score -= 40;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze domain information
   */
  async analyzeDomain(hostname) {
    try {
      const results = {
        hostname: hostname,
        isIp: this.isIpAddress(hostname),
        tld: this.extractTld(hostname),
        subdomain: this.extractSubdomain(hostname),
        domain: this.extractDomain(hostname),
        dnsRecords: null,
        whoisData: null
      };

      // Get DNS records
      try {
        const dnsResult = await this.getDnsRecords(hostname);
        results.dnsRecords = dnsResult;
      } catch (error) {
        results.dnsRecords = { error: 'DNS lookup failed' };
      }

      // Get WHOIS data (using existing domain service)
      try {
        const DomainService = require('./domainService');
        const whoisResult = await DomainService.lookupDomain(hostname);
        if (whoisResult.success) {
          results.whoisData = whoisResult.data;
        }
      } catch (error) {
        results.whoisData = { error: 'WHOIS lookup failed' };
      }

      return {
        success: true,
        data: results
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get DNS records for domain
   */
  async getDnsRecords(hostname) {
    try {
      const dns = require('dns').promises;
      const records = {};

      // Get A records
      try {
        records.a = await dns.resolve4(hostname);
      } catch (error) {
        records.a = [];
      }

      // Get AAAA records
      try {
        records.aaaa = await dns.resolve6(hostname);
      } catch (error) {
        records.aaaa = [];
      }

      // Get MX records
      try {
        records.mx = await dns.resolveMx(hostname);
      } catch (error) {
        records.mx = [];
      }

      // Get TXT records
      try {
        records.txt = await dns.resolveTxt(hostname);
      } catch (error) {
        records.txt = [];
      }

      return records;
    } catch (error) {
      throw new Error('DNS lookup failed: ' + error.message);
    }
  }

  /**
   * Analyze URL structure
   */
  analyzeUrlStructure(parsedUrl) {
    try {
      const structure = {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        pathname: parsedUrl.pathname,
        search: parsedUrl.search,
        hash: parsedUrl.hash,
        parameters: {},
        fragments: parsedUrl.hash ? parsedUrl.hash.substring(1) : null,
        pathSegments: parsedUrl.pathname.split('/').filter(segment => segment.length > 0),
        isHttps: parsedUrl.protocol === 'https:',
        isStandardPort: this.isStandardPort(parsedUrl.protocol, parsedUrl.port),
        hasParameters: parsedUrl.search.length > 0,
        hasFragments: parsedUrl.hash.length > 0
      };

      // Parse query parameters
      if (parsedUrl.search) {
        const params = new URLSearchParams(parsedUrl.search);
        params.forEach((value, key) => {
          structure.parameters[key] = value;
        });
      }

      return {
        success: true,
        data: structure
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze page content for links and metadata
   */
  async analyzePageContent(url) {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const html = response.data;
      const links = this.extractLinks(html, url);
      const metadata = this.extractMetadata(html);

      return {
        success: true,
        data: {
          title: metadata.title,
          description: metadata.description,
          keywords: metadata.keywords,
          links: links,
          linkCount: links.length,
          internalLinks: links.filter(link => link.isInternal).length,
          externalLinks: links.filter(link => !link.isInternal).length,
          dofollowLinks: links.filter(link => link.rel !== 'nofollow').length,
          nofollowLinks: links.filter(link => link.rel === 'nofollow').length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract links from HTML content
   */
  extractLinks(html, baseUrl) {
    const links = [];
    const baseDomain = new URL(baseUrl).hostname;
    
    // Simple regex to find links (in production, use a proper HTML parser)
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const text = match[2].replace(/<[^>]*>/g, '').trim();
      
      try {
        const fullUrl = new URL(href, baseUrl).href;
        const linkDomain = new URL(fullUrl).hostname;
        
        links.push({
          url: fullUrl,
          text: text,
          isInternal: linkDomain === baseDomain,
          rel: this.extractRelAttribute(match[0]),
          domain: linkDomain
        });
      } catch (error) {
        // Skip invalid URLs
      }
    }

    return links;
  }

  /**
   * Extract rel attribute from link tag
   */
  extractRelAttribute(linkTag) {
    const relMatch = linkTag.match(/rel=["']([^"']+)["']/i);
    return relMatch ? relMatch[1] : null;
  }

  /**
   * Extract metadata from HTML
   */
  extractMetadata(html) {
    const metadata = {
      title: '',
      description: '',
      keywords: ''
    };

    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }

    // Extract keywords
    const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1].trim();
    }

    return metadata;
  }

  /**
   * Check if URL is a webpage (not a file)
   */
  isWebpageUrl(parsedUrl) {
    const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.7z', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mp3', '.avi', '.mov'];
    const pathname = parsedUrl.pathname.toLowerCase();
    return !fileExtensions.some(ext => pathname.endsWith(ext));
  }

  /**
   * Check if string is an IP address
   */
  isIpAddress(str) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(str) || ipv6Regex.test(str);
  }

  /**
   * Extract TLD from hostname
   */
  extractTld(hostname) {
    const parts = hostname.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Extract subdomain from hostname
   */
  extractSubdomain(hostname) {
    const parts = hostname.split('.');
    return parts.length > 2 ? parts.slice(0, -2).join('.') : '';
  }

  /**
   * Extract domain from hostname
   */
  extractDomain(hostname) {
    const parts = hostname.split('.');
    return parts.length > 1 ? parts.slice(-2).join('.') : hostname;
  }

  /**
   * Check if port is standard for protocol
   */
  isStandardPort(protocol, port) {
    const standardPorts = {
      'http:': '80',
      'https:': '443',
      'ftp:': '21',
      'ssh:': '22'
    };
    return standardPorts[protocol] === port;
  }

  /**
   * Health check for URL analysis service
   */
  async healthCheck() {
    try {
      const testUrl = 'https://example.com';
      const result = await this.analyzeUrl(testUrl);
      
      return {
        status: 'healthy',
        services: {
          urlParsing: 'available',
          urlExpansion: 'available',
          securityAnalysis: 'available',
          domainAnalysis: 'available',
          contentAnalysis: 'available'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new UrlAnalysisService();
