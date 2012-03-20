var utils = require('../../utils');
var _ = require('underscore');

/** Adds pagerduty field to devops if pagerduty related api is present
 * @param {string} devops_filename the filename of the devopsjson file relative to the fixtures directory
 * @param {fn} request_maker A function that takes two arguments, options and on_end_cb:
 *   options an options dict for making an XHR, such as would be used by http.request
 *   on_end_cb a callback that gets called with the XHR response data
 */

module.exports = utils.create_caching_middleware('pagerduty', 10*60, function(req, res, next, payload) {

  // PagerDuty requires the date range for all requests.
  var now, until, options;

  now = new Date();
  until = new Date();
  until.setDate(now.getDate() + 4);
  now = now.toISOString().split('T')[0];
  until = until.toISOString().split('T')[0];


  options = {
    port: req.devops.related_apis.pager_duty.port,
    host: req.devops.related_apis.pager_duty.subdomain + '.pagerduty.com',
    path: ['/api/v1/schedules/',
           req.devops.related_apis.pager_duty.schedule_id,
           '/entries?since=',
           now,
           '&until=',
           until].join(''),
    method: 'GET',
    auth: req.devops.related_apis.pager_duty.auth,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  utils.request_maker(
    options,
    function(data) {
      req.devops.pagerduty.data = JSON.parse(data);
      // add oncall key to contacts that are oncall
      if (req.devops.pagerduty.data.entries) {
        _.each(req.devops.pagerduty.data.entries, function(entry) {
          _.each(req.devops.contacts, function(contact) {
            _.each(contact.members, function(member) {
              if (member.name === entry.user.name || member.mailto === entry.user.email) {
                member.oncall = true;
              }
            });
          });
        });
      }
      if (req.devops.pagerduty.data.error) {
        payload.error = JSON.stringify(req.devops.pagerduty.data.error);
      }
    next();
    },
    function(e) {
      payload.error = e;
      next();
    });
});
