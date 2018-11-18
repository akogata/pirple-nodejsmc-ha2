const debug = require('util').debuglog('handlers')
const _data = require('./data')
const helpers = require('./helpers')

const handlers = {}

handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback)
  } else {
    debug('handlers.users: method unknown (' + data.method + ')')
    callback(405) // eslint-disable-line standard/no-callback-literal
  }
}

const _extractString = (input, defaultInput) => {
  const result = typeof input === 'string' && input.trim().length ? input.trim() : defaultInput
  debug('_extractString: ', input, result)
  return result
}

handlers._users = {}

// required data: email, password, name, address
handlers._users.post = (data, callback) => {
  const defaultValue = ''
  const email = _extractString(data.payload.email, defaultValue)
  const password = _extractString(data.payload.email, defaultValue)
  const name = _extractString(data.payload.name, defaultValue)
  const address = _extractString(data.payload.address, defaultValue)
  if (!email || !password || !name || !address) {
    callback(400, { 'Error': 'Missing required fields' }) // eslint-disable-line standard/no-callback-literal
    return
  }
  _data.read('users', email, (err, data) => {
    if (!err) {
      callback(400, { 'Error': 'A user with that email already existse' }) // eslint-disable-line standard/no-callback-literal
    } else {
      const hashedPassword = helpers.hash(password)
      if (!hashedPassword) {
        callback(500, { 'Error': 'Could not hash the user\'s password' }) // eslint-disable-line standard/no-callback-literal
      } else {
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
      }
    }
  })
}

handlers._users.get = (data, callback) => {
}

handlers._users.put = (data, callback) => {
}

handlers._users.delete = (data, callback) => {
}

handlers.tokens = (data, callback) => {
  debug('handlers.tokens:\n', data, '\n\n')
  callback(200) // eslint-disable-line standard/no-callback-literal
}

handlers.ping = (data, callback) => {
  debug('handlers.ping:\n', data, '\n\n')
  callback(200) // eslint-disable-line standard/no-callback-literal
}

handlers.notFound = (data, callback) => {
  callback(404) // eslint-disable-line standard/no-callback-literal
}

handlers.default = handlers.notFound

module.exports = handlers
