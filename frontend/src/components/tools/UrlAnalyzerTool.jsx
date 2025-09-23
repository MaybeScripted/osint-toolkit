import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Copy, 
  Download,
  Eye,
  Lock,
  Unlock,
  Link,
  Search,
  Info
} from 'lucide-react';
import api from '../../services/api';

const UrlAnalyzerTool = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await api.analyzeUrl(url);
      
      if (response.success) {
        setResults(response.data);
        setActiveTab('overview');
      } else {
        setError(response.error?.message || 'Analysis failed');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to analyze URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getSecurityScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSecurityScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const renderOverview = () => {
    if (!results) return null;

    const { parsedUrl, analysis } = results;

    return (
      <div className="space-y-6">
        {/* URL Information */}
        <div className="card">
          <div className="card-content">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            URL Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-dark-400">Original URL</label>
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={results.originalUrl}
                  readOnly
                  className="input-field flex-1 py-2 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(results.originalUrl)}
                  className="ml-2 btn-ghost p-2"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-dark-400">Protocol</label>
              <div className="mt-1 flex items-center">
                {(() => {
                  // determine if HTTPS (secure) based on protocol string or isHttps property
                  const isHttps = parsedUrl.isHttps || parsedUrl.protocol?.toLowerCase() === 'https' || parsedUrl.protocol?.toLowerCase() === 'https:';
                  const protocol = parsedUrl.protocol?.toLowerCase().replace(':', '') || 'http';

                  return isHttps ? (
                    <Lock className="w-5 h-5 text-green-400 mr-2" title="Secure HTTPS Connection" />
                  ) : (
                    <Unlock className="w-5 h-5 text-red-400 mr-2" title="Unsecure HTTP Connection" />
                  );
                })()}
                <span className="text-white font-mono text-sm">{parsedUrl.protocol?.toLowerCase().replace(':', '') || 'http'}</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  parsedUrl.isHttps || parsedUrl.protocol?.toLowerCase() === 'https' || parsedUrl.protocol?.toLowerCase() === 'https:'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {parsedUrl.isHttps || parsedUrl.protocol?.toLowerCase() === 'https' || parsedUrl.protocol?.toLowerCase() === 'https:' ? 'SECURE' : 'UNSECURE'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-dark-400">Hostname</label>
              <div className="mt-1 text-white">{parsedUrl.hostname}</div>
            </div>

            <div>
              <label className="text-sm text-dark-400">Port</label>
              <div className="mt-1 text-white">
                {parsedUrl.port} {parsedUrl.isStandardPort && <span className="text-green-400 text-xs">(Standard)</span>}
              </div>
            </div>

            <div>
              <label className="text-sm text-dark-400">Path</label>
              <div className="mt-1 text-white font-mono text-sm">{parsedUrl.pathname}</div>
            </div>

            <div>
              <label className="text-sm text-dark-400">Parameters</label>
              <div className="mt-1 text-white">
                {parsedUrl.hasParameters ? (
                  <span className="text-yellow-400">{Object.keys(parsedUrl.parameters).length} parameters</span>
                ) : (
                  <span className="text-dark-400">None</span>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* security checks and stuff. aka "security analysis" (corporate bs) */}
        {analysis.security && (
          <div className="card">
            <div className="card-content">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-400">Security Score</span>
                  {getSecurityScoreIcon(analysis.security.securityScore)}
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analysis.security.securityScore >= 80 ? 'bg-green-400' :
                      analysis.security.securityScore >= 55 ? 'bg-yellow-400' :
                      analysis.security.securityScore >= 40 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${analysis.security.securityScore}%` }}
                  ></div>
                </div>
                <div className={`text-sm mt-1 ${getSecurityScoreColor(analysis.security.securityScore)}`}>
                  {analysis.security.securityScore}/100
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Suspicious Patterns</span>
                  <span className={`text-sm ${
                    analysis.security.suspiciousPatterns.overallScore > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {analysis.security.suspiciousPatterns.overallScore > 0 ? 'Detected' : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Phishing Indicators</span>
                  <span className={`text-sm ${
                    analysis.security.phishingIndicators.overallScore > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {analysis.security.phishingIndicators.overallScore > 0 ? 'Detected' : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Malware Check</span>
                  <span className={`text-sm ${
                    analysis.security.malwareCheck?.detected ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {analysis.security.malwareCheck?.detected ? 'Detected' : 'Clean'}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* URL expension stuff */}
        {analysis.expansion && (
          <div className="card">
            <div className="card-content">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2" />
              URL Expansion
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-dark-400">Final URL</label>
                <div className="flex items-center mt-1">
                  <input
                    type="text"
                    value={analysis.expansion.finalUrl}
                    readOnly
                    className="input-field flex-1 py-2 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(analysis.expansion.finalUrl)}
                    className="ml-2 btn-ghost p-2"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-dark-400">Redirect Count</label>
                  <div className="mt-1 text-white">{analysis.expansion.redirectCount}</div>
                </div>
                <div>
                  <label className="text-sm text-dark-400">Is Shortened</label>
                  <div className="mt-1">
                    {analysis.expansion.isShortened ? (
                      <span className="text-yellow-400">Yes</span>
                    ) : (
                      <span className="text-green-400">No</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-dark-400">Status</label>
                  <div className="mt-1">
                    {analysis.expansion.redirectCount > 0 ? (
                      <span className="text-blue-400">Redirected</span>
                    ) : (
                      <span className="text-green-400">Direct</span>
                    )}
                  </div>
                </div>
              </div>

              {analysis.expansion.redirects && analysis.expansion.redirects.length > 0 && (
                <div>
                  <label className="text-sm text-dark-400">Redirect Chain</label>
                  <div className="mt-2 space-y-2">
                    {analysis.expansion.redirects.map((redirect, index) => (
                      <div key={index} className="bg-dark-700 rounded p-3">
                        <div className="text-xs text-dark-400 mb-1">Step {index + 1}</div>
                        <div className="text-sm text-white font-mono break-all">{redirect.from}</div>
                        <div className="text-xs text-dark-400 mt-1">→ {redirect.to}</div>
                        <div className="text-xs text-dark-400">Status: {redirect.status} {redirect.statusText}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSecurity = () => {
    if (!results?.analysis?.security) return null;

    const { security } = results.analysis;

    return (
      <div className="space-y-6">
        {/* sus patterns */}
        {security.suspiciousPatterns && (
          <div className="card">
            <div className="card-content">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Suspicious Patterns
            </h3>

            <div className="space-y-4">
              {security.suspiciousPatterns.suspiciousSubdomains.length > 0 && (
                <div>
                  <label className="text-sm text-dark-400">Suspicious Subdomains</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {security.suspiciousPatterns.suspiciousSubdomains.map((subdomain, index) => (
                      <span key={index} className="bg-red-900/20 text-red-400 px-2 py-1 rounded text-xs">
                        {subdomain}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {security.suspiciousPatterns.suspiciousPaths.length > 0 && (
                <div>
                  <label className="text-sm text-dark-400">Suspicious Paths</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {security.suspiciousPatterns.suspiciousPaths.map((path, index) => (
                      <span key={index} className="bg-orange-900/20 text-orange-400 px-2 py-1 rounded text-xs">
                        {path}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {security.suspiciousPatterns.suspiciousParams.length > 0 && (
                <div>
                  <label className="text-sm text-dark-400">Suspicious Parameters</label>
                  <div className="mt-1 space-y-1">
                    {security.suspiciousPatterns.suspiciousParams.map((param, index) => (
                      <div key={index} className="bg-yellow-900/20 text-yellow-400 px-2 py-1 rounded text-xs">
                        {param.key}: {param.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {security.suspiciousPatterns.suspiciousTlds.length > 0 && (
                <div>
                  <label className="text-sm text-dark-400">Suspicious TLDs</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {security.suspiciousPatterns.suspiciousTlds.map((tld, index) => (
                      <span key={index} className="bg-red-900/20 text-red-400 px-2 py-1 rounded text-xs">
                        {tld}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {security.suspiciousPatterns.overallScore === 0 && (
                <div className="text-green-400 text-sm">No suspicious patterns detected</div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* Phishing indicators */}
        {security.phishingIndicators && (
          <div className="card">
            <div className="card-content">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Phishing Indicators
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">Homograph Attack</span>
                <span className={`text-sm ${
                  security.phishingIndicators.homographAttack ? 'text-red-400' : 'text-green-400'
                }`}>
                  {security.phishingIndicators.homographAttack ? 'Detected' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">Suspicious Domain</span>
                <span className={`text-sm ${
                  security.phishingIndicators.suspiciousDomain ? 'text-red-400' : 'text-green-400'
                }`}>
                  {security.phishingIndicators.suspiciousDomain ? 'Detected' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">Suspicious Path</span>
                <span className={`text-sm ${
                  security.phishingIndicators.suspiciousPath ? 'text-red-400' : 'text-green-400'
                }`}>
                  {security.phishingIndicators.suspiciousPath ? 'Detected' : 'None'}
                </span>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Malware checking area */}
        {security.malwareCheck && (
          <div className="card">
            <div className="card-content">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Malware Check
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">Status</span>
                <span className={`text-sm ${
                  security.malwareCheck.detected ? 'text-red-400' : 'text-green-400'
                }`}>
                  {security.malwareCheck.detected ? 'Malware Detected' : 'Clean'}
                </span>
              </div>
              {security.malwareCheck.positives !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Detection Rate</span>
                  <span className="text-sm text-white">
                    {security.malwareCheck.positives}/{security.malwareCheck.total}
                  </span>
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDomain = () => {
    if (!results?.analysis?.domain) return null;

    const { domain } = results.analysis;

    return (
      <div className="space-y-6">
        {/* Domain info */}
        <div className="card">
          <div className="card-content">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Domain Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-dark-400">Hostname</label>
              <div className="mt-1 text-white">{domain.hostname}</div>
            </div>
            <div>
              <label className="text-sm text-dark-400">Is IP Address</label>
              <div className="mt-1">
                {domain.isIp ? (
                  <span className="text-yellow-400">Yes</span>
                ) : (
                  <span className="text-green-400">No</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-dark-400">TLD</label>
              <div className="mt-1 text-white">{domain.tld}</div>
            </div>
            <div>
              <label className="text-sm text-dark-400">Subdomain</label>
              <div className="mt-1 text-white">{domain.subdomain || 'None'}</div>
            </div>
            <div>
              <label className="text-sm text-dark-400">Domain</label>
              <div className="mt-1 text-white">{domain.domain}</div>
            </div>
          </div>
          </div>
        </div>

        {/* DNS records */}
        {domain.dnsRecords && (
          <div className="card">
            <div className="card-content">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              DNS Records
            </h3>

            <div className="space-y-4">
              {domain.dnsRecords.a && domain.dnsRecords.a.length > 0 && (
                <div>
                  <label className="text-sm text-dark-400">A Records</label>
                  <div className="mt-1 space-y-1">
                    {domain.dnsRecords.a.map((record, index) => (
                      <div key={index} className="bg-dark-700 px-3 py-2 rounded text-sm text-white font-mono">
                        {record}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {domain.dnsRecords.aaaa && domain.dnsRecords.aaaa.length > 0 && (
                <div>
                  <label className="text-sm text-dark-400">AAAA Records</label>
                  <div className="mt-1 space-y-1">
                    {domain.dnsRecords.aaaa.map((record, index) => (
                      <div key={index} className="bg-dark-700 px-3 py-2 rounded text-sm text-white font-mono">
                        {record}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {domain.dnsRecords.mx && domain.dnsRecords.mx.length > 0 && (
                <div>
                  <label className="text-sm text-dark-400">MX Records</label>
                  <div className="mt-1 space-y-1">
                    {domain.dnsRecords.mx.map((record, index) => (
                      <div key={index} className="bg-dark-700 px-3 py-2 rounded text-sm text-white">
                        {record.priority} {record.exchange}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {domain.dnsRecords.txt && domain.dnsRecords.txt.length > 0 && (
                <div>
                  <label className="text-sm text-dark-400">TXT Records</label>
                  <div className="mt-1 space-y-1">
                    {domain.dnsRecords.txt.map((record, index) => (
                      <div key={index} className="bg-dark-700 px-3 py-2 rounded text-sm text-white font-mono break-all">
                        {record.join('')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* WHOIS stuff */}
        {domain.whoisData && (
          <div className="card">
            <div className="card-content">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              WHOIS Data
            </h3>

            <div className="space-y-3">
              {domain.whoisData.registrar && (
                <div className="flex justify-between">
                  <span className="text-sm text-dark-400">Registrar</span>
                  <span className="text-sm text-white">{domain.whoisData.registrar}</span>
                </div>
              )}
              {domain.whoisData.creation_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-dark-400">Creation Date</span>
                  <span className="text-sm text-white">{domain.whoisData.creation_date}</span>
                </div>
              )}
              {domain.whoisData.expiration_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-dark-400">Expiration Date</span>
                  <span className="text-sm text-white">{domain.whoisData.expiration_date}</span>
                </div>
              )}
              {domain.whoisData.country && (
                <div className="flex justify-between">
                  <span className="text-sm text-dark-400">Country</span>
                  <span className="text-sm text-white">{domain.whoisData.country}</span>
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (!results?.analysis?.content) return null;

    const { content } = results.analysis;

    return (
      <div className="space-y-6">
        {/* Page metadata like title, description and keywords. */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Page Metadata
          </h3>

          <div className="space-y-3">
            {content.title && (
              <div>
                <label className="text-sm text-dark-400">Title</label>
                <div className="mt-1 text-white">{content.title}</div>
              </div>
            )}
            {content.description && (
              <div>
                <label className="text-sm text-dark-400">Description</label>
                <div className="mt-1 text-white">{content.description}</div>
              </div>
            )}
            {content.keywords && (
              <div>
                <label className="text-sm text-dark-400">Keywords</label>
                <div className="mt-1 text-white">{content.keywords}</div>
              </div>
            )}
          </div>
        </div>

        {/* Link checks analysis */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Link className="w-5 h-5 mr-2" />
            Link Analysis
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{content.linkCount}</div>
              <div className="text-sm text-dark-400">Total Links</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{content.internalLinks}</div>
              <div className="text-sm text-dark-400">Internal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{content.externalLinks}</div>
              <div className="text-sm text-dark-400">External</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{content.nofollowLinks}</div>
              <div className="text-sm text-dark-400">NoFollow</div>
            </div>
          </div>

          {content.links && content.links.length > 0 && (
            <div>
              <label className="text-sm text-dark-400">Sample Links</label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {content.links.slice(0, 10).map((link, index) => (
                  <div key={index} className="bg-dark-700 rounded p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-mono break-all">{link.url}</div>
                        {link.text && (
                          <div className="text-xs text-dark-400 mt-1">"{link.text}"</div>
                        )}
                      </div>
                      <div className="ml-2 flex space-x-1">
                        {link.isInternal && (
                          <span className="bg-blue-900/20 text-blue-400 px-2 py-1 rounded text-xs">
                            Internal
                          </span>
                        )}
                        {link.rel === 'nofollow' && (
                          <span className="bg-yellow-900/20 text-yellow-400 px-2 py-1 rounded text-xs">
                            NoFollow
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {content.links.length > 10 && (
                  <div className="text-center text-sm text-dark-400">
                    ... and {content.links.length - 10} more links
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="card mb-6">
        <div className="card-content">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <Globe className="w-6 h-6 mr-3" />
          URL Analyzer
        </h2>
        <p className="text-dark-400 mb-6">
          Analyze URLs for security threats, expansion, domain information, and content analysis.
        </p>

        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter URL to analyze (e.g., https://example.com)"
              className="input-field"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Search className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        </div>
      </div>

      {results && (
        <div className="card">
          {/* the tabs for all this */}
          <div className="border-b border-dark-600">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Globe },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'domain', label: 'Domain', icon: Search },
                { id: 'content', label: 'Content', icon: Link }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-dark-400 hover:text-white hover:border-dark-400'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* and the content for the tabs */}
          <div className="card-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'security' && renderSecurity()}
            {activeTab === 'domain' && renderDomain()}
            {activeTab === 'content' && renderContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlAnalyzerTool;
