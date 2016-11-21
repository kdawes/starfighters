'use strict'
var selectn = require('selectn')
var React = require('react')
// var Grid = require('react-bootstrap').Grid
// var Row = require('react-bootstrap').Row
// var Col = require('react-bootstrap').Col
// var moment = require('moment')
// var _ = require('lodash')
// var Watcher = require('../lib/watcher')
// var Tia = require('../../../lib/tia')
// var tia = new Tia({})
// need to require css or browserify doesn't pull in the bootstrap stuff
// var css = require('../../css/app.css')

function avgPrice (a) {
  if (!a || ! Array.isArray(a)) {
    // throw new Error('avg(a) : parameter "a" must be an array')
    return 0
  }
  // console.log('avgPrice : : ', a)
  //  var aaa = (a.length > 0) ? (a.reduce(function (a, b) { return a.price + b.price }, 0) / a.length) : 0
  var tot = 0
  a.forEach(function (i) {
    tot += i.price
  })
  return tot / a.length
}

function avgQty (a) {
  if (!a || ! Array.isArray(a)) {
    // throw new Error('avg(a) : parameter "a" must be an array')
    return 0
  }
  // console.log('avgPrice : : ', a)
  //  var aaa = (a.length > 0) ? (a.reduce(function (a, b) { return a.price + b.price }, 0) / a.length) : 0
  var tot = 0
  a.forEach(function (i) {
    tot += i.qty
  })
  return tot / a.length
}

var Updown = React.createClass({
  render: function () {
    if (this.props && this.props.obook && this.props.obook.bids && this.props.obook.asks) {
      var bidLen = parseInt((this.props.obook.bids) ? this.props.obook.bids.length : 0, 10)
      var askLen = parseInt((this.props.obook.asks) ? this.props.obook.asks.length : 0, 10)

      var avgBid = parseInt((askLen > 0) ? avgPrice(this.props.obook.bids) : 0, 10)
      var avgBidQty = parseInt(avgQty(this.props.obook.bids), 10)

      var avgAsk = parseInt((bidLen > 0) ? avgPrice(this.props.obook.asks) : 0, 10)
      var avgAskQty = parseInt(avgQty(this.props.obook.asks), 10)
      //  console.log('THIS.PROPS', JSON.stringify(this.props, null, 2))
      return (<div>Bids : {bidLen} : avg : {avgBid} {avgBidQty}  Asks :{askLen} avg : {avgAsk} {avgAskQty}</div>)
    } else {
      return (<div> -- NA -- </div>)
    }
  }
})

exports = module.exports = Updown
