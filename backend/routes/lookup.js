const express = require('express');
const FreeApiService = require('../services/freeApiService');

const router = express.Router();

// GET /lookup/email/:email
router.get('/email/:email', async (req, res) => {
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
router.get('/ip/:ip', async (req, res) => {
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
router.get('/domain/:domain', async (req, res) => {
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
router.get('/username/:username', async (req, res) => {
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

module.exports = router;
