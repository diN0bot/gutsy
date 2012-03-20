var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var urls = require('./web/urls');

exports.create_caching_middleware = function(name, expires, work_function){
  //TODO: assert name isn't in app._cache already
  //TODO: assert name, expires, work_function, work_function is callable
  cb = function(payload){

  };
  return function(req, res, next){
    // TODO: this stampedes
    var expires_on = Date.now() + expires / 1000;
    if (req.app._cache[name] && req.app._cache[name].expires < expires_on ){
      req.devops[name] = req.app._cache[name]['payload'];
      console.log('\n\n\n\ncashhit');
      next();
    } else{
      // pass in a payload object to be modified in place
      var payload = {
        error: null,
        data: null
      };
      work_function(req, res, payload, function(payload){
        // set the payload in the req object
        req.devops[name] = payload;
        req.app._cache[name] = {expires_on: expires_on, payload: payload};
        next();
        }
      );
    }
  };
};

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
 *@param project {string} Project name (should match devops.json file name)
 *@param devops {Object} devops.json object
 */
exports.create_navbar = function(project, devops) {
  var navbar, i;
  navbar = {};
  navbar[exports.capitalize(project)] = '/p/' + project;
  if (devops.related_apis.version_one) {
    navbar.Defects = urls.DEFECTS.replace(':project', project);
  }
  if (devops.related_apis.github) {
    navbar.DevHealth = urls.DEVHEALTH.replace(':project', project);
  }
  return navbar;
};

/**
 * @param string
 * @returns new string with first letter capitalized
 */
exports.capitalize = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
