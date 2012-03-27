var utils = require('../../utils');
var http = require('http');
var https = require('https');

module.exports = utils.create_middleware('dreadnot', function dreadnot(req, res, next, payload, api_config) {
	var auth = {};
	auth[api_config.username] = api_config.password;
  options = {
		port: 443,
		host: api_config.url,
		path: "/api/1.0/stacks",
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': utils.create_basic_auth(api_config.username, api_config.password)
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

