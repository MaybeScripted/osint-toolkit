const axios = require('axios');
const hunterService = require('./hunterService');
const gravatarService = require('./gravatarService');
const emailAnalysisService = require('./emailAnalysisService');
const sherlockService = require('./sherlockService');

class EmailService {
  constructor() {
    // Using hunterService instead of direct axios client
  }

  async lookupEmail(email) {
    const results = {
      email,
      hunter: null,
      gravatar: null,
      analysis: null,
      usernameCorrelation: null,
      success: false,
      errors: [],
      summary: {}
    };

    console.log(`Starting email lookup for ${email}`);

    // 1. Email analysis
    try {
      results.analysis = emailAnalysisService.analyzeEmail(email);
      console.log(`✅ Email analysis completed for ${email}`);
    } catch (error) {
      console.error(`Email analysis error for ${email}:`, error.message);
      results.errors.push({
        service: 'analysis',
        error: error.message
      });
    }

          // 2. Hunter.io lookup
      if (hunterService.isConfigured()) {
        try {
          console.log(`Running Hunter.io lookup for ${email}`);

          // hunter: combo lookup, verify, domain stats, then mash it all together
          const combinedResult = await hunterService.combinedFind(email);
          const verificationResult = await hunterService.verifyEmail(email);
          const domain = email.split('@')[1];
          const emailCountResult = await hunterService.getEmailCount(domain);

          results.hunter = {
            verification: verificationResult.success ? verificationResult.data : null,
            combined: combinedResult.success ? combinedResult.data : null,
            emailCount: emailCountResult.success ? emailCountResult.data : null,
            intelligence: this.extractHunterIntelligence(combinedResult, verificationResult, emailCountResult)
          };

          console.log(`Hunter.io lookup completed for ${email}`);
          console.log(`Debug - Hunter.io data:`, {
            hasVerification: !!verificationResult.data,
            verificationStatus: verificationResult.data?.data?.status || verificationResult.data?.status,
            hasCombined: !!combinedResult.data,
            hasEmailCount: !!emailCountResult.data,
            combinedSuccess: combinedResult.success,
            combinedData: combinedResult.success ? Object.keys(combinedResult.data?.data || {}) : 'none'
          });

        } catch (error) {
          console.error(`Hunter.io error for ${email}:`, error.message);
          results.errors.push({
            service: 'hunter',
            error: error.message || 'Hunter.io lookup failed'
          });
        }
      } else {
        results.errors.push({
          service: 'hunter',
          error: 'Hunter.io API key not configured'
        });
      }

    // 3. Gravatar profile lookup
    try {
      const gravatarData = await gravatarService.checkProfile(email);
      results.gravatar = {
        ...gravatarData,
        intelligence: gravatarService.extractProfileIntelligence(gravatarData)
      };
      
      console.log(`✅ Gravatar lookup completed for ${email} (profile: ${gravatarData.hasProfile ? 'yes' : 'no'})`);
    } catch (error) {
      console.error(`Gravatar error for ${email}:`, error.message);
      results.errors.push({
        service: 'gravatar',
        error: error.message
      });
    }


    // 4. Generate summary
    results.summary = this.generateEmailSummary(results);
    
    // Consider lookup successful if we got any data
    results.success = !!(
      results.hunter?.verification || 
      results.gravatar?.success || 
      results.analysis
    );

    console.log(`Email lookup completed for ${email} (${results.errors.length} errors)`);
    return results;
  }

