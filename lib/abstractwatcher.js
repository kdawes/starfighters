exports = module.exports = AbstractWatcher
var _ = require('lodash')
var WebSocket = require('ws')
var config = require('../config/config')
var WebSocketServer = require('ws').Server
var sockWrap = require('./sockwrap')

var api = require('..')
var Api = new api({})

function AbstractWatcher (opts) {
  this.connections = []
  this.wss = null
  this.port = opts.port
  console.log('AbstractWatcher >>>', JSON.stringify(opts))
  console.log('AbstractWatcher :this.wsText >>>', this.wsText)
  return {
    wss: function () { return wss },
    start: function () { this.startIt() }.bind(this),
    stop: function () { this.stop() }.bind(this),
    restart: function () { this.restart() }.bind(this)
  }
}

AbstractWatcher.prototype.restart = function () {
  this.stop()
  this.startIt()
}

AbstractWatcher.prototype.stop = function () {
  if (this.wss) {
    wss.close()
  }
}

AbstractWatcher.prototype.startIt = function () {
  /* Inheritors must implement this */
}

AbstractWatcher.prototype.serverWrap = function () {
  var that = this
  console.log('AbstractWatcher:serverWrap')

  this.wss = new WebSocketServer({ port: this.port })
  this.wss.on('connection', function connection (wsThing) {
    console.log('AbstractWatcher:CONNECTION')
    this.connections.push(wsThing)
  }.bind(this))
  this.wss.on('close', function () {
    console.log('AbstractWatcher:WSS  - client disconnected. Still active :  ', --active)
  })
}
