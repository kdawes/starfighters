var WebSocket = require('ws')
var minimist = require('minimist')
var promise = require('promise')
var _ = require('lodash')
var config = require('../../config/config')
var argv = minimist(process.argv)
if (argv.url) { url = argv.url }
// if (!argv.leveljs) { throw new Error('--leveljs required')}
var instanceId = argv.instanceid
var tia = new require('../../lib/tia')({})
// var WebSocketServer = require('ws').Server
var sockWrap = require('../../lib/sockwrap')
var parseWrap = require('../../lib/parsewrap')
var TickerTiaProxy = require('../../lib/tickertiaproxy')
var TickerProxy = require('../../lib/tickerproxy')
var LocalWatcher = require('../../lib/localwatcher')
var ExecWatcher = require('../../lib/execwatcher')
var OrderbookWatcher = require('../../lib/orderbookwatcher')
var AskBidWatcher = require('../../lib/askbidwatcher')
var Server = require('../../harness')
var api = require('../..')
var Trading = require('../../lib/trading')
var muxDemux = require('../../mux_demux')
var Api = new api({})
var events = require('events')
var ee = new events.EventEmitter()

var cluster = require('cluster')
var workers = 1 // process.env.WORKERS || require('os').cpus().length

process.on('uncaughtException', function (err) {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})

function startWatchers (leveljs) {
  console.log('StartWatchers : leveljs', typeof (leveljs), ' ' , JSON.stringify(leveljs, null, 2))
  var wsText = [config.ws_api_root, leveljs.account || argv.account, '/venues/',
    leveljs.venues[0] || argv.venue, '/tickertape'].join('')
  console.log('With : ', wsText)

  var wsExecText = [config.ws_api_root, leveljs.account || argv.account, '/venues/',
    leveljs.venues[0] || argv.venue, '/executions'].join('')
  console.log('With : ', wsExecText)

  var ticker = new TickerProxy({
    wsText: wsText,
    tia: tia,
    port: config.quote_ws_port,
    ee: ee
  })
  ticker.start()
  if (!argv.noexec) {
    var execwatcher = new ExecWatcher({
      wsText: wsExecText,
      instanceId: leveljs.instanceId,
      tia: tia,
      port: config.exec_ws_port,
      ee: ee
    })
    execwatcher.start()
  }
  if (!argv.nolocal) {
    console.log('Watiting for localWatcher...')
    console.log('localWatcher : go --->', leveljs.instanceId)
    var localwatcher = new LocalWatcher({
      wsText: 'ws://localhost:' + config.meta_ws_port,
      instanceId: leveljs.instanceId,
      tia: tia,
      port: config.meta_ws_port
    })
    localwatcher.start()
  }
  if (!argv.noobook) {
    console.log('Watiting for OrderbookWatcher...',
      leveljs.venues[0], ' ', leveljs.tickers[0])

    var obook = new OrderbookWatcher({
      wsText: 'ws://localhost:' + config.obook_ws_port,
      instanceId: leveljs.instanceId,
      tia: tia,
      port: config.obook_ws_port,
      venue: leveljs.venues[0],
      symbol: leveljs.tickers[0]
    })
    obook.start()
  }
  if (!argv.noaskbid) {
    console.log('Watiting for AskBidWatcher... and EE is a ', typeof (ee))

    var askbid = new AskBidWatcher({
      instanceId: leveljs.instanceId,
      port: 8888,
      ee: ee
    })
    askbid.start()

  }

}

if (cluster.isMaster) {
  for (var i = 0; i < workers; ++i) {
    var worker = cluster.fork().process
    console.log('worker %s started.', worker.pid)
  }

  cluster.on('exit', function (worker) {
    console.log('worker %s died. restart...', worker.process.pid)
    cluster.fork()
  })
} else {
  var P = new promise(function (resolve, reject) {
    var promisifiedLevelThing = (function () {
      if (argv.check) {
        console.log('LEVEL CHECK ', argv.instanceid)
        return Api.levelCheck(argv.instanceid)
      }
      if (argv.start) {
        console.log('Starting level : ', argv.start)
        return Api.levelStart(argv.start)
      } else if (argv.restart) {
        console.log('RESTART LEVEL')
        return Api.levelRestart(argv.instanceid)
      } else if (argv.stop) {
        console.log('STOP level')
        return Api.levelStop(argv.instanceid)
      } else {
        console.log('RESUME LEVEL')
        return Api.levelResume(argv.instanceid)
      }
    })()

    promisifiedLevelThing.then(function (p) {
      leveljs = parseWrap(p.body)
      if (!leveljs || leveljs.ok === false) {
        console.log('Failed : ', leveljs.error)
        return reject('failed' + leveljs.error)
      }
      if (p.error) {
        console.log('Failed : ', p.error)
        return reject(p.error)
      }
      return resolve(leveljs)
    })
  }).then(function (leveljs) {
    startWatchers(leveljs)
    var trading = new Trading({
      levelcfg: leveljs,
      tia: tia,
      ts: new Date().getTime(),
      ee: ee
    })

    var wsText = [config.ws_api_root, leveljs.account, '/venues/',
      leveljs.venues[0], '/tickertape'].join('')
    console.log('With : ', wsText)
    var watch = new TickerTiaProxy({
      wsText: wsText,
      tia: tia,
      port: config.ticker_ws_port,
      trading: trading
    })
    watch.start()

    server = new Server({ trading: trading, levelcfg: leveljs })
    server.start()

    var mux = new muxDemux({
      account: leveljs.account,
      venue: leveljs.venues[0],
      symbol: leveljs.tickers[0],
      ee: ee,
      config: config,
      trading: trading
    })
    mux.setupAccount({account: leveljs.account})

  }).catch(function (error) {
    console.log('ERROR from promise', error)
  })
}
