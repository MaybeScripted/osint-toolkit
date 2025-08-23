class EmailAnalysisService {
  constructor() {
    // Common email providers and their characteristics
    this.providers = {
      // Personal providers
      'gmail.com': { type: 'personal', provider: 'Google', security: 'high', popularity: 'very_high' },
      'outlook.com': { type: 'personal', provider: 'Microsoft', security: 'high', popularity: 'high' },
      'hotmail.com': { type: 'personal', provider: 'Microsoft', security: 'medium', popularity: 'high' },
      'yahoo.com': { type: 'personal', provider: 'Yahoo', security: 'medium', popularity: 'high' },
      'icloud.com': { type: 'personal', provider: 'Apple', security: 'high', popularity: 'medium' },
      'protonmail.com': { type: 'personal', provider: 'ProtonMail', security: 'very_high', popularity: 'low', privacy_focused: true },
      'tutanota.com': { type: 'personal', provider: 'Tutanota', security: 'very_high', popularity: 'low', privacy_focused: true },
      
      // Business providers
      'amazon.com': { type: 'business', provider: 'Amazon', security: 'high', industry: 'technology' },
      'microsoft.com': { type: 'business', provider: 'Microsoft', security: 'high', industry: 'technology' },
      'google.com': { type: 'business', provider: 'Google', security: 'high', industry: 'technology' },
      'apple.com': { type: 'business', provider: 'Apple', security: 'high', industry: 'technology' },
      'facebook.com': { type: 'business', provider: 'Meta', security: 'high', industry: 'technology' },
      'tesla.com': { type: 'business', provider: 'Tesla', security: 'high', industry: 'automotive' },
      'stripe.com': { type: 'business', provider: 'Stripe', security: 'high', industry: 'fintech' },
      
      // Educational
      'edu': { type: 'educational', security: 'medium', note: 'Educational institution' },
      'ac.uk': { type: 'educational', security: 'medium', note: 'UK Educational institution' }
    };

    // Patterns to catch usernames that look fake, spammy, or throwaway
    this.suspiciousPatterns = [
      /^[a-z]{1,3}[0-9]{3,}$/,
      /^[0-9]+$/,
      /^.{1,3}$/,
      /test|fake|temp|throw|spam|junk|dummy/i,
      /^(no|not)reply/i,
      /^[a-z]{8,}[0-9]{8,}$/
    ];

    // Common disposable email domains
    this.disposableDomains = [
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'tempmail.org',
      'throwaway.email',
      'temp-mail.org',
      'yopmail.com',
      'maildrop.cc'
    ];
  }

  analyzeEmail(email) {
    const [username, domain] = email.toLowerCase().split('@');
    
    const analysis = {
      email: email,
      username: username,
      domain: domain,
      usernameAnalysis: this.analyzeUsername(username),
      domainAnalysis: this.analyzeDomain(domain),
      riskAssessment: {},
      insights: []
    };

    analysis.riskAssessment = this.calculateRiskAssessment(analysis);
    analysis.insights = this.generateInsights(analysis);

    return analysis;
  }

  analyzeUsername(username) {
    const analysis = {
      length: username.length,
      hasNumbers: /\d/.test(username),
      hasSpecialChars: /[._-]/.test(username),
      isNumericOnly: /^\d+$/.test(username),
      pattern: this.detectUsernamePattern(username),
      suspiciousScore: this.calculateUsernameSuspiciousScore(username)
    };

    return analysis;
  }

  analyzeDomain(domain) {
    const analysis = {
      domain: domain,
      tld: this.extractTLD(domain),
      isCustomDomain: !this.providers[domain] && !domain.endsWith('.edu') && !domain.endsWith('.gov'),
      isDisposable: this.disposableDomains.includes(domain),
      providerInfo: this.providers[domain] || null,
      domainAge: null,
      reputation: this.getDomainReputation(domain)
    };

    // educational domains
    if (domain.endsWith('.edu') || domain.endsWith('.ac.uk') || domain.endsWith('.edu.au')) {
      analysis.type = 'educational';
      analysis.providerInfo = { type: 'educational', security: 'medium' };
    }

    // government domains
    if (domain.endsWith('.gov') || domain.endsWith('.mil')) {
      analysis.type = 'government';
      analysis.providerInfo = { type: 'government', security: 'very_high' };
    }

    return analysis;
  }

  detectUsernamePattern(username) {
    if (/^[a-zA-Z]+[0-9]+$/.test(username)) return 'name_numbers';
    if (/^[a-zA-Z]+\.[a-zA-Z]+$/.test(username)) return 'firstname_lastname';
    if (/^[a-zA-Z]\.[a-zA-Z]+$/.test(username)) return 'initial_lastname';
    if (/^[a-zA-Z]+_[a-zA-Z]+$/.test(username)) return 'name_underscore';
    if (/^[a-zA-Z]+$/.test(username)) return 'letters_only';
    if (/^\d+$/.test(username)) return 'numbers_only';
    return 'mixed_pattern';
  }

  // scores username "sus" level based on sketchy patterns, length, all-numbers, and gibberish vibes (max 100)
  calculateUsernameSuspiciousScore(username) {
    let score = 0;

    this.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(username)) score += 20;
    });

    if (username.length <= 3) score += 15;
    if (/^\d+$/.test(username)) score += 25;
    if (username.length > 8 && !/[aeiou]/i.test(username)) score += 10;

    return Math.min(score, 100);
  }

  extractTLD(domain) {
    const parts = domain.split('.');
    return parts[parts.length - 1];
  }

  getDomainReputation(domain) {
    if (this.providers[domain]) {
      return this.providers[domain].security || 'medium';
    }
    
    if (this.disposableDomains.includes(domain)) {
      return 'very_low';
    }

    // suspicious TLDs
    const suspiciousTLDs = ['tk', 'ml', 'ga', 'cf'];
    const tld = this.extractTLD(domain);
    if (suspiciousTLDs.includes(tld)) {
      return 'low';
    }

    return 'unknown';
  }

  calculateRiskAssessment(analysis) {
    let riskScore = 0;
    const factors = [];

    // username risk factors
    if (analysis.usernameAnalysis.suspiciousScore > 50) {
      riskScore += 30;
      factors.push('Suspicious username pattern');
    }

    // domain risk factors
    if (analysis.domainAnalysis.isDisposable) {
      riskScore += 40;
      factors.push('Disposable email domain');
    }

    if (analysis.domainAnalysis.reputation === 'very_low') {
      riskScore += 35;
      factors.push('Low reputation domain');
    }

    // provider risk factors
    if (analysis.domainAnalysis.providerInfo?.security === 'low') {
      riskScore += 15;
      factors.push('Low security email provider');
    }

    return {
      score: Math.min(riskScore, 100),
      level: this.getRiskLevel(riskScore),
      factors: factors
    };
  }

  getRiskLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'very_low';
  }

  generateInsights(analysis) {
    const insights = [];

    // provider insights
    if (analysis.domainAnalysis.providerInfo) {
      const provider = analysis.domainAnalysis.providerInfo;
      if (provider.type === 'personal') {
        insights.push(`Personal email account (${provider.provider})`);
      } else if (provider.type === 'business') {
        insights.push(`Business email account (${provider.provider})`);
        if (provider.industry) {
          insights.push(`Industry: ${provider.industry}`);
        }
      }

      if (provider.privacy_focused) {
        insights.push('Privacy-focused email provider');
      }
    }

    if (analysis.domainAnalysis.isCustomDomain) {
      insights.push('Uses custom domain (likely business or professional)');
    }

    // username pattern insights
    switch (analysis.usernameAnalysis.pattern) {
      case 'firstname_lastname':
        insights.push('Username follows firstname.lastname pattern');
        break;
      case 'initial_lastname':
        insights.push('Username follows initial.lastname pattern');
        break;
      case 'name_numbers':
        insights.push('Username combines name with numbers');
        break;
      case 'numbers_only':
        insights.push('Username is numbers only (potentially automated)');
        break;
    }

    // security insight thing
    if (analysis.domainAnalysis.providerInfo?.security === 'very_high') {
      insights.push('High security email provider');
    }

    // risk insights
    if (analysis.riskAssessment.level === 'high') {
      insights.push('⚠️ High risk email - review carefully');
    } else if (analysis.riskAssessment.level === 'very_low') {
      insights.push('✅ Low risk email');
    }

    return insights;
  }

  // get potential usernames for social media correlation
  extractPotentialUsernames(email) {
    const [username, domain] = email.split('@');
    const potentialUsernames = [username];

    // parts if separated by dots or underscores
    if (username.includes('.')) {
      const parts = username.split('.');
      potentialUsernames.push(...parts);
      
      if (parts.length === 2) {
        potentialUsernames.push(parts.join(''));
        potentialUsernames.push(parts.join('_'));
      }
    }

    if (username.includes('_')) {
      const parts = username.split('_');
      potentialUsernames.push(...parts);
      
      if (parts.length === 2) {
        potentialUsernames.push(parts.join(''));
        potentialUsernames.push(parts.join('.'));
      }
    }

    // remove numbers for name-based searches
    const withoutNumbers = username.replace(/\d+$/, '');
    if (withoutNumbers !== username && withoutNumbers.length > 2) {
      potentialUsernames.push(withoutNumbers);
    }

    // unique usernames only lol
    return [...new Set(potentialUsernames)].filter(u => u.length > 2);
  }
}

module.exports = new EmailAnalysisService();
