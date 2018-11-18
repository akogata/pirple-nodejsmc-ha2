const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')
const debug = require('util').debuglog('data')

let lib = {}

lib.baseDir = path.join(__dirname, '../.data/')

lib.create = function (dir, file, data, callback) {
  const fname = lib.baseDir + dir + '/' + file + '.json'
  debug('data.create.fname:', fname)
  fs.open(fname, 'wx', (err, fd) => {
    if (!err && fd) {
      const stringData = JSON.stringify(data)
      fs.writeFile(fd, stringData, err => {
        if (!err) {
          fs.close(fd, err => {
            if (!err) {
              callback(false) // eslint-disable-line standard/no-callback-literal
            } else {
              callback(new Error('Error closing new file'))
            }
          })
        } else {
          callback(new Error('Error writing to new file'))
        }
      })
    } else {
      callback(new Error('Could not create new file, it may already exist'))
    }
  })
}

lib.read = function (dir, file, callback) {
  const fname = lib.baseDir + dir + '/' + file + '.json'
  fs.readFile(fname, 'utf-8', (err, data) => {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data)
      callback(false, parsedData) // eslint-disable-line standard/no-callback-literal
    } else {
      callback(err, data)
    }
  })
}

lib.update = function (dir, file, data, callback) {
  const fname = lib.baseDir + dir + '/' + file + '.json'
  fs.open(fname, 'r+', (err, fd) => {
    if (!err && fd) {
      const stringData = JSON.stringify(data)
      fs.truncate(fd, err => {
        if (!err) {
          fs.writeFile(fd, stringData, err => {
            if (!err) {
              fs.close(fd, err => {
                if (!err) {
                  callback(false) // eslint-disable-line standard/no-callback-literal
                } else {
                  callback(new Error('Error closing file'))
                }
              })
            } else {
              callback(new Error('Error writing to updating file'))
            }
          })
        } else {
          callback(new Error('Error truncating file'))
        }
      })
    } else {
      callback(new Error('Could not open the file for updating, it may not exist yet'))
    }
  })
}

lib.delete = function (dir, file, callback) {
  const fname = lib.baseDir + dir + '/' + file + '.json'
  fs.unlink(fname, err => {
    if (!err) {
      callback(false) // eslint-disable-line standard/no-callback-literal
    } else {
      callback(new Error('Error deleting file'))
    }
  })
}

// list all the files in a directory
lib.list = (dir, callback) => {
  fs.readdir(lib.baseDir + dir + '/', (err, data) => {
    if (!err && data && data.length > 0) {
      const trimmedFileNames = []
      data.forEach(filename => {
        trimmedFileNames.push(filename.replace('.json', ''))
      })
      callback(null, trimmedFileNames)
    } else {
      callback(err, data)
    }
  })
}

module.exports = lib
