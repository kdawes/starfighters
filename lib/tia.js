exports = module.exports = tia

var minimist = require('minimist')
var argv = minimist(process.argv)
var _ = require('lodash')
var sockWrap = require('./sockwrap')
var parseWrap = require('./parsewrap')

function tia (opts) {
  if (!(this instanceof tia)) {
    return new tia(opts)
  }
  return {
    raw: function () {
      return _.flatten(raw)
    },
    all: function () {
      return {
        meta: _.cloneDeep(meta),
        nav: _.cloneDeep(nav),
      }
    },
    nav: function () { return _.cloneDeep(nav)},
    meta: function () { return _.cloneDeep(meta)},
    doIt: function (data) { doIt(data) },
    doMeta: function (data) { doMeta(data) },
    doExec: function (data) { doExec(data) }
  }
}

var orderbook = {}
var raw = []

var nav = {
  shares: 0,
  cash: 0,
  nav: 0
}

var count = 0
// {
//     "ok": true,
//     "quote": {
//       "symbol": "YGL",
//       "venue": "QRUVEX",
//       "bid": 9685,
//       "ask": 9733,
//       "bidSize": 47402,
//       "askSize": 3339,
//       "bidDepth": 67382,
//       "askDepth": 10017,
//       "last": 7709,
//       "lastSize": 4770,
//       "lastTrade": "2015-12-29T06:18:56.080721599Z",
//       "quoteTime": "2015-12-29T06:18:56.098252773Z"
//     }
//   }}
var meta = {
  lasts: [],
  bids: [],
  asks: [],
  spreads: [],
  avgBid: [],
  avgAsk: [],
  avgLast: [],
  avgSpread: [],
  momentumAsk: [],
  momentumBid: [],
  momentumSpread: [],
  ts: null,
  last: null,
  lastSize: null,
  flash: null
}

var position = {
  bids: [],
  asks: [],
  fills: []
}

function bumpBids (q) {
  if (q.bid) { meta.bids.push(q.bid) }
}

function bumpAsks (q) {
  if (q.ask) { meta.asks.push(q.ask) }
}
function bumpSpreads (q) {
  // if (q.bid && q.ask) { meta.spreads.push(q.ask - q.bid)}
  var spread = parseInt((q.ask - q.bid), 10)
  if (! isNaN(spread)) { meta.spreads.push(spread)}
}
function bumpTs (ts) {
  var qTs = ts
  if (qTs > meta.ts) { meta.ts = qTs }
}
function bumpLast (q) {
  meta.last = (q.last) ? q.last : meta.last
  meta.lastSize = (q.lastSize) ? q.lastSize : meta.lastSize

  meta.lasts.push(meta.last)
}

function avg (a, tag) {
  if (! Array.isArray(a)) {
    throw new Error('avg(a) : parameter "a" must be an array')
  }
  // console.log('avg :', tag, ' : ', a)
  return (a.length > 0) ? (a.reduce(function (a, b) { return a + b }, 0) / a.length) : 0
}

function bumpAvgs () {
  meta.avgBid.push(avg(meta.bids, 'bids'))
  meta.avgAsk.push(avg(meta.asks, 'asks'))
  meta.avgSpread.push(avg(meta.spreads, 'spreads'))
  meta.avgLast.push(avg(meta.lasts, 'lasts'))
}

function bumpFlash (q) {
  // console.log('BUMPFLASH')
  var dat = null
  if (typeof (q) === 'string')
    dat = parseWrap(q)
  else
    dat = q

  // console.log('bumpFlash: ', JSON.stringify(dat, null, 2))

  if (dat) {
    var time = (dat && dat.details) ? ['(', dat.details.tradingDay, ',', dat.details.endOfTheWorldDay, ')'].join('') : ''
    var info = (dat && dat.flash && dat.flash.info) ? dat.flash.info : ''
    var warning = (dat && dat.flash && dat.flash.warning) ? dat.flash.warning : ''
    var success = (dat && dat.flash && dat.flash.success) ? dat.flash.sucess : ''
    var error = (dat && dat.flash && dat.flash.error) ? dat.flash.error : ''
    var danger = (dat && dat.flash && dat.flash.danger) ? dat.flash.danger : ''
    meta.flash = ['Day:', danger, error, time, info, warning, success].join(' ')
  } else {
    meta.flash = 'none'
  }
}

function bumpMomentum () {
  var HIST_WINDOW = 6
  var momentumAsks = _.chunk(meta.asks.slice(-HIST_WINDOW), 2).reduce(function (a, b) {
    // console.log('a[0]', a[0], ' a[1] ', a[1], ' b[0] ', b[0], ' b[1] ', b[1])
    return b[1] - b[0]
  }, 0)
  var momentumBids = _.chunk(meta.bids.slice(-HIST_WINDOW), 2).reduce(function (a, b) {
    return b[1] - b[0]
  }, 0)
  var momentumSpreads = _.chunk(meta.spreads.slice(-HIST_WINDOW), 2).reduce(function (a, b) {
    return b[1] - b[0]
  }, 0)
  meta.momentumAsks.push(momentumAsks)
  meta.momentumBids.push(momentumBids)
  meta.momentumSpreads.push(momentumSpreads)
}

function doExec (event) {
}

function doMeta (event) {
  // console.log('doMeta:bumpFlash: ', event)
  bumpFlash(event)
}

function bumps (ev) {
  var ts = new Date(ev.quote.quoteTime).getTime()
  bumpBids(ev.quote)
  bumpAsks(ev.quote)
  bumpSpreads(ev.quote)
  bumpTs(ts)
  bumpAvgs()
  bumpLast(ev.quote)
  bumpMomentum()
}

function doIt (event) {
  raw.push(event)
  // console.log('doIt', event)
  try {
    var q = (typeof (event) === 'string') ? JSON.parse(event) : event
    if (Array.isArray(q)) {
      q.forEach(function (ev) {
        bumps(ev)
      })

    } else {
      bumps(event)
    }
  // console.log('DO IT ', typeof (event), ' , ', event)
  } catch(e) {
    // console.log('Got a mysterious event :', e, ' : ', JSON.stringify(event, null, 2))
  }
}
