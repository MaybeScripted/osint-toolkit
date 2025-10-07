const express = require('express');
const FreeApiService = require('../services/freeApiService');
const EasyIdService = require('../services/easyIdService');
const { validationMiddleware } = require('../middleware/validation');

const router = express.Router();

// GET /lookup/email/:email
router.get('/email/:email', validationMiddleware('email'), async (req, res) => {
  try {
    const { email } = req.params;
    
    // email lookup request
    
    const result = await FreeApiService.performLookup('email', email);
    
    res.json({
      success: result.success,
      data: result.data,
      entities: result.entities,
      timestamp: result.timestamp,
      ...(result.error && { error: result.error })
    });

  } catch (error) {
    console.error('Email lookup error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Email lookup failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/ip/:ip
router.get('/ip/:ip', validationMiddleware('ip'), async (req, res) => {
  try {
    const { ip } = req.params;
    
    // ip lookup request
    
    const result = await FreeApiService.performLookup('ip', ip);
    
    res.json({
      success: result.success,
      data: result.data,
      entities: result.entities,
      timestamp: result.timestamp,
      ...(result.error && { error: result.error })
    });

  } catch (error) {
    console.error('IP lookup error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'IP lookup failed',
        details: error.message
      }
    });
  }
});



// GET /lookup/domain/:domain  
router.get('/domain/:domain', validationMiddleware('domain'), async (req, res) => {
  try {
    const { domain } = req.params;
    
    // Domain lookup request
    
    const result = await FreeApiService.performLookup('domain', domain);
    
    res.json({
      success: result.success,
      data: result.data,
      entities: result.entities,
      timestamp: result.timestamp,
      ...(result.error && { error: result.error })
    });

  } catch (error) {
    console.error('Domain lookup error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Domain lookup failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/username/:username
router.get('/username/:username', validationMiddleware('username'), async (req, res) => {
  try {
    const { username } = req.params;
    
    // username lookup request
    
    const result = await FreeApiService.performLookup('username', username);
    
    res.json({
      success: result.success,
      data: result.data,
      entities: result.entities,
      timestamp: result.timestamp,
      ...(result.error && { error: result.error })
    });

  } catch (error) {
    console.error('Username lookup error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Username lookup failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/username/:username/stream - server-Sent events streaming endpoint
router.get('/username/:username/stream', validationMiddleware('username'), async (req, res) => {
  try {
    const { username } = req.params;
    
    // set the sse headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Starting username search...' })}\n\n`);

    // import SherlockService here to avoid stupid circular dependencies
    const SherlockService = require('../services/sherlockService');

    // Handle client disconnect
    req.on('close', () => {
      console.log(`Client disconnected for username: ${username}`);
      // Stop the search process when client disconnects
      SherlockService.stopUsernameSearch(username);
    });

    // start streaming search
    await SherlockService.lookupUsernameStream(
      username,
      // onResult callback
      (result) => {
        const eventData = {
          type: 'result',
          data: result,
          timestamp: new Date().toISOString()
        };
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
      },
      // onError callback
      (error) => {
        const eventData = {
          type: 'error',
          error: {
            message: error.message,
            details: error.stack
          },
          timestamp: new Date().toISOString()
        };
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
        res.end();
      },
      // onComplete callback
      (finalResult) => {
        const eventData = {
          type: 'complete',
          data: finalResult,
          timestamp: new Date().toISOString()
        };
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
        res.end();
      }
    );

  } catch (error) {
    console.error('Streaming username lookup error:', error);
    const eventData = {
      type: 'error',
      error: {
        message: 'Failed to start streaming search',
        details: error.message
      },
      timestamp: new Date().toISOString()
    };
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    res.end();
  }
});

// POST /lookup/username/:username/stop - Stop an active username search
router.post('/username/:username/stop', validationMiddleware('username'), async (req, res) => {
  try {
    const { username } = req.params;
    
    // Import SherlockService here to avoid circular dependencies
    const SherlockService = require('../services/sherlockService');
    
    const stopped = SherlockService.stopUsernameSearch(username);
    
    if (stopped) {
      res.json({
        success: true,
        message: `Search for username '${username}' has been stopped`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        message: `No active search found for username '${username}'`,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Stop username search error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to stop search',
        details: error.message
      }
    });
  }
});

// GET /lookup/health
router.get('/health', async (req, res) => {
  try {
    const health = await FreeApiService.healthCheck();
    
    const overallHealthy = Object.values(health.services).every(
      service => service.status === 'healthy' || service.status === 'available'
    );
    
    res.status(overallHealthy ? 200 : 503).json({
      success: overallHealthy,
      ...health
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Health check failed',
        details: error.message
      }
    });
  }
});

// POST /lookup/batch
router.post('/batch', async (req, res) => {
  try {
    const { lookups } = req.body;
    
    if (!lookups || !Array.isArray(lookups)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'lookups must be an array of {type, value} objects'
        }
      });
    }

    // batch lookup request
    
    const results = [];
    
    // process lookups sequentially to respect rate limits
    for (const lookup of lookups) {
      if (!lookup.type || !lookup.value) {
        results.push({
          success: false,
          error: 'Missing type or value',
          lookup: lookup
        });
        continue;
      }
      
      const result = await FreeApiService.performLookup(lookup.type, lookup.value);
      results.push({
        ...result,
        lookup: lookup
      });
      
      // small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    res.json({
      success: true,
      results: results,
      total: results.length,
      successful: results.filter(r => r.success).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch lookup error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Batch lookup failed',
        details: error.message
      }
    });
  }
});

// Hunter.io specific endpoints
const HunterService = require('../services/hunterService');

// GET /lookup/hunter/verify/:email
router.get('/hunter/verify/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!HunterService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Hunter.io API key not configured'
        }
      });
    }
    
    const result = await HunterService.verifyEmail(email);
    
    res.json({
      success: result.success,
      data: result.data,
      timestamp: new Date().toISOString(),
      ...(result.error && { error: { message: result.error } })
    });

  } catch (error) {
    console.error('Hunter email verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Email verification failed',
        details: error.message
      }
    });
  }
});

