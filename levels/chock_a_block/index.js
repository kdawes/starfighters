// var request = require('request')
var _ = require('lodash')
// / special

// var allstocks = Api.venueStocks(levelcfg.venues[0])
//   .then(function (results) {
//     return JSON.parse(results.body)
//   }).catch(function (error) {
//   console.log('allstocks:venueStocks', error)
// })

// allstocks.then(function (r) {
//   console.log('allstocks : ', JSON.stringify(r, null, 2))
//   SYMBOL = r.symbols[0].symbol
//   console.log('SYMBOL : ', SYMBOL)
// })

server.listen(config.port)
console.log('CC>> go :' + config.port)
