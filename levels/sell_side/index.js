var request = require('request')
var api = require('../..')
var _ = require('lodash')

var union = require('union'),
  director = require('director')

// / special
var config = require('../../config/config')
var Api = new api({})
var minimist = require('minimist')
var argv = minimist(process.argv)
var levelcfg = require('./level.json')

var wsProto = argv.wsproto || 'ws://'
var wsHost = argv.host || 'localhost'
var wsPort = argv.port || 8080
var url = [wsProto, wsHost, ':', wsPort].join('')
var Tia = require('../../lib/tia')
var tia = new Tia({})
var cors = require('cors')
var async = require('async')

// GLobal position accounting
var totalPos = 0
var minusPos = 0

var stalls = {}

var position = {
  bids: {},
  asks: {},
  fills: {}
}
function throttle (func, ms) {
  var timeout, last = 0
  return function () {
    var a = arguments, t = this, now = +(new Date),
      exe = function () { last = now; func.apply(t, a) }
    clearTimeout(timeout)
    ;(now >= last + ms) ? exe() : timeout = setTimeout(exe, ms)
  }
}

var FSM = 'trading'

// AI / Knobs for tweaking
var SYMBOL = null // gets set during init
// biggest bid
var BUCKET_SIZE = 400
// Our adjustment to whatever our baseline ask is
var ASK_PCT = 0.05
//
var BID_PCT = 0.0825

// Our C&C API to the bot AI
var publicRouter = new director.http.Router().configure({recurse: null})
var server = union.createServer({
  before: [
    cors(),
    function (req, res) {
      f = publicRouter.dispatch(req, res)
      if (! f) {
        res.emit('next')
      }
    }]
})

function parseWrap (body) {
  var doneCheck = null
  try {
    doneCheck = JSON.parse(body)
  } catch (e) {
    console.log('Failed in parseWrape:,', e)
    return null
  }
  return doneCheck
}

// {
// 	"ok": true,
// 	"quote": {
// 		"symbol": "HEDY",
// 		"venue": "CRKEX",
// 		"bid": 4326,
// 		"ask": 4347,
// 		"bidSize": 156,
// 		"askSize": 12229,
// 		"bidDepth": 759,
// 		"askDepth": 36687,
// 		"last": 4326,
// 		"lastSize": 8,
// 		"lastTrade": "2015-12-17T02:02:30.588849689Z",
// 		"quoteTime": "2015-12-17T02:02:33.070177665Z"
// 	}
// }

var orderBook = Api.venueStocks(levelcfg.venues[0])
  .then(function (results) {
    var js = JSON.parse(results.body)
    return Api.orderbook(levelcfg.venues[0], js.symbols[0].symbol)
      .then(function (res) {
        //        console.log('ob: >> ', JSON.stringify(JSON.parse(res.body), null, 2))
        return JSON.parse(res.body)
      }).catch(function (error) {
      console.log('orderbook:', error)
      return null
    })
  }).catch(function (error) {
  console.log('error:venueStocks:', error)
})

var allstocks = Api.venueStocks(levelcfg.venues[0])
  .then(function (results) {
    return JSON.parse(results.body)
  }).catch(function (error) {
  console.log('allstocks:venueStocks', error)
})

publicRouter.get('/flash', function () {
  this.res.json(meta.flash || {})
})

publicRouter.get('/orderbook', function () {
  orderBook.then(function (ob) {
    return this.res.json({ok: true, data: ob })
  }.bind(this)).catch(function (err) {
    return this.res.json({ok: false, message: err})
  }.bind(this))
})

publicRouter.get('/bucket', function () {
  this.res.json({ok: true, data: BUCKET_SIZE})
})
publicRouter.get('/bucket/set/:sz', function (sz) {
  BUCKET_SIZE = sz
  this.res.json({ok: true, data: BUCKET_SIZE})
})

publicRouter.get('/ask', function () {
  this.res.json({ok: true, data: ASK_PCT})
})
publicRouter.get('/ask/set/:pct', function (pct) {
  ASK_PCT = pct
  this.res.json({ok: true, data: ASK_PCT})
})
publicRouter.get('/pct', function () {
  this.res.json({ok: true, data: BID_PCT})
})
publicRouter.get('/pct/set/:pct', function (pct) {
  BID_PCT = pct
  this.res.json({ok: true, data: BID_PCT})
})

publicRouter.get('/FSM', function (state) {
  this.res.json({ok: true, data: FSM})
})

publicRouter.get('/FSM/set/:state', function (state) {
  FSM = state
  this.res.json({ok: true, data: FSM})
})

