var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var urls = require('./web/urls');
var _ = require('underscore');

/**
 * Takes middlware function pointer with arrity of 5 and returns a middleware
 *
 * @param {string} name the name of the middleware (should be unique)
 * @param {fn} the middleware proper which should accept (req, res, next, payload, api_config- set payload.data/errors to cache stuff, api_config = req.devops[name]
 * @return {fn} middleware function
 */
exports.create_middleware = function(name, middleware){
  return function(req, res, next){
    // Do they have the api defined in the devops ball?
    if (!req.devops.related_apis || !req.devops.related_apis[name]) {
      req.devops[name] = null;
      next();
      return;
    }
      var payload = {error: null, data: null};
      req.devops[name] = payload;
      try{
        middleware(req, res, next, payload, req.devops.related_apis[name]);
      }catch (e){
        payload.error = e;
        // TODO: this may not be callable if the error was with express
        next();
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
  var handler = {'443': https, '80': http}[options.port];
  var req = handler.get(options, function(res) {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function(d) {
      data += d;
    });
    res.on('end', function() {
      // this is nuts- we want any exceptions to bubble up to the error handler or the try/catch
      //  around the middleware calls- unfotunately, the async stuff causes that stack to die off and the propogation doesn't work as expected (in other languages)
      try{
        on_success(data);
      }catch(e){
        on_err(e);
      }
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
