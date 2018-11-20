const debug = require('util').debuglog('handlers')
const _data = require('./data')
const helpers = require('./helpers')

const VALID_TOKENID_LENGTH = 20
const TIME_TO_EXPIRE = 1000 * 60 * 60 // in miliseconds

const handlers = {}

// dispatches the received request to a suitable handler according
// to the required method
handlers.users = (data, callback) => {
  debug('handlers.users')
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  const receivedMethod = data.method.toLowerCase()
  if (acceptableMethods.indexOf(receivedMethod) > -1) {
    handlers._users[receivedMethod](data, callback)
  } else {
    debug('handlers.users: method unknown (' + data.method + ')')
    callback(405) // eslint-disable-line standard/no-callback-literal
  }
}

handlers._users = {}

// required data: email, password, name, address
handlers._users.post = (data, callback) => {
  debug('handlers._users.post.data:', data)
  const defaultValue = ''
  const email = _extractString(data.payload.email, defaultValue)
  const password = _extractString(data.payload.password, defaultValue)
  const name = _extractString(data.payload.name, defaultValue)
  const address = _extractString(data.payload.address, defaultValue)
  if (!email || !password || !name || !address) {
    callback(400, { 'Error': 'Missing required fields' }) // eslint-disable-line standard/no-callback-literal
    return
  }
  _data.read('users', email, (err, data) => {
    if (!err) {
      callback(400, { 'Error': 'A user with that email already exists' }) // eslint-disable-line standard/no-callback-literal
      return
    }
    const hashedPassword = helpers.hash(password)
    if (!hashedPassword) {
      callback(500, { 'Error': 'Could not hash the user\'s password' }) // eslint-disable-line standard/no-callback-literal
      return
    }
    const userData = {
      email,
      hashedPassword,
      name,
      address
    }
    _data.create('users', email, userData, (err, data) => {
      if (err) {
        callback(500, { 'Error': 'Could not create the new user' }) // eslint-disable-line standard/no-callback-literal
      } else {
        callback(200) // eslint-disable-line standard/no-callback-literal
      }
    })
  })
}

// required fields: email
handlers._users.get = (inputData, callback) => {
  debug('handlers._users.get.data:', inputData)
  const email = _validEmail(inputData.queryStringObject.email)
  if (!email) {
    callback(400, { 'Error': 'Missing required field \'email\'' }) // eslint-disable-line standard/no-callback-literal
    return
  }
  if (!_validHeaderToken(inputData.headers.token)) {
    callback(403, { 'Error': 'Missing required token in header' }) // eslint-disable-line standard/no-callback-literal
    return
  }
  const tokenId = inputData.headers.token
  handlers._tokens.verifyToken(tokenId, email, isValid => {
    if (!isValid) {
      callback(403, { 'Error': 'Token is invalid' }) // eslint-disable-line standard/no-callback-literal
      return
    }
    _data.read('users', email, (err, userData) => {
      if (err) {
        callback(404, { 'Error': 'User not found' }) // eslint-disable-line standard/no-callback-literal
      } else {
        callback(200, userData) // eslint-disable-line standard/no-callback-literal
      }
    })
  })
}

// required field: email
// optional: password, name, address (at least one of them)
handlers._users.put = (inputData, callback) => {
  debug('handlers._users.put.data:', inputData)
  const defaultValue = ''
  const email = _extractString(inputData.payload.email, defaultValue)
  const hashedPassword = helpers.hash(_extractString(inputData.payload.password, defaultValue))
  const name = _extractString(inputData.payload.name, defaultValue)
  const address = _extractString(inputData.payload.address, defaultValue)
  if (!email) {
    callback(400, { 'Error': 'Missing required field \'email\'' }) // eslint-disable-line standard/no-callback-literal
    return
  }
  if (!_validHeaderToken(inputData.headers.token)) {
    callback(403, { 'Error': 'Missing required token in header' }) // eslint-disable-line standard/no-callback-literal
    return
  }
  const tokenId = inputData.headers.token
  handlers._tokens.verifyToken(tokenId, email, isValid => {
    if (!isValid) {
      callback(403, { 'Error': 'Token is invalid' }) // eslint-disable-line standard/no-callback-literal
      return
    }
    _data.read('users', email, (err, userData) => {
      if (err) {
        callback(404, { 'Error': 'User not found' }) // eslint-disable-line standard/no-callback-literal
        return
      }
      userData.hashedPassword = hashedPassword || userData.hashedPassword
      userData.name = name || userData.name
      userData.address = address || userData.address
      _data.update('users', email, userData, err => {
        if (err) {
          callback(400, { 'Error': 'Could not update user data' }) // eslint-disable-line standard/no-callback-literal
        } else {
          callback(200) // eslint-disable-line standard/no-callback-literal
        }
      })
    })
  })
}