// POST /lookup/domain/bulk
router.post('/domain/bulk', async (req, res) => {
  try {
    const { domains } = req.body;
    
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'domains array is required and must not be empty'
        }
      });
    }

    // Validate domains
    const validDomains = domains.filter(domain => {
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
      return domainRegex.test(domain.trim());
    });

    if (validDomains.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No valid domains provided'
        }
      });
    }

    const DomainService = require('../services/domainService');
    const result = await DomainService.lookupBulkDomains(validDomains);
    
    res.json({
      success: result.success,
      data: result.whois,
      domains: result.domains,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bulk domain lookup error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Bulk domain lookup failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/hunter/domain/:domain
router.get('/hunter/domain/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const { limit = 25 } = req.query;
    
    if (!HunterService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Hunter.io API key not configured'
        }
      });
    }
    
    const domainResult = await HunterService.searchDomain(domain, parseInt(limit));
    const companyResult = await HunterService.findCompany(domain);
    
    res.json({
      success: domainResult.success || companyResult.success,
      data: {
        domain_search: domainResult.success ? domainResult.data : null,
        company: companyResult.success ? companyResult.data : null
      },
      timestamp: new Date().toISOString(),
      ...(domainResult.error && { error: { message: domainResult.error } })
    });

  } catch (error) {
    console.error('Hunter domain search error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Domain search failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/hunter/person/:email
router.get('/hunter/person/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!HunterService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Hunter.io API key not configured'
        }
      });
    }
    
    const result = await HunterService.findPerson(email);
    
    res.json({
      success: result.success,
      data: result.data,
      timestamp: new Date().toISOString(),
      ...(result.error && { error: { message: result.error } })
    });

  } catch (error) {
    console.error('Hunter person lookup error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Person lookup failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/hunter/find-email
router.get('/hunter/find-email', async (req, res) => {
  try {
    const { domain, first_name, last_name } = req.query;
    
    if (!domain || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'domain, first_name, and last_name query parameters are required'
        }
      });
    }
    
    if (!HunterService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Hunter.io API key not configured'
        }
      });
    }
    
    const result = await HunterService.findEmail(domain, first_name, last_name);
    
    res.json({
      success: result.success,
      data: result.data,
      timestamp: new Date().toISOString(),
      ...(result.error && { error: { message: result.error } })
    });

  } catch (error) {
    console.error('Hunter email finder error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Email finder failed',
        details: error.message
      }
    });
  }
});

