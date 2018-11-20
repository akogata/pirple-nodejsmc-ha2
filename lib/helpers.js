const crypto = require('crypto')
const config = require('../config')

const helpers = {}

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
