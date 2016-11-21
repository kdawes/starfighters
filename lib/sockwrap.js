exports = module.exports = sockWrap
var WebSocket = require('ws')
var _ = require('lodash')

function sockWrap (connectionString, ee, eeEventTag) {
  var active = null
  var buffer = []
  var id = connectionString
  var EE = ee
  var resetting = false

  function init () {
    // console.log('init......:', connectionString)
    active = new WebSocket(connectionString)
    active.on('message', function (data, flags) {
      // console.log('sockWrap message', data)
      // flags.binary will be set if a binary data is received.
      // flags.masked will be set if the data was masked.

      try {
        var parsed = JSON.parse(data)
        // allow the user to inject an eventEmitter for lower latency
        // eventing
        if (ee && typeof (ee) === 'object') {
          ee.emit(eeEventTag || 'quote', parsed)
        } else {
          buffer.push(parsed)
        }
      } catch(e) {
        console.log('sockWrap:PARSE ERROR: ', e)
      }
    })

    function handleErrorOrClose (id, msg) {
      console.log(msg, id)
      // wss://api.stockfighter.io/ob/api/ws/BSS6879360/venues/QTJEX/executions
      var account = id.split('://')[1].split('/')[4]
      console.log('sockWrap:EMIT:', 'websocketclose', ' account ', account)
      if (ee && typeof (ee) === 'object' && resetting == false) {
        resetting = true
        EE.emit('websocketclose', {account: account})
      } else {
        console.log('ERROR : sockWrap : no EE available (onclose emitter)')
      }

    }

    active.on('error', function (err) {
      handleErrorOrClose(id, 'sockWrap:WEBSOCKET ERROR: >>>>>>>>>>>>>>>>>>> ', err)
    })
    active.on('close', function () {
      handleErrorOrClose(id, 'sockWrap:WEBSOCKET CLOSED >>>>>>>>>>>>>>>>>>> ')
    })
  }

  // console.log('sockWrap')
  init()
  return {
    ping: active === null,
    get: function () {
      var dat = _.cloneDeep(buffer)
      buffer = []
      return dat
    },
    reset: function () { console.log('reset!');  buffer = []; },
    close: function () { active.close(); active = null; buffer = null; }
  }
}
