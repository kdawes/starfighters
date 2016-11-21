var api = require('.')
var Api = new api({})
var util = require('util')
var async = require('async')
var parseWrap = require('./lib/parsewrap')

module.exports = WrappedApi

function WrappedApi (opts) {
  this.tia = opts.tia
  this.ee = opts.ee
  this.levelcfg = opts.levelcfg
  console.log('LEVELCFG : beautified : ', JSON.stringify(this.levelcfg, null, 2))
  api.call(this)
}
util.inherits(WrappedApi, api)

// b - the 'body' of the response
// emitter_tag : eg: 'ask', 'bid', 'cancel' - if
// emitter_tag is null, no data
function checkErrorsAndRespond (b, emitter, emitter_tag) {
  if (!b) {
    throw new Error('checkErrorsAndRespond - null inputs')
  }
  if (b.error) {
    console.log('cear : thats an error: ', JSON.stringify(b))
    if (emitter) {
      emitter.emit('error', b.error)
    }
    return {ok: false, message: emitter_tag + ' : ' + b.error}
  } else {
    // console.log('CEAR : looks ok')
    if (emitter && emitter_tag) {
      emitter.emit(emitter_tag, b.body)
    }
    return {ok: true, data: b.body}
  }
}

function getTradeMetadata (ctx) {
  var account = (ctx.levelcfg) ? ctx.levelcfg.account : 'EXB123456'
  var venue = (ctx.levelcfg) ? ctx.levelcfg.venues[0] : process.env.VENUE
  var symbol = (ctx.levelcfg) ? ctx.levelcfg.tickers[0] : process.env.SYMBOL
  return [account, venue, symbol]
}

WrappedApi.prototype.judge = function (obj) {
  // console.log('WRAPPED JUDGE : ', JSON.stringify(obj))
  Api.judge(obj.account,
    obj.explanation_link,
    obj.executive_summary, this.levelcfg.instanceId).then(function (r) {
    // console.log('beautified : judge : response', r, JSON.stringify(r))
    return checkErrorsAndRespond(r, this.ee, null)
  }.bind(this))
    .catch(function (error) {
      console.log('judge : error :', error)
    })

}

WrappedApi.prototype.quote = function () {
  var meta = getTradeMetadata(this)
  Api.getQuote(meta[1], meta[2]).then(function (quote) {
    return checkErrorsAndRespond(quote, this.ee, null)
  }.bind(this))
    .catch(function (error) {
      console.log('quote : error :', error)
    })
}

WrappedApi.prototype.orderbook = function () {
  var meta = getTradeMetadata(this)
  console.log('orderbook : meta : ', JSON.stringify(meta))
  Api.orderbook(meta[1], meta[2])
    .then(function (b) {
      console.log('>> ', JSON.stringify(JSON.parse(b.body), null, 2))
      // var ob = JSON.parse(res.body)
      return checkErrorsAndRespond(b, this.ee, null)
    }.bind(this))
    .catch(function (error) {
      console.log('no orderbook ', error)
    })
}

WrappedApi.prototype.buy = function (bidSize, type, price) {
  var meta = getTradeMetadata(this)
  // console.log('buy: num : ', bidSize, ' type : ', type, ' price : ', price)
  // Api.bid( account, venue, symbol, price, bidSize, type || 'limit')
  Api.bid(meta[0], meta[1], meta[2], parseInt(price), parseInt(bidSize), type || 'limit')
    .then(function (b) {
      // console.log('buy ', JSON.stringify(b, null, 2))
      return checkErrorsAndRespond(b, this.ee, 'bid')
    }.bind(this))
    .catch(function (error) {
      console.log('buy:error: ', error)
    })
}

WrappedApi.prototype.sell = function (askSize, type, price) {
  console.log('sell: ', askSize, ' ', type, ' ', price)
  var meta = getTradeMetadata(this)
  // Api.sell(account, venue, symbol, price, bidSize, type || 'limit')
  Api.sell(meta[0], meta[1], meta[2], price, askSize, type || 'limit')
    .then(function (b) {
      return checkErrorsAndRespond(b, this.ee, 'ask')
    }.bind(this))
    .catch(function (error) {
      console.log('sell:error: ', error)
    })
}

