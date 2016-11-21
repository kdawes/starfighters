module.exports = (function (environment) {
  return {
    ws_api_root: 'wss://api.stockfighter.io/ob/api/ws/',
    api_root: 'https://api.stockfighter.io/ob/api',
    host: '127.0.0.1',
    port: 8181,
    meta_ws_port: 8123,
    ticker_ws_port: 8080,
    exec_ws_port: 8081,
    obook_ws_port: 8082,
    quote_ws_port: 9090,
    askbid_ws_port: 8888,
    instance_id: 5006,
    api_key: 'yourapikeyhere'
  }
})(process.env.NODE_ENV || 'dev')
