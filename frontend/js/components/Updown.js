'use strict'
var selectn = require('selectn')
var React = require('react')
// var Grid = require('react-bootstrap').Grid
// var Row = require('react-bootstrap').Row
// var Col = require('react-bootstrap').Col
// var moment = require('moment')
var _ = require('lodash')
// var Watcher = require('../lib/watcher')
// var Tia = require('../../../lib/tia')
// var tia = new Tia({})
// need to require css or browserify doesn't pull in the bootstrap stuff
// var css = require('../../css/app.css')

var Updown = React.createClass({
  render: function () {
    //  console.log('THIS.PROPS', JSON.stringify(this.props, null, 2))
    var aa = this.props.meta.asks.slice(-6)
    var momentumAsks = _.chunk(aa, 2).reduce(function (a, b) {
      // console.log('a[0]', a[0], ' a[1] ', a[1], ' b[0] ', b[0], ' b[1] ', b[1])
      return b[1] - b[0]
    }, 0)
    var momentumBids = _.chunk(this.props.meta.bids.slice(-6), 2).reduce(function (a, b) {
      return b[1] - b[0]
    }, 0)
    var momentumSpreads = _.chunk(this.props.meta.spreads.slice(-6), 2).reduce(function (a, b) {
      return b[1] - b[0]
    }, 0)

    var cash = parseInt((this.props.nav) ? this.props.nav.cash : 0, 10) / 100
    var shares = parseInt((this.props.nav) ? this.props.nav.shares : 0, 10)
    var nav = parseInt((this.props.nav) ? this.props.nav.nav : 0.0, 10) / 100
    return (<div>Cash: {cash} Shares:{shares} NAV: {nav} Momentum Asks : {momentumAsks} Momentum Bids :{ momentumBids } Momentum Spreads : { momentumSpreads }</div>)
  }
})

exports = module.exports = Updown
