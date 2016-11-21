var minimist = require('minimist')

var argv = minimist(process.argv)
var id = process.argv[4]
var venue = process.argv[6]
var ticker = process.argv[5]
var fs = require('fs')
var leveljs = require(argv.leveljs)

// console.log(JSON.stringify(leveljs))

leveljs.account = id
leveljs.tickers[0] = ticker
leveljs.venues[0] = venue
// console.log(JSON.stringify(leveljs, null, 2))
fs.createWriteStream(argv.leveljs).write(JSON.stringify(leveljs))
