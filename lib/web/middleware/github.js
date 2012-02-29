var urls = require('../urls');
var utils = require('../../utils');
var _ = require('underscore');

/** Adds github field to devops if github related api is present
 * @param {object} devops devops object
 */
module.exports = function(devops, request_maker) {
  // No-op if GitHub creds aren't provided
  if (!devops.related_apis || !devops.related_apis.github) {
    return function(req, res, next) {
      next();
    };
  }

  // If a request maker isn't provided, use the standard http module
  // This allows tests to mock request making
  request_maker = request_maker || utils.request_maker;

  return function(req, res, next) {
    var auth = [devops.related_apis.github.username,
                '/token:',
                devops.related_apis.github.apikey].join("");
    var options = {
      port: devops.related_apis.github.port,
      host: devops.related_apis.github.host,
      path: ["/api/v2/json/pulls/",
             devops.related_apis.github.org,
             "/",
             devops.related_apis.github.repo,
             "?per_page=100"].join(""),
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + new Buffer(auth, "ascii").toString('base64')
      }
    };

    devops.github = {
        'error': null,
        'data': null
    };
    request_maker(
        options,
        function(data) {
          var i, length;
          try {
            data = JSON.parse(data);
            var avg_age_metric = {
                name: "pull request avg age",
                unit: "days",
                aggregate: 0,
                stats: [] // {"diN0bot": 90},
              };
            var number_metric = {
                name: "number of pull requests",
                unit: "",
                aggregate: 0,
                stats: {} // {"diN0bot": 90},
              };
            devops.github.data = {
                repo: devops.related_apis.github.repo,
                metrics: [avg_age_metric,
                          number_metric]
            };

            var user_data = {};
            length = data.pulls.length;
            for (i = 0; i < length; i++) {
              var pull = data.pulls[i];
              var username = pull.user.login;

              number_metric.aggregate++;
              if (!number_metric.stats[username]) {
                number_metric.stats[username] = 0;
              }
              number_metric.stats[username]++;


              if (!(username in user_data)) {
                user_data[username] = [];
              }
              user_data[username].push(pull);
            }

            number_metric.stats = _.map(
                Object.getOwnPropertyNames(number_metric.stats),
                function(x) {
                  var m = {};
                  m[x] = number_metric.stats[x];
                  return m;
                });

            for (var username in user_data) {
              var userstats = user_stats(user_data[username]);
              var m = {};
              m[username] = userstats.avg_total_life_span;
              avg_age_metric.stats.push(m);
            }
          } catch (e) {
            devops.github.error = e;
          }
          next();
        },
        function(e) {
          devops.github.error = e;
          next();
        });
  };

  next();
};

/**
 *
 */
var user_stats = function(pulls) {
  // pull request counts
  var number_pull_requests = pulls.length;
  var number_merged = 0;
  var number_stale = 0;
  var number_tested = 0;
  // commit counts
  var number_commits = 0;
  // avg times
  var merged_life_span_time = 0; // against number_merged
  var total_life_span_time = 0; // against number_pull_requests
  var stale_time = 0; // against number_stale

  var now = Date.now();
  for(var i = 0; i < pulls.length; i++) {
    var pull = pulls[i];
    var created_at = Date.parse(pull.created_at);
    var updated_at = Date.parse(pull.updated_at);
    var merged_at = pull.merged_at;
    var closed_at = pull.closed_at;
    if (merged_at) { merged_at = Date.parse(merged_at); }
    if (closed_at) { closed_at = Date.parse(closed_at); }

    if (merged_at) {
      number_merged++;
      merged_life_span_time += (merged_at - created_at);
    }
    if (!merged_at && !closed_at) {
      number_stale++;
      stale_time += (now - updated_at);
    }
    if (closed_at) {
      total_life_span_time += (closed_at - created_at);
    } else {
      total_life_span_time += (now - created_at);
    }
  }
  return {
    number_pull_requests: number_pull_requests,
    number_merged: number_merged,
    number_stale: number_stale,
    number_tested: number_tested,
    number_commits: number_commits,
    avg_merged_life_span: avg_days(merged_life_span_time, number_merged),
    avg_total_life_span: avg_days(total_life_span_time, number_pull_requests),
    avg_stale_life_span: avg_days(stale_time, number_stale)
    };
};

/**
 *
 */
var avg_days = function(total_seconds, number) {
  if (number) {
    avg_seconds = total_seconds / number;
    return (avg_seconds / 1000 / 60 / 60 / 24).toFixed(1);
  } else {
    return 0;
  }
};

/*
 *
 * { issue_updated_at: '2012-02-29T21:45:24Z',
       gravatar_id: 'ca2eeff97529b33e4c6d06ac8eca7f07',
       position: 1,
       number: 1764,
       votes: 0,
       issue_user: [Object],
       comments: 0,
       body: 'Still need to do validation and notification.',
       title: 'B 14917/wire add a record to backend (not ready)',
       diff_url: 'https://github.com/racker/reach/pull/1764.diff',
       updated_at: '2012-02-29T21:45:24Z',
       user: [Object],
       patch_url: 'https://github.com/racker/reach/pull/1764.patch',
       base: [Object],
       mergeable: true,
       created_at: '2012-02-29T21:45:24Z',
       issue_created_at: '2012-02-29T21:45:24Z',
       labels: [],
       head: [Object],
       html_url: 'https://github.com/racker/reach/pull/1764',
       state: 'open' },
*/