function deleteCancelledFromPosition (bid) {
  if (!bid) {
    console.log('error: deleteCancelledFromPosition called with null data')
    return
  }
  console.log('dcfp :', JSON.stringify(bid, null, 2))
  var tmp = parseInt((bid.originalQty - bid.totalFilled), 10)
  var minusCount = (! isNaN(tmp)) ? tmp : 0
  // Update global accounting
  minusPos += minusCount
  console.log('Minus Count', minusCount, ' minusPos ', minusPos)
  delete position.bids[bid.id]
  delete stalls[bid.id]
}

publicRouter.get('/cancel/:symbol/:bidId', function (symbol, bidId) {
  Api.cancelBid(levelcfg.venues[0], symbol, bidId).then(function (res) {
    console.log('MANUAL Cancel :', bidId, res.body)
    if (res.error) {
      this.res.json({ok: false, message: res.error})
    }
    var doneCheck = null
    try {
      doneCheck = parseWrap(res.body)
      deleteCancelledFromPosition(doneCheck)
    } catch (e) {
      console.log('Failed in manual cancel:,', e)
      return this.res.json({ok: false, message: e})
    }
  }.bind(this))
  this.res.json({ok: true, message: ''})
})

publicRouter.get('/cancel/all', function () {
  console.log('MANUAL Cancel ALL:')

  // get all open bids and try to Cancel
  var keys = Object.keys(position.bids)
  console.log('KILLING THESE ONES :', keys)
  async.each(keys, function (bid, callback) {
    Api.cancelBid(levelcfg.venues[0], SYMBOL, bid).then(function (res) {
      if (res.error) {
        console.log('cancel failed for', bid)
        /* if we return an error, all processing stops - not what we want.  User
        will have to check and see, I guess. Not optimal. */
        return callback()
      }
      var doneCheck = parseWrap(res.body)
      console.log('Cancelled :', doneCheck.id)
      deleteCancelledFromPosition(doneCheck)
      return callback()
    })
  }, function (err) {
    console.log('Cancel bids failed!', err)
    return this.res.json({ok: false, message: 'err'})
  })

  return this.res.json({ok: true, message: ''})
})

console.log('connecting to ', url)
var WebSocket = require('ws')
var ws = new WebSocket(url)
ws.on('message', function (data, flags) {
  // flags.binary will be set if a binary data is received.
  // flags.masked will be set if the data was masked.
  // console.log('> ', JSON.stringify(JSON.parse(data), null, 2))
  tia.doIt(data)
})

allstocks.then(function (r) {
  console.log('allstocks : ', JSON.stringify(r, null, 2))
  SYMBOL = r.symbols[0].symbol
  console.log('SYMBOL : ', SYMBOL)
})

function reduceAndShiftDecimal (ar) {
  return parseInt(Math.floor(ar.reduce(function (a, b) {
      return a + b }, 0) / ar.length), 10)
}

function sell (size) {
  // console.log('meta >', JSON.stringify(tia.meta(), null, 2))
  var avgBid, avgAsk, avgSpread = null
  var meta = tia.meta()
  if (meta) {
    if (meta.asks.length) {
      avgAsk = reduceAndShiftDecimal(meta.asks)
    //  console.log('AskingAvg:', avgAsk)
    }
    if (meta.bids.length) {
      avgBid = reduceAndShiftDecimal(meta.bids)
    //  console.log('BidingAvg:', avgBid)
    }
    if (meta.spreads.length) {
      avgSpread = reduceAndShiftDecimal(meta.spreads)
    //  console.log('SpreadAvg:', avgSpread)
    }

    if (avgBid) {
      var bidPct = Math.floor(avgSpread * BID_PCT)
      var bidPrice = meta.bids[0] + parseInt(bidPct, 10)
      // console.log('bidPct : ', bidPct, ' => bidPrice : ', bidPrice)
      var bid = Api.sell(levelcfg.account, levelcfg.venues[0], SYMBOL, bidPrice, size, 'limit')
      bid.then(function (b) {
        console.log('I got this data : ', JSON.stringify(b.body))
        bidId = b.body.id
        position.asks[bidId] = b
      })
    }
  }
}