// required field: email
handlers._users.delete = (inputData, callback) => {
  debug('handlers._users.delete:', inputData)
  const email = _validEmail(inputData.queryStringObject.email)
  if (!email) {
    callback(400, { 'Error': 'Missing required field \'email\'' }) // eslint-disable-line standard/no-callback-literal
    return
  }
  if (!_validHeaderToken(inputData.headers.token)) {
    callback(403, { 'Error': 'Missing required token in header' }) // eslint-disable-line standard/no-callback-literal
    return
  }
  const tokenId = inputData.headers.token
  handlers._tokens.verifyToken(tokenId, email, isValid => {
    if (!isValid) {
      callback(403, { 'Error': 'Token is invalid' }) // eslint-disable-line standard/no-callback-literal
      return
    }
    _data.delete('users', email, err => {
      if (err) {
        callback(400, { 'Error': 'Could not delete user data' }) // eslint-disable-line standard/no-callback-literal
      } else {
        callback(200) // eslint-disable-line standard/no-callback-literal
      }
    })
  })
}

// dispatches request to suitable function according to method
handlers.tokens = (data, callback) => {
  debug('handlers.tokens')
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  const receivedMethod = data.method.toLowerCase()
  if (acceptableMethods.indexOf(receivedMethod) > -1) {
    handlers._tokens[receivedMethod](data, callback)
  } else {
    debug('handlers.users: method unknown (' + data.method + ')')
    callback(405) // eslint-disable-line standard/no-callback-literal
  }
}

handlers._tokens = {}

// required field: email, password
// output: email, tokenId, expirationDate
handlers._tokens.post = (inputData, callback) => {
  debug('handlers._tokens.post.data:', inputData)
  const defaultValue = ''
  const email = _extractString(inputData.payload.email, defaultValue)
  const password = _extractString(inputData.payload.password, defaultValue)
  if (!email || !password) {
    callback(400, { 'Error': 'Missing required fields' }) // eslint-disable-line standard/no-callback-literal
    return
  }
  _data.read('users', email, (err, userData) => {
    if (err) {
      callback(404, { 'Error': 'User not found' }) // eslint-disable-line standard/no-callback-literal
      return
    }
    const hashedPassword = helpers.hash(password)
    if (!hashedPassword) {
      callback(500, { 'Error': 'Could not hash the user\'s password' }) // eslint-disable-line standard/no-callback-literal
      return
    }
    if (hashedPassword !== userData.hashedPassword) {
      callback(400, { 'Error': 'Password did not match the specified user\'s stored password' }) // eslint-disable-line standard/no-callback-literal
      return
    }
    const tokenData = {
      email,
      id: helpers.createRandomString(VALID_TOKENID_LENGTH),
      expires: Date.now() + TIME_TO_EXPIRE
    }
    _data.create('tokens', tokenData.id, tokenData, (err, data) => {
      if (err) {
        callback(500, { 'Error': 'Could not create the new token' }) // eslint-disable-line standard/no-callback-literal
      } else {
        callback(200, tokenData) // eslint-disable-line standard/no-callback-literal
      }
    })
  })
}

