let fakerLegacy = null;
let FakerClass = null;
let defaultFaker = null;
let locales = {};
try {
  // modern api with locale-aware instances :D
  const fakerPkg = require('@faker-js/faker');
  FakerClass = fakerPkg.Faker;
  defaultFaker = fakerPkg.faker;

  locales = {
    en: fakerPkg.en_US,   // default to US English
    nl: fakerPkg.nl,      // Netherlands
    be: fakerPkg.nl_BE    // Belgium (Dutch)
  };
} catch (e) {
  // legacy fallback incase the modern api fails.
  fakerLegacy = require('faker');
}

class EasyIdService {
  constructor() {
    // legacy faker locale codes (v6) for our supported locales
    this.locales = { en: 'en_US', nl: 'nl', be: 'nl_BE' };
  }

  // Helper for faker fallbacks (modern -> legacy)
  fakerCall(f, modernPath, legacyPath, ...args) {
    const modern = modernPath.split('.').reduce((obj, key) => obj?.[key], f);
    return modern ? modern(...args) : legacyPath.split('.').reduce((obj, key) => obj?.[key], f)?.(...args);
  }

  // creates a faker instance for the requested locale
  // this is just a wrapper around the faker instance.
  getFaker(locale = 'en', seed = null) {
    if (FakerClass) {
      const loc = locales[locale] || locales.en;
      const f = new FakerClass({ locale: loc });
      if (seed !== null && f.seed) {
        const seedInt = Number(seed);
        if (!Number.isNaN(seedInt)) f.seed(seedInt);
      }
      return f;
    }
    // legacy global-locale switch (kept for compatibility)
    const original = fakerLegacy.locale;
    fakerLegacy.locale = this.locales[locale] || this.locales.en;
    if (seed !== null && fakerLegacy.seed) {
      const seedInt = Number(seed);
      if (!Number.isNaN(seedInt)) fakerLegacy.seed(seedInt);
    }
    // provides a tiny cute proxy that restores locale on dispose
    const api = fakerLegacy;
    api.__restore = () => (fakerLegacy.locale = original);
    return api;
  }

