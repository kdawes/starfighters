var json = require('./capture.json')
var minimist = require('minimist')
var argv = minimist(process.argv)
var ask = []
var bid = []
var last = []
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
      ask.push([new Date(i.quote.quoteTime).getTime() - start, i.quote.ask])
    }
    if (i.quote.bid) {
      bid.push([new Date(i.quote.quoteTime).getTime() - start, i.quote.bid])
    }
    if (i.quote.last) {
      last.push([new Date(i.quote.quoteTime).getTime() - start, i.quote.last])
    }
  }
})
console.log(JSON.stringify([ask, bid, last], null, 2))