// required field: id
handlers._tokens.get = (inputData, callback) => {
  const id = _validTokenId(inputData.queryStringObject.id)
  if (!id) {
    callback(400, { 'Error': 'Missing required field \'id\'' }) // eslint-disable-line standard/no-callback-literal
    return
  }
  _data.read('tokens', id, (err, tokenData) => {
    if (err) {
      callback(404, { 'Error': 'Could not find the token' }) // eslint-disable-line standard/no-callback-literal
    } else {
      callback(200, tokenData) // eslint-disable-line standard/no-callback-literal
    }
  })
}

// required fields: id, extend (bool)
handlers._tokens.put = (inputData, callback) => {
  debug('handlers._tokens.put.data:', inputData)
  const defaultValue = ''
  const id = _validTokenId(inputData.payload.id, defaultValue)
  const extend = _extractBoolean(inputData.payload.extend)
  if (!id || !extend) {
    callback(400, { 'Error': 'Missing required field(s) or field(s) are invalid' }) // eslint-disable-line standard/no-callback-literal
    return
  }
  _data.read('tokens', id, (err, tokenData) => {
    if (err) {
      callback(404, { 'Error': 'Token not found' }) // eslint-disable-line standard/no-callback-literal
      return
    }
    if (_tokenStillGood(tokenData.expires)) {
      callback(400, { 'Error': 'Token already expired and cannot be extended' }) // eslint-disable-line standard/no-callback-literal
      return
    }
    tokenData.expires = Date.now() + TIME_TO_EXPIRE
    _data.update('tokens', tokenData.id, tokenData, (err, data) => {
      if (err) {
        callback(500, { 'Error': 'Could not update the token\'s expiration' }) // eslint-disable-line standard/no-callback-literal
      } else {
        callback(200, tokenData) // eslint-disable-line standard/no-callback-literal
      }
    })
  })
}

// required fields: id
handlers._tokens.delete = (inputData, callback) => {
  debug('handlers._tokens.delete:', inputData)
  const id = _validTokenId(inputData.queryStringObject.id)
  if (!id) {
    callback(400, { 'Error': 'Missing required field \'id\'' }) // eslint-disable-line standard/no-callback-literal
  } else {
    _data.delete('tokens', id, err => {
      if (err) {
        callback(400, { 'Error': 'Could not delete token data' }) // eslint-disable-line standard/no-callback-literal
      } else {
        callback(200) // eslint-disable-line standard/no-callback-literal
      }
    })
  }
}

handlers._tokens.verifyToken = (id, email, callback) => {
  _data.read('tokens', id, (err, tokenData) => {
    if (err) {
      callback(false) // eslint-disable-line standard/no-callback-literal
    } else {
      callback(tokenData.email === email && _tokenStillGood(tokenData.expires))
    }
  })
}

handlers.ping = (data, callback) => {
  debug('handlers.ping:\n', data, '\n\n')
  callback(200) // eslint-disable-line standard/no-callback-literal
}

handlers.notFound = (data, callback) => {
  callback(404) // eslint-disable-line standard/no-callback-literal
}

function _extractString (input, defaultInput) {
  const result = typeof input === 'string' && input.trim().length ? input.trim() : defaultInput
  debug('_extractString: ', input, result)
  return result
}

function _extractBoolean (input) {
  return typeof input === 'boolean' && input
}

// simple check: if txt has a '@' will be accepted as a valid email for now
function _validEmail (txt) {
  if (typeof txt === 'string' && txt && txt.length && txt.indexOf('@') > -1) {
    return txt.trim()
  }
  return false
}

// simple check: if txt has the expected length for a tokenId
function _validTokenId (txt) {
  if (typeof txt === 'string' && txt && txt.length === VALID_TOKENID_LENGTH) {
    return txt
  }
  return false
}

function _tokenStillGood (token) {
  debug('_tokenStillGood:', Date.now() < token)
  return Date.now() < token
}

function _validHeaderToken (txt) {
  if (typeof txt === 'string' && txt) {
    return txt
  }
  return false
}

handlers.defaultHandler = handlers.notFound

module.exports = handlers