  // generates a single fake person with all details. should be obvious.
  generatePerson(locale = 'en', includeSensitive = false, seed = null) {
    const f = this.getFaker(locale, seed);

    // basic info generation. pretty simple.
    const firstName = this.fakerCall(f, 'person.firstName', 'name.firstName');
    const lastName = this.fakerCall(f, 'person.lastName', 'name.lastName');
    const baseDomain = this.fakerCall(f, 'internet.domainName', 'internet.domainName');
    const username = this.fakerCall(f, 'internet.username', 'internet.userName', { firstName, lastName }).replace(/\./g, '_');

    // age and birthdate - keep it simple
    const age = this.fakerCall(f, 'number.int', 'datatype.number', { min: 18, max: 80 });
    const birthDateObj = new Date(Date.now() - age * 365.25 * 24 * 60 * 60 * 1000);
    const birthDate = birthDateObj.toISOString().split('T')[0];

    // address fields and country code stuff
    const address = {
      street: this.fakerCall(f, 'location.streetAddress', 'address.streetAddress'),
      city: this.fakerCall(f, 'location.city', 'address.city'),
      state: this.fakerCall(f, 'location.state', 'address.state'),
      zipCode: this.fakerCall(f, 'location.zipCode', 'address.zipCode'),
      country: this.fakerCall(f, 'location.country', 'address.country'),
      countryCode: this.fakerCall(f, 'location.countryCode', 'address.countryCode', 'alpha-2')
    };

    // normalizing address country based on locale
    const countryOverrides = { en: { country: 'United States', countryCode: 'US' }, nl: { country: 'Netherlands', countryCode: 'NL' }, be: { country: 'Belgium', countryCode: 'BE' } };
    const override = countryOverrides[(locale || 'en').toLowerCase()];
    if (override) Object.assign(address, override);

    // building email from name + domain
    const emailLocal = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
    const email = `${emailLocal}@${baseDomain}`;

    const person = {
      // basic info
      firstName,
      lastName,
      fullName: f.person?.fullName ? f.person.fullName({ firstName, lastName }) : `${firstName} ${lastName}`,

      // contact info
      email,
      phone: this.fakerCall(f, 'phone.number', 'phone.phoneNumber'),
      mobile: this.fakerCall(f, 'phone.number', 'phone.phoneNumber'),

      // address
      address,

      // personal details
      age,
      birthDate,
      gender: this.fakerCall(f, 'person.sexType', 'random.arrayElement', ['male', 'female', 'other']) || 'other',

      // online presence
      username,
      website: `https://${baseDomain}`,
      avatar: this.fakerCall(f, 'image.avatarGitHub', 'image.avatar'),

      // professional info
      jobTitle: this.fakerCall(f, 'person.jobTitle', 'name.jobTitle'),
      company: this.fakerCall(f, 'company.name', 'company.companyName'),
      department: this.fakerCall(f, 'commerce.department', 'commerce.department'),

      // financial data (if requested)
      ...(includeSensitive && (() => {
        const ccNumber = this.fakerCall(f, 'finance.creditCardNumber', 'finance.creditCardNumber');
        const accountNumber = this.fakerCall(f, 'finance.accountNumber', 'finance.account');
        const isUS = address.countryCode === 'US';
        const maybeRouting = isUS ? this.fakerCall(f, 'finance.routingNumber', 'finance.routingNumber') : null;
        const maybeIban = !isUS ? this.fakerCall(f, 'finance.iban', 'finance.iban', { countryCode: address.countryCode }) : null;

        return {
          creditCard: {
            number: ccNumber,
            type: this.getCreditCardType(ccNumber),
            cvv: this.fakerCall(f, 'finance.creditCardCVV', 'finance.creditCardCVV'),
            expiry: this.fakerCall(f, 'date.future', 'date.future', 5).toISOString().slice(0, 7)
          },
          bankAccount: accountNumber,
          ...(maybeRouting && { routingNumber: maybeRouting }),
          ...(maybeIban && { iban: maybeIban }),
          bitcoin: this.fakerCall(f, 'finance.bitcoinAddress', 'finance.bitcoinAddress')
        };
      })())
    };
    
    // Restore legacy locale if needed
    if (f.__restore) f.__restore();
    
    return person;
  }

  // generates multiple people basically. just calls the generatePerson function multiple times
  generatePeople(count = 1, locale = 'en', includeSensitive = false, seed = null) {
    return Array.from({ length: count }, () => this.generatePerson(locale, includeSensitive, seed));
  }

  generateContactInfo(count = 1, locale = 'en') {
    return Array.from({ length: count }, () => {
      const person = this.generatePerson(locale);
      return {
        name: person.fullName,
        email: person.email,
        phone: person.phone,
        company: person.company
      };
    });
  }

  generateEmails(count = 1, domain = null) {
    return Array.from({ length: count }, () => {
      const f = this.getFaker();
      const email = domain
        ? (f.internet?.email?.({ domain }) || f.internet.email(undefined, undefined, domain))
        : (f.internet?.email?.() || f.internet.email());
      return {
        email,
        username: email.split('@')[0],
        domain: email.split('@')[1]
      };
    });
  }

