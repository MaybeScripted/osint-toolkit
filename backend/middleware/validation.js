const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateIP = (ip) => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

const validateDomain = (domain) => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
};

const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const validateUsername = (username) => {
  // Username should be 3-30 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

const validationMiddleware = (type) => {
  return (req, res, next) => {
    const value = req.params[type];
    
    if (!value) {
      return res.status(400).json({
        success: false,
        error: {
          message: `${type} parameter is required`,
          code: 'MISSING_PARAMETER'
        }
      });
    }

    let isValid = false;
    let errorMessage = '';

    switch (type) {
      case 'email':
        isValid = validateEmail(value);
        errorMessage = 'Invalid email format';
        break;
      case 'ip':
        isValid = validateIP(value);
        errorMessage = 'Invalid IP address format';
        break;
      case 'domain':
        isValid = validateDomain(value);
        errorMessage = 'Invalid domain format';
        break;
      case 'url':
        isValid = validateURL(value);
        errorMessage = 'Invalid URL format';
        break;
      case 'username':
        isValid = validateUsername(value);
        errorMessage = 'Username must be 3-30 characters, alphanumeric and underscores only';
        break;
      default:
        isValid = true; // Skip validation for unknown types
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: errorMessage,
          code: 'INVALID_INPUT',
          input: value
        }
      });
    }

    next();
  };
};

module.exports = {
  validationMiddleware,
  validateEmail,
  validateIP,
  validateDomain,
  validateURL,
  validateUsername
};
