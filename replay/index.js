var json = require('./capture.json')
var minimist = require('minimist')
var argv = minimist(process.argv)

var data = {
  ask: {
    name: 'ask',
    values: [],
  },
  bid: {
    name: 'bid',
    values: [],
  },
  last: {
    name: 'last',
    values: [],
  }
}

var start = null
var count = 0
var inc = 0
json.forEach(function (i) {
  count++
  if (count === 0) {
    start = new Date(i.quote.quoteTime).getTime()
  }
  if ((argv.skip && count > argv.skip) && ((argv.limit && inc < argv.limit) || !argv.limit)) {
    inc++
    if (i.quote.ask) {
      data.ask.values.push({
        x: new Date(i.quote.quoteTime).getTime() - start - 4999,
        y: i.quote.ask
      })
    }
    if (i.quote.bid) {
      data.bid.values.push({
        x: new Date(i.quote.quoteTime).getTime() - start - 4999,
        y: i.quote.bid
      })
    }
    if (i.quote.last) {
      data.last.values.push({
        x: new Date(i.quote.quoteTime).getTime() - start - 4999,
        y: i.quote.last
      })
    }
  }
})

console.log(JSON.stringify([data.ask, data.bid, data.last], null, 2))