  generateUsernames(count = 1, style = 'mixed') {
    return Array.from({ length: count }, () => {
      const f = this.getFaker();
      let username;
      switch (style) {
        case 'professional':
          username = (f.internet?.username?.() || f.internet.userName()).replace(/[^a-zA-Z0-9]/g, '');
          break;
        case 'gaming':
          username = (f.helpers?.arrayElement || (arr => arr[Math.floor(Math.random()*arr.length)]))([
            (f.internet?.username?.() || f.internet.userName()) + (f.number?.int?.({ max: 999 }) || f.datatype.number(999)),
            (f.hacker?.noun?.() || 'hack') + (f.hacker?.verb?.() || 'code'),
            (f.word?.noun?.() || f.random.word()) + (f.number?.int?.({ max: 99 }) || f.datatype.number(99))
          ]);
          break;
        case 'social':
          username = (f.internet?.username?.() || f.internet.userName()).toLowerCase();
          break;
        default: // mixed
          username = (f.internet?.username?.() || f.internet.userName());
      }
      return {
        username,
        displayName: (f.person?.fullName?.() || f.name.findName()),
        bio: (f.lorem?.sentence?.() || f.lorem.sentence())
      };
    });
  }

  generateAddresses(count = 1, locale = 'en') {
    return Array.from({ length: count }, () => this.generatePerson(locale).address);
  }

  generateCompanies(count = 1, locale = 'en') {
    return Array.from({ length: count }, () => {
      const f = this.getFaker(locale);
      
      const company = {
        name: (f.company?.name?.() || f.company.companyName()),
        catchPhrase: (f.company?.catchPhrase?.() || f.company.catchPhrase()),
        bs: (f.company?.buzzPhrase?.() || f.company.bs()),
        industry: (f.commerce?.department?.() || f.commerce.department()),
        website: (f.internet?.url?.() || f.internet.url()),
        email: (f.internet?.email?.({ provider: f.internet?.domainName?.() || f.internet.domainName() }) || f.internet.email(undefined, undefined, f.internet.domainName())),
        phone: (f.phone?.number?.() || f.phone.phoneNumber()),
        address: {
          street: (f.location?.streetAddress?.() || f.address.streetAddress()),
          city: (f.location?.city?.() || f.address.city()),
          state: (f.location?.state?.() || f.address.state()),
          zipCode: (f.location?.zipCode?.() || f.address.zipCode()),
          country: (f.location?.country?.() || f.address.country())
        },
        employees: (f.number?.int?.({ min: 1, max: 10000 }) || f.datatype.number({ min: 1, max: 10000 })),
        founded: (f.date?.past?.(50).getFullYear?.() || f.date.past(50).getFullYear()),
        revenue: (f.finance?.amount?.(100000, 1000000000, 0, '$') || f.finance.amount(100000, 1000000000, 0, '$'))
      };
      if (f.__restore) f.__restore();
      return company;
    });
  }

  // super illegal credit cards. (jk lol. fake info)
  generateCreditCards(count = 1, type = 'any') {
    return Array.from({ length: count }, () => {
      const f = this.getFaker();
      const cardNumber = (f.finance?.creditCardNumber?.() || f.finance.creditCardNumber());
      return {
        number: cardNumber,
        type: this.getCreditCardType(cardNumber),
        cvv: (f.finance?.creditCardCVV?.() || f.finance.creditCardCVV()),
        expiry: (f.date?.future?.(5) || f.date.future(5)).toISOString().slice(0, 7),
        holderName: (f.person?.fullName?.() || f.name.findName())
      };
    });
  }

  getCreditCardType(cardNumber) {
    const num = cardNumber.replace(/\D/g, '');
    const d1 = num.charAt(0);
    const d2 = num.substring(0, 2);
    const d3 = parseInt(num.substring(0, 3), 10);
    const d4 = parseInt(num.substring(0, 4), 10);

    if (d1 === '4') return 'Visa';
    if (d2 >= 51 && d2 <= 55 || d4 >= 2221 && d4 <= 2720) return 'Mastercard';
    if (d2 === '34' || d2 === '37') return 'American Express';
    if (d4 === 6011 || d2 === '65' || d3 >= 644 && d3 <= 649) return 'Discover';
    if (d4 >= 3528 && d4 <= 3589) return 'JCB';
    if (d3 >= 300 && d3 <= 305 || d2 === '36' || d2 === '38' || d2 === '39') return 'Diners Club';
    if (d2 === '62') return 'UnionPay';
    if (d2 === '50' || d2 >= 56 && d2 <= 59 || d2 === '63' || d2 === '67' || d2 >= 68 && d2 <= 69) return 'Maestro';
    return 'Unknown';
  }

