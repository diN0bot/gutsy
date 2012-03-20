var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var urls = require('./web/urls');
var _ = require('underscore');

var __cache = {};
/**
 * Takes a name, a timeout in seconds and a middlware function pointer with arrity of 4 and returns a middleware
 *
 * @param {string} name the name of the middleware (should be unique)
 * @param {int} expires the ttl in seconds
 * @param {fn} the middleware proper which should accept (req, res, next, payload- set payload.data/errors to cache stuff
 * @return {fn} middleware function
 */
exports.create_caching_middleware = function(name, expires, middleware){
  //TODO: assert name, expires, work_function, middleware is callable
  return function(req, res, next){
    // TODO: this stampedes
    var expires_on = Date.now() + expires * 1000;
    var key = req.url;
    // TODO: this is a bit unsafe because JS is crazy and the key is user input
    if (key && _.has(__cache, key) && __cache[key].expires_on < expires_on ){
      req.devops[name] = __cache[key].payload;
      next();
    } else{
      // pass in a payload object to be modified in place
      var payload = {error: null, data: null};
      req.devops[name] = payload;
      __cache[key] = {expires_on: expires_on, payload: payload};
      try{
        middleware(req, res, next, payload);
      }catch (e){
        payload.error = e;
        // TODO: this may not be callable if the error was with express
        next();
      }
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
