var WebSocket = require('ws')
var minimist = require('minimist')
var argv = minimist(process.argv)

var wsProto = argv.wsproto || 'ws://'
var wsHost = argv.host || 'localhost'
var wsPort = argv.port || 8080
var url = [wsProto, wsHost, ':', wsPort].join('')

console.log('connecting to ', url)
var ws = new WebSocket(url)
ws.on('message', function (data, flags) {
  // flags.binary will be set if a binary data is received.
  // flags.masked will be set if the data was masked.
  if (!argv.silent)
    console.log('> ', JSON.stringify(JSON.parse(data), null, 2))
})
