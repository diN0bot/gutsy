var utils = require('../../utils'),
NewRelicApi = require('newrelicapi');

module.exports = utils.create_caching_middleware('newrelic',
                                                  2*60,
                                                  function(req, res, next, payload) {
  // No-op if creds aren't provided
  if (!req.devops.related_apis || !req.devops.related_apis.newrelic) {
    return next();
  }

  var appid = req.devops.related_apis.newrelic.appid;
  var nra = new NewRelicApi({
    apikey: req.devops.related_apis.newrelic.apikey,
    accountId: req.devops.related_apis.newrelic.accountId
  });
  nra.getSummaryMetrics(appid, function(err, data) {
    if (err) {
      payload.error = err;
    } else {
      payload.data = data;
    }
    next();
  });
});
