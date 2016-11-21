var axon = require('axon')
var sock = axon.socket('req')
var port = process.env.ATTRIBUTION_C2_PORT || 9000
var readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

sock.connect(port)

var execSummary = `TLDR : You need to identify your trading account
 (not your API key!) in the URL. This is the only form of authorization for this web socket.
 :1234: trololol ?

I guess that an information leak here can be just as devastating as for, say, defeating aslr.

 General Strategy at the outset :

1 ) profile / record the market for analysis
2 ) keep track of who enters / exits, when, what
2.1 ) As accounts enter the market, start following their execution websocket and track their positions.
2.2 ) Refresh / reconnect as their exec websockets drop
3.0 ) Do some sort of attribution by linking trades via id / standingId / incomingId

we expect the bad guy to 'look different' than the rest of the market
 - that could be op-tempo
 - repeatedly flying in the face of the market
 - etc.

`

const commands = {
  'q': {
    msg: 'query <ts>', parser: function (i) {
      var s = i.split(' ')
      var limit = null
      console.log('i : ', s[1])
      if (s[2]) {
        limit = parseInt(s[2])
      }
      sock.send({ts: s[1], window: 100}, function (res) {
        if (limit) {
          console.log(JSON.stringify(res.slice(0, limit), null, 2))
        } else {
          console.log(JSON.stringify(res, null, 2))
        }
      })
    }
  },
  'p': {
    msg: 'position <accountid>', parser: function (i) {
      var s = i.split(' ')
      console.log('account : ', s[1])
      sock.send({account: s[1]}, function (res) {
        console.error(JSON.stringify(res, null, 2))
      })
    }
  },
  'judge': {
    msg: 'judge <accountId> <link>', parser: function (i) {
      var s = i.split(' ')
      console.log('account : ', s[1])
      console.log('link : ', s[2])
      sock.send({account: s[1], explanation_link: link, executive_summary: execSummary}, function (res) {
        console.error(JSON.stringify(res, null, 2))
      })
    }
  }
}

function question () {
  rl.on('line', function (cmd) {
    // that.exec(cmd.trim())
    Object.keys(commands).forEach(function (c) {
      var toks = cmd.split(/ /)
      if (toks[0].match(new RegExp(`${c}`, 'g'))) {
        if (commands[c].parser) {
          commands[c].parser(cmd)
        } else {
          console.log(' com ' + commands[c].msg)
        }
      }
    })
    rl.prompt()
  }).on('close', function () {
    process.stdout.write('\n')
    process.exit(0)
  })
  rl.setPrompt('> ')
  rl.prompt()
}

question()