  // OPSEC-focused social identity generator. honestly just creates believable fake online personas
  async generateSocialProfiles(count = 1, locale = 'en', useIpForLocation = false, userIp = null, seed = null) {
    const profiles = [];
    
    for (let i = 0; i < count; i++) {
      const f = this.getFaker(locale, seed);
      
      // this is just generating a consistent fake identity that looks believable and legitimate
      const fakeFirstName = (f.person?.firstName?.() || f.name.firstName());
      const fakeLastName = (f.person?.lastName?.() || f.name.lastName());
      const fakeFullName = `${fakeFirstName} ${fakeLastName}`;
      
      const legitimateNames = [
        'Alex Johnson', 'Sarah Williams', 'Mike Davis', 'Emma Brown', 'Chris Wilson',
        'Jessica Miller', 'David Garcia', 'Lisa Martinez', 'Ryan Anderson', 'Amy Taylor',
        'Kevin Thomas', 'Rachel Jackson', 'James White', 'Michelle Harris', 'Daniel Martin',
        'Jennifer Thompson', 'Robert Garcia', 'Amanda Martinez', 'Christopher Robinson',
        'Stephanie Clark', 'Matthew Rodriguez', 'Ashley Lewis', 'Andrew Lee', 'Nicole Walker',
        'Joshua Hall', 'Samantha Allen', 'Brandon Young', 'Megan King', 'Tyler Wright'
      ];
      
      // 30% chance to use a pre-made legitimate name
      const useLegitimateName = (f.datatype?.boolean?.() || (Math.random() < 0.3));
      const finalName = useLegitimateName 
        ? f.helpers?.arrayElement?.(legitimateNames) || legitimateNames[Math.floor(Math.random() * legitimateNames.length)]
        : fakeFullName;
      
      // creating a base username
      const baseUsername = this.generateOPSECUsername(f, fakeFirstName, fakeLastName);
      
      // believable age and join year
      const age = (f.number?.int?.({ min: 18, max: 24 }) || f.datatype.number({ min: 18, max: 24 }));
      const joinYear = (f.number?.int?.({ min: 2015, max: 2023 }) || f.datatype.number({ min: 2015, max: 2023 }));
      
      // realistic but fake location
      let fakeLocation;
      let detectedLocation = null;
      let detectedLocale = locale;
      
      let actualIp = userIp;
      
      if (useIpForLocation && userIp) {
        // using real IP-based location and language detection
        const ipData = await this.getRealIpLocation(userIp);
        fakeLocation = ipData.location;
        detectedLocation = ipData.location;
        detectedLocale = ipData.locale || locale;
        actualIp = ipData.actualIp || userIp; // Store the actual IP used
      } else {
        // faker has generated location
        fakeLocation = (f.location?.city?.() || f.address.city()) + ', ' + (f.location?.state?.() || f.address.state());
      }

      // generating personality tags for OPSEC behavior guidance
      const personalityTags = ['curious', 'quiet', 'monotone', 'reserved', 'analytical', 'cautious', 'observant', 'methodical', 'introverted', 'thoughtful', 'mysterious', 'independent', 'private', 'discreet', 'subtle', 'unassuming', 'low-key', 'minimalist', 'focused', 'deliberate', 'measured', 'understated'];
      const selectedTraits = f.helpers?.shuffle?.(personalityTags).slice(0, f.number?.int?.({ min: 3, max: 4 }) || 3) || personalityTags.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      // generating language preferences based on detected locale
      const languagePreferences = this.getLanguagePreferences(detectedLocale);
      
      // generating a profile picture URL using the seed for consistency
      const profilePicture = this.generateProfilePicture(f, fakeFirstName, fakeLastName, seed, i);
      
      const profile = {
        // OPSEC-focused identity - only useful information.
        username: baseUsername,
        displayName: finalName,
        location: fakeLocation,
        age: age,
        joinYear: joinYear,
        avatar: profilePicture,
        personalityTags: selectedTraits,
        languagePreferences: languagePreferences,

        // adding IP information when using IP-based location
        ...(useIpForLocation && userIp && {
          ipInfo: {
            ip: this.censorIp(actualIp), // using the actual IP used for geolocation
            detectedLocation: detectedLocation || fakeLocation,
            detectedLocale: detectedLocale,
            note: 'Real IP-based location and language detection enabled'
          }
        })
      };

      profiles.push(profile);
    }
    return profiles;
  }

