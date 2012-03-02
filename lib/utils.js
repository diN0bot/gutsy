var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var urls = require('./web/urls');

/**
 * Takes a relative or absolute devops filename and returns the parsed content
 *
 * @param {string} devops_filename the filename of the devopsjson file relative to the fixtures directory
 * @return {Object} parsed content of JSON file
 */
exports.load_devops = function(devops_path) {
  var devops;
  devops = fs.readFileSync(devops_path);
  devops = JSON.parse(devops);
  return devops;
};

/**
 * Loads an example devopsjson file from devopsjson/examples
 *
 * @param {string} devops_filename the filename of the devopsjson file relative to extern/devopsjson/examples
 * @return {Object} parsed content of JSON file
 */
exports.load_example_devops = function(devops_path) {
  devops_path = path.join(__dirname, '..', 'extern', 'devopsjson', 'examples', devops_path);
  return exports.load_devops(devops_path);
};


/** A convenience function for making requests without having to build up response body data.
 * Also useful for mocking the making of requests in tests
 * @param {Object} options an options dict such as http.request would use
 * @param {fn} on_success callback that takes the complete response body data as a parameter
 * @param {fn} on_error callback that takes an Exception as a parameter
 */
exports.request_maker = function(options, on_success, on_err) {
  var req = {'443': https, '80': http}[options.port].get(options, function(res) {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function(d) {
      data += d;
    });
    res.on('end', function() {
      on_success(data);
    });
  }).on('error', function(e) {
    on_err(e);
  });
};


/**
 *@param projects {string or Array} Either an array of project names, or a single project name.
 *  If a single project name, devops must be non-null.
 *@param devops {Object} devops.json object
 */
exports.create_navbar = function(projects, devops) {
  var navbar, i, project;
  navbar = {};
  if (!devops && projects instanceof Array) {
    for (i = 0; i < projects.length; i++) {
      navbar[projects[i]] = '/p/' + projects[i];
    }
  } else {
    project = projects;
    navbar[project] = '/p/' + project;
    if (devops.related_apis.version_one) {
      navbar.Defects = urls.DEFECTS.replace(':project', project);
    }
    if (devops.related_apis.github) {
      navbar.DevHealth = urls.DEVHEALTH.replace(':project', project);
    }
  }
  navbar.About = urls.ABOUT;
  return navbar;
};