function bidUp (bidSize) {
  // console.log('meta >', JSON.stringify(tia.meta(), null, 2))
  var avgBid, avgAsk, avgSpread = null
  var meta = tia.meta()
  if (meta) {
    if (meta.asks.length) {
      avgAsk = reduceAndShiftDecimal(meta.asks)
    //  console.log('AskingAvg:', avgAsk)
    }
    if (meta.bids.length) {
      avgBid = reduceAndShiftDecimal(meta.bids)
    //  console.log('BidingAvg:', avgBid)
    }
    if (meta.spreads.length) {
      avgSpread = reduceAndShiftDecimal(meta.spreads)
    //  console.log('SpreadAvg:', avgSpread)
    }

    if (avgBid) {
      var bidPct = Math.floor(avgSpread * BID_PCT)
      var bidPrice = avgAsk - parseInt(bidPct, 10)
      // console.log('bidPct : ', bidPct, ' => bidPrice : ', bidPrice)
      var bid = Api.bid(levelcfg.account, levelcfg.venues[0], SYMBOL, bidPrice, bidSize, 'limit')
      bid.then(function (b) {
        //  console.log('I got this data : ', JSON.stringify(b))
        bidId = b.body.id
        position.bids[bidId] = b
      })
    }
  } else {
    console.log('EH ? no meta')
  }
}

var flashInterval =
setInterval(function () {
  Api.flash().then(function (flash) {
    console.log('GETTING FLASH', flash.body)
    var meta = tia.meta()
    meta.flash = flash
  }).catch(function (err) {
    console.log('flash:error:', err)
  })
}.bind(this), 2000)

setInterval(function go () {
  var keys = Object.keys(position.bids)
  // console.log('go polling loop : total bids : ', keys)
  console.log('Position : ', totalPos, ' filled  cancelled :', minusPos, ' txns : ', Object.keys(position.fills).length)
  if (FSM !== 'trading') {
    return
  }
  for (var i = 0; i < keys.length; i++) {
    var BID = keys[i]
    // console.log('BID ', keys[i])
    var status = Api.getBidStatus(BID, levelcfg.venues[0], SYMBOL)
    status.then(function (bid) {
      // console.log('BID STATUS> ', bid.body)
      try {
        var doneCheck = parseWrap(bid.body)
        // console.log(doneCheck.id, ', DONECHECK : filled : ', parseInt(doneCheck.totalFilled, 10), ' bid ', parseInt(doneCheck.originalQty, 10))

        if (doneCheck.open === false && (doneCheck.fills.reduce(function (a, b) {return a + b}, 0))) {
          // Fully filled - remove our bid from tracking and
          // Update our fills
          delete stalls[doneCheck.id]
          position.fills[doneCheck.id] = doneCheck
          delete position.bids[doneCheck.id]

          totalPos += doneCheck.totalFilled
          //  console.log('BIDS NOW ;', Object.keys(position.bids))
          console.log('FILLED: ', doneCheck.id, ' filled : ', doneCheck.totalFilled, ' / ', doneCheck.originalQty, ' stalls ', stalls[doneCheck.id] || 0)
        } else {
          // console.log('BID: ', doneCheck.id, ' progress : ', doneCheck.totalFilled, ' / ', doneCheck.originalQty, ' stalls ', stalls[doneCheck.id] || 0)
          if (doneCheck.totalFilled === 0) {
            stalls[doneCheck.id] = (stalls[doneCheck.id] != undefined) ? (stalls[doneCheck.id] + 1.5) : 1
          } else {
            stalls[doneCheck.id] = (stalls[doneCheck.id] != undefined) ? (stalls[doneCheck.id] + 0.5) : 1
          }
          //
          if (stalls[doneCheck.id] > 5) {
            Api.cancelBid(levelcfg.venues[0], SYMBOL, doneCheck.id).then(function (res) {
              deleteCancelledFromPosition(doneCheck)
            })
            if (totalPos > 100) {
              sell(100)
            }
          }
        }
      } catch(e) {
        console.log('uh oh - bid status :(', e)
      }
    }).catch(function (err) {
      console.log('then err', err)
    })
  }
  return go
}(), 750)

var ainterval = setInterval(function () {
  // console.log('Position : ', totalPos, ' filled  cancelled :', minusPos, ' txns : ', Object.keys(position.fills).length)
  var meta = tia.meta()
  console.log('meta', JSON.stringify(meta))
// if (FSM === 'trading') { // }&& meta.asks.length > 0) {
//   var bidSize = Math.floor(Math.random() * BUCKET_SIZE) + 1
//   if (argv.verbose)
//     console.log('Bidding for : ', bidSize, ' bucket> ', BUCKET_SIZE)
//
//   bidUp(bidSize)
//
//   if (totalPos >= 100000) {
//     console.log('I should be done ....')
//   // clearInterval(ainterval)
//   }
// } else {
//   console.log('FSM : ', FSM, ' Asks : ', meta.asks.length)
// }
}, 2500)

server.listen(config.port)
console.log('CC>> go :' + config.port)
