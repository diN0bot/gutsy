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
	_.each(api_config.stacks, function(a_stack){
		_.each(_.keys(a_stack), function(stack_name){
			_.each(a_stack[stack_name], function(region){
				// partial application of the config and path (an implicit closure)
				var region_req = _.bind(request, {}, api_config, '/' + stack_name + '/regions/' + region + '/deployments');
				requests.push(region_req);
			});
		});
	});

	async.parallel(requests, function(err, results){
		try{
			data = JSON.parse(results);
		}catch(e){
			payload.error = err;
		}
		payload.data = handle_deployments_data(data);
		next();
	});
});

function handle_deployments_data(data){
	var last_deploy = data[0];
	var last_good_deploy = null;
	var deploys_till_good = [];

	if (!good_deploy(last_deploy)){
		for (var i=1, deploy=data[i]; i < data.length; i++){
			deploys_till_good.push(deploy);
			if (good_deploy(deploy)){
				break;
			}
		}
	}
	return {last: last_deploy, deploys_till_good: deploys_till_good};
}

function good_deploy(deploy){
	return (deploy.success && deploy.finished);
}