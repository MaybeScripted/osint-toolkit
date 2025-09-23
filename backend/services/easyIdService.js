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

    // generates some basic info. aka atomic values first to keep fields consistent
    const firstName = (f.person?.firstName?.() || f.name.firstName());
    const lastName = (f.person?.lastName?.() || f.name.lastName());
    const baseDomain = (f.internet?.domainName?.() || f.internet.domainName());
    const username = (f.internet?.username
      ? f.internet.username({ firstName, lastName })
      : f.internet.userName(firstName, lastName)).replace(/\./g, '_');

    // birthdate first, then compute age to ensure it makes sense.
    const birthDateObj = f.date?.birthdate
      ? f.date.birthdate({ min: 18, max: 80, mode: 'age' })
      : f.date.between('1940-01-01', '2005-12-31');
    const birthDate = birthDateObj.toISOString().split('T')[0];
    const now = new Date();
    const age = now.getFullYear() - birthDateObj.getFullYear() - (
      (now.getMonth() < birthDateObj.getMonth() || (
        now.getMonth() === birthDateObj.getMonth() && now.getDate() < birthDateObj.getDate()
      )) ? 1 : 0
    );

    // address shorthand plus derived countryCode when available
    const address = {
      street: (f.location?.streetAddress?.() || f.address.streetAddress()),
      city: (f.location?.city?.() || f.address.city()),
      state: (f.location?.state?.() || f.address.state()),
      zipCode: (f.location?.zipCode?.() || f.address.zipCode()),
      country: (f.location?.country?.() || f.address.country()),
      countryCode: (f.location?.countryCode ? f.location.countryCode('alpha-2') : f.address.countryCode())
    };

    // normalizes address country based on selected locale for consistency
    const normalizedLocale = (locale || 'en').toLowerCase();
    if (normalizedLocale === 'en') {
      address.country = 'United States';
      address.countryCode = 'US';
    } else if (normalizedLocale === 'nl') {
      address.country = 'Netherlands';
      address.countryCode = 'NL';
    } else if (normalizedLocale === 'be') {
      address.country = 'Belgium';
      address.countryCode = 'BE';
    }

    // builds email from name + domain to match username.
    // incase you're curious, yes this works across modern/legacy APIs.
    const emailLocal = `${firstName}.${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.|\.$/g, '');
    const email = `${emailLocal}@${baseDomain}`;

    const person = {
      // basic info
      firstName,
      lastName,
      fullName: (f.person?.fullName?.() ? f.person.fullName({ firstName, lastName }) : `${firstName} ${lastName}`),

      // contact info
      email,
      phone: (f.phone?.number?.() || f.phone.phoneNumber()),
      mobile: (f.phone?.number?.() || f.phone.phoneNumber()),

      // address (duh? read the name)
      address,

      // personal details
      age,
      birthDate,
      gender: (f.person?.sexType
        ? (f.helpers?.arrayElement?.(['male', 'female', 'other']) || 'other')
        : f.random?.arrayElement?.(['Male', 'Female', 'Other']) || 'Other'),

      // online presence
      username,
      website: `https://${baseDomain}`,
      avatar: (f.image?.avatarGitHub?.() || f.image.avatar()),

      // professional info
      jobTitle: (f.person?.jobTitle?.() || f.name.jobTitle()),
      company: (f.company?.name?.() || f.company.companyName()),
      department: (f.commerce?.department?.() || f.commerce.department()),

      // financial (if sensitive data is requested)
      ...(includeSensitive && (() => {
        const ccNumber = (f.finance?.creditCardNumber?.() || f.finance.creditCardNumber());
        const accountNumber = (f.finance?.accountNumber?.() || f.finance.account());
        const isUS = address.countryCode === 'US';
        const maybeRouting = isUS ? (f.finance?.routingNumber?.() || null) : null;
        const maybeIban = !isUS
          ? (f.finance?.iban?.({ countryCode: address.countryCode }) || f.finance.iban())
          : null;

        return {
          creditCard: {
            number: ccNumber,
            type: this.getCreditCardType(ccNumber),
            cvv: (f.finance?.creditCardCVV?.() || f.finance.creditCardCVV()),
            expiry: (f.date?.future?.(5) || f.date.future(5)).toISOString().slice(0, 7)
          },
          bankAccount: accountNumber,
          ...(maybeRouting ? { routingNumber: maybeRouting } : {}),
          ...(maybeIban ? { iban: maybeIban } : {}),
          bitcoin: (f.finance?.bitcoinAddress?.() || f.finance.bitcoinAddress())
        };
      })())
    };
    
    // Restore legacy locale if needed
    if (f.__restore) f.__restore();
    
    return person;
  }

  // generates multiple people basically. just calls the generatePerson function multiple times
  generatePeople(count = 1, locale = 'en', includeSensitive = false, seed = null) {
    const people = [];
    for (let i = 0; i < count; i++) {
      people.push(this.generatePerson(locale, includeSensitive, seed));
    }
    return people;
  }

  generateContactInfo(count = 1, locale = 'en') {
    const contacts = [];
    for (let i = 0; i < count; i++) {
      const person = this.generatePerson(locale);
      contacts.push({
        name: person.fullName,
        email: person.email,
        phone: person.phone,
        company: person.company
      });
    }
    return contacts;
  }

  generateEmails(count = 1, domain = null) {
    const emails = [];
    for (let i = 0; i < count; i++) {
      const f = this.getFaker();
      const email = domain
        ? (f.internet?.email?.({ domain }) || f.internet.email(undefined, undefined, domain))
        : (f.internet?.email?.() || f.internet.email());
      emails.push({
        email,
        username: email.split('@')[0],
        domain: email.split('@')[1]
      });
    }
    return emails;
  }

  generateUsernames(count = 1, style = 'mixed') {
    const usernames = [];
    for (let i = 0; i < count; i++) {
      let username;
      const f = this.getFaker();
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
      usernames.push({
        username,
        displayName: (f.person?.fullName?.() || f.name.findName()),
        bio: (f.lorem?.sentence?.() || f.lorem.sentence())
      });
    }
    return usernames;
  }

  generateAddresses(count = 1, locale = 'en') {
    const addresses = [];
    for (let i = 0; i < count; i++) {
      const person = this.generatePerson(locale);
      addresses.push(person.address);
    }
    return addresses;
  }

  generateCompanies(count = 1, locale = 'en') {
    const companies = [];
    for (let i = 0; i < count; i++) {
      const f = this.getFaker(locale);
      
      companies.push({
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
      });
      
      if (f.__restore) f.__restore();
    }
    return companies;
  }

  // super illegal credit cards. (jk lol. fake info)
  generateCreditCards(count = 1, type = 'any') {
    const cards = [];
    for (let i = 0; i < count; i++) {
      const f = this.getFaker();
      const cardNumber = (f.finance?.creditCardNumber?.() || f.finance.creditCardNumber());
      cards.push({
        number: cardNumber,
        type: this.getCreditCardType(cardNumber),
        cvv: (f.finance?.creditCardCVV?.() || f.finance.creditCardCVV()),
        expiry: (f.date?.future?.(5) || f.date.future(5)).toISOString().slice(0, 7),
        holderName: (f.person?.fullName?.() || f.name.findName())
      });
    }
    return cards;
  }

  // this right over here is a method to determine credit card type from number
  // its basically just a helper method
  getCreditCardType(cardNumber) {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const firstDigit = cleanNumber.charAt(0);
    const firstTwo = cleanNumber.substring(0, 2);
    const firstThree = cleanNumber.substring(0, 3);
    const firstFour = cleanNumber.substring(0, 4);
    const firstSix = cleanNumber.substring(0, 6);

    // fkn visa
    if (firstDigit === '4') return 'Visa';

    // lol MasterCard (51-55 or 2221-2720)
    const twoNum = parseInt(firstTwo, 10);
    const fourNum = parseInt(firstFour, 10);
    if ((twoNum >= 51 && twoNum <= 55) || (fourNum >= 2221 && fourNum <= 2720)) return 'Mastercard';

    // allmighty american express (34, 37)
    if (firstTwo === '34' || firstTwo === '37') return 'American Express';

    // discover (6011, 65, 644-649)
    const threeNum = parseInt(firstThree, 10);
    if (firstFour === '6011' || firstTwo === '65' || (threeNum >= 644 && threeNum <= 649)) return 'Discover';

    // jcb (3528-3589)
    const fourFirst = parseInt(firstFour, 10);
    if (fourFirst >= 3528 && fourFirst <= 3589) return 'JCB';

    // diners club (300-305, 36, 38-39)
    if ((threeNum >= 300 && threeNum <= 305) || firstTwo === '36' || firstTwo === '38' || firstTwo === '39') return 'Diners Club';

    // unionpay (62)
    if (firstTwo === '62') return 'UnionPay';

    // maestro (50, 56-59, 63, 67, 68-69)
    if (firstTwo === '50' || (twoNum >= 56 && twoNum <= 59) || firstTwo === '63' || firstTwo === '67' || (twoNum >= 68 && twoNum <= 69)) return 'Maestro';

    return 'Unknown';
  }

  // funtion name says it lmfao. generates fake social media profiles
  generateSocialProfiles(count = 1, platforms = ['all']) {
    const profiles = [];
    const allPlatforms = ['twitter', 'instagram', 'facebook', 'linkedin', 'github', 'tiktok', 'youtube'];
    const selectedPlatforms = platforms.includes('all') ? allPlatforms : platforms;
    
    for (let i = 0; i < count; i++) {
      const person = this.generatePerson();
      const f = this.getFaker();
      const profile = {
        username: person.username,
        displayName: person.fullName,
        bio: (f.lorem?.sentence?.() || f.lorem.sentence()),
        followers: (f.number?.int?.({ min: 0, max: 1000000 }) || f.datatype.number({ min: 0, max: 1000000 })),
        following: (f.number?.int?.({ min: 0, max: 5000 }) || f.datatype.number({ min: 0, max: 5000 })),
        posts: (f.number?.int?.({ min: 0, max: 10000 }) || f.datatype.number({ min: 0, max: 10000 })),
        platforms: {}
      };

      selectedPlatforms.forEach(platform => {
        profile.platforms[platform] = {
          username: person.username + ((f.number?.int?.({ max: 99 }) || f.datatype.number(99))),
          url: `https://${platform}.com/${person.username}`,
          verified: (f.datatype?.boolean?.() || (Math.random() < 0.5))
        };
      });

      profiles.push(profile);
    }
    return profiles;
  }

  // fake api keys/tokens idk why this is here but i can have it so i want it.
  generateApiKeys(count = 1, type = 'mixed') {
    const keys = [];
    for (let i = 0; i < count; i++) {
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
      keys.push({
        key,
        type: type,
        generated: new Date().toISOString(),
        expires: (f.date?.future?.(1) || f.date.future(1)).toISOString()
      });
    }
    return keys;
  }

  // gets available locales, basically just returns the locales object
  getAvailableLocales() {
    return Object.keys(this.locales);
  }

  // the name says it again, this generates random data based on the type
  generateRandomData(type, count = 1, options = {}, seed = null) {
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
      case 'social':
        return this.generateSocialProfiles(count, options.platforms);
      case 'apikey':
        return this.generateApiKeys(count, options.type);
      default:
        throw new Error(`Unknown data type: ${type}`);
    }
  }
}

module.exports = new EasyIdService();
