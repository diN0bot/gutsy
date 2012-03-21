/**
 * Adds some utility methods to the res.locals for utiltiy in rendering views
 */
var _ = require('underscore');
var settings = require('../../../settings');

module.exports = function() {
	return function injector(req, res, next) {

		// partial application of req and res so we don't have to close _locals here
		// (mostly because this is awesomer!)
		_.each(_.keys(_locals), function(key){
			// this is also set to null... for no reason really
			// TODO: wrap this function call so that we get exceptions in these!
			_locals[key] = _.bind(_locals[key], null, req, res);
		});
		// dump in jade
		res.locals(_locals);
		// advance the middlewares
		next();
	};
};

var _locals = {
	format_time: function(req, res, time_like){
		var date_object = new Date(time_like);
		return date_object.toDateString() + date_object.toTimeString();
	},
	trace: function(req, res, error){
		// if in debug mode... and this is a new Error();
		if (settings.debug === true){
			if (_.has(error, 'stack')){
				var stack = error.stack;
				// turn line returns into the HTML equiv
				return JSON.stringify(stack.replace(/\n/g, '<br/>'));
			}
			//TODO: extract a callback stack somehow from an error string with magic or emmit a warning
			// this may not be as crazy as it sounds, but many errors here are not exceptions, but are api failures
			// for one reason or another (bad api key, etc)
		}
		// fall through
		return JSON.stringify(error.message);
	}
};

var get_value_from_json = function(obj, str){
	if (!str){
		return null;
	}
	var val = obj;
	try{
		var keys = str.split('.');
		_.each(keys, function(key){
			val = val[key];
		});
	}catch(e){
		val = null;
	}finally{
		return val;
	}

};
