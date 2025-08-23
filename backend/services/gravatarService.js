const axios = require('axios');
const crypto = require('crypto');

class GravatarService {
  constructor() {
    this.baseURL = 'https://www.gravatar.com';
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'OSINT-Toolkit/1.0'
      }
    });
  }

  // gravatar uses md5 hashes for everything
  generateEmailHash(email) {
    return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  }

  // main lookup - checks for profile + avatar
  async checkProfile(email) {
    try {
      const emailHash = this.generateEmailHash(email);
      
      const profileResponse = await this.client.get(
        `${this.baseURL}/${emailHash}.json`,
        { timeout: 5000 }
      );

      if (profileResponse.status === 200 && profileResponse.data) {
        return {
          success: true,
          hasProfile: true,
          profile: profileResponse.data.entry?.[0] || profileResponse.data,
          avatarUrl: `${this.baseURL}/avatar/${emailHash}?s=200&d=404`,
          profileUrl: `${this.baseURL}/${emailHash}`
        };
      }

      return {
        success: true,
        hasProfile: false,
        avatarUrl: null,
        profileUrl: null
      };

    } catch (error) {
      if (error.response?.status === 404) {
        // no public profile but maybe has avatar
        const avatarExists = await this.checkAvatarExists(email);
        return {
          success: true,
          hasProfile: false,
          hasAvatar: avatarExists,
          avatarUrl: avatarExists ? `${this.baseURL}/avatar/${this.generateEmailHash(email)}?s=200` : null,
          profileUrl: null
        };
      }

      return {
        success: false,
        error: error.message,
        hasProfile: false
      };
    }
  }

  // checks if at least an avatar exists
  async checkAvatarExists(email) {
    try {
      const emailHash = this.generateEmailHash(email);
      
      const response = await this.client.head(
        `${this.baseURL}/avatar/${emailHash}?d=404`,
        { timeout: 3000 }
      );

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // pulls intel from gravatar profile data
  extractProfileIntelligence(gravatarData) {
    if (!gravatarData.success || !gravatarData.profile) {
      return {
        hasGravatar: gravatarData.hasAvatar || false,
        socialProfiles: [],
        names: [],
        locations: [],
        organizations: [],
        websites: []
      };
    }

    const profile = gravatarData.profile;
    const intelligence = {
      hasGravatar: true,
      socialProfiles: [],
      names: [],
      locations: [],
      organizations: [],
      websites: [],
      verified: profile.verified || false
    };

    if (profile.displayName) intelligence.names.push(profile.displayName);
    if (profile.name && profile.name.formatted) intelligence.names.push(profile.name.formatted);
    if (profile.name && profile.name.givenName && profile.name.familyName) {
      intelligence.names.push(`${profile.name.givenName} ${profile.name.familyName}`);
    }

    if (profile.currentLocation) intelligence.locations.push(profile.currentLocation);

    if (profile.organizations) {
      profile.organizations.forEach(org => {
        if (org.name) intelligence.organizations.push(org.name);
      });
    }

    if (profile.accounts) {
      profile.accounts.forEach(account => {
        intelligence.socialProfiles.push({
          service: account.shortname || account.domain,
          username: account.username,
          url: account.url,
          verified: account.verified || false
        });
      });
    }

    if (profile.urls) {
      profile.urls.forEach(url => {
        intelligence.websites.push({
          title: url.title,
          url: url.value
        });
      });
    }

    if (profile.aboutMe) intelligence.bio = profile.aboutMe;
    if (profile.profileUrl) intelligence.gravatarUrl = profile.profileUrl;

    return intelligence;
  }

  // different sized avatar urls
  getAvatarUrls(email) {
    const emailHash = this.generateEmailHash(email);
    return {
      small: `${this.baseURL}/avatar/${emailHash}?s=80`,
      medium: `${this.baseURL}/avatar/${emailHash}?s=200`,
      large: `${this.baseURL}/avatar/${emailHash}?s=400`,
      original: `${this.baseURL}/avatar/${emailHash}?s=2048`
    };
  }

  isConfigured() {
    return true; // gravatar is always free
  }

  async healthCheck() {
    try {
      const response = await this.client.head(
        `${this.baseURL}/avatar/test@example.com?d=404`,
        { timeout: 3000 }
      );
      return { status: 'healthy', message: 'Gravatar service is reachable' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

module.exports = new GravatarService();
