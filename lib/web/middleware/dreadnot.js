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
		utils.request_maker(options, _.bind(this.callback, this));
		this.cb = cb;
	},
	callback: function(error, data){
		this.cb(error, data);
	}
};

module.exports = utils.create_middleware('dreadnot', function dreadnot(req, res, next, payload, api_config) {

	var requests = [];
	_.each(api_config.stacks, function(a_stack){
		_.each(_.keys(a_stack), function(stack_name){
			requests.push(_.bind(request, {}, api_config, '/' + stack_name));
			_.each(a_stack[stack_name], function(region){
				// partial application of the config and path (an implicit closure)
				var region_req = _.bind(request, {}, api_config, '/' + stack_name + '/regions/' + region + '/deployments');
				requests.push(region_req);
			});
		});
	});

	async.parallel(requests, function(err, results){
		var response = [];
		var stack = null;
		var stacks = {};

		try{
			_.each(_.values(results), function(value){
				value = JSON.parse(value);
				if (value instanceof Array){
					stacks[value[0].stackName].deploys = value;
				}else{
					stacks[value.name] = value;
				}
			});
			for (var name in stacks){
				stack = stacks[name];
				var deployment = {
					name: stack.name,
					github_href: stack.github_href,
					latest_revision: stack.latest_revision,
					deploy: stack.deploys[0]
				};
				deployment.deploy.from_trunc = deployment.deploy.from_revision.slice(0,6);
				deployment.deploy.to_trunc = deployment.deploy.to_revision.slice(0,6);
				response.push(deployment);
			}
		}catch(e) {
			payload.error = err;
		}
		payload.data = response;
		next();
	});
});

function good_deploy(deploy){
	return (deploy.success && deploy.finished);
}