const faker = require('faker');

class EasyIdService {
  constructor() {
    // Initialize faker with a seed for consistent results if needed
    this.locales = {
      en: 'en',
      pt: 'pt_BR', 
      zh: 'zh_CN'
    };
  }

  // Generate a single fake person with all details
  generatePerson(locale = 'en', includeSensitive = false) {
    const originalLocale = faker.locale;
    faker.locale = this.locales[locale] || this.locales.en;

    const person = {
      // Basic info
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      fullName: faker.name.findName(),
      
      // Contact info
      email: faker.internet.email(),
      phone: faker.phone.phoneNumber(),
      mobile: faker.phone.phoneNumber(),
      
      // Address
      address: {
        street: faker.address.streetAddress(),
        city: faker.address.city(),
        state: faker.address.state(),
        zipCode: faker.address.zipCode(),
        country: faker.address.country(),
        countryCode: faker.address.countryCode()
      },
      
      // Personal details
      age: faker.datatype.number({ min: 18, max: 80 }),
      birthDate: faker.date.past(50, '2000-01-01').toISOString().split('T')[0],
      gender: faker.random.arrayElement(['Male', 'Female', 'Other']),
      
      // Online presence
      username: faker.internet.userName(),
      website: faker.internet.url(),
      avatar: faker.image.avatar(),
      
      // Professional info
      jobTitle: faker.name.jobTitle(),
      company: faker.company.companyName(),
      department: faker.commerce.department(),
      
      // Financial (if sensitive data is requested)
      ...(includeSensitive && {
        creditCard: {
          number: faker.finance.creditCardNumber(),
          type: this.getCreditCardType(faker.finance.creditCardNumber()),
          cvv: faker.finance.creditCardCVV(),
          expiry: faker.date.future(5).toISOString().slice(0, 7)
        },
        bankAccount: faker.finance.account(),
        iban: faker.finance.iban(),
        bitcoin: faker.finance.bitcoinAddress()
      })
    };

    // Restore original locale
    faker.locale = originalLocale;
    
    return person;
  }

  // Generate multiple people
  generatePeople(count = 1, locale = 'en', includeSensitive = false) {
    const people = [];
    for (let i = 0; i < count; i++) {
      people.push(this.generatePerson(locale, includeSensitive));
    }
    return people;
  }

  // Generate just basic contact info
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

  // Generate fake emails only
  generateEmails(count = 1, domain = null) {
    const emails = [];
    for (let i = 0; i < count; i++) {
      const email = domain 
        ? faker.internet.email(undefined, undefined, domain)
        : faker.internet.email();
      emails.push({
        email,
        username: email.split('@')[0],
        domain: email.split('@')[1]
      });
    }
    return emails;
  }

  // Generate fake usernames
  generateUsernames(count = 1, style = 'mixed') {
    const usernames = [];
    for (let i = 0; i < count; i++) {
      let username;
      switch (style) {
        case 'professional':
          username = faker.internet.userName().replace(/[^a-zA-Z0-9]/g, '');
          break;
        case 'gaming':
          username = faker.random.arrayElement([
            faker.internet.userName() + faker.datatype.number(999),
            faker.hacker.noun() + faker.hacker.verb(),
            faker.random.word() + faker.datatype.number(99)
          ]);
          break;
        case 'social':
          username = faker.internet.userName().toLowerCase();
          break;
        default: // mixed
          username = faker.internet.userName();
      }
      usernames.push({
        username,
        displayName: faker.name.findName(),
        bio: faker.lorem.sentence()
      });
    }
    return usernames;
  }

  // Generate fake addresses
  generateAddresses(count = 1, locale = 'en') {
    const addresses = [];
    for (let i = 0; i < count; i++) {
      const person = this.generatePerson(locale);
      addresses.push(person.address);
    }
    return addresses;
  }

