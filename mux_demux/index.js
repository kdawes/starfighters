var Api = new require('..')({})
var sockWrap = require('../lib/sockwrap')
var axon = require('axon')
// var mq = axon.socket('push')
var mq = axon.socket('pub')

module.exports = MuxDemux

function MuxDemux (opts) {
  if (!(this instanceof MuxDemux)) {
    return new MuxDemux(opts)
  }
  this.trading = opts.trading
  this.symbol = opts.symbol
  this.account = opts.account
  this.venue = opts.venue
  this.ee = opts.ee
  this.config = opts.config
  this.accounts = []
  this.sockets = {}
  this.last = 0

  // xxxfixme hardcoded
  mq.bind(3000)

  //  console.log('MuxDemux init : account :', this.account, ' venue ', this.venue, ' symbol ', this.symbol)

  this.ee.on('TRIDENT', function (ev) {
    var account = this.tradingAccountFromBuffer(ev)
    // console.log('ACCOUNT : ', account)
    if (account && this.accounts.indexOf(account) === -1) {
      // console.log('-> Adding ', account)
      this.accounts.push(account)
      this.setupAccount({
        account: account
      })
    } else if (account) {
      // // console.log(account, '..already tracked or error')

    }
  }.bind(this))

  var interval = setInterval(function () {
    this.cancelSpike()
  }.bind(this), 7500)

// var wsRefreshInterval = setInterval(function () {
//   Object.keys(this.sockets).forEach(function (account) {
//     console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! refreshing websocket for ', account)
//     this.sockets[account] = this.refreshWebsocket(account)
//   }.bind(this))
// }.bind(this), 1 * 60 * 1000)
}

MuxDemux.prototype.refreshWebsocket = function (account) {
  if (this.sockets[account] && typeof (this.sockets[account]) == 'function') {
    this.sockets[account].close()
    console.log('this.sockets[account] : ', typeof (this.sockets[account]), ' ', this.sockets[account])
  }
  // console.log('setupAccount : ', JSON.stringify(opts))
  var wstext = [this.config.ws_api_root, account, '/venues/',
    this.venue, '/executions'].join('')
  // console.log('setupAccount : wstext : ', wstext)
  return new sockWrap(wstext, this.ee, account)
}

MuxDemux.prototype.setupAccount = function (opts) {
  this.ee.on(opts.account, function (fill) {
    mq.send(fill)
  })
  this.ee.on('websocketclose', function (dat) {
    console.log('WEBSOCKETCLOSE received : ', dat, ' REFRESHING IS DISABLED!!! ')
    if (this.sockets[dat.account] == dat.account) {
      // wait for the timeout ...
      console.log('websocketclose : DEBOUNCE -- waiting')
    } else {
      // setup a canary so we only do this once in case we get multiple
      // close events in our debounce window
      this.sockets[dat.account] = dat.account
      // debounce

      function getRandomIntInclusive (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
      }
      setTimeout(function () {
        console.log('REFRESHING websocket : ', dat.account)
        this.sockets[dat.account] = this.refreshWebsocket(dat.account)
      }.bind(this), 5000 + getRandomIntInclusive(20, 30) * 1000)
    }
  }.bind(this))
  this.sockets[opts.account] = this.refreshWebsocket(opts.account)
}

function checkErrorsAndRespond (b, emitter, emitter_tag) {
  if (!b) {
    throw new Error('checkErrorsAndRespond - null inputs')
  }
  try {
    var body = JSON.parse(b.body)
    if (b.error) {
      console.log('cear : thats an error: ', JSON.stringify(b))
      if (emitter) {
        emitter.emit('error', body)
      }
      return body
    } else {
      // console.log('CEAR : looks ok')
      if (emitter && emitter_tag) {
        emitter.emit(emitter_tag, b.body)
      }
      return {ok: true, data: b.body}
    }
  } catch(e) {}
}

MuxDemux.prototype.cancelSpike = function () {
  var that = this
  var i = this.last
  console.log('cancelSpike')
  Api.cancelBid(this.venue, this.symbol, 9999999)
    .then(function (b) {
      console.log('cancelSpike : rawBody : ', b.body)
      var ss = checkErrorsAndRespond(b)
      var maxId = ss.data.split(' ').pop().slice(0, -4)
      console.log('cancelSpike , maxId :', maxId)
      var limit = (this.last + 100 < maxId) ? (this.last + 100) : maxId
      for (; i <= limit;  i++, this.last++) {
        // console.log('TRIDENT : limit : ', limit, ' canceling ', i)
        if (that.trading.position.pendingId(i) || that.trading.position.isFilled(i)) {
          console.log('SKIPPING OUR OWN ORDER : ', i)
        } else {
          Api.cancelBid(this.venue, this.symbol, i)
            .then(function (b) {
              return checkErrorsAndRespond(b, this.ee, 'TRIDENT')
            }.bind(this))
            .catch(function (err) {
              console.log('cancel:error: ', bidId, err)
            })
        }
      }
    }.bind(this))
}
//
MuxDemux.prototype.tradingAccountFromBuffer = function (buf) {
  // console.log('tradingAccountFromBuffer : ', buf, ' : ', typeof (buf))
  // {"ok":false,"error":"Not authorized to delete that order.  You have to own account LMB90168997."}
  // we want to snag the account id from the error message
  // so : split it into tokens on spaces, grab the last token, trim off the '.'
  try {
    var tmp = (typeof (buf) === 'string') ?
      JSON.parse(buf) : JSON.parse(JSON.stringify(buf))
    var account = null
    if (tmp.ok === false && tmp.error) {
      account = tmp.error.split(' ').pop().slice(0, -1)
    } else {
      //  console.log('tradingAccountFromBuffer - strange input:', buf)
    }
    return account
  } catch (err) {
    console.log('tradingAccountFromBuffer: error: ', err)
    return null
  }
}
