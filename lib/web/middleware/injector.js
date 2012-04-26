/**
 * Adds some utility methods to the res.locals for utiltiy in rendering views
 */
var _ = require('underscore');
var settings = require('../../settings');
var utils = require('../../utils');

exports.inject = function(polling_data, devops){
  return function(req, res, next){
    // params aren't made yet for some damn reason
    var project = req.url.match('/p/([a-zA-Z]+)/*');
    if (project && project.length == 2){
      project = project[1];
      res.locals(polling_data[project]);
      req.devops = devops[project];
    }
    res.locals(module.exports.jade_locals(req, res));
    next();
  };
};

exports.jade_locals = function(req, res){
  return {
    format_time: function(time_like){
      var date_object = new Date(time_like);
      return utils.humane_date(date_object);
//      return date_object.toLocaleString();
    },
    trace: function(error){
      // if in debug mode... and this is a new Error();
      if (settings.debug === true){
        if (_.has(error, 'stack') && error.stack){
          // turn line returns into the HTML equiv
          return JSON.stringify(error.stack.replace(/\n/g, '<br/>'));
        }
        //TODO: extract a callback stack somehow from an error string with magic or emmit a warning
        // this may not be as crazy as it sounds, but many errors here are not exceptions, but are api failures
        // for one reason or another (bad api key, etc)
      }
      if (error.message){
        return JSON.stringify(error.message);
      }
      // fall through
      return JSON.stringify(error);
    },
    title: function(){
      if (req.params && req.params.project){
        return "Gutsy: " + req.params.project;
      }
      return 'Gutsy';
    },
    health_enum_to_string: function(num){
      return utils.HEALTH_ENUM[num];
    }
  };
};

