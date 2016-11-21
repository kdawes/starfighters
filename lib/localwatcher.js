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

  console.log('localWatcher >>>', JSON.stringify(opts))
  console.log('localWatcher :this.wsText >>>', this.wsText)
  return AbstractWatcher.apply(this, arguments)
}
util.inherits(Watcher, AbstractWatcher)
Watcher.prototype.startIt = function () {
  // Connect the the stockfigher ws api enpoint
  console.log('localwatcher, start, wstext is :', this.wsText)
  this.wss = this.serverWrap()
  var that = this
  var intervalId = setInterval(function () {
    if (that.instanceId) {
      Api.flash(that.instanceId).then(function (flash) {
        if (flash.error) { console.log('localwatcher: thats an error: ', flash.error) } else {
          var i = 0
          try {
            if (that.connections) {
              for (i = 0; i < that.connections.length; i++) {
                that.connections[i].send(flash.body)
              }
              that.tia.doMeta(flash.body)
            } else {
              console.log('localWatcher:waiting for connections')
            }
          } catch(e) {
            console.log('localwatcher: ooops - client has disconnected', e)
            console.log('Websocket died - cleaning up connection : ', i)
            that.connections.splice(i, 1)
          }
        }
      }) // flash
    } else {
      console.log('localwatcher:no instanceId - cant query flash metadata - shtting down')
      clearInterval(intervalId)
    }
  }, 1000)
}
