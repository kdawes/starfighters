var request = require('request')
var promise = require('promise')
// / special
var config = require('./config/config')

//
module.exports = api
function api (opts) {
  if (! (this instanceof api)) {
    return new api(opts)
  }
}

function promisifyRequest (options) {
  var P = new promise(function (resolve, reject) {
    request(options, function (e, r, b) {
      if (e) { console.log('promisifyReqest: request: error', e); reject(e); return }
      resolve({error: e, result: r, body: b})
    })
  }).then(function (body) {
    return body
  }).catch(function (err) {
    console.log('promisifyRequest: error: ', err)
    return err
  })
  return P
}

api.prototype.levelStart = function (levelName) {
  var url = 'https://www.stockfighter.io/gm/levels/' + levelName
  var options = {
    method: 'POST',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.levelRestart = function (instanceId) {
  console.log('levelREstart')
  var url = 'https://www.stockfighter.io/gm/instances/' + instanceId + '/restart'
  var options = {
    method: 'POST',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.levelStop = function (instanceId) {
  var url = 'https://www.stockfighter.io/gm/instances/' + instanceId + '/stop'
  var options = {
    method: 'POST',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.levelResume = function (instanceId) {
  var url = 'https://www.stockfighter.io/gm/instances/' + instanceId + '/resume'
  var options = {
    method: 'POST',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.levelCheck = function (instanceId) {
  var url = 'https://www.stockfighter.io/gm/instances/' + instanceId
  var options = {
    method: 'GET',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return pr1omisifyRequest(options)
}

api.prototype.getApiKey = function () {
  return config.api_key
}

api.prototype.cancelBid = function (venueId, stockId, bidId) {
  var url = 'https://api.stockfighter.io/ob/api/venues/' + venueId + '/stocks/' + stockId + '/orders/' + bidId
  var options = {
    method: 'DELETE',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.getAllBidStatus = function (venueId, acountId) {
  var url = 'https://api.stockfighter.io/ob/api/venues/' + venueId + '/accounts/' + accountId + '/orders'
  var options = {
    method: 'GET',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}
// https://api.stockfighter.io/ob/api/venues/:venue/accounts/:account/stocks/:stock/orders
api.prototype.getAllBidStatusForStock = function (venueId, acountId, stockId) {
  var url = 'https://api.stockfighter.io/ob/api/venues/' + venueId + '/accounts/' + accountId + '/stocks/' + stockId + '/orders'
  var options = {
    method: 'GET',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.getBidStatus = function (bidId, venueId, stockId) {
  var url = 'https://api.stockfighter.io/ob/api/venues/' + venueId + '/stocks/' + stockId + '/orders/' + bidId
  var options = {
    method: 'GET',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.getQuote = function (venueId, stockId) {
  var url = 'https://api.stockfighter.io/ob/api/venues/' + venueId + '/stocks/' + stockId + '/quote'
  var options = {
    method: 'GET',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

// {
//   "account": "MST92145671",
//   "venue": "LOBHEX",
//   "stock": "LPEI",
//   "qty": 100,
//   "direction": "buy",
//   "orderType": "market"
// }
api.prototype.sell = function (accountId, venueId, stockId, price, qty, orderType) {
  var direction = 'sell'
  var url = 'https://api.stockfighter.io/ob/api/venues/' + venueId + '/stocks/' + stockId + '/orders'
  var options = {
    method: 'POST',
    url: url,
    json: true,
    body: {
      account: accountId,
      venue: venueId,
      stock: stockId,
      price: price,
      qty: qty,
      direction: direction,
      orderType: orderType
    },
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

// {
//   "account": "MST92145671",
//   "venue": "LOBHEX",
//   "stock": "LPEI",
//   "qty": 100,
//   "direction": "buy",
//   "orderType": "market"
// }
api.prototype.bid = function (accountId, venueId, stockId, price, qty, orderType) {
  var direction = 'buy'
  var url = 'https://api.stockfighter.io/ob/api/venues/' + venueId + '/stocks/' + stockId + '/orders'
  var options = {
    method: 'POST',
    url: url,
    json: true,
    body: {
      account: accountId,
      venue: venueId,
      stock: stockId,
      price: price,
      qty: qty,
      direction: direction,
      orderType: orderType
    },
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.orderbook = function (venueId, stockId) {
  var url = 'https://api.stockfighter.io/ob/api/venues/' + venueId + '/stocks/' + stockId
  var options = {
    method: 'GET',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.venueStocks = function (venueId) {
  var url = 'https://api.stockfighter.io/ob/api/venues/' + venueId + '/stocks'
  var options = {
    method: 'GET',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.venueHeartbeat = function (venueId) {
  var url = 'https://api.stockfighter.io/ob/api/venues/' + venueId + '/heartbeat'
  var options = {
    method: 'GET',
    url: url,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.heartbeat = function () {
  var options = {
    method: 'GET',
    url: 'https://api.stockfighter.io/ob/api/heartbeat',
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.flash = function (instanceId) {
  var options = {
    method: 'GET',
    url: 'https://www.stockfighter.io/gm/instances/' + instanceId,
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}

api.prototype.judge = function (account, link, summary, instanceId) {
  //  { "account" : "ABC123456", "explanation_link": "http://www.example.com", "executive_summary": "Lorem ipsum blah blah blah." }

  // account (string): the trading account of the comptroller's accomplice
  // explanation_link (string): a publicly accessible URL leading to a detailed explanation of your evidence. (Feel free to show us code via Github or similar.)
  // executive_summary (string): A paragraph or two of text explaining your approach.
  // Post your evidence to /gm/instances/YOUR_INSTANCE_ID/judge You can find your instance ID by taking a look at the developer tools in your browser and looking for the GET request against /gm/instances/YOUR_INSTANCE_ID which the UI is presently polling every few seconds.
  //
  var options = {
    method: 'POST',
    url: 'https://www.stockfighter.io/gm/instances/' + instanceId + '/judge',
    json: true,
    body: {
      account: account,
      explanation_link: link,
      executive_summary: summary
    },
    headers: {
      'X-Starfighter-Authorization': config.api_key
    }
  }
  return promisifyRequest(options)
}
