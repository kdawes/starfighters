var test = require('tape')
var Position = require('../lib/position')
var position = new Position({})

test('is an instanceof Position', function (t) {
  t.equal(true, position instanceof Position)
  t.end()
})

test('has a db', function (t) {
  t.equal(true, (position.db && position.db !== null))
  t.end()
})

test('db has asks bids cancelled fills', function (t) {
  t.equal(Object.keys(position.db).length, 4)
  t.end()
})

test('asks and bids and cancelled and fills are objects, not arrays',
  function (t) {
    t.equal(typeof (position.db.asks), 'object', 'asks is object')
    t.equal(false, Array.isArray(position.db.asks), 'asks is not an Array')
    t.equal(typeof (position.db.bids), 'object', 'bids is an object')
    t.equal(false, Array.isArray(position.db.bids), 'bids is not an array')
    t.equal(typeof (position.db.cancelled), 'object', 'cancelled is an object')
    t.equal(false, Array.isArray(position.db.cancelled), 'cancelled is not an array')
    t.equal(typeof (position.db.fills), 'object', 'fills is an object')
    t.equal(false, Array.isArray(position.db.fills), 'fills is not an array')

    t.end()
  })
test('cancelled.asks, cancelled.bids, fills.asks, fills,bids are arrays', function (t) {
  t.equal(true, Array.isArray(position.db.cancelled.asks))
  t.equal(true, Array.isArray(position.db.cancelled.bids))
  t.equal(true, Array.isArray(position.db.fills.asks))
  t.equal(true, Array.isArray(position.db.fills.bids))
  t.end()
})

test('position.bid() adds bid to position.bids', function (t) {
  var Position = require('../lib/position')
  var p = new Position({})

  t.equal(true, (Object.keys(p.db.bids).length === 0), 'before, length is 0')
  var obj = {
    id: 1234
  }
  p.bid(obj)
  t.equal(true, (Object.keys(p.db.bids).length === 1), 'after, length is 1')
  t.end()
})

test('cancel removes bid from bids, adds to cancelled', function (t) {
  var Position = require('../lib/position')
  var p = new Position({})

  t.equal(true, (Object.keys(p.db.bids).length === 0), 'before, length is 0')
  var obj = {
    id: 1234
  }
  p.bid(obj)
  t.equal(true, (Object.keys(p.db.bids).length === 1), 'before, bids length is 1')
  p.cancel(obj)
  t.equal(true, (Object.keys(p.db.bids).length === 0), 'before, bids length is 0')
  t.equal(true, p.db.cancelled.bids.length === 1, 'after, cancelled.bids length is 1')
  t.end()
})

test('cancel removes ask from asks, adds to cancelled', function (t) {
  var Position = require('../lib/position')
  var p = new Position({})

  t.equal(true, (Object.keys(p.db.asks).length === 0), 'before, length is 0')
  var obj = {
    id: 1234
  }
  p.ask(obj)
  t.equal(true, (Object.keys(p.db.asks).length === 1), 'before, bids length is 1')
  p.cancel(obj)
  t.equal(true, (Object.keys(p.db.asks).length === 0), 'before, bids length is 0')
  t.equal(true, p.db.cancelled.asks.length === 1, 'after, cancelled.bids length is 1')
  t.end()
})

test('fill removes ask from asks, adds to fills', function (t) {
  var Position = require('../lib/position')
  var p = new Position({})

  var obj = {
    id: 1234
  }
  p.ask(obj)
  p.fill(obj)
  t.equal(true, p.db.fills.asks.length === 1)
  t.end()
})

test('fill removes bid from bids, adds to fills', function (t) {
  var Position = require('../lib/position')
  var p = new Position({})

  var obj = {
    id: 1234
  }
  p.bid(obj)
  p.fill(obj)
  t.equal(true, p.db.fills.bids.length === 1)
  t.end()
})

test('cancel with bad input throws', function (t) {
  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position({})
    p.cancel('')
  })

  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position({})
    p.cancel('lol')
  })

  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position({})
    p.cancel([])

  })

  t.end()
})

test('cancel, not in bids or asks throws', function (t) {
  var Position = require('../lib/position')
  var p = new Position({})
  t.throws(function () {
    p.cancel({})
  })

  t.end()
})

test('position.ask() adds ask to position.ask', function (t) {
  var Position = require('../lib/position')
  var p = new Position({})

  t.equal(true, (Object.keys(p.db.asks).length === 0), 'before, length is 0')
  var obj = {
    id: 1234
  }
  p.ask(obj)
  t.equal(true, (Object.keys(p.db.asks).length === 1), 'after, length is 1')
  t.end()
})

test('no options creates default opts', function (t) {
  var Position = require('../lib/position')
  var p = new Position()
  t.equal(true, p != null)
  t.end()
})

test('bid ask fill cancel with null input throws', function (t) {
  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.bid(null)
  })

  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.ask(null)
  })

  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.fill(null)
  })

  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.cancel(null)
  })

  t.end()
})

test('bid ask fill cancel with array input throws', function (t) {
  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.bid([])
  })

  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.ask([])
  })

  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.fill([])
  })

  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.cancel([])
  })

  t.end()
})

test('bid ask fill cancel with array input throws', function (t) {
  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.bid([])
  })

  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.ask([])
  })

  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.fill([])
  })

  t.throws(function () {
    var Position = require('../lib/position')
    var p = new Position()
    p.cancel([])
  })

  t.end()
})

test('fill, not in bids or asks without direction throws', function (t) {
  var Position = require('../lib/position')
  var p = new Position()
  var obj = {
    id: 1234
  }
  t.throws(function () {
    p.fill(obj)
  })

  t.end()
})
test('fill, null or undefined input throws', function (t) {
  var Position = require('../lib/position')
  var p = new Position()

  t.throws(function () {
    p.fill(null)
  })

  t.throws(function () {
    p.fill(undefined)
  })

  t.end()
})

test('fill, not in bids or asks without direction === buy fills a bid', function (t) {
  var Position = require('../lib/position')
  var p = new Position()
  var obj = {
    id: 1234,
    direction: 'buy'
  }
  p.fill(obj)
  t.equal(true, p.db.fills.bids.length === 1)
  t.end()
})

test('fill, not in bids or asks without direction === sell fills an ask', function (t) {
  var Position = require('../lib/position')
  var p = new Position()
  var obj = {
    id: 1234,
    direction: 'sell'
  }
  p.fill(obj)
  t.equal(true, p.db.fills.asks.length === 1)
  t.end()
})

test('update position - bad input', function (t) {
  var Position = require('../lib/position')
  var p = new Position()
  t.throws(function (t) {
    p.updatePosition(1, 2)
  })

  t.throws(function (t) {
    p.updatePosition('bid', [])
  })

  t.throws(function (t) {
    p.updatePosition('bid')
  })

  t.throws(function (t) {
    p.updatePosition('ask')
  })
  t.throws(function (t) {
    p.updatePosition({})
  })

  t.throws(function (t) {
    p.updatePosition('', {})
  })

  t.end()
})
test('update position - good input', function (t) {
  var Position = require('../lib/position')
  var p = new Position()

  t.ok(function (t) {
    p.updatePosition('bid', {id: 1234})
  })

  t.ok(function (t) {
    p.updatePosition('ask', {id: 1234})
  })

  t.end()
})

test('update position - no obj.id', function (t) {
  var Position = require('../lib/position')
  var p = new Position()

  t.throws(function (t) {
    p.updatePosition('bid', {})
  })

  t.end()
})
