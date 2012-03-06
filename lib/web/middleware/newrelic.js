var utils = require('../../utils'),
    NewRelicApi = require('newrelicapi');

module.exports = function(devops, request_maker) {
  // No-op if PagerDuty creds aren't provided
  if (!devops.related_apis || !devops.related_apis.newrelic) {
    return function(req, res, next) {
      next();
    };
  }

  return function(req, res, next) {
    devops.newrelic = {
      'error': null,
      'data': null
    };
    try{
      var appid = devops.related_apis.newrelic.appid;
      var nra = new NewRelicApi({
        apikey: devops.related_apis.newrelic.apikey,
        accountId: devops.related_apis.newrelic.accountId
      });
      nra.getSummaryMetrics(appid, function(err, res){
        if (err) { throw err; }
        devops.newrelic.data = res;
        next();
      });
    } catch (e) {
      devops.newrelic.error = e;
      next();
    }
  };
};
