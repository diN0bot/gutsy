var utils = require('../../utils');
var http = require('http');
var https = require('https');
var async = require('async');
var _ = require('underscore');

var dreadnot_options = utils.makeClass();

dreadnot_options.prototype = {
	port: 443,
	path: "/api/1.0/stacks",
	method: 'GET',
	headers: { 'Content-Type': 'application/json', 'Authorization': null},
	init: function(api_config, path){
		this.host = api_config.url;
		if (path){
			this.path += path;
		}
		console.log('\n\npath: ' + this.path);
		this.headers.Authorization = utils.create_basic_auth(api_config.username, api_config.password);
	}
};

var request = utils.makeClass();
request.prototype = {
	init: function(api_config, path, cb){
		var options = dreadnot_options(api_config, path);
		utils.request_maker(options, _.bind(this.on_success, this), _.bind(this.on_err, this));
		this.cb = cb;
	},
	on_success: function(data){
		this.cb(null, data);
	},
	on_err: function(err){
		this.cb(err, null);
	}
};

module.exports = utils.create_middleware('dreadnot', function dreadnot(req, res, next, payload, api_config) {

	var requests = [];
	_.each(api_config.stacks, function(stack){
		// partial application of the config and path (an implicit closure)
		var stack_req = _.bind(request, {}, api_config, null);
		requests.push(stack_req);

		var region_req = _.bind(request, {}, api_config, '/' + stack + '/regions');
		requests.push(region_req);

	});

	async.parallel(requests, function(err, results){
		payload.data = results;
		payload.error = err;
		next();
	});
});

