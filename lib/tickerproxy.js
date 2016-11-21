exports = module.exports = TickerProxy

var WebSocket = require('ws')
var config = require('../config/config')
var url = config.ws_api_root
var sockWrap = require('./sockwrap')
var _ = require('lodash')
var util = require('util')
var AbstractWatcher = require('./abstractwatcher')
//
// opts = {
// our producer we are watching  / proxying
// wsText : 'wss://api.stockfighter.io/ob/api/ws/WSH55472023/venues/TESTEX/tickertape',
// port : 8080, //we listen on this port
// }
function TickerProxy (opts) {
  this.wsText = opts.wsText
  this.instanceId = opts.instanceId
  this.verbose = opts.verbose
  this.port = opts.port
  this.ee = opts.ee

  console.log('TickerProxy >>>', JSON.stringify(opts))
  console.log('TickerProxy :this.wsText >>>', this.wsText)
  return AbstractWatcher.apply(this, arguments)
}
util.inherits(TickerProxy, AbstractWatcher)
TickerProxy.prototype.startIt = function () {
  // Connect the the stockfigher ws api enpoint
  console.log('TickerProxy, start, wstext is :', this.wsText)
  this.sock = new sockWrap(this.wsText, this.ee)
  this.wss = this.serverWrap()

  this.ee.on('quote', function (quote) {
    var i = 0
    try {
      for (i = 0; i < this.connections.length; i++) {
        if (this.verbose) {
          console.log('TickerProxy:quote: ', JSON.stringify(quote, null, 2))
        }
        //  console.log('tickerproxy:connection loop')
        this.connections[i].send(JSON.stringify(quote))
      }
    } catch(e) {
      console.log('Tickerproxy :ooops - client has disconnected', e)
      console.log('Tickerproxy: Websocket died - cleaning up connection : ', i)
      this.connections.splice(i, 1)
    }
  }.bind(this))
}
