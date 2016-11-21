exports = module.exports = AskBidWatcher
var util = require('util')
var WebSocket = require('ws')
var WebSocketServer = require('ws').Server

var config = require('../config/config')
var sockWrap = require('./sockwrap')
var api = require('..')
var Api = new api({})
var AbstractWatcher = require('./abstractwatcher')

function AskBidWatcher (opts) {
  this.verbose = opts.verbose
  this.port = opts.port
  this.ee = opts.ee

  console.log('local AskBidWatcher  >>>', JSON.stringify(opts))
  return AbstractWatcher.apply(this, arguments)
}
util.inherits(AskBidWatcher , AbstractWatcher)

function eeCallbackProxy (ctx, obj) {
  var i = 0
  try {
    for (i = 0; i < ctx.connections.length; i++) {
      ctx.connections[i].send(JSON.stringify(obj))
    }
  } catch (e) {
    console.log('askbidwatcher : error : cleaning up connection', i, ' ', e)
    ctx.connections.splice(i, 1)
  }
}

AskBidWatcher.prototype.startIt = function () {
  console.log(' AskBidWatcher , start, wstext is :', this.wsText)
  this.wss = this.serverWrap()
  var that = this
  this.ee.on('ASK', function (obj) {
    // console.log('ASK cb', JSON.stringify(obj))
    eeCallbackProxy(that, obj)
  })
  this.ee.on('BID', function (obj) {
    // console.log('BID cb', JSON.stringify(obj))
    eeCallbackProxy(that, obj)
  })
// currently, these are proxied via execwatcher.js
// this.ee.on('fill:ask', fillAskCb)
// this.ee.on('fill:bid', fillBidCb)
}
