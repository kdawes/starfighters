'use strict'
var React = require('react')
var Grid = require('react-bootstrap').Grid
var Row = require('react-bootstrap').Row
var Col = require('react-bootstrap').Col
var Sparklines = require('react-sparklines').Sparklines
var SparklinesLine = require('react-sparklines').SparklinesLine
var SparklinesBars = require('react-sparklines').SparklinesBars
var moment = require('moment')
var _ = require('lodash')
var Proxy = require('../lib/proxy')
var parseWrap = require('../../../lib/parsewrap')
var Updown = require('./Updown')
var Orderbook = require('./orderbook')
var Stocks = require('./stocks')
// need to require css or browserify doesn't pull in the bootstrap stuff
var css = require('../../css/app.css')

function avg (a, tag) {
  if (! Array.isArray(a)) {
    throw new Error('avg(a) : parameter "a" must be an array')
  }
  return (a.length > 0) ? (a.reduce(function (a, b) { return a + b }) / a.length) : 0
}

var ticker = null
var obook = null
var count = 0
var App = React.createClass({
  getInitialState: function () {
    return {
      meta: {
        lasts: [],
        bids: [],
        asks: [],
        spreads: [],
        avgBid: [],
        avgAsk: [],
        avgLast: [],
        avgSpread: [],
        momentumAsk: [],
        momentumBid: [],
        momentumSpread: [],
        ts: null,
        last: null,
        lastSize: null,
        flash: null
      },
      obook: {
        'ok': false,
        'venue': 'ALIEN',
        'symbol': 'WAREZCO',
        'ts': 'nope',
        'bids': [],
        'asks': []
      }
    }
  },
  componentDidMount: function () {
    var that = this
    console.log('componentDidMount')
    ticker = new Proxy({wsText: 'ws://localhost:8080', callback: function (data) {
        var parsed = parseWrap(data)
        // console.log('DATA', JSON.stringify(parsed, null, 2))
        that.setState({ meta: parsed.meta, nav: parsed.nav})
    }})
    obook = new Proxy({wsText: 'ws://localhost:8082', callback: function (data) {
        var parsed = parseWrap(data)
        // console.log('OBOOK :', JSON.stringify(parsed, null, 2))
        that.setState({ obook: parsed})
    }})

    setInterval(function () {
      this.setState({interval: ++count})
    }.bind(this), 1000)
  },
  componentWillUpdate: function (nextProps, nextState) {
    //  console.log('componentWillUpdate fired')
  },
  componentDidUpdate: function (prevProps, prevState) {
    //  console.log('componentDidUpdate fired')
  },
  componentWillUnmount: function () {
    console.log('componentWillUnmount fired')
    ticker.shutdown()
    ticker = null
    obook.shutdown()
    obook = null
  },
  render: function () {
    return (
    <div>
        <Grid>
          <Row className="show-grid">
          <Col xs={8} md={2} className="bg-info"><h1><small>{this.state.meta.flash}</small></h1> </Col>
          <Col xs={4} md={2}><h1><small><Updown nav={this.state.nav} meta={this.state.meta}/></small></h1> </Col>
          </Row>
          <Row className="show-grid">
            <Col xs={10} md={2} ><h1><small><Orderbook obook={this.state.obook}/></small></h1> </Col>
            <Col xs={10} md={2} ><h1><small>{count}</small></h1> </Col>
          </Row>
          <Row className="show-grid">
            <Col xs={12} md={8}>Lasts : { parseInt(avg(this.state.meta.lasts)) }
              <Sparklines data={this.state.meta.lasts} width={250} height={150} margin={5}>
               <SparklinesLine style={{ strokeWidth: 3, stroke: '#223322', fill: 'none', fillOpacity: '.9'}}/>
             </Sparklines>
            </Col>
            <Col xs={12} md={8}>Avg Lasts : { parseInt(avg(this.state.meta.lasts)) }
              <Sparklines data={this.state.meta.avgLast} width={250} height={150} margin={5}>
               <SparklinesLine style={{ strokeWidth: 3, stroke: '#223322', fill: 'none', fillOpacity: '.9'}}/>
             </Sparklines>
            </Col>
          </Row>
          <Row className="show-grid">
            <Col xs={12} md={8}>Bids : {parseInt(avg(this.state.meta.avgBid))}
                <Sparklines data={this.state.meta.bids} width={250} height={150} margin={5}>
                   <SparklinesLine style={{ strokeWidth: 3, stroke: '#336aff', fill: 'none' }}/>
                 </Sparklines>
            </Col>
            <Col xs={12} md={8}>Avg Bids :
                <Sparklines data={this.state.meta.avgBid} width={250} height={150} margin={5}>
                   <SparklinesLine style={{ strokeWidth: 3, stroke: '#336aff', fill: 'none' }}/>
                 </Sparklines>
            </Col>
          </Row>
          <Row className="show-grid">
            <Col xs={12} md={8}>Asks : {parseInt(avg(this.state.meta.avgAsk))}
              <Sparklines data={this.state.meta.asks} width={250} height={150} margin={5}>
               <SparklinesLine style={{ strokeWidth: 3, stroke: '#fa1a1a', fill: 'none', fillOpacity: '.9'}}/>
             </Sparklines>
            </Col>
            <Col xs={12} md={8}>Avg Asks :
              <Sparklines data={this.state.meta.avgAsk} width={250} height={150} margin={5}>
               <SparklinesLine style={{ strokeWidth: 3, stroke: '#fa1a1a', fill: 'none', fillOpacity: '.9'}}/>
             </Sparklines>
            </Col>
          </Row>
          <Row className="show-grid">
            <Col xs={12} md={8}>Spread : { parseInt(avg(this.state.meta.avgSpread)) }
              <Sparklines data={this.state.meta.spreads} width={250} height={150} margin={5}>
               <SparklinesLine style={{ strokeWidth: 3, stroke: '#333333', fill: 'none', fillOpacity: '.9'}}/>
             </Sparklines>
            </Col>
            <Col xs={12} md={8}>Avg Spread : { parseInt(avg(this.state.meta.avgSpread)) }
              <Sparklines data={this.state.meta.avgSpread} width={250} height={150} margin={5}>
               <SparklinesLine style={{ strokeWidth: 3, stroke: '#333333', fill: 'none', fillOpacity: '.9'}}/>
             </Sparklines>
            </Col>
          </Row>
        </Grid>
     </div>
    )
  }
})

exports = module.exports = App