// POST /lookup/hunter/discover
router.post('/hunter/discover', async (req, res) => {
  try {
    const { query, filters = {} } = req.body;
    
    if (!query && Object.keys(filters).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'query or filters are required'
        }
      });
    }
    
    if (!HunterService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Hunter.io API key not configured'
        }
      });
    }
    
    const result = await HunterService.discoverCompanies(query, filters);
    
    res.json({
      success: result.success,
      data: result.data,
      timestamp: new Date().toISOString(),
      ...(result.error && { error: { message: result.error } })
    });

  } catch (error) {
    console.error('Hunter company discovery error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Company discovery failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/hunter/combined/:email
router.get('/hunter/combined/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!HunterService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Hunter.io API key not configured'
        }
      });
    }
    
    const result = await HunterService.combinedFind(email);
    
    res.json({
      success: result.success,
      data: result.data,
      timestamp: new Date().toISOString(),
      ...(result.error && { error: { message: result.error } })
    });

  } catch (error) {
    console.error('Hunter combined enrichment error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Combined enrichment failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/hunter/email-count/:domain
router.get('/hunter/email-count/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const { type } = req.query;
    
    if (!HunterService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Hunter.io API key not configured'
        }
      });
    }
    
    const result = await HunterService.getEmailCount(domain, type);
    
    res.json({
      success: result.success,
      data: result.data,
      timestamp: new Date().toISOString(),
      ...(result.error && { error: { message: result.error } })
    });

  } catch (error) {
    console.error('Hunter email count error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Email count failed',
        details: error.message
      }
    });
  }
});

// ==================== URL ANALYSIS ROUTES ====================

const UrlAnalysisService = require('../services/urlAnalysisService');

// GET /lookup/url/:url
router.get('/url/:url', validationMiddleware('url'), async (req, res) => {
  try {
    const { url } = req.params;
    const decodedUrl = decodeURIComponent(url);
    
    const result = await UrlAnalysisService.analyzeUrl(decodedUrl);
    
    res.json({
      success: result.success,
      data: result.data,
      timestamp: result.timestamp || new Date().toISOString(),
      ...(result.error && { error: result.error })
    });

  } catch (error) {
    console.error('URL analysis error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'URL analysis failed',
        details: error.message
      }
    });
  }
});

