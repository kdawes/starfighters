var React = require('react')
var App = require('./components/App')
var Stocks = require('./components/stocks')
var Ticker = require('./components/ticker.js')
React.render(<Stocks/>, document.getElementById('stocks'))
// React.render(<Ticker/>, document.getElementById('ticker'))
React.render(<App/>, document.getElementById('App'))
