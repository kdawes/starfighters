var request = require('request')
var api = require('../..')
// / special
var config = require('../../config/config')
var Api = new api({})
var minimist = require('minimist')
var argv = minimist(process.argv)
var levelcfg = require('./level.json')

//
// console.log('API_KEY : ', config.api_key)
// console.log('heartbeat : ', Api.heartbeat().then(function (res) {
//   if (res && res.error === null) {
//     console.log(res.result.statusCode, ' ', res.result.statusMessage, ' ', res.body)
//   } else {
//     console.log('promise error? ', res.error)
//   }
// }).catch(function (err) {
//   console.log(err)
// })
// )
//
// if (levelcfg.venues[0]) {
//   console.log('venues heartbeat: ',
//     levelcfg.venues[0],
//     Api.venueHeartbeat(levelcfg.venues[0]).then(function (res) {
//       console.log(res.result.statusCode, ' ', res.result.statusMessage, ' ', res.body)
//     }).catch(function (err) {
//       console.log(err)
//     })
//   )
// }
//
// console.log('STOCKS', Api.venueStocks(levelcfg.venues[0]).then(function (res) {
//   console.log(res.result.statusCode, ' ', res.result.statusMessage, ' ', res.body)
// }).catch(function (err) {
//   console.log('Couldnt get stocks for venue ', levelcfg.venues[0])
// }))

console.log('BIDDING ')

var js = null

Api.bid(levelcfg.account, levelcfg.venues[0], 'EFOY', 3714, 100, 'limit')
  .then(function (res) {
    console.log(res.result.statusCode, ' ', res.result.statusMessage, ' ', res.body)
  }).catch(function (err) {
  console.log('bid Failed :(', err)
})

// Api.orderbook(levelcfg.venues[0], js.symbols[0].symbol)
//   .then(function (res) {
//     //console.log('>> ', JSON.stringify(JSON.parse(res.body), null, 2))
// 		var ob = JSON.parse(res.body)
//
//
//
//   }).catch(function (error) {
//   console.log('no orderbook')
// })

// console.log('LEVELCFG', JSON.stringify(levelcfg, null, 2))
