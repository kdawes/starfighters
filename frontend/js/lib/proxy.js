exports = module.exports = Proxy

// This is intended to be a thin wrappery /proxy around a websocket.
//  a callback which is invoked
// in the onMessageCallback gets us the data back.  the caller
function Proxy (opts) {
  var that = this
  var ws = null
  var callback = opts.callback
  function init () {
    console.log('Watcher init')
    try {
      if (ws) {
        ws.close()
        ws = null
      }
      ws = new WebSocket(opts.wsText)
      ws.onmessage = sockOnMessage
      ws.onerror = sockOnError
      ws.onclose = sockOnClose
    } catch(e) {
      console.log('Watcher:init:error:', e)
      return false
    }
  }

  function shutdown () {
    console.log('Watcher shutdown')
    if (ws) {
      ws.close()
    }
    ws = null
  }

  function sockOnError (error) {
    console.log('sockOnError:', JSON.stringify(error))
  // setTimeout(function () {
  //   init()
  // }, 4000)
  }

  function sockOnClose (close) {
    console.log('sockOnClose:', JSON.stringify(close))
    setTimeout(function () {
      init()
    }, 7000)
  }

  function sockOnMessage (event) {
    callback(event.data)
  }

  // set everything up...
  init()

  return {
    shutdown: function () { shutdown() }
  }
}
