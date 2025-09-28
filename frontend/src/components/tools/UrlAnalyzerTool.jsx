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
    if (score >= 80) return <CheckCircle className="w-6 h-6 text-green-400" />;
    if (score >= 60) return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
    return <XCircle className="w-6 h-6 text-red-400" />;
  };

  const renderOverview = () => {
    if (!results) return null;

    const { parsedUrl, analysis } = results;

    return (
      <div className="space-y-8">
        {/* URL info */}
        <div className="card">
          <div className="card-content">
          <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
            <Globe className="w-6 h-6 mr-3" />
            URL Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-base text-dark-400">Original URL</label>
              <div className="flex items-center mt-2">
                <input
                  type="text"
                  value={results.originalUrl}
                  readOnly
                  className="input-field flex-1 py-3 text-base"
                />
                <button
                  onClick={() => copyToClipboard(results.originalUrl)}
                  className="ml-3 btn-ghost p-3"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-base text-dark-400">Protocol</label>
              <div className="mt-2 flex items-center">
                {(() => {
                  // determine if HTTPS (secure) based on protocol string or isHttps property
                  const isHttps = parsedUrl.isHttps || parsedUrl.protocol?.toLowerCase() === 'https' || parsedUrl.protocol?.toLowerCase() === 'https:';
                  const protocol = parsedUrl.protocol?.toLowerCase().replace(':', '') || 'http';

                  return isHttps ? (
                    <Lock className="w-6 h-6 text-green-400 mr-3" title="Secure HTTPS Connection" />
                  ) : (
                    <Unlock className="w-6 h-6 text-red-400 mr-3" title="Unsecure HTTP Connection" />
                  );
                })()}
                <span className="text-white font-mono text-base">{parsedUrl.protocol?.toLowerCase().replace(':', '') || 'http'}</span>
                <span className={`ml-3 px-3 py-2 rounded-full text-base font-medium ${
                  parsedUrl.isHttps || parsedUrl.protocol?.toLowerCase() === 'https' || parsedUrl.protocol?.toLowerCase() === 'https:'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {parsedUrl.isHttps || parsedUrl.protocol?.toLowerCase() === 'https' || parsedUrl.protocol?.toLowerCase() === 'https:' ? 'SECURE' : 'UNSECURE'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-base text-dark-400">Hostname</label>
              <div className="mt-2 text-white text-base">{parsedUrl.hostname}</div>
            </div>

            <div>
              <label className="text-base text-dark-400">Port</label>
              <div className="mt-2 text-white text-base">
                {parsedUrl.port} {parsedUrl.isStandardPort && <span className="text-green-400 text-base">(Standard)</span>}
              </div>
            </div>

            <div>
              <label className="text-base text-dark-400">Path</label>
              <div className="mt-2 text-white font-mono text-base">{parsedUrl.pathname}</div>
            </div>

            <div>
              <label className="text-base text-dark-400">Parameters</label>
              <div className="mt-2 text-white">
                {parsedUrl.hasParameters ? (
                  <span className="text-yellow-400 text-base">{Object.keys(parsedUrl.parameters).length} parameters</span>
                ) : (
                  <span className="text-dark-400 text-base">None</span>
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
            <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
              <Shield className="w-6 h-6 mr-3" />
              Security Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base text-dark-400">Security Score</span>
                  {getSecurityScoreIcon(analysis.security.securityScore)}
                </div>
                <div className="w-full bg-dark-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      analysis.security.securityScore >= 80 ? 'bg-green-400' :
                      analysis.security.securityScore >= 55 ? 'bg-yellow-400' :
                      analysis.security.securityScore >= 40 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${analysis.security.securityScore}%` }}
                  ></div>
                </div>
                <div className={`text-base mt-2 ${getSecurityScoreColor(analysis.security.securityScore)}`}>
                  {analysis.security.securityScore}/100
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base text-dark-400">Suspicious Patterns</span>
                  <span className={`text-base ${
                    analysis.security.suspiciousPatterns.overallScore > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {analysis.security.suspiciousPatterns.overallScore > 0 ? 'Detected' : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-dark-400">Phishing Indicators</span>
                  <span className={`text-base ${
                    analysis.security.phishingIndicators.overallScore > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {analysis.security.phishingIndicators.overallScore > 0 ? 'Detected' : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-dark-400">Malware Check</span>
                  <span className={`text-base ${
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
            <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
              <ExternalLink className="w-6 h-6 mr-3" />
              URL Expansion
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-base text-dark-400">Final URL</label>
                <div className="flex items-center mt-2">
                  <input
                    type="text"
                    value={analysis.expansion.finalUrl}
                    readOnly
                    className="input-field flex-1 py-3 text-base"
                  />
                  <button
                    onClick={() => copyToClipboard(analysis.expansion.finalUrl)}
                    className="ml-3 btn-ghost p-3"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-base text-dark-400">Redirect Count</label>
                  <div className="mt-2 text-white text-base">{analysis.expansion.redirectCount}</div>
                </div>
                <div>
                  <label className="text-base text-dark-400">Is Shortened</label>
                  <div className="mt-2">
                    {analysis.expansion.isShortened ? (
                      <span className="text-yellow-400 text-base">Yes</span>
                    ) : (
                      <span className="text-green-400 text-base">No</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-base text-dark-400">Status</label>
                  <div className="mt-2">
                    {analysis.expansion.redirectCount > 0 ? (
                      <span className="text-blue-400 text-base">Redirected</span>
                    ) : (
                      <span className="text-green-400 text-base">Direct</span>
                    )}
                  </div>
                </div>
              </div>

              {analysis.expansion.redirects && analysis.expansion.redirects.length > 0 && (
                <div>
                  <label className="text-base text-dark-400">Redirect Chain</label>
                  <div className="mt-3 space-y-3">
                    {analysis.expansion.redirects.map((redirect, index) => (
                      <div key={index} className="bg-dark-700 rounded p-4">
                        <div className="text-sm text-dark-400 mb-2">Step {index + 1}</div>
                        <div className="text-base text-white font-mono break-all">{redirect.from}</div>
                        <div className="text-sm text-dark-400 mt-2">→ {redirect.to}</div>
                        <div className="text-sm text-dark-400">Status: {redirect.status} {redirect.statusText}</div>
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
      <div className="space-y-8">
        {/* sus patterns */}
        {security.suspiciousPatterns && (
          <div className="card">
            <div className="card-content">
            <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-3" />
              Suspicious Patterns
            </h3>

            <div className="space-y-5">
              {security.suspiciousPatterns.suspiciousSubdomains.length > 0 && (
                <div>
                  <label className="text-base text-dark-400">Suspicious Subdomains</label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {security.suspiciousPatterns.suspiciousSubdomains.map((subdomain, index) => (
                      <span key={index} className="bg-red-900/20 text-red-400 px-3 py-2 rounded text-base">
                        {subdomain}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {security.suspiciousPatterns.suspiciousPaths.length > 0 && (
                <div>
                  <label className="text-base text-dark-400">Suspicious Paths</label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {security.suspiciousPatterns.suspiciousPaths.map((path, index) => (
                      <span key={index} className="bg-orange-900/20 text-orange-400 px-3 py-2 rounded text-base">
                        {path}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {security.suspiciousPatterns.suspiciousParams.length > 0 && (
                <div>
                  <label className="text-base text-dark-400">Suspicious Parameters</label>
                  <div className="mt-2 space-y-2">
                    {security.suspiciousPatterns.suspiciousParams.map((param, index) => (
                      <div key={index} className="bg-yellow-900/20 text-yellow-400 px-3 py-2 rounded text-base">
                        {param.key}: {param.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {security.suspiciousPatterns.suspiciousTlds.length > 0 && (
                <div>
                  <label className="text-base text-dark-400">Suspicious TLDs</label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {security.suspiciousPatterns.suspiciousTlds.map((tld, index) => (
                      <span key={index} className="bg-red-900/20 text-red-400 px-3 py-2 rounded text-base">
                        {tld}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {security.suspiciousPatterns.overallScore === 0 && (
                <div className="text-green-400 text-base">No suspicious patterns detected</div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* Phishing indicators */}
        {security.phishingIndicators && (
          <div className="card">
            <div className="card-content">
            <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
              <Eye className="w-6 h-6 mr-3" />
              Phishing Indicators
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base text-dark-400">Homograph Attack</span>
                <span className={`text-base ${
                  security.phishingIndicators.homographAttack ? 'text-red-400' : 'text-green-400'
                }`}>
                  {security.phishingIndicators.homographAttack ? 'Detected' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-dark-400">Suspicious Domain</span>
                <span className={`text-base ${
                  security.phishingIndicators.suspiciousDomain ? 'text-red-400' : 'text-green-400'
                }`}>
                  {security.phishingIndicators.suspiciousDomain ? 'Detected' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-dark-400">Suspicious Path</span>
                <span className={`text-base ${
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
            <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
              <Shield className="w-6 h-6 mr-3" />
              Malware Check
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base text-dark-400">Status</span>
                <span className={`text-base ${
                  security.malwareCheck.detected ? 'text-red-400' : 'text-green-400'
                }`}>
                  {security.malwareCheck.detected ? 'Malware Detected' : 'Clean'}
                </span>
              </div>
              {security.malwareCheck.positives !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-base text-dark-400">Detection Rate</span>
                  <span className="text-base text-white">
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
      <div className="space-y-8">
        {/* Domain info */}
        <div className="card">
          <div className="card-content">
          <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
            <Globe className="w-6 h-6 mr-3" />
            Domain Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-base text-dark-400">Hostname</label>
              <div className="mt-2 text-white text-base">{domain.hostname}</div>
            </div>
            <div>
              <label className="text-base text-dark-400">Is IP Address</label>
              <div className="mt-2">
                {domain.isIp ? (
                  <span className="text-yellow-400 text-base">Yes</span>
                ) : (
                  <span className="text-green-400 text-base">No</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-base text-dark-400">TLD</label>
              <div className="mt-2 text-white text-base">{domain.tld}</div>
            </div>
            <div>
              <label className="text-base text-dark-400">Subdomain</label>
              <div className="mt-2 text-white text-base">{domain.subdomain || 'None'}</div>
            </div>
            <div>
              <label className="text-base text-dark-400">Domain</label>
              <div className="mt-2 text-white text-base">{domain.domain}</div>
            </div>
          </div>
          </div>
        </div>

        {/* DNS records */}
        {domain.dnsRecords && (
          <div className="card">
            <div className="card-content">
            <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
              <Search className="w-6 h-6 mr-3" />
              DNS Records
            </h3>

            <div className="space-y-5">
              {domain.dnsRecords.a && domain.dnsRecords.a.length > 0 && (
                <div>
                  <label className="text-base text-dark-400">A Records</label>
                  <div className="mt-2 space-y-2">
                    {domain.dnsRecords.a.map((record, index) => (
                      <div key={index} className="bg-dark-700 px-4 py-3 rounded text-base text-white font-mono">
                        {record}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {domain.dnsRecords.aaaa && domain.dnsRecords.aaaa.length > 0 && (
                <div>
                  <label className="text-base text-dark-400">AAAA Records</label>
                  <div className="mt-2 space-y-2">
                    {domain.dnsRecords.aaaa.map((record, index) => (
                      <div key={index} className="bg-dark-700 px-4 py-3 rounded text-base text-white font-mono">
                        {record}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {domain.dnsRecords.mx && domain.dnsRecords.mx.length > 0 && (
                <div>
                  <label className="text-base text-dark-400">MX Records</label>
                  <div className="mt-2 space-y-2">
                    {domain.dnsRecords.mx.map((record, index) => (
                      <div key={index} className="bg-dark-700 px-4 py-3 rounded text-base text-white">
                        {record.priority} {record.exchange}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {domain.dnsRecords.txt && domain.dnsRecords.txt.length > 0 && (
                <div>
                  <label className="text-base text-dark-400">TXT Records</label>
                  <div className="mt-2 space-y-2">
                    {domain.dnsRecords.txt.map((record, index) => (
                      <div key={index} className="bg-dark-700 px-4 py-3 rounded text-base text-white font-mono break-all">
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
            <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
              <Info className="w-6 h-6 mr-3" />
              WHOIS Data
            </h3>

            <div className="space-y-4">
              {domain.whoisData.registrar && (
                <div className="flex justify-between">
                  <span className="text-base text-dark-400">Registrar</span>
                  <span className="text-base text-white">{domain.whoisData.registrar}</span>
                </div>
              )}
              {domain.whoisData.creation_date && (
                <div className="flex justify-between">
                  <span className="text-base text-dark-400">Creation Date</span>
                  <span className="text-base text-white">{domain.whoisData.creation_date}</span>
                </div>
              )}
              {domain.whoisData.expiration_date && (
                <div className="flex justify-between">
                  <span className="text-base text-dark-400">Expiration Date</span>
                  <span className="text-base text-white">{domain.whoisData.expiration_date}</span>
                </div>
              )}
              {domain.whoisData.country && (
                <div className="flex justify-between">
                  <span className="text-base text-dark-400">Country</span>
                  <span className="text-base text-white">{domain.whoisData.country}</span>
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
      <div className="space-y-8">
        {/* Page metadata like title, description and keywords. */}
        <div className="bg-dark-800 rounded-lg p-7">
          <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
            <Info className="w-6 h-6 mr-3" />
            Page Metadata
          </h3>

          <div className="space-y-4">
            {content.title && (
              <div>
                <label className="text-base text-dark-400">Title</label>
                <div className="mt-2 text-white text-base">{content.title}</div>
              </div>
            )}
            {content.description && (
              <div>
                <label className="text-base text-dark-400">Description</label>
                <div className="mt-2 text-white text-base">{content.description}</div>
              </div>
            )}
            {content.keywords && (
              <div>
                <label className="text-base text-dark-400">Keywords</label>
                <div className="mt-2 text-white text-base">{content.keywords}</div>
              </div>
            )}
          </div>
        </div>

        {/* Link checks analysis */}
        <div className="bg-dark-800 rounded-lg p-7">
          <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
            <Link className="w-6 h-6 mr-3" />
            Link Analysis
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-7">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{content.linkCount}</div>
              <div className="text-base text-dark-400">Total Links</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{content.internalLinks}</div>
              <div className="text-base text-dark-400">Internal</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{content.externalLinks}</div>
              <div className="text-base text-dark-400">External</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{content.nofollowLinks}</div>
              <div className="text-base text-dark-400">NoFollow</div>
            </div>
          </div>

          {content.links && content.links.length > 0 && (
            <div>
              <label className="text-base text-dark-400">Sample Links</label>
              <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
                {content.links.slice(0, 10).map((link, index) => (
                  <div key={index} className="bg-dark-700 rounded p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-base text-white font-mono break-all">{link.url}</div>
                        {link.text && (
                          <div className="text-sm text-dark-400 mt-2">"{link.text}"</div>
                        )}
                      </div>
                      <div className="ml-3 flex space-x-2">
                        {link.isInternal && (
                          <span className="bg-blue-900/20 text-blue-400 px-3 py-2 rounded text-base">
                            Internal
                          </span>
                        )}
                        {link.rel === 'nofollow' && (
                          <span className="bg-yellow-900/20 text-yellow-400 px-3 py-2 rounded text-base">
                            NoFollow
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {content.links.length > 10 && (
                  <div className="text-center text-base text-dark-400">
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
      <div className="card mb-8 hover:lift anim-enter">
        <div className="card-content">
        <div className="flex space-x-5">
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
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
            ) : (
              <Search className="w-6 h-6 mr-3" />
            )}
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {error && (
          <div className="mt-5 bg-red-900/20 border border-red-500/20 text-red-400 px-5 py-4 rounded-lg">
            {error}
          </div>
        )}
        </div>
      </div>

      {results && (
        <div className="card hover:lift anim-enter">
          {/* the tabs for all this */}
          <div className="tab-nav">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Globe },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'domain', label: 'Domain', icon: Search },
                { id: 'content', label: 'Content', icon: Link }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <tab.icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* and the content for the tabs */}
          <div className="card-content anim-fade">
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
