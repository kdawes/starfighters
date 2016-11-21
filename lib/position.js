'use strict'
module.exports = Position
// There should only be one instance of Position owned on a per Trading
// instance
function Position (opts) {
  if (!(this instanceof Position)) { return new Position(opts) }
  if (!opts) opts = {}

  this.cash = 0
  this.shares = 0
  this.ee = opts.ee

  // POSITION : FILLEVENT {
  // "ok": true,
  // "account": "YPS6428563",
  // "venue": "KMNEX",
  // "symbol": "EOPC",
  // "order": {
  //   "ok": true,
  //   "symbol": "EOPC",
  //   "venue": "KMNEX",
  //   "direction": "buy",
  //   "originalQty": 2,
  //   "qty": 0,
  //   "price": 3785,
  //   "orderType": "fill-or-kill",
  //   "id": 65,
  //   "account": "YPS6428563",
  //   "ts": "2016-01-05T06:42:20.986370169Z",
  //   "fills": [
  //     {
  //       "price": 3651,
  //       "qty": 2,
  //       "ts": "2016-01-05T06:42:20.986371606Z"
  //     }
  //   ],
  //   "totalFilled": 2,
  //   "open": false
  // },
  // "standingId": 56,
  // "incomingId": 65,
  // "price": 3651,
  // "filled": 2,
  // "filledAt": "2016-01-05T06:42:20.986371606Z",
  // "standingComplete": false,
  // "incomingComplete": true
  // }
  this.ee.on('ask', function (ask) {
    this.updatePosition('ask', ask)
  // console.log('ASK: ', JSON.stringify(ask))
  }.bind(this))
  this.ee.on('bid', function (bid) {
    this.updatePosition('bid', bid)
  // console.log('BID: ', JSON.stringify(bid))
  }.bind(this))
  this.ee.on('cancel', function (cancel) {
    // console.log('ee - cancel ', typeof(cancel), " > ", cancel)
    // XXX fixme - wat ?
    console.log('CANCEL: ', cancel)
  // this.updateCancel(JSON.parse(cancel))
  }.bind(this))
  this.ee.on('fillevent', function (fill) {
    this.updateFill(fill.order)
  // console.log('FILL: ', JSON.stringify(fill))
  }.bind(this))
  this.db = {
    asks: {},
    bids: {},
    cancelled: {
      asks: [],
      bids: []
    },
    fills: {
      asks: [],
      bids: []
    }
  }
}

Position.prototype.isFilled = function (id) {
  return (this.db.fills.asks.indexOf(id) >= 0 || this.db.fills.bids.indexOf(id) >= 0)
}

Position.prototype.haveOpenPendingAsks = function () {
  var that = this
  return (Object.keys(this.db.asks).filter(function (id) {
    if (that.db.asks[id].open) {
      console.log('haveOpenPendingAsks<<<<<<<<<<<<<<<<>>>>>>>>>> Id ', id , ' still open!', JSON.stringify(that.db.asks[id]))
    }
    return that.db.asks[id].open
  }).length > 0)
}

Position.prototype.pendingBids = function () {
  return Object.keys(this.db.bids).length > 0
}

Position.prototype.pendingId = function (id) {
  // console.log('pendingId ', id)
  return (Object.keys(this.db.asks).concat(Object.keys(this.db.bids)).indexOf(id) >= 0)
}

Position.prototype.updatePosition = function (type, obj) {
  // console.log('updatePosition: TYPE ', type, ', ', obj.id, ' ', typeof (obj)) // , ' OBJ ', JSON.stringify(obj))

  if (!type || !obj || !obj.id || (obj && typeof obj !== 'object') ||
    (obj && Array.isArray(obj))) {
    throw new Error('updatePosition: null inputs' + ' ' + type + ' ' + JSON.stringify(obj))
  }
  try {
    if (! obj.id) {
      throw new Error('updatePosition : malformed object input: ',
        JSON.stringify(obj))
    }
    if (type === 'ask') {
      this.db.asks[obj.id] = obj
    } else if (type === 'bid') {
      this.db.bids[obj.id] = obj
    } else {
      throw new Error('updatePosition : unknown type:', type)
    }
  } catch(e) {
    console.log('updatePosition:error ::', type, ' > ', JSON.stringify(obj, null, 2))
  }
}