  // Extract entities from email lookup results
  extractEntities(emailResults) {
    const entities = [];

    if (!emailResults.success) return entities;

    // Extract domain from email address if it fucking exists
    if (emailResults.email.includes('@')) {
      const domain = emailResults.email.split('@')[1];
      entities.push({
        type: 'domain',
        value: domain,
        source: 'derived',
        confidence: 1.0
      });
    }

    // hunter.io dump: pulls out whatever we can from the person object if it exists
    if (emailResults.hunter) {
      const { verification, person } = emailResults.hunter;

      if (person && person.data) {
        const personData = person.data;

        if (personData.first_name || personData.last_name) {
          const fullName = [personData.first_name, personData.last_name].filter(Boolean).join(' ');
          if (fullName) {
            entities.push({
              type: 'name',
              value: fullName,
              source: 'hunter',
              confidence: 0.9
            });
          }
        }

        if (personData.domain) {
          entities.push({
            type: 'domain',
            value: personData.domain,
            source: 'hunter',
            confidence: 0.8
          });
        }

        if (personData.organization) {
          entities.push({
            type: 'company',
            value: personData.organization,
            source: 'hunter',
            confidence: 0.8
          });
        }

        if (personData.position) {
          entities.push({
            type: 'job_title',
            value: personData.position,
            source: 'hunter',
            confidence: 0.7
          });
        }

        if (personData.linkedin) {
          entities.push({
            type: 'social_profile',
            value: personData.linkedin,
            source: 'hunter',
            confidence: 0.8
          });
        }

        if (personData.twitter) {
          entities.push({
            type: 'social_profile',
            value: personData.twitter,
            source: 'hunter',
            confidence: 0.8
          });
        }
      }
    }

    return entities;
  }
  // this grabs all lookup results and builds a quick rundown for the user.
  generateEmailSummary(results) {
    const summary = {
      riskLevel: 'unknown',
      confidence: 0,
      keyFindings: [],
      recommendations: [],
      dataPoints: 0
    };

    let riskScore = 0;
    let dataPoints = 0;
            // ENHANCED Hunter.io data
        if (results.hunter?.intelligence) {
          const intel = results.hunter.intelligence;
          
          // Person intelligence
          if (intel.personIntel?.fullName) {
            dataPoints++;
            summary.keyFindings.push(`👤 Person: ${intel.personIntel.fullName}`);
            
            if (intel.personIntel.employment?.title) {
              summary.keyFindings.push(`💼 Position: ${intel.personIntel.employment.title}`);
            }
            
            if (intel.personIntel.location) {
              summary.keyFindings.push(`📍 Location: ${intel.personIntel.location}`);
            }

            // Social profiles count
            const socialCount = Object.values(intel.personIntel.socialProfiles || {}).filter(Boolean).length;
            if (socialCount > 0) {
              summary.keyFindings.push(`🔗 ${socialCount} social profile${socialCount > 1 ? 's' : ''} found`);
            }
          }

          // Company intelligence
          if (intel.companyIntel?.name) {
            dataPoints++;
            summary.keyFindings.push(`🏢 Company: ${intel.companyIntel.name}`);
            
            if (intel.companyIntel.industry) {
              summary.keyFindings.push(`🏭 Industry: ${intel.companyIntel.industry}`);
            }
            
            if (intel.companyIntel.metrics?.employees) {
              summary.keyFindings.push(`👥 Company size: ${intel.companyIntel.metrics.employees}`);
            }

            if (intel.companyIntel.foundedYear) {
              summary.keyFindings.push(`📅 Founded: ${intel.companyIntel.foundedYear}`);
            }
          }

          // Domain intelligence
          if (intel.domainIntel?.totalEmails) {
            summary.keyFindings.push(`📧 ${intel.domainIntel.totalEmails} emails found in domain`);
            summary.keyFindings.push(`🏢 Network size: ${intel.domainIntel.networkSize}`);
          }

          // Email verification
          if (intel.networkIntel?.deliverable !== undefined) {
            if (intel.networkIntel.deliverable) {
              if (intel.networkIntel.status === 'webmail') {
                summary.keyFindings.push('✅ Valid webmail address (Gmail/Outlook)');
              } else if (intel.networkIntel.status === 'accept_all') {
                summary.keyFindings.push('✅ Email server accepts all addresses');
              } else {
                summary.keyFindings.push('✅ Email is deliverable');
              }
            } else {
              summary.keyFindings.push(`❌ Email status: ${intel.networkIntel.status}`);
              riskScore += 20;
            }

            if (intel.networkIntel.riskLevel) {
              summary.keyFindings.push(`⚠️ Risk level: ${intel.networkIntel.riskLevel}`);
              if (intel.networkIntel.riskLevel === 'high') riskScore += 30;
              else if (intel.networkIntel.riskLevel === 'medium') riskScore += 15;
            }

            if (intel.networkIntel.publiclyVisible) {
              summary.keyFindings.push(`🌐 Found on ${intel.networkIntel.sources} public source${intel.networkIntel.sources > 1 ? 's' : ''}`);
            }
          }
        }

    // Gravatar data
    if (results.gravatar) {
      dataPoints++;
      if (results.gravatar.hasProfile) {
        summary.keyFindings.push('🖼️ Has Gravatar profile');
        
        const intelligence = results.gravatar.intelligence;
        if (intelligence?.socialProfiles?.length > 0) {
          summary.keyFindings.push(`🔗 ${intelligence.socialProfiles.length} linked social account${intelligence.socialProfiles.length > 1 ? 's' : ''}`);
        }
      } else if (results.gravatar.hasAvatar) {
        summary.keyFindings.push('🖼️ Has Gravatar avatar');
      } else {
        summary.keyFindings.push('📷 No Gravatar found');
      }
    }

    // Analysis data
    if (results.analysis) {
      dataPoints++;
      const analysis = results.analysis;
      
      if (analysis.domainAnalysis?.providerInfo) {
        const provider = analysis.domainAnalysis.providerInfo;
        if (provider.type === 'business') {
          summary.keyFindings.push(`🏢 Business email (${provider.provider})`);
        } else if (provider.type === 'personal') {
          summary.keyFindings.push(`👤 Personal email (${provider.provider})`);
        }
      }

      if (analysis.domainAnalysis?.isDisposable) {
        summary.keyFindings.push('🗑️ Disposable email address');
        riskScore += 40;
      }

      if (analysis.riskAssessment?.level === 'high') {
        riskScore += 30;
      } else if (analysis.riskAssessment?.level === 'medium') {
        riskScore += 15;
      }
    }

    // Calculate overall risk level
    if (riskScore >= 70) {
      summary.riskLevel = 'high';
    } else if (riskScore >= 40) {
      summary.riskLevel = 'medium';
    } else if (riskScore >= 20) {
      summary.riskLevel = 'low';
    } else {
      summary.riskLevel = 'very_low';
    }

    // generate confidence based on data points (out of 3 sources: Hunter.io, Gravatar, Email Analysis)
    summary.confidence = Math.min((dataPoints / 3) * 100, 100);
    summary.dataPoints = dataPoints;

    // Generate recommendations
    if (summary.riskLevel === 'high') {
      summary.recommendations.push('⚠️ High risk email - verify identity carefully');
    }
    
    if (dataPoints < 2) {
      summary.recommendations.push('🔍 Limited data available - consider additional verification');
    }
    
    summary.recommendations.push('💰 For breach data, consider using: Have I Been Pwned (HIBP). You can goto their website to check for breaches for free.');

    return summary;
  }