  // Generate fake company data
  generateCompanies(count = 1, locale = 'en') {
    const companies = [];
    for (let i = 0; i < count; i++) {
      const originalLocale = faker.locale;
      faker.locale = this.locales[locale] || this.locales.en;
      
      companies.push({
        name: faker.company.companyName(),
        catchPhrase: faker.company.catchPhrase(),
        bs: faker.company.bs(),
        industry: faker.commerce.department(),
        website: faker.internet.url(),
        email: faker.internet.email(undefined, undefined, faker.internet.domainName()),
        phone: faker.phone.phoneNumber(),
        address: {
          street: faker.address.streetAddress(),
          city: faker.address.city(),
          state: faker.address.state(),
          zipCode: faker.address.zipCode(),
          country: faker.address.country()
        },
        employees: faker.datatype.number({ min: 1, max: 10000 }),
        founded: faker.date.past(50).getFullYear(),
        revenue: faker.finance.amount(100000, 1000000000, 0, '$')
      });
      
      faker.locale = originalLocale;
    }
    return companies;
  }

  // Generate fake credit cards (for testing purposes)
  generateCreditCards(count = 1, type = 'any') {
    const cards = [];
    for (let i = 0; i < count; i++) {
      const cardNumber = faker.finance.creditCardNumber();
      cards.push({
        number: cardNumber,
        type: this.getCreditCardType(cardNumber),
        cvv: faker.finance.creditCardCVV(),
        expiry: faker.date.future(5).toISOString().slice(0, 7),
        holderName: faker.name.findName()
      });
    }
    return cards;
  }

  // this right over here is a method to determine credit card type from number
  // its basically just a helper method
  getCreditCardType(cardNumber) {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const firstDigit = cleanNumber.charAt(0);
    const firstTwoDigits = cleanNumber.substring(0, 2);
    
    if (firstDigit === '4') return 'Visa';
    if (firstTwoDigits >= '51' && firstTwoDigits <= '55') return 'Mastercard';
    if (firstTwoDigits === '34' || firstTwoDigits === '37') return 'American Express';
    if (firstTwoDigits === '30' || firstTwoDigits === '36' || firstTwoDigits === '38') return 'Diners Club';
    if (firstTwoDigits === '35') return 'JCB';
    if (firstTwoDigits === '60' || firstTwoDigits === '65') return 'Discover';
    
    return 'Unknown';
  }

  // Generate fake social media profiles
  generateSocialProfiles(count = 1, platforms = ['all']) {
    const profiles = [];
    const allPlatforms = ['twitter', 'instagram', 'facebook', 'linkedin', 'github', 'tiktok', 'youtube'];
    const selectedPlatforms = platforms.includes('all') ? allPlatforms : platforms;
    
    for (let i = 0; i < count; i++) {
      const person = this.generatePerson();
      const profile = {
        username: person.username,
        displayName: person.fullName,
        bio: faker.lorem.sentence(),
        followers: faker.datatype.number({ min: 0, max: 1000000 }),
        following: faker.datatype.number({ min: 0, max: 5000 }),
        posts: faker.datatype.number({ min: 0, max: 10000 }),
        platforms: {}
      };

      selectedPlatforms.forEach(platform => {
        profile.platforms[platform] = {
          username: person.username + faker.datatype.number(99),
          url: `https://${platform}.com/${person.username}`,
          verified: faker.datatype.boolean()
        };
      });

      profiles.push(profile);
    }
    return profiles;
  }

  // Generate fake API keys/tokens (for testing)
  generateApiKeys(count = 1, type = 'mixed') {
    const keys = [];
    for (let i = 0; i < count; i++) {
      let key;
      switch (type) {
        case 'uuid':
          key = faker.datatype.uuid();
          break;
        case 'jwt':
          key = faker.random.alphaNumeric(64);
          break;
        case 'api':
          key = faker.random.alphaNumeric(32);
          break;
        default: // mixed
          key = faker.random.arrayElement([
            faker.datatype.uuid(),
            faker.random.alphaNumeric(32),
            faker.random.alphaNumeric(64)
          ]);
      }
      keys.push({
        key,
        type: type,
        generated: new Date().toISOString(),
        expires: faker.date.future(1).toISOString()
      });
    }
    return keys;
  }

  // Get available locales
  getAvailableLocales() {
    return Object.keys(this.locales);
  }

  // Generate random data based on type
  generateRandomData(type, count = 1, options = {}) {
    switch (type) {
      case 'person':
        return this.generatePeople(count, options.locale, options.includeSensitive);
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
