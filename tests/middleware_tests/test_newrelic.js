var base = require('./base');
var nock = require('nock');
var fs = require('fs');
var path = require('path');

var xml_fixture = fs.readFileSync(path.join(__dirname,'fixtures', 'new_relic.xml'));

exports.test_example_minimum = function(test, assert) {
  base.run_test(test, assert, 'example-minimum.json', 'newrelic', 'newrelic', _success_mock, false);
};

exports.test_example_simple = function(test, assert) {
  base.run_test(test, assert, 'example-simple.json', 'newrelic', 'newrelic', _success_mock, false);
};

exports.test_example_full_success = function(test, assert) {
  base.run_test(test, assert, 'example-full.json', 'newrelic', 'newrelic', _success_mock, true);
};

function _create_mock(req, status, res) {
  var mock;

  if (!req.devops.related_apis || !req.devops.related_apis.newrelic) {
    mock = null;
  } else {
    mock = nock('https://rpm.newrelic.com');
    mock = mock.get(["/accounts",
                     req.devops.related_apis.newrelic.accountId,
                     "applications",
                     req.devops.related_apis.newrelic.appid,
                     "threshold_values.xml"
                     ].join("/"));
    mock = mock.reply(status, res);
    //mock = mock.log(console.log);
  }
  return mock;
}

function _success_mock(req) {
  return _create_mock(
      req,
      200,
      xml_fixture);
}