// POST /lookup/url/batch
router.post('/url/batch', async (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'urls array is required and must not be empty'
        }
      });
    }

    // Validate URLs
    const validUrls = urls.filter(url => {
      try {
        new URL(url.startsWith('http') ? url : 'https://' + url);
        return true;
      } catch (error) {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No valid URLs provided'
        }
      });
    }

    const results = [];
    
    // Process URLs sequentially to respect rate limits
    for (const url of validUrls) {
      const result = await UrlAnalysisService.analyzeUrl(url);
      results.push({
        ...result,
        url: url
      });
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    res.json({
      success: true,
      results: results,
      total: results.length,
      successful: results.filter(r => r.success).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch URL analysis error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Batch URL analysis failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/url/expand/:url
router.get('/url/expand/:url', validationMiddleware('url'), async (req, res) => {
  try {
    const { url } = req.params;
    const decodedUrl = decodeURIComponent(url);
    
    const result = await UrlAnalysisService.expandUrl(decodedUrl);
    
    res.json({
      success: result.success,
      data: result.data,
      timestamp: new Date().toISOString(),
      ...(result.error && { error: result.error })
    });

  } catch (error) {
    console.error('URL expansion error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'URL expansion failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/url/security/:url
router.get('/url/security/:url', validationMiddleware('url'), async (req, res) => {
  try {
    const { url } = req.params;
    const decodedUrl = decodeURIComponent(url);
    
    const result = await UrlAnalysisService.analyzeSecurity(decodedUrl);
    
    res.json({
      success: result.success,
      data: result.data,
      timestamp: new Date().toISOString(),
      ...(result.error && { error: result.error })
    });

  } catch (error) {
    console.error('URL security analysis error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'URL security analysis failed',
        details: error.message
      }
    });
  }
});

// ==================== DOCUMENT ANALYSIS ROUTES ====================

const DocumentAnalysisService = require('../services/documentAnalysisService');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file type is supported
    if (DocumentAnalysisService.isFormatSupported(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// POST /lookup/document/analyze
router.post('/document/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No file uploaded'
        }
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    
    const result = await DocumentAnalysisService.analyzeDocument(buffer, originalname, mimetype);
    
    res.json({
      success: result.success,
      data: result.data,
      timestamp: new Date().toISOString(),
      ...(result.error && { error: result.error })
    });

  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Document analysis failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/document/formats
router.get('/document/formats', async (req, res) => {
  try {
    const formats = DocumentAnalysisService.getSupportedFormats();
    
    res.json({
      success: true,
      data: {
        formats,
        count: Object.keys(formats).length,
        categories: getFormatCategories(formats)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get supported formats error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get supported formats',
        details: error.message
      }
    });
  }
});

// Helper function to categorize formats
function getFormatCategories(formats) {
  const categories = {};
  
  Object.entries(formats).forEach(([mimeType, info]) => {
    if (!categories[info.category]) {
      categories[info.category] = [];
    }
    categories[info.category].push({
      mimeType,
      extension: info.extension
    });
  });
  
  return categories;
}

// ==================== EASY-ID ROUTES ====================

// GET /lookup/easy-id/generate
router.get('/easy-id/generate', async (req, res) => {
  try {
    const {
      type = 'person',
      count = 1,
      locale = 'en',
      includeSensitive = false,
      style = 'mixed',
      domain = null,
      cardType = 'any',
      seed = null,
      useIpForLocation = false
    } = req.query;

    // Get the user their IP address to use for geolocation
    const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   req.headers['x-client-ip'] ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   req.ip ||
                   '127.0.0.1';
    

    const options = {
      locale,
      includeSensitive: includeSensitive === 'true',
      style,
      domain,
      type: cardType,
      useIpForLocation: useIpForLocation === 'true',
      userIp: userIp
    };

    const data = await EasyIdService.generateRandomData(type, parseInt(count), options, seed);
    
    res.json({
      success: true,
      data: {
        type,
        count: data.length,
        locale,
        generated: new Date().toISOString(),
        results: data
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Easy-ID generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Data generation failed',
        details: error.message
      }
    });
  }
});

// GET /lookup/easy-id/locales
router.get('/easy-id/locales', async (req, res) => {
  try {
    const locales = EasyIdService.getAvailableLocales();
    
    res.json({
      success: true,
      data: {
        locales,
        count: locales.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Easy-ID locales error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get locales',
        details: error.message
      }
    });
  }
});

// GET /lookup/easy-id/types
router.get('/easy-id/types', async (req, res) => {
  try {
    const types = [
      { name: 'person', description: 'Complete person profiles with all details' },
      { name: 'contact', description: 'Basic contact information only' },
      { name: 'email', description: 'Email addresses with usernames and domains' },
      { name: 'username', description: 'Social media usernames and profiles' },
      { name: 'address', description: 'Physical addresses' },
      { name: 'company', description: 'Company information and details' },
      { name: 'creditcard', description: 'Credit card information (for testing)' },
      { name: 'basic_opsec', description: 'OPSEC-focused fake identities for anonymous social media presence' },
      { name: 'apikey', description: 'API keys and tokens (for testing)' }
    ];
    
    res.json({
      success: true,
      data: {
        types,
        count: types.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Easy-ID types error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get types',
        details: error.message
      }
    });
  }
});

module.exports = router;
