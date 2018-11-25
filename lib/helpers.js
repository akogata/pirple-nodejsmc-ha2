const crypto = require('crypto')
const config = require('../config')
const request = require('request')
const querystring = require('querystring')

const helpers = {}

helpers.charge = (apiUserId, params, callback) => {
  const headers = {
    'Idempotency-Key': helpers.createRandomString(9)
  }
  const dataString = querystring.stringify(params)
  const options = {
    url: 'https://api.stripe.com/v1/charges',
    method: 'POST',
    headers,
    body: dataString,
    auth: {
      user: apiUserId,
      pass: ''
    }
  }
  request(options, callback)
}

helpers.sendEmailNotification = (params, callback) => {
  const apiKey = '361355b8a9546f3d5fdbaceed0c8d140-1053eade-ff0f4ce1'
  const domainName = 'sandbox61113075ff1d43498b8d721e13671c0c.mailgun.org'
  params.from = `Pizza Delivery <postmaster@${domainName}>`
  const dataString = querystring.stringify(params)
  const options = {
    url: `https://api.mailgun.net/v3/${domainName}/messages`,
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + new Buffer('api:' + apiKey).toString('base64')
    },
    form: {
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text
    }
  }
  console.log('sendEmailNotification: ', options)
  request(options, callback)
}

helpers.hash = text => {
  if (typeof text === 'string' && text.length > 0) {
    return crypto.createHmac('sha256', config.hashingSecret).update(text).digest('hex')
  } else {
    return false
  }
}

helpers.parseJson = str => {
  try {
    return JSON.parse(str)
  } catch (err) {
    return {}
  }
}

helpers.createRandomString = strLength => {
  strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false
  if (strLength) {
    const possibleCharacters = 'abcdef0123456789'
    let str = ''
    for (let i = 0; i < strLength; i++) {
      const randomPosition = Math.floor(Math.random() * possibleCharacters.length)
      str += possibleCharacters.charAt(randomPosition)
    }
    return str
  } else {
    return false
  }
}

module.exports = helpers