  // Extract intelligence from Hunter.io combined results
  extractHunterIntelligence(combinedResult, verificationResult, emailCountResult) {
    const intelligence = {
      personIntel: {},
      companyIntel: {},
      domainIntel: {},
      networkIntel: {}
    };

    // Extract person intelligence
    if (combinedResult.success && combinedResult.data?.person) {
      const person = combinedResult.data.person;
      
      intelligence.personIntel = {
        fullName: person.name?.fullName,
        firstName: person.name?.givenName,
        lastName: person.name?.familyName,
        location: person.location,
        timezone: person.timeZone,
        bio: person.bio,
        avatar: person.avatar,
        employment: {
          title: person.employment?.title,
          company: person.employment?.name,
          domain: person.employment?.domain,
          role: person.employment?.role,
          seniority: person.employment?.seniority
        },
        socialProfiles: {
          linkedin: person.linkedin?.handle,
          twitter: person.twitter?.handle,
          github: person.github?.handle,
          facebook: person.facebook?.handle
        },
        contact: {
          phone: person.phone,
          site: person.site
        },
        lastActivity: person.activeAt,
        confidence: person.fuzzy ? 'low' : 'high'
      };
    }

    // Extract company intelligence
    if (combinedResult.success && combinedResult.data?.company) {
      const company = combinedResult.data.company;
      
      intelligence.companyIntel = {
        name: company.name,
        legalName: company.legalName,
        domain: company.domain,
        description: company.description,
        foundedYear: company.foundedYear,
        industry: company.category?.industry,
        sector: company.category?.sector,
        tags: company.tags,
        location: {
          full: company.location,
          city: company.geo?.city,
          state: company.geo?.state,
          country: company.geo?.country,
          coordinates: company.geo?.lat && company.geo?.lng ? 
            `${company.geo.lat}, ${company.geo.lng}` : null
        },
        contact: {
          phone: company.phone,
          emails: company.site?.emailAddresses,
          phones: company.site?.phoneNumbers
        },
        metrics: {
          employees: company.metrics?.employees,
          revenue: company.metrics?.estimatedAnnualRevenue,
          trafficRank: company.metrics?.trafficRank
        },
        technology: {
          stack: company.tech,
          categories: company.techCategories
        },
        socialProfiles: {
          linkedin: company.linkedin?.handle,
          twitter: company.twitter?.handle,
          facebook: company.facebook?.handle
        },
        funding: company.fundingRounds,
        logo: company.logo
      };
    }

    // Extract domain intelligence
    if (emailCountResult.success && emailCountResult.data) {
      const emailData = emailCountResult.data;
      
      intelligence.domainIntel = {
        totalEmails: emailData.total,
        personalEmails: emailData.personal_emails,
        genericEmails: emailData.generic_emails,
        departments: emailData.department,
        seniority: emailData.seniority,
        networkSize: this.calculateNetworkSize(emailData.total)
      };
    }

    // Extract network intelligence
    if (verificationResult.success && verificationResult.data) {
      const verification = verificationResult.data.data || verificationResult.data;
      
      intelligence.networkIntel = {
        // Fix: webmail and accept_all are still deliverable!
        deliverable: ['valid', 'webmail', 'accept_all'].includes(verification.status),
        status: verification.status, // raw status for debugging
        riskLevel: this.assessEmailRisk(verification),
        sources: verification.sources?.length || 0,
        publiclyVisible: (verification.sources?.length || 0) > 0,
        acceptsAll: verification.accept_all,
        isWebmail: verification.webmail,
        isDisposable: verification.disposable
      };
    }

    return intelligence;
  }

  // Calculate network size category
  calculateNetworkSize(totalEmails) {
    if (totalEmails > 1000) return 'enterprise';
    if (totalEmails > 100) return 'large';
    if (totalEmails > 20) return 'medium';
    if (totalEmails > 5) return 'small';
    return 'minimal';
  }

  // Assess email risk level
  assessEmailRisk(verification) {
    let riskScore = 0;
    
    if (verification.disposable) riskScore += 40;
    // Fix: Don't penalize webmail (Gmail, Outlook are safe!)
    // if (verification.webmail) riskScore += 10;
    if (verification.accept_all) riskScore += 15; // Reduced penalty
    if (!verification.mx_records) riskScore += 30;
    if (verification.gibberish) riskScore += 35;
    
    // Additional penalties for truly problematic statuses
    if (verification.status === 'invalid') riskScore += 50;
    if (verification.status === 'unknown') riskScore += 20;
    
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    if (riskScore >= 20) return 'low';
    return 'very_low';
  }

  // Check if email format is valid
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = new EmailService();
