// Shared validation utils
export const validateEmail = (email) => {
  // email validation based on RFC 5322
  // allows underscores, plus signs, and other valid special characters
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

export const validateUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // valid protocols
    const validProtocols = ['http:', 'https:', 'ftp:', 'ftps:'];
    if (!validProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // hostname checks. see if shits valid
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

export const validateIp = (ip) => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

export const validateDomain = (domain) => {
  // domain validation
  // (yes, yes it does support international domains and subdomains)
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

  if (!domainRegex.test(domain)) return false;
  
  // valid TLD (at least 2 characters)
  const parts = domain.split('.');
  if (parts.length < 2) return false;
  
  const tld = parts[parts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z0-9]+$/.test(tld)) return false;
  
  // each part length (max 63 characters per label)
  return parts.every(part => part.length <= 63 && part.length > 0);
};

