var _ = require('underscore');
var util = require('util');
var utils = require('../../utils');
var async = require('async');
var url = require('url');

/** Adds github field to devops if github related api is present
 * @param {object} devops devops object
 */
module.exports = function(payload) {
  var api_config = payload.config;
  var closed_options = make_github_options(api_config, true);
  console.log(closed_options);

  var closed_and_merged = {};
  var requests_by_date = [];

  utils.request_maker(closed_options, function(errors, results){
    var pulls;
    var data = [];
    var res;

    if (errors) {
      payload.error = errors;
      return;
    }

    try{
      res = results.res;
      pulls = JSON.parse(results.data);
      debugger;
       // open_pull_requests: github response string
      _.each(pulls, function(val, key) {

      });

    } catch (e){
      payload.error = e;
      return;
    }
    payload.data = data;
  });
};

/**
 *
 * @param devops_github
 * @param is_closed
 * @returns
 */
var make_github_options = function(devops_github) {
  var parsed_url = url.parse(devops_github.url);
  var path = [
    "/repos/",
    devops_github.org,
    "/",
    devops_github.repo,
    '/pulls?state=closed&per_page=150&page=1'
  ];

  return {
    return_response: true,
    host: parsed_url.host,
    port: 443,
    path: path.join(''),
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': utils.create_basic_auth(devops_github.username,
        devops_github.apikey)
    }
  };
};