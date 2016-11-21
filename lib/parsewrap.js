module.exports = parseWrap

function parseWrap (body) {
  var doneCheck = null
  try {
    doneCheck = JSON.parse(body)
  } catch (e) {
    console.log('Failed in parseWrap:,', e)
    console.log('body :', typeof (body), ' ; ', body)
    return null
  }
  return doneCheck
}