  generateOPSECUsername(f, firstName, lastName) {
    const styles = [
      () => firstName.toLowerCase(),
      () => firstName.toLowerCase() + lastName.charAt(0).toLowerCase(),
      () => firstName.toLowerCase() + lastName.toLowerCase(),
      () => `${this.fakerCall(f, 'word.adjective', 'random.word')}${this.fakerCall(f, 'word.noun', 'random.word')}`.toLowerCase(),
      () => firstName.toLowerCase() + this.fakerCall(f, 'word.noun', 'random.word').toLowerCase(),
      () => this.fakerCall(f, 'internet.username', 'internet.userName').toLowerCase(),
      () => firstName.toLowerCase() + this.fakerCall(f, 'word.adjective', 'random.word').toLowerCase(),
      () => lastName.toLowerCase() + firstName.charAt(0).toLowerCase()
    ];

    // prefer no numbers (80% chance), occasional numbers (20%)
    const selectedStyle = Math.random() < 0.8 ? styles[Math.floor(Math.random() * (styles.length - 1))] : () => firstName.toLowerCase() + (f.number?.int?.({ max: 99 }) || f.datatype.number(99));
    return selectedStyle().replace(/[^a-z0-9]/g, '');
  }


  // realistic language preferences - most people only know their native language + English
  getLanguagePreferences(locale) {
    const languageMap = {
      'en': { primary: 'English', secondary: ['Spanish'] },
      'nl': { primary: 'Dutch', secondary: ['English'] },
      'be': { primary: 'Dutch', secondary: ['English', 'French'] },
      'de': { primary: 'German', secondary: ['English'] },
      'fr': { primary: 'French', secondary: ['English'] },
      'es': { primary: 'Spanish', secondary: ['English'] },
      'it': { primary: 'Italian', secondary: ['English'] },
      'pt': { primary: 'Portuguese', secondary: ['English'] },
      'ru': { primary: 'Russian', secondary: ['English'] },
      'ja': { primary: 'Japanese', secondary: ['English'] },
      'ko': { primary: 'Korean', secondary: ['English'] },
      'zh': { primary: 'Chinese', secondary: ['English'] }
    };
    
    const config = languageMap[locale] || languageMap['en'];
    
    // 70% chance of having only primary language, 30% chance of having one secondary
    const hasSecondary = Math.random() < 0.3;
    const selectedSecondary = hasSecondary ? [config.secondary[Math.floor(Math.random() * config.secondary.length)]] : [];
    
    return {
      primary: config.primary,
      secondary: selectedSecondary,
      proficiency: 'Native'
    };
  }

  // realistic-looking fake people avatars
  generateProfilePicture(f, firstName, lastName, seed = null, index = 0) {
    const avatarSeed = seed ? `${seed}-${index}` : `${firstName}-${lastName}-${index}`;
    return `https://i.pravatar.cc/256?u=${encodeURIComponent(avatarSeed)}`;
  }

  // censoring the IP address for display (shows only first two octets)
  censorIp(ip) {
    if (!ip) return 'xxx.xxx.xxx.xxx';
    const parts = ip.split('.');
    if (parts.length !== 4) return 'xxx.xxx.xxx.xxx';
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }

