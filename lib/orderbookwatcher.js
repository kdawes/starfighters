exports = module.exports = Watcher
var util = require('util')
var WebSocket = require('ws')
var config = require('../config/config')
var WebSocketServer = require('ws').Server
var sockWrap = require('./sockwrap')

var api = require('..')
var Api = new api({})

var AbstractWatcher = require('./abstractwatcher')

function Watcher (opts) {
  this.wsText = opts.wsText
  this.instanceId = opts.instanceId
  this.verbose = opts.verbose
  this.tia = opts.tia
  this.port = opts.port
  this.venue = opts.venue
  this.symbol = opts.symbol
  console.log('ExecWatcher >>>', JSON.stringify(opts))
  console.log('ExecWatcher :this.wsText >>>', this.wsText)
  return AbstractWatcher.apply(this, arguments)
}
util.inherits(Watcher, AbstractWatcher)
Watcher.prototype.startIt = function () {
  // Connect the the stockfigher ws api enpoint
  console.log('watcher, start, wstext is :', this.wsText)
  this.wss = this.serverWrap()
  var that = this
  var intervalId = setInterval(function () {
    if (that.instanceId) {
      Api.orderbook(that.venue, that.symbol).then(function (orderbook) {
        if (orderbook.error) {
          console.log('orderbookwatcher: thats an error: ', flash.error)
        } else {
          var i = 0
          try {
            if (that.connections) {
              for (i = 0; i < that.connections.length; i++) {
                // console.log('ORDERBOOK : ', orderbook.body)
                that.connections[i].send(orderbook.body)
              }
            //  that.tia.doMeta(flash.body)
            } else {
              // console.log('orderbookWatcher:waiting for connections')
            }
          } catch(e) {
            console.log('orderbookwatcher: ooops - client has disconnected', e)
            console.log('Websocket died - cleaning up connection : ', i)
            that.connections.splice(i, 1)
          }
        }
      })
    } else {
      console.log('orderbookwatcher:no instanceId - cant query flash metadata - shtting down')
      clearInterval(intervalId)
    }
  }, 100)
}
