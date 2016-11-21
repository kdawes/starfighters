var config = require('../config/config')
var Ticker = require('../lib/execwatcher')
var events = require('events')
var ee = new events.EventEmitter()
var minimist = require('minimist')
var argv = minimist(process.argv)
var wsText = [
  config.ws_api_root,
  'EXB123456',
  '/venues/',
  'TESTEX',
  '/executions'
].join('')

var tprox = new Ticker({
  wsText: wsText,
  port: 8081,
  ee: ee,
  verbose: true
})

tprox.start()
