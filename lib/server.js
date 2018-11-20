const http = require('http')
const https = require('https')
const debug = require('util').debuglog('server')
const config = require('../config')
const fs = require('fs')
const path = require('path')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const handlers = require('./handlers')
const helpers = require('./helpers')

const server = {}

server.httpServer = http.createServer(unifiedServer)
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
}
server.httpsServer = https.createServer(server.httpsServerOptions, unifiedServer)

function unifiedServer (req, res) {
  const parsedUrl = url.parse(req.url, true)
  const path = parsedUrl.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g, '')
  const method = req.method.toLowerCase()
  const queryStringObject = parsedUrl.query
  const headers = req.headers
  const decoder = new StringDecoder('utf-8')
  let buffer = ''
  req.on('data', data => {
    buffer += decoder.write(data)
  })
  req.on('end', () => {
    buffer += decoder.end()

    // route the request to suitable function
    const chosenHandler = server.router[trimmedPath] || handlers.defaultHandler

    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJson(buffer)
    }
    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof statusCode === 'number' ? statusCode : 500
      payload = typeof payload === 'object' ? payload : {}
      const payloadString = JSON.stringify(payload)

      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode)
      res.end(payloadString)
    })

    debug('Request: ' + method + ' on [' + trimmedPath + '] with queryString [', queryStringObject, ']')
    debug('Header: ', headers)
    debug('Payload: ', buffer)
  })
}

server.init = () => {
  const httpColor = '\x1b[36m%s\x1b[0m'
  const httpsColor = '\x1b[35m%s\x1b[0m'

  server.httpServer.listen(config.httpPort, () => {
    console.log(httpColor, `Http server listening on port ${config.httpPort} now in ${config.envName} mode`)
  })

  server.httpsServer.listen(config.httpsPort, () => {
    console.log(httpsColor, `Https server listening on port ${config.httpsPort} now in ${config.envName} mode`)
  })
}

server.router = {
  users: handlers.users,
  tokens: handlers.tokens,
  menu: handlers.menu,
  orders: handlers.orders,
  ping: handlers.ping
}

module.exports = server
