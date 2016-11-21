module.exports = Trading

var _ = require('lodash')
var async = require('async')
var util = require('util')

// var api = require('..')
// var Api = new api({})
var parseWrap = require('./parsewrap')

var Position = require('./position')
var position = null

var tLib = require('../beautified')
var tlib = null // needs the emitter to be injected, set in constructor
// var WebSocket = require('ws')

// var FSM = 'trading'
// // AI / Knobs for tweaking
// // biggest bid
// var BUCKET_SIZE = 400
// // Our adjustment to whatever our baseline ask is
// var ASK_PCT = 0.05
// var BID_PCT = 0.0825
// var SELL_SIZE = 100

Array.prototype.max = function () {
  return Math.max.apply(null, this)
}

Array.prototype.min = function () {
  return Math.min.apply(null, this)
}

function Trading (opts) {
  if (!(this instanceof Trading)) {
    return new Trading(opts)
  }
  console.log('TRADING : ', opts.levelcfg.tickers[0])
  // bot intervals
  this.scanned = 0
  this.outlier = true
  this.position = new Position({ ee: opts.ee })
  this.genesis = opts.ts
  this.levelcfg = opts.levelcfg
  this.aiinterval = null
  // bot tweakables
  this.stalls = {},
  this.tia = opts.tia
  this.tweakables = {
    'FSM': 'trading',
    'BUCKET_SIZE': 20,
    'ASK_PCT': 0.05,
    'BID_PCT': 0.05,
    'SELL_SIZE': 25, // conservative
    'WINDOW': 400,
    'HIST_WINDOW': 10
  }
  this.ee = opts.ee
  tlib = new tLib({ee: this.ee, levelcfg: this.levelcfg, tia: this.tia})
  this.ee.on('fillevent', function (fill) {
    // console.log('Trading: FillEvent:', JSON.stringify(fill))
    // this.trident(fill)
  }.bind(this))
}

Trading.prototype.judge = function (obj) {
  return tlib.judge(obj)
}

Trading.prototype.buy = function (num, type, price) {
  console.log('num ', num , ' type ', type, ' price ', price)
  return tlib.buy(num, type, price)
}

Trading.prototype.sell = function (num, type, price) {
  return tlib.sell(num, type, price)
}

Trading.prototype.orderbook = function () {
  return tlib.orderbook()
}

Trading.prototype.cancelAll = function () {
  return tlib.cancelAll(this.position)
}

Trading.prototype.lock = function (seed, intervalLength) {
  var that = this
  var fiveInMs = 5000
  var now = new Date().getTime()
  var drift = now - seed
  var chunk = Math.floor(drift / fiveInMs)
  var target = chunk + 1
  var targetInMs = seed + fiveInMs * target
  var timeOutInMs = targetInMs - now
  console.log([
    'LOCK: ', seed,
    'intervalLength', intervalLength,
    'now', now,
    'drift', drift,
    'chunk', chunk,
    'target', target,
    'targetInMs', targetInMs,
    'timeOutInMs', timeOutInMs
  ].join(' '))
  setTimeout(function () {
    that.aiinterval = setInterval(function go () {
      // that.strategy() // momentum trade
      // that.net()
      that.wave()
      return go
    }(), intervalLength || 5001)
  }, timeOutInMs)
}

Trading.prototype.wave = function () {
  var that = this
  console.log('WAVE : ', that.position.shares, ' ', that.position.cash)
  var num = 200
  if (that.position.shares == num && ! that.position.haveOpenPendingAsks()) {
    console.log('liquidating , < pendingAsks :', Object.keys(that.position.db.asks).length)
    tlib.sell((that.position.shares > num) ? num : that.position.shares, 'limit', that.tia.meta().last)
  } else if (that.position.shares === 0 && Object.keys(that.position.db.bids) == 0) {
    console.log('buying!')
    tlib.buy(num, 'limit', that.tia.meta().last)
  }
}

Trading.prototype.quote = function (opts) {
  return tlib.quote()
}

Trading.prototype.position = function () {
  return _.cloneDeep(position.db)
}

Trading.prototype.stopAi = function () {
  if (this.aiinterval) {
    clearInterval(this.aiinterval)
    this.aiinterval = null
  }
}

function reduceAndShiftDecimal (ar) {
  return parseInt(Math.floor(ar.reduce(function (a, b) {
      return a + b }, 0) / ar.length), 10)
}

function momentum (stuff) {
  if (!Array.isArray(stuff)) {
    return 0
  }

  return _.chunk(stuff, 2).reduce(function (a, b) {
    return b[1] - b[0]
  })
}

// return : false : do no trade
// return : true : trade
Trading.prototype.checkShortCircuitConditions = function (opts) {
  var meta = this.tia.meta()
  var nav = this.tia.nav()
  if (nav.shares >= this.tweakables.WINDOW) {
    console.log('position is too long @', nav.shares)
    return false
  }
  if (nav.shares <= -this.tweakables.WINDOW) {
    console.log('position is too short @', nav.shares)
    return false
  }

  if (opts.checkbuys && this.tweakables.BUCKET_SIZE === 0) {
    console.log('<<< BUYS DISABLED - BUCKET_SIZE : 0 >>>')
    return false
  }
  if (opts.checksells && this.tweakables.SELL_SIZE === 0) {
    console.log('<<< SELLS DISABLED - SELL_SIZE : 0 >>>')
    return false
  }
  return true
}

