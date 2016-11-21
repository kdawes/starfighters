exports = module.exports = TickerTiaProxy

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
function TickerTiaProxy (opts) {
  this.wsText = opts.wsText
  this.instanceId = opts.instanceId
  this.verbose = opts.verbose
  this.tia = opts.tia
  this.port = opts.port
  this.trading = opts.trading
  console.log('TickerTiaProxy >>>', JSON.stringify(opts))
  console.log('TickerProxy :this.wsText >>>', this.wsText)
  return AbstractWatcher.apply(this, arguments)
}
util.inherits(TickerTiaProxy, AbstractWatcher)
TickerTiaProxy.prototype.startIt = function () {
  // Connect the the stockfigher ws api enpoint
  console.log('TickerTiaProxy, start, wstext is :', this.wsText)
  this.sock = new sockWrap(this.wsText)
  this.wss = this.serverWrap()

  this.intervalId = setInterval(function () {
    var data = this.sock.get()
    // console.log('data > ', JSON.stringify(data))
    if (data.length > 0) {
      //  console.log('here we go')
      this.tia.doIt(_.flatten(data))
      var meta = this.tia.meta()
      //  console.log('META > ' , JSON.stringify(meta))
      var i = 0
      try {
        for (i = 0; i < this.connections.length; i++) {
          if (this.verbose) {
            console.log(JSON.stringify(meta, null, 2))
          }
          // console.log('tickertiaproxy:connection loop')
          this.connections[i].send(JSON.stringify({
            meta: meta,
            nav: {
              cash: this.trading.position.cash,
              shares: this.trading.position.shares,
              nav: this.trading.position.cash + (this.trading.position.shares * meta.lasts.slice(-1))
            }
          }))
        }
      } catch(e) {
        console.log('tickertiaproxy :ooops - client has disconnected', e)
        console.log('tickertiaproxy: Websocket died - cleaning up connection : ', i)
        this.connections.splice(i, 1)
      }
    }
  }.bind(this), 100)
}
