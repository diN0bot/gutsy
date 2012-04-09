var express = require('express');
var path = require('path');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var middleware = require('./middleware');
var routes = require('./routes');
var utils = require('../utils');
var settings = require('../settings');

var TEMPLATE_DIR = path.join(__dirname, 'views');
var api_cache = new utils.api_cache();

exports.run = function(port, devops_directory, host) {
  var app, secure_app, certificate, privateKey;
  privateKey = fs.readFileSync('./keys/key.pem').toString();
  certificate = fs.readFileSync('./keys/cert.pem').toString();

  app = express.createServer();
  secure_app = express.createServer({key: privateKey, cert: certificate});

  _.each([app, secure_app], function(_app){
    _app.set('views', TEMPLATE_DIR);
    _app.set('view engine', 'jade');
    _app.set('view options', {layout: false});
    _app.use(middleware.logger());
    if (settings.testing === true){
      _app.enable('testing');
    }
  });

  app.use('/static', express.static(path.join(__dirname, '..', '..', 'extern')));
  app.use('/static', express.static(path.join(__dirname, '..', '..', 'static')));
  /* setup middleware */
  app.use(middleware.cache_me(5*60));
  app.use(middleware.devops_directory_setter(devops_directory));
  app.use(middleware.injector.injector_middleware);

  routes.install(app, secure_app, api_cache, devops_directory);

  app.listen(port, host);
  secure_app.listen(443, '0.0.0.0');
};
