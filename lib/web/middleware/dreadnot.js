var utils = require('../../utils');
var http = require('http');
var https = require('https');

module.exports = utils.create_middleware('dreadnot', function dreadnot(req, res, next, payload, api_config) {
  method = api_config.url.split(':')[0];
  options = {
		port: api_config.port,
		host: api_config.host,
		path: api_config.url,
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Basic ' + utils.create_basic_auth(api_config.username, api_config.password)
      }
		};
	utils.request_maker(options,
		function(data){
			payload.data = data;
			next();
	}, function(error){
		payload.error = error;
		next();
	});
});