function rollupFills (fill) {
  var tot = 0
  fill.order.fills.forEach(function (f) {
    tot += f.price * f.qty
  })
  return tot
}

Position.prototype.updateFill = function (obj) {
  // console.log('fill and obj :', obj, JSON.stringify(obj))
  // console.log('this', (this) ? 'ok' : 'nope')
  // console.log('this.db', (this && this.db) ? 'ok' : 'nope')
  // console.log('this.db.asks', (this && this.db && this.db.asks) ? 'ok' : 'nope')
  // console.log('this.db.bids', (this && this.db && this.db.bids) ? 'ok' : 'nope')
  // Net Account Value, I think. (cash + price x shares)

  if (!obj || ! obj.id) {
    console.log('updatePosition : malformed object input: ', JSON.stringify(obj))
  //  throw new Error('updatePosition : malformed object input: ',
  //    JSON.stringify(obj))
  } else {
    if (obj.id in this.db.asks ||
      (obj.direction && obj.direction === 'sell')) {
      delete this.db.asks[obj.id]
      this.db.fills.asks.push(obj)
      // only tally this up if this order is closed
      if (obj.open == false) {
        this.cash += rollupFills({order: obj})
        this.shares -= obj.totalFilled
      }
    // console.log('FILL : ', obj.id, ' isA ', obj.direction, ' : ', obj.totalFilled)
    } else if (obj.id in this.db.bids ||
      (obj.direction && obj.direction === 'buy')) {
      delete this.db.bids[obj.id]
      this.db.fills.bids.push(obj)
      if (obj.open == false) {
        this.cash -= rollupFills({order: obj})
        this.shares += obj.totalFilled
      }
    // console.log('FILL : ', obj.id, ' isA ', obj.direction, ' : ', obj.totalFilled)
    } else {
      throw new Error('fill : unknown type:', obj)
    }
  }
}

Position.prototype.updateCancel = function (obj) {
  //  console.log('UPDATECANCEL WITH : ', obj, ' ', typeof (obj))
  if (!obj || ! obj.id) {
    throw new Error('updateCancel : malformed object input: >',
      JSON.stringify(obj), ' : ', obj)
  }

  if (obj.id in this.db.asks) {
    delete this.db.asks[obj.id]
    this.db.cancelled.asks.push(obj)
  } else if (obj.id in this.db.bids) {
    delete this.db.bids[obj.id]
    this.db.cancelled.bids.push(obj)
  } else {
    console.log('WARNING , CANCELLING obj isnt recorded in bids or asks',
      JSON.stringify(obj))
    throw new Error('cancel : not in bids or asks : cant cancel :', JSON.stringify(obj))
  }
}

Position.prototype.ask = function (obj) {
  // console.log('position:ask')
  if (!obj || ! (typeof obj === 'object' && !Array.isArray(obj))) {
    throw new Error('ask:null input or non object', obj)
  }

  this.updatePosition('ask', obj)
}

Position.prototype.bid = function (obj) {
  // console.log('position:bid', obj)
  if (!obj || ! (typeof obj === 'object' && !Array.isArray(obj))) {
    throw new Error('ask:null input or non object', obj)
  }

  this.updatePosition('bid', obj)
}

Position.prototype.fill = function (obj) {
  // console.log('position.fill >', JSON.stringify(obj), '<')
  if (!obj || ! (typeof obj === 'object' && !Array.isArray(obj))) {
    throw new Error('fill:null input or non object', obj)
  }
  this.updateFill(obj)
}

Position.prototype.cancel = function (obj) {
  if (!obj || ! (typeof obj === 'object' && !Array.isArray(obj))) {
    throw new Error('cancel:null input or non object', obj)
  }

  this.updateCancel(obj)
}
