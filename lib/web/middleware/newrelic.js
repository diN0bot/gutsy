var utils = require('../../utils'),
NewRelicApi = require('newrelicapi');

module.exports = utils.create_caching_middleware('new_relic', 2*60, _new_relic);
                                                  
function _new_relic(req, res, next, payload, api_config) {
  var appid = api_config.appid;
  var nra = new NewRelicApi({
    apikey: api_config.apikey,
    accountId: api_config.accountId
  });
  nra.getSummaryMetrics(appid, function(err, data) {
    if (err) {
      payload.error = err;
    } else {
      payload.data = data;
    }
    next();
  });
}
