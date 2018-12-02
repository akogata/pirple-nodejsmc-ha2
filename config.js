let environments = {}

environments.staging = {
  envName: 'staging',
  httpPort: 3000,
  httpsPort: 3001,
  hashingSecret: 'staging salt',
  payment: { // from stripe
    apiUserId: process.env.PAYMENT_APIUSERID || '',
    currency: 'usd'
  },
  emailNotification: { // from mailgun
    apiKey: process.env.EMAILNOTIFICATION_APIKEY || '',
    domainName: process.env.EMAILNOTIFICATION_DOMAINNAME || ''
  }
}

environments.production = {
  envName: 'production',
  httpPort: 5000,
  httpsPort: 5001,
  hashingSecret: 'production salt',
  payment: { // from stripe
    apiUserId: process.env.PAYMENT_APIUSERID || '',
    currency: 'usd'
  },
  emailNotification: { // from mailgun
    apiKey: process.env.EMAILNOTIFICATION_APIKEY || '',
    domainName: process.env.EMAILNOTIFICATION_DOMAINNAME || ''
  }
}

const currentEnvironment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : ''

const environmentToExport = typeof environments[currentEnvironment] === 'object' ? environments[currentEnvironment] : environments.staging

module.exports = environmentToExport
