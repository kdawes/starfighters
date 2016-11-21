var test = require('tape')
var sockWrap = require('../lib/sockwrap')
var WebSocketServer = require('ws').Server
var async = require('async')
var wss = new WebSocketServer({port: 8888})

wss.on('connection', function (c) {
  console.log('WSS - connection')
  setTimeout(function () {
    console.log('WSS : Sending PING :', new Date().getTime())
    // we send stringified json, which is expected
    c.send(JSON.stringify({ping: 'ping'}))
    // and a buffer object, which isn't so we can converge the happy
    // and the error path - the wrapper just logs an error
    c.send(new Buffer(12))
  }, 100)
})

test('sockwrap is a function', function (t) {
  t.equal(true, typeof sockWrap === 'function')
  t.end()
})

test('.get() returns an array', function (t) {
  var wrapped = sockWrap('ws://localhost:8123')
  var got = wrapped.get()
  t.equal(true, typeof got === 'object')
  t.equal(true, Array.isArray(got))
  wrapped.close()
  t.end()
})

test('.on message', function (t) {
  var wrapped = sockWrap('ws://localhost:8888/')
  console.log('before', new Date().getTime())
  setTimeout(function () {
    var got = wrapped.get()
    t.equal(1, got.length, ' we got a message from the server')
    wrapped.close()
    wrapped = null
    t.end()
  }, 200)
})
test('reset', function (t) {
  var wrapped = sockWrap('ws://localhost:8888/')
  console.log('before', new Date().getTime())
  wrapped.reset()

  setTimeout(function () {
    var got = wrapped.get()
    t.equal(1, got.length, ' we got a message from the server')

    wrapped.close()
    wrapped = null

    t.end()
  }, 1000)
})

test('teardwn', function (t) {
  wss.close()
  t.end()
})
