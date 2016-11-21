'use strict'

var React = require('react')
var Highstock = require('react-highcharts/bundle/highstock')
var Proxy = require('../lib/proxy')
var parseWrap = require('../../../lib/parsewrap')
var data = require('./series.json')
var _ = require('lodash')
var asks = []
var bids = []
var config = {
  rangeSelector: {
    selected: 1
  },
  title: {
    text: 'HO HO HO'
  },
  series: [{
    color: '#fa1a1a',
    name: 'ASKS',
    data: [],
    tooltip: {
      valueDecimals: 2
    }
  },
    {
      color: '#336aff',
      name: 'BIDS',
      data: [],
      tooltip: {
        valueDecimals: 2
      }
    },
    {
      color: '#220000',
      name: 'LAST1',
      data: [],
      tooltip: {
        valueDecimals: 2
      }
    },
    {
      color: '#00aa00',
      name: 'CURRENT ASK',
      data: [],
      tooltip: {
        valueDecimals: 2
      }
    },
    {
      color: '#0000dd',
      name: 'CURRENT BID',
      data: [],
      tooltip: {
        valueDecimals: 2
      }
    }
  ]

}
var askbid = null
var ticker = null
var chart = React.createElement(Highstock, { config: config })
var Stocks = React.createClass({
  getInitialState: function () {
    return { ticker: [] }
  },
  componentDidMount: function () {
    var that = this
    this.buffer = []
    console.log('componentDidMount')
    ticker = new Proxy({wsText: 'ws://localhost:9090', callback: function (data) {
        var parsed = parseWrap(data)
        that.buffer.push(parsed)
    }})

    this.tickerInterval = setInterval(function () {
      var parsed = _.flatten(this.buffer)
      this.buffer = []
      //  console.log('DATA', JSON.stringify(parsed, null, 2))
      if (parsed && parsed.length > 0) {
        that.setState({ ticker: parsed })
      }

      asks = []
      bids = []

    }.bind(this), 10000)

    askbid = new Proxy({  wsText: 'ws://localhost:8888', callback: function (data) {
        var parsed = parseWrap(data)
        //  console.log('ASKBID Proxy', JSON.stringify(data))
        if (parsed.direction && parsed.direction === 'buy') {
          //  console.log('BUY from PROXY')
          // that.setState({ bid: parsed})
          bids.push(parsed)
        } else if (parsed.direction && parsed.direction === 'sell') {
          //  console.log('SELL FROM PROXY')
          // that.setState({ ask: parsed })
          asks.push(parsed)
        }
    }})

  },
  render: function () {
    var bd = []
    var ad = []
    bids.forEach(function (b) {
      bd.push([new Date(b.ts).getTime(), b.price])
    })
    config.series[4].data = bd
    asks.forEach(function (a) {
      ad.push([new Date(a.ts).getTime(), a.price])
    })
    config.series[3].data = ad

    var m = this.state.ticker
    // if (m.length > 0) {
    var ask = []
    var bid = []
    var last = []
    var count = 0
    m.forEach(function (i) {
      if (i.quote.ask) {
        ask.push([new Date(i.quote.quoteTime).getTime(), i.quote.ask])
      }
      if (i.quote.bid) {
        bid.push([new Date(i.quote.quoteTime).getTime(), i.quote.bid])
      }
      if (i.quote.last) {
        last.push([new Date(i.quote.quoteTime).getTime(), i.quote.last])
      }

    })
    config.series[0].data = ask
    config.series[1].data = bid
    config.series[2].data = last

    return (React.createElement(Highstock, { config: config }))
  }
})
module.exports = Stocks
