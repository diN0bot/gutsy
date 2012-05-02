/*
 *  Copyright 2011 Rackspace
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

var fs = require('fs');

var express = require('express');
var async = require('async');
var _ = require('underscore');
var et = require('elementtree');

var urls = require('./urls');
var middleware = require('./middleware');
var settings = require('../settings');
var utils = require('../utils');

function get_devops(req, devops, api){
  var _devops = devops[req.params.project];
  if (!api){
    return _devops;
  }
  return _devops.related_apis[api];
}

module.exports.install = function(app, status_api, devops){
  app.get(
    '/favicon.ico',
    function(req, res) {
      res.send("favicon");
  });

  app.get(
    urls.DEFECTS,
    function(req, res) {
      res.render('defects.jade');
  });

  app.get(
    urls.DEVHEALTH,
    function(req, res) {
      res.render('devhealth.jade');
    });

  app.get(
    urls.RELEASE_NOTES,
    function(req, res) {
      res.render('release_notes.jade', {get: true, errors: null, notes: null});
  });

  var Note = utils.make_class({
    init: function(pull_request){
      var self = this;
      self.title = pull_request.title;
      self.body = pull_request.body;
      self.link = pull_request.html_url;
      self.merged_at = pull_request.merged_at;
      self.id = pull_request.id;
      self.v1 = {
        data: null,
        href: null,
        error: null
      };
    },
    set_data: function(data){
      var self = this;
      self.v1.data = data;
    },
    set_href: function(href){
      var self = this;
      self.v1.href = href;
    },
    set_error: function(err){
      var self = this;
      self.v1.error = err;
    }
  });

  var Release_Notes_Worker = utils.make_class({
    init: function(v1_config, github_config, start, end){
      var self = this;

      self.notes = [];
      self._start = start;
      self._end = end;

      self._cutoff = new Date(self._end.valueOf() - 31 * 24 * 60 *60 * 1000);

      self.v1_support = v1_config ? true : false;

      self._github_options = _.bind(utils.github_request_options, null, github_config);
      self._v1_options = _.bind(utils.get_v1_options_from_branch_name, null, v1_config);

      self.v1_response_handler = _.bind(self.__v1_response_handler, self);
      self.github_response_handler = _.bind(self.__github_response_handler, self);

      // a queue to grab info from v1 (after we get info from github :(
      // make an async queue for requests of concurrency: 5
      self._q = async.queue(utils.request_maker, 5);
    },
    work: function(cb){
      var self = this;
      self.cb = cb;

      // cb is called after we are all done
      self._q.drain = function(err){

        self.notes.sort(function(a, b){
          return ( b.merged_at.valueOf() - a.merged_at.valueOf());
        });

        cb(err, self.notes);
      };
      // and .... go!
      self.q_github_request();
    },
    add_note: function(pull_request){
      var self = this;
      var note = new Note(pull_request);

      self.notes.push(note);
      if (self.v1_support){
        self._q_v1_request(note);
      }
      return note;
    },
    q_github_request: function(uri){
      var self = this;
      var options = self._github_options(uri);
      self._q.push(options, self.github_response_handler);
    },
    _q_v1_request: function(note){
      var self = this;

      var options = self._v1_options(note.title);

      if (!options){
        return;
      }

      console.log(note.title);
      self._q.push(options, function(err, results){
        // could use bind again, but this is clearerer
        self.v1_response_handler(note, err, results);
      });
    },
    __v1_response_handler: function(note, errors, results){
      var self = this;
      var etree;
      var asset;

      if (errors){
        note.set_error(errors);
        return;
      }

      etree = et.parse(results.data);

      if (!_.isEmpty(etree.error)){
        note.set_error(etree.error.code + ": " + etree.error.message);
        return;
      }
      asset = etree.getroot().find('./Asset');
      note.set_data(asset.getchildren()[0].text);
      note.set_href(asset.attrib.href);

    },
    __github_response_handler: function(errors, results){
      var self = this;
      var pulls;
      var res;
      var links;
      var i;
      var pull;
      var merged_at;
      var reached_cutoff = false;

      next = null;

      if (errors) {
        return self.cb(errors);
      }

      try{
        res = results.res;
        pulls = JSON.parse(results.data);
      } catch (e){
        return self.cb(e);
      }

      for (i=0; i<pulls.length; i++){

        pull = pulls[i];
        if (new Date(pull.created_at) < self._cutoff){
          reached_cutoff = true;
        }
        if (!pull.merged_at){
          continue;
        }
        // TODO: check for pull.base.label === 'master'?
        merged_at = new Date(pull.merged_at);

        if (merged_at >= self._start && merged_at <= self._end){
          self.add_note(pull);
        }
      }
      // make another github request?
      if (!reached_cutoff && res.headers.link){
        _.each(res.headers.link.split(','), function(link){
          var rel_position, rel;
          uri = link.match(/<(.+?)>/)[1];
          rel = link.match(/rel="(.+?)"/)[1];
          if (rel === "next"){
            self.q_github_request(uri);
          }
        });
      }
    }
  });

  app.post(
    urls.RELEASE_NOTES,
    [express.bodyParser()],
    function(req, res) {
      var context = {get: false, notes: [], errors: null};
      var start = req.body.start;
      var end = req.body.end;
      var worker;
      var v1_config;
      var github_config;

      if (!start || !end){
        context.errors = "Supply start and end!";
        return res.render('release_notes.jade', context);
      }
      context.start = start;
      context.end = end;
      try{
        context.start = new Date(start);
        context.end = new Date(end);
      }catch(e){
        context.errors = "I could not parse a date!" + e;
        return res.render('release_notes.jade', context);
      }
      if (start.toString() === 'Invalid Date' || end.toString() === 'Invalid Date'){
        context.errors = "I could not parse a date!";
        return res.render('release_notes.jade', context);
      }
      v1_config = get_devops(req, devops, 'version_one');
      github_config = get_devops(req, devops, 'github');

      worker = new Release_Notes_Worker(v1_config, github_config, context.start, context.end);
      worker.work(function(err, notes){
        if (err){
          context.errors = err;
        }
        context.notes = notes;
        res.render('release_notes.jade', context);
      });
  });

  app.get(
    urls.INDEX,
    function(req, res) {
      var project = get_devops(req, devops);
      var events = project.events;

      var max = 0;
      var event;

      var now = (new Date()).getTime();
      var future_events = [];
      for (var i=0; i<events.length; i++){
        event = events[i];
        if (_.isNull(event.timestamp)){
          continue;
        }
        // convert to seconds
        event.seconds = event.timestamp * 1000;
        // get max
        if (event.seconds > max){
          max = event.seconds;
        }
        // make valid events list
        if (event.seconds > now){
          future_events.push(event);
        }
      }
      if (future_events.length > 1) {
        future_events.sort(function(x,y) {
          return y.timestamp < x.timestamp;
        });
      }
      _.each(future_events, function(event){
        event.days_remaining = Math.floor((event.seconds - now) / (1000*60*60*24));
        // figure out the amount and offset from the right 100px and from the left 25px
        var amt = ((event.seconds - now) / (max - now + 1)) * 0.8;
        event.position = amt * 100;
      });
      res.render('index.jade', {events: future_events, project: project});
  });
  app.get(
    urls.ABOUT,
    function(req, res) {
      res.render("about.jade", {name: "About"});
    });

  app.get(
    urls.META_INDEX,
    function(req, res) {
      var context = {
        name: 'Dashboards',
        projects: _.keys(devops),
        external_projects: settings.external_projects,
        links: settings.metadashboard_uris
      };
      res.render('meta_index.jade', context);
    });

  app.get(
    urls.SERVICE_HEALTH,
    function(req, res){
      var context = {};
      context.hosts =  status_api.get_service_stats(req.params.project);
      context.HEALTH_ENUM = utils.HEALTH_ENUM;
      context.SHOW_ALL = 1030300;
      context.VALID_HEALTH = utils.VALID_HEALTH;
      context.HEALTH_STRING_OK = utils.HEALTH_STRING_OK;
      context.HEALTH_STRING_PROBLEM = utils.HEALTH_STRING_PROBLEM;
      context.HEALTH_STRING_ERROR = utils.HEALTH_STRING_ERROR;
      context.HEALTH_STRING_UNKNOWN = utils.HEALTH_STRING_UNKNOWN;
      context.HEALTH_ERROR = utils.HEALTH_ERROR;
      res.render('service_health.jade', context);
    });

  app.get(
    urls.HIGH_SCORES,
    function(req, res){
      res.render('highscores.jade');
  });
};
