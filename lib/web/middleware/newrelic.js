var utils = require('../../utils'),
NewRelicApi = require('newrelicapi');

module.exports = utils.create_caching_middleware('newrelic',
                                                  2*60,
                                                  function(req, res, next, payload, api_config) {

  var appid = api_config.appid;
  var nra = new NewRelicApi({
    apikey: api_config.apikey,
    accountId: api_config.accountId
  });
  console.log('appid: ' + appid + "  apikey " + api_config.apikey + ' account ' + api_config.accountId);
  nra.getSummaryMetrics(appid, function(err, data) {
    if (err) {
      payload.error = err;
    } else {
      payload.data = data;
    }
    next();
  });
});
