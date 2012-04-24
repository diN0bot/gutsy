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

var _ = require('underscore');
var util = require('util');
var utils = require('../../utils');
var async = require('async');
var url = require('url');

module.exports = utils.create_middleware('highscores', _highscores);

/** Adds github field to devops if github related api is present
 * @param {object} devops devops object
 */
function _highscores(req, res, next, payload, api_config) {

	var options = {
		host: api_config.url,
    port: 3000,
    path: "/api/reach",
    method: 'GET'
   };

  utils.request_maker(options, function(err, results){

		if (err){
			payload.err = err;
			return next();
		}

		payload.data = JSON.parse(results);

		return next();
  });
}