// attribution engine
// we receive fillevents over axon
var selectn = require('selectn')
var table = require('text-table')

var chalk = require('chalk')
var axon = require('axon')
var sock = axon.socket('pull')
// var c2 = axon.socket('rep')
var c2 = axon.socket('sub')
var Position = require('../lib/position')
var moment = require('moment')
// weird plugin api
require('moment-range')

var events = require('events')
var ee = new events.EventEmitter()
var command_port = 9000
var interval_len = 1000
var port = 3000
//
sock.connect(port)
// c2.bind(command_port)
console.log('attribution server started : port : ', port)
//
// { account: [fill1, fill2, fill3. ..], account2: [fillx, filly, fill ... fillz]}
var accounts = {}
// { account: {shares: xxx, cash: yyy }, account2: {...}, account3: {... }}
var positions = {}
//
var network = {}
//
var seq = {}

sock.on('message', handleFill)
c2.on('message', handleCommand)

function idxById (a, field, id) {
  var idx = -1
  for (var i = 0; i < a.length; i++) {
    var tmp = selectn(field, a[i])
    // console.log('cpid : testing : ', a[i].order.id, ' vs id : ', id)
    if (tmp === id) {
      idx = i
      break
    }
  }
  return idx
}

setInterval(function () {
  var s = Object.keys(accounts).sort(function (a, b) {
    return accounts[a].length - accounts[b].length
  })
  var lines = []
  lines.push(['idx', 'acct', 'cash', 'shares', 'fills'])

  for (var i = 0; i < s.length; i++) {
    var cashFn = (positions[s[i]].cash > 0) ? chalk.green : chalk.red
    var sharesFn = (positions[s[i]].shares > 0) ? chalk.green : chalk.red
    lines.push([i, s[i], cashFn(positions[s[i]].cash), sharesFn(positions[s[i]].shares), accounts[s[i]].length])
  }
  var t = table(lines, { align: ['r', 'r', 'r', 'r', 'r']})
  if (process.env.ATTR_OUTPUT_DISPOSITION === 'table') {
    console.log(t)
  } else {
    var fillIds = []
    ;(function () {
      Object.keys(accounts).forEach(function (a) {
        accounts[a].forEach(function (fill) {
          fillIds.push(fill)
        })
      })
    })()
    fillIds.sort(function (a, b) {return a.order.id - b.order.id})
    var ll = []
    for ( var i = 0; i < fillIds.length; i++) {
      var order = fillIds[i]
      var counterPartyId = (order.order.id == order.standingId) ? order.incomingId : order.standingId
      var idx = idxById(fillIds, 'order.id', counterPartyId)
      // console.log('id : ', order.order.id, ' counterPartyId: ', counterPartyId, ' idx : ', idx)

      if (idx >= 0) {
        var counterOrder = fillIds[idx]
        var line = [
          order.order.id,
          ':',
          order.order.account,
          order.order.direction,
          counterOrder.filled,
          (order.order.direction == 'sell') ? 'to' : 'from',
          //     //  counterPartyId
          counterOrder.account,
          '@',
          counterOrder.order.price,
          '(id : ' + order.order.id + ' i: ' + i + ')'
        ]
        // console.log(line)
        ll.push(line)
      } else {
        //  console.log('failed to match ', order.order.id, ' idx ', idx)
      }
    }
    var t = table(ll, {align: ['r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r]']})
    console.log(t)
  }
}, interval_len)

function checkDup (msg) {
  return (accounts[msg.account].filter(function (i) {
    return i.order.id == msg.order.id
  }) > 0)
}

function handleFill (msg) {
  if (! accounts[msg.account]) {
    accounts[msg.account] = []
    positions[msg.account] = new Position({ ee: ee })
  }
  if (checkDup(msg)) {
    console.log('handleFill:DUPLICATE, but no action taken. FIXME! : ', JSON.stringify(msg, null, 2))
  }
  accounts[msg.account].push(msg)
  positions[msg.account].updateFill(msg.order)
}

function handleCommand (msg, cb) {
  if (msg.account) {
    console.log('handleCommand : ', msg.account)
    cb(positions[msg.account])
  } else {
    console.log('handleCommand : ', JSON.stringify(msg))
    var ts = parseInt(msg.ts, 10)
    var win = parseInt(msg.window, 10)
    var halfWindow = Math.ceil(win / 2)
    var windowStart = moment(ts - halfWindow)
    var windowEnd = moment(ts + halfWindow)
    var matches = []
    ;(function () {
      Object.keys(accounts).forEach(function (a) {
        accounts[a].filter(function (fill) {
          var targetTs = moment(fill.order.ts)
          // console.log('targetTs : ', targetTs.unix(), ' start ', windowStart.unix(), ' end ', windowEnd.unix())
          return moment().range(windowStart, windowEnd).contains(targetTs)
        }).forEach(function (m) {
          matches.push(m)
        })
      })
    })()
    cb(matches)
  }
}
