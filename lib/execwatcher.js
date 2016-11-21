exports = module.exports = ExecWatcher
var _ = require('lodash')
var config = require('../config/config')
var sockWrap = require('./sockwrap')

var util = require('util')
var AbstractWatcher = require('./abstractwatcher')

function ExecWatcher (opts) {
  this.wsText = opts.wsText
  this.instanceId = opts.instanceId
  this.verbose = opts.verbose
  this.tia = opts.tia
  this.port = opts.port
  this.ee = opts.ee

  // console.log('ExecWatcher >>>', JSON.stringify(opts))
  // console.log('ExecWatcher :this.wsText >>>', this.wsText)
  return AbstractWatcher.apply(this, arguments)
}
util.inherits(ExecWatcher, AbstractWatcher)

ExecWatcher.prototype.startIt = function () {
  // Connect the the stockfigher ws api enpoint
  // console.log('ExecWatcher, start, wstext is :', this.wsText)
  this.sock = new sockWrap(this.wsText, this.ee, 'fill')
  this.wss = this.serverWrap()
  var that = this
  var nav = null
  this.ee.on('fill', function (fill) {
    this.ee.emit('fillevent', fill)
    if (this.verbose) {
      console.log('ExecWatcher:fill: ', JSON.stringify(fill, null, 2))
    }
    if (this.tia) {
      this.tia.doExec([fill])
      nav = this.tia.nav()

      var i = 0
      try {
        for (i = 0; i < this.connections.length; i++) {
          this.connections[i].send(JSON.stringify(nav))
        }
        if (this.verbose) {
          console.log(JSON.stringify(nav, null, 2))
        }
      } catch(e) {
        console.log('execwatcher: ooops - client has disconnected', e)
        console.log('execwatcher :Websocket died - cleaning up connection : ', i)
        this.connections.splice(i, 1)
      }
    }
  }.bind(this))
}