WrappedApi.prototype.cancel = function (bidId) {
  var meta = getTradeMetadata(this)
  console.log('cancel : meta : ', JSON.stringify(meta))
  //  Api.cancelBid(this.levelcfg.venues[0], symbol, bidId).then(function (res) {
  Api.cancelBid(meta[1], meta[2], bidId)
    .then(function (b) {
      // console.log('cancel>> ', JSON.stringify(JSON.parse(b.body), null, 2))
      return checkErrorsAndRespond(b, this.ee, 'cancel')
    }.bind(this))
    .catch(function (err) {
      console.log('cancel:error: ', bidId, err)
    })
}

WrappedApi.prototype.cancelAll = function (position) {
  var that = this
  var keys = Object.keys(position.db.bids).concat(Object.keys(position.db.asks))
  var meta = getTradeMetadata(this)
  console.log('KILLING THESE ONES :', keys)
  if (keys.length) {
    async.each(keys, function (bid, callback) {
      //    console.log(' cancelling :  ', bid)
      Api.cancelBid(meta[1], meta[2], bid).then(function (b) {
        return checkErrorsAndRespond(b, that.ee, 'cancel')
      }).catch(function (error) {
        console.log('Thats an error ', error)
      })
    }, function (err) {
      if (err)
        console.log('Cancel bids failed!', err)
      return that.res.json({ok: false, message: err || 'error'})
    })
  }
}

WrappedApi.prototype.averagedBuy = function (bidSize, bidType, SYMBOL, BID_PCT, price) {
  //  console.log('averagedBuy')
  var that = this
  var avgBid, avgAsk, avgSpread = null
  var meta = this.tia.meta()
  //  console.log('averagedBuy', JSON.stringify(meta))
  if (meta) {
    if (meta.asks.length) {
      avgAsk = reduceAndShiftDecimal(meta.asks)
    // console.log('AskingAvg:', avgAsk)
    }
    if (meta.bids.length) {
      avgBid = reduceAndShiftDecimal(meta.bids)
    //    console.log('BidingAvg:', avgBid)
    }
    if (meta.spreads.length) {
      avgSpread = reduceAndShiftDecimal(meta.spreads)
    // console.log('SpreadAvg:', avgSpread)
    }

    if (avgBid) {
      var bidPct = Math.floor(avgSpread * BID_PCT)
      var bidPrice = price || meta.last + bidPct
      var meta = getTradeMetadata(this)
      //  var bid = Api.bid(that.levelcfg.account,
      // meta is avs
      var bid = Api.bid(meta[0],
        meta[1],
        meta[2],
        bidPrice,
        bidSize,
        bidType || 'limit')
      bid.then(function (b) {
        return checkErrorsAndRespond(b, this.ee, 'bid')
      }.bind(this))
    } else {
      return ({ok: false, data: 'no meta'})
    }
  }
}

// Sell based on the average with a discount
WrappedApi.prototype.averagedSell = function (size, bidType, SYMBOL, ASK_PCT, price) {
  // console.log('meta >', JSON.stringify(tia.meta(), null, 2))
  //  console.log('averagedSell: ', size, ', ', bidType, ', ', SYMBOL, ', ', ASK_PCT)
  var avgBid, avgAsk, avgSpread = null
  var meta = this.tia.meta()
  if (meta) {
    if (meta.asks.length) {
      avgAsk = reduceAndShiftDecimal(meta.asks)
    //  console.log('AskingAvg:', avgAsk)
    }

    if (avgAsk) {
      var askPct = Math.floor(avgSpread * ASK_PCT)
      var askPrice = price || avgAsk - parseInt(askPct, 10)
      // console.log('bidPct : ', askPct, ' => askPrice : ', askPrice)
      // console.log('SELL ', levelcfg.account, ' , ', levelcfg.venues[0],
      //  ',', SYMBOL, ', ', size, ' @ ', askPrice, ',',
      //  bidType || 'limit', ' LAST : (', meta.last, ')')
      var meta = getTradeMetadata(this)
      var ask = Api.sell(meta[0],
        meta[1],
        meta[2],
        askPrice,
        size,
        'limit')
      ask.then(function (b) {
        return checkErrorsAndRespond(b, this.ee, 'ask')
      }.bind(this)).catch(function (err) {
        console.log('sell:error: ', bidId, ' : ', err)
      })
    }
  }
}
