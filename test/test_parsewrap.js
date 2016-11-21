var test = require('tape')
var parseWrap = require('../lib/parsewrap')

test('parsewrap is a function', function (t) {
  t.equal(true, typeof parseWrap === 'function')
  t.end()
})

test('parse true json', function (t) {
  var js = { good: true, ok: { yes: 1 }}
  var parsed = parseWrap(JSON.stringify(js))
  t.end()
})

test('parse junk json returns null', function (t) {
  var js = '{JUNK}'
  var parsed = parseWrap(js)
  console.log('parsed; ', parsed)
  t.equal(true, (parsed === null))
  t.end()
})
