const EmailService = require('./emailService');
const IpService = require('./ipService');
const SherlockService = require('./sherlockService');
const HunterService = require('./hunterService');
const DomainService = require('./domainService');

class FreeApiService {
  constructor() {
    this.services = {
      email: EmailService,
      ip: IpService,
      username: SherlockService,
      hunter: HunterService
    };
  }

  async performLookup(type, value) {
    try {
      let result;
      let entities = [];

      switch (type) {
        case 'email':
          if (!EmailService.isValidEmail(value)) {
            throw new Error('Invalid email format');
          }
          result = await EmailService.lookupEmail(value);
          entities = EmailService.extractEntities(result);
          break;

        case 'ip':
          if (!IpService.isValidIP(value)) {
            throw new Error('Invalid IP format');
          }
          if (IpService.isPrivateIP(value)) {
            // skipping private IP's
            return {
              success: false,
              error: 'Private IP addresses are not looked up',
              data: null,
              entities: []
            };
          }
          result = await IpService.lookupIP(value);
          entities = IpService.extractEntities(result);
          break;

        case 'username':
          if (!SherlockService.isValidUsername(value)) {
            throw new Error('Invalid username format');
          }
          result = await SherlockService.lookupUsername(value);
          entities = SherlockService.extractEntities(result);
          break;



        case 'domain':
          if (!DomainService.isValidDomain(value)) {
            throw new Error('Invalid domain format');
          }
          if (!DomainService.isConfigured()) {
            throw new Error('Domain service not configured (RapidAPI key required)');
          }
          result = await DomainService.lookupDomain(value);
          entities = DomainService.extractEntities(result);
          break;

        default:
          throw new Error(`Unsupported lookup type: ${type}`);
      }

      return {
        success: result.success,
        data: result,
        entities: entities,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ ${type} lookup failed for ${value}:`, error.message);
      return {
        success: false,
        error: error.message,
        data: null,
        entities: [],
        timestamp: new Date().toISOString()
      };
    }
  }







  // get search strategies for different entity types
  getSearchStrategies(entityType, value) {
    const strategies = [];

    switch (entityType) {
      case 'email':
        strategies.push(
          { service: 'email', type: 'email', priority: 1 }
        );
        break;

      case 'username':
        strategies.push(
          { service: 'username', type: 'username', priority: 1 }
        );
        break;

      case 'ip':
        strategies.push(
          { service: 'ip', type: 'ip', priority: 1 }
        );
        break;

      case 'domain':
        strategies.push(
          { service: 'domain', type: 'domain', priority: 1 }
        );
        break;



      // handle derived entity types
      case 'social_profile_url':
      case 'social_platform':
        const username = this.extractUsernameFromUrl(value);
        if (username) {
          strategies.push(
            { service: 'username', type: 'username', priority: 2, value: username }
          );
        }
        break;

      case 'potential_username':
      case 'username':
        strategies.push(
          { service: 'username', type: 'username', priority: 2 }
        );
        break;

      default:
        // for unknown types, try to infer the search type
        if (EmailService.isValidEmail(value)) {
          strategies.push({ service: 'email', type: 'email', priority: 3 });
        } else if (IpService.isValidIP(value)) {
          strategies.push({ service: 'ip', type: 'ip', priority: 3 });
        } else if (DomainService.isValidDomain(value)) {
          strategies.push({ service: 'domain', type: 'domain', priority: 3 });
        } else if (SherlockService.isValidUsername(value)) {
          strategies.push({ service: 'username', type: 'username', priority: 3 });
        }
    }

    return strategies;
  }

  extractUsernameFromUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      
      // grab username from social URLs
      // (think of shit like: /username, /user/username, /profile/username, /username/profile)
      const patterns = [
        /^\/([^\/]+)\/?$/,              // /username
        /^\/user\/([^\/]+)\/?$/,        // /user/username
        /^\/profile\/([^\/]+)\/?$/,     // /profile/username
        /^\/([^\/]+)\/profile\/?$/,     // /username/profile
      ];

      for (const pattern of patterns) {
        const match = pathname.match(pattern);
        if (match && match[1] && SherlockService.isValidUsername(match[1])) {
          return match[1];
        }
      }
    } catch (e) {
      // invalid URL, just return null :)
    }

    return null;
  }

  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    try {
      await SherlockService.checkSherlockStatus();
      health.services.sherlock = { status: 'healthy' };
    } catch (error) {
      health.services.sherlock = { 
        status: 'unhealthy', 
        error: error.message 
      };
    }

    try {
      const hunterHealth = await HunterService.healthCheck();
      health.services.hunter = hunterHealth;
    } catch (error) {
      health.services.hunter = { 
        status: 'error', 
        message: error.message 
      };
    }

    if (DomainService.isConfigured()) {
      try {
        const domainHealth = await DomainService.healthCheck();
        health.services.domain = domainHealth;
      } catch (error) {
        health.services.domain = { 
          status: 'error', 
          message: error.message 
        };
      }
    } else {
      health.services.domain = { 
        status: 'not_configured', 
        message: 'RapidAPI key not configured' 
      };
    }

    // other services are HTTP-based and don't need health checks
    health.services.email = { status: 'available' };
    health.services.ip = { status: 'available' };

    return health;
  }
}

module.exports = new FreeApiService();
