var middleware = require('web/middleware');
var path = require('path');

exports.test_example_minimum = function(test, assert) {
  run_test(test, assert, 'example-minimum.json');
};

exports.test_example_simple = function(test, assert) {
  run_test(test, assert, 'example-simple.json');
};

exports.test_example_full = function(test, assert) {
  run_test(test, assert, 'example-full.json');
};

exports.test_all_endpoint_settings = function(test, assert){
  test.finish();
};
/**
 * Runs a single test. Calls assert.
 *
 * @param {string} devops_filename the filename of the devopsjson file relative to the fixtures directory
 */
var run_test = function(test, assert, devops_filename) {
  var fixtures_path, devops_path, mock_req;

  fixtures_path = path.join('extern', 'devopsjson', 'examples');
  devops_path = path.join(fixtures_path, devops_filename);

  mock_req = {
      params: {
        project: devops_filename
      },
      devops_directory: fixtures_path
  };

  middleware.load_devops(mock_req, null, function(){
    var devops = mock_req.devops;
    assert.isDefined(devops);
    assert.isDefined(devops.name);
    assert.isDefined(devops.description);
    assert.isDefined(devops.contacts);
    assert.isDefined(devops.tags);
    assert.isDefined(devops.links);
    assert.isDefined(devops.environments);
    assert.isDefined(devops.metadata);
    assert.isDefined(devops.related_apis);
    assert.isDefined(devops.dependent_services);
    assert.isDefined(devops.events);
    assert.isDefined(devops.kpi_spec);
    assert.isNull(devops.pagerduty);
    assert.isNull(devops.versionone);
    assert.isNull(devops.github);
    assert.isNull(devops.new_relic);
    test.finish();
  });
};