  // IP geolocation using public IP detection (with fallback)
  async getRealIpLocation(ip) {
    // getting the actual public IP using api.ipify.org
    try {
      const publicIpResponse = await fetch('https://api.ipify.org?format=json', {
        headers: { 'User-Agent': 'OSINT-Toolkit/1.0' }
      });
      const { ip: publicIp } = await publicIpResponse.json();
      ip = publicIp;
    } catch {
      ip = '8.8.8.8';
    }

    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        headers: { 'User-Agent': 'OSINT-Toolkit/1.0', 'Accept': 'application/json' },
        signal: controller.signal
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.reason || 'IP geolocation failed');
      
      
      // mapping country codes to supported locales
      const countryToLocale = { US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en', DE: 'de', AT: 'de', CH: 'de', FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr', ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', VE: 'es', IT: 'it', SM: 'it', VA: 'it', NL: 'nl', PT: 'pt', BR: 'pt', RU: 'ru', JP: 'ja', KR: 'ko', CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh' };

      return {
        location: `${data.city || 'Unknown City'}, ${data.region || 'Unknown Region'}, ${data.country_name || 'Unknown Country'}`,
        locale: countryToLocale[data.country_code] || 'en',
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'XX',
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        actualIp: ip
      };

    } catch (error) {
      console.warn('IP geolocation failed for IP:', ip, 'Error:', error.message);
      return {
        location: 'Mountain View, CA, United States',
        locale: 'en',
        country: 'United States',
        countryCode: 'US',
        city: 'Mountain View',
        region: 'CA',
        actualIp: ip
      };
    }
  }


  // fake api keys/tokens idk why this is here but i can have it so i want it.
  generateApiKeys(count = 1, type = 'mixed') {
    return Array.from({ length: count }, () => {
      let key;
      const f = this.getFaker();
      switch (type) {
        case 'uuid':
          key = (f.string?.uuid?.() || f.datatype.uuid());
          break;
        case 'jwt':
          key = (f.string?.alphanumeric?.(64) || f.random.alphaNumeric(64));
          break;
        case 'api':
          key = (f.string?.alphanumeric?.(32) || f.random.alphaNumeric(32));
          break;
        default: // mixed
          key = (f.helpers?.arrayElement || (arr => arr[Math.floor(Math.random()*arr.length)]))([
            (f.string?.uuid?.() || f.datatype.uuid()),
            (f.string?.alphanumeric?.(32) || f.random.alphaNumeric(32)),
            (f.string?.alphanumeric?.(64) || f.random.alphaNumeric(64))
          ]);
      }
      return {
        key,
        type: type,
        generated: new Date().toISOString(),
        expires: (f.date?.future?.(1) || f.date.future(1)).toISOString()
      };
    });
  }

  // gets available locales, basically just returns the locales object
  getAvailableLocales() {
    return Object.keys(this.locales);
  }

  // the name says it again, this generates random data based on the type
  async generateRandomData(type, count = 1, options = {}, seed = null) {
    switch (type) {
      case 'person':
        return this.generatePeople(count, options.locale, options.includeSensitive, seed);
      case 'contact':
        return this.generateContactInfo(count, options.locale);
      case 'email':
        return this.generateEmails(count, options.domain);
      case 'username':
        return this.generateUsernames(count, options.style);
      case 'address':
        return this.generateAddresses(count, options.locale);
      case 'company':
        return this.generateCompanies(count, options.locale);
      case 'creditcard':
        return this.generateCreditCards(count, options.type);
      case 'basic_opsec':
        return await this.generateSocialProfiles(count, options.locale, options.useIpForLocation, options.userIp, seed);
      case 'apikey':
        return this.generateApiKeys(count, options.type);
      default:
        throw new Error(`Unknown data type: ${type}`);
    }
  }
}

module.exports = new EasyIdService();