Trading.prototype.strategy = function (quote) {
  var that = this
  console.log('strategy')

  function bidLow (that, windowOverride) {
    var meta = that.tia.meta()
    var nav = that.tia.nav()
    var lastAvgAsk = meta.avgAsk.slice(-1)
    var minAsk = meta.asks.slice(-that.tweakables.HIST_WINDOW).min()
    var spread = meta.spreads.slice(-that.tweakables.HIST_WINDOW).reduce(function (a, b) { return a + b }, 0) / that.tweakables.HIST_WINDOW
    var bidPrice = parseInt([lastAvgAsk, minAsk].min() + spread + 10, 10)

    if (! that.checkShortCircuitConditions({checkbuys: true})) {
      return
    }
    if (isNaN(bidPrice)) {
      console.log('uh oh - bid price is fucked ', bidPrice)
      console.log('lastAvgAsk : ', lastAvgAsk, ' minAsk : ', minAsk, ' bid: ', bidPrice, ' spread : ', spread)
      console.log('last :', meta.last, ' avgbid : ', meta.avgBid.slice(-1), ' avgAsk : ', meta.avgAsk.slice(-1))
    } else {
      tlib.buy(windowOverride || that.tweakables.BUCKET_SIZE, 'limit', bidPrice)
    }
  }

  function sellHigh (that, windowOverride) {
    var meta = that.tia.meta()
    var nav = that.tia.nav()
    var lastAvgBid = meta.avgBid.slice(-1)
    var maxBid = meta.asks.slice(-10).max()
    var bidPrice = parseInt([lastAvgBid, maxBid].max(), 10) - 10
    if (! that.checkShortCircuitConditions({checksells: true})) {
      return
    }
    tlib.sell(windowOverride || that.tweakables.SELL_SIZE, 'limit', bidPrice)
  }

  function avg (arr) {
    return arr.reduce(function (a, b) {
      return a + b
    }, 0) / arr.length
  }

  function outlier (arr) {
    return avg(arr)
  }

  function checkOutlier (arr) {
    var av = avg(arr)
    // most recent spread is thrice as big as the average
    if (arr.slice(-1) > Math.floor(av * 3)) {
      return true
    }
    return false
  }

  function isOutlierBidMomentum () {
    var meta = that.tia.meta()
    return checkOutlier(meta.bids)
  }

  function isOutlierAskMomentum () {
    var meta = that.tia.meta()
    return checkOutlier(meta.asks)
  }

  function isOutlierSpreadMomentum () {
    var meta = that.tia.meta()
    return checkOutlier(meta.spreads)
  }
  function isOutlier () {
    return isOutlierSpreadMomentum()
  }
  var meta = that.tia.meta()
  if (that.tweakables.FSM.match(/trading/)) {
    if (isOutlier() && this.outlier) {
      console.log('OUTLIER>>>>>>>>>>>>>>>') // , JSON.stringify(this.position))
      // First, stop the world and prepare for battle
      tlib.cancelAll(that.position)

      var askSpike = outlier(meta.asks)
      var bidSpike = outlier(meta.bids)
      var spreadSpike = outlier(meta.spreads)
      console.log([
        'OUTLIER',
        'askSpike', askSpike,
        'bidSpike', bidSpike,
        'spreadSpike', spreadSpike
      ].join(' '))
      if (bidSpike > 0) {
        bidLow(that, 75)
      }
      if (askSpike > 0) {
        sellHigh(that, 50)
      }
    }
  }
}

Trading.prototype.trident = function (ev) {
  var that = this
  var meta = this.tia.meta()
  var i = 0
  var limit = 10
  if (ev) {
    i = (typeof (ev) === 'object') ? ev.order.id : 0
    limit = i + 100
  }
  for (; i < limit;  i++) {
    console.log('TRIDENT : limit : ', limit, ' canceling ', i)
    tlib.cancel(i)
  }
}

Trading.prototype.net = function () {
  var that = this
  var meta = this.tia.meta()
  var midpoint = meta.lasts.slice(-1) // Math.abs(Math.floor((meta.asks.slice(-1) + meta.bids.slice(-1)) / 2))
  var pct = 10
  //  console.log('averagedBuy', JSON.stringify(meta))
  if (meta && ! isNaN(midpoint) && midpoint >= 0) {
    console.log('NET : MIDPOINT ', midpoint)
    // tlib.cancelAll(that.position)
    for (var i = 0; i < 4; i++) {
      if (that.checkShortCircuitConditions({checksells: 1})) {
        tlib.sell(that.tweakables.SELL_SIZE, 'limit', midpoint + i * pct)
      }
      if (that.checkShortCircuitConditions({checkbuys: 1})) {
        tlib.buy(that.tweakables.BUCKET_SIZE, 'limit', midpoint - i * pct)
      }
    }
  }

}

Trading.prototype.startAiInterval = function (intervalLength) {
  this.lock(this.genesis, intervalLength)
}
