var union = require('union')
var director = require('director')
var cors = require('cors')
var async = require('async')
var _ = require('lodash')

// var levelcfg = require('../levels/chock_a_block/level.json')
var api = require('..')
var Api = new api({})
var parseWrap = require('../lib/parsewrap')

var publicRouter = new director.http.Router().configure({recurse: null})
var server = null
var trading = null
var leveljs = null

function Wrapper (opts) {
  this.tia = opts.tia
  this.levelcfg = opts.levelcfg
  // hack :-(
  leveljs = opts.levelcfg
  trading = opts.trading
}

Wrapper.prototype.start = function () {
  // Our C&C API to the bot AI
  server = union.createServer({
    before: [
      function (req, res) {
        console.log('C&C harness control API initializing')
        res.emit('next')
      },
      cors(),
      function (req, res) {
        f = publicRouter.dispatch(req, res)
        if (! f) {
          res.emit('next')
        }
      }]
  })
  server.listen(8181)
// trading.startAiInterval(4500)
// trading.startAgeInterval(1000)
}

publicRouter.get('/position', function () {
  return this.res.json({ok: true, data: trading.position})
})

function parseWrapAndTest (results) {
  console.log('results', results)
  var js = parseWrap(results)
  if (js.ok === false) {
    throw new Error('parseWrapAndTest:error: ' + js.error)
  }
  return js
}

publicRouter.get('/raw', function () {
  return this.res.json({ok: true, data: trading.tia.raw()})
})

publicRouter.get('/orderbook', function () {
  return this.res.json({ok: true, data: trading.orderbook() })
})

publicRouter.get('/window', function () {
  this.res.json({ok: true, data: trading.tweakables.WINDOW})
})
publicRouter.get('/window/set/:sz', function (sz) {
  trading.tweakables.BUCKET_SIZE = parseInt(sz, 10)
  this.res.json({ok: true, data: trading.tweakables.WINDOW})
})

publicRouter.get('/bucket', function () {
  this.res.json({ok: true, data: trading.tweakables.BUCKET_SIZE})
})
publicRouter.get('/bucket/set/:sz', function (sz) {
  trading.tweakables.BUCKET_SIZE = parseInt(sz, 10)
  this.res.json({ok: true, data: trading.tweakables.BUCKET_SIZE})
})

publicRouter.get('/ai/start/:duration', function (duration) {
  trading.startAiInterval(duration)
  //  trading.startAgeInterval(1000)
  return this.res.json({ok: true})
})

publicRouter.get('/ai/stop', function () {
  trading.stopAi()
  return this.res.json({ok: true})
})

publicRouter.get('/buy/qty/:qty/price/:price/type/:ordertype',
  function (qty, price, ordertype) {
    var msg = trading.buy(parseInt(qty), ordertype, parseInt(price))
    this.res.json({ok: true, msg: msg })
  })

publicRouter.get('/sell/qty/:qty/price/:price/type/:ordertype',
  function (qty, price, ordertype) {
    var msg = trading.sell(parseInt(qty), ordertype, parseInt(price))
    this.res.json({ok: true, msg: msg})
  })

publicRouter.get('/sell', function () {
  this.res.json({ok: true, data: trading.tweakables.SELL_SIZE})
})
publicRouter.get('/sell/set/:sz', function (sz) {
  trading.tweakables.SELL_SIZE = parseInt(sz, 10)
  this.res.json({ok: true, data: trading.tweakables.SELL_SIZE})
})

publicRouter.get('/ask', function () {
  this.res.json({ok: true, data: trading.tweakables.ASK_PCT})
})
publicRouter.get('/ask/set/:pct', function (pct) {
  trading.tweakables.ASK_PCT = pct
  this.res.json({ok: true, data: trading.tweakables.ASK_PCT})
})
publicRouter.get('/pct', function () {
  this.res.json({ok: true, data: trading.tweakables.BID_PCT})
})
publicRouter.get('/pct/set/:pct', function (pct) {
  trading.tweakables.BID_PCT = pct
  this.res.json({ok: true, data: trading.tweakables.BID_PCT})
})

publicRouter.get('/fsm', function (state) {
  this.res.json({ok: true, data: trading.tweakables.FSM})
})

publicRouter.get('/fsm/set/:state', function (state) {
  trading.tweakables.FSM = state
  this.res.json({ok: true, data: trading.tweakables.FSM})
})

publicRouter.get('/cancel/:symbol/:bidId', function (symbol, bidId) {
  trading.cancel(symbol, bidId)
  this.res.json({ok: true, message: ''})
})

publicRouter.get('/cancel/all', function () {
  console.log('MANUAL Cancel ALL:')
  trading.cancelAll()
  return this.res.json({ok: true, message: ''})
})

publicRouter.get('/special/:action', function (action) {
  if (action === 'no') {
    trading.outlier = false
  } else {
    trading.outlier = true
  }

  return this.res.json({ok: true, message: ''})
})
publicRouter.post('/test', {stream: true}, function () {
  var that = this
  var concat = require('concat-stream')
  this.req.pipe(concat(function (body) {
    try {
      // body is a buffer.
      var obj = JSON.parse(body.toString('utf-8'))
      // trading.judge(obj)
      console.log('TEST POST : ', JSON.stringify(obj, null, 2))
      return that.res.json({ok: 'yes'})
    } catch(e) {
      console.log('JUDGE:POST:ERROR', e)
    }
  }))
})

publicRouter.post('/judge', {stream: true}, function () {
  var that = this
  var concat = require('concat-stream')
  this.req.pipe(concat(function (body) {
    try {
      // body is a buffer.
      var obj = JSON.parse(body.toString('utf-8'))
      // console.log('JUDGING ', JSON.stringify(obj, null, 2))
      var msg = trading.judge(obj)
      // console.log('RESPONSE : ', msg)
      return that.res.json({ok: true, 'msg': msg})
    } catch(e) {
      console.log('JUDGE:POST:ERROR', e)
    }
  }))
})

exports = module.exports = Wrapper
