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
  var app = express.createServer();

  var privateKey = fs.readFileSync('./keys/key.pem').toString();
  var certificate = fs.readFileSync('./keys/cert.pem').toString();
  var secure_app = express.createServer({key: privateKey, cert: certificate});

  _.each([app, secure_app], function(express_app){
    express_app.set('views', TEMPLATE_DIR);
    express_app.set('view engine', 'jade');
    express_app.set('view options', {layout: false});
    express_app.use(middleware.logger());
  });

  app.use('/static', express.static(path.join(__dirname, '..', '..', 'extern')));
  app.use('/static', express.static(path.join(__dirname, '..', '..', 'static')));
  /* setup middleware */
  app.use(middleware.devops_directory_setter(devops_directory));
  app.use(middleware.injector.injector_middleware);

  routes.install(app, secure_app, api_cache);

  secure_app.listen(443, '0.0.0.0');
  app.listen(port, host);
};
