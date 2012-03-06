var urls = require('./urls');
var utils = require('../utils');

/**
 * Fleshes out devops object with defaults for missing optional fields
 *
 * @param devops {Object}
 * @param project {string} name of project; will show up in navbar (currently it is the URL/crawled-file name)
 * @param whereami {string} Optionally the value for the active field used in the navbar; will use project if not provided.
 */
module.exports = function(devops, project, whereami) {
  var fields, field;
  fields = {
    'tags': [],
    'links': {},
    'environments': [],
    'metadata': {},
    'related_apis': {},
    'dependent_services': [],
    'events': [],
    'kpi_spec': '',
    // By convention, middlewares will populate this fields,
    // if the related_apis exist, with {'error': X, 'data': X}
    'pagerduty': null,
    'versionone': null,
    'github': null,
    'newrelic': null
  };

  for (field in fields) {
    devops[field] = devops[field] || fields[field];
  }

  // create navigation bar
  devops.navbar = utils.create_navbar(project, devops);

  // add active location
  if (whereami) {
    devops.active = whereami;
  } else {
    devops.active = project;
  }
};
