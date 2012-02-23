var fs = require('fs');
var path = require('path');
var jade = require('jade');


exports.run = function() {
  var viewTester = new ViewTester();
  viewTester.test_view('index.jade', 'devops_fake_full.json');
  //viewTester.test_view('index.jade', 'devops_fake_min.json');
}

/** The test class
 * @param {Object} options configuration variables.
 * @constructor
 */
var ViewTester = function(options) {
  this._options = options || {};
  this._view_path = path.join(__dirname, '..', '..',  'lib', 'web', 'views');
  this._fixture_path = path.join(__dirname, '..', '..', 'fixtures');
};

/**
 * Runs a view tests
 *
 * @param {string} dataset the dataset to add records to.
 * @param {string} name the name of the message.
 * @param {Object} data the data for the example.
 */
ViewTester.prototype.test_view = function(view, devopsjson) {
  var view_path, context;

  view_path = path.join(this._view_path, view);
  context = path.join(this._fixture_path, devopsjson);
  context = fs.readFileSync(context);
  context = JSON.parse(context);

  jade.renderFile(view_path, context, function(er, tmpl) {
    console.log("ERR", er);
    console.log("TMP", tmpl);
    // assert that no error thrown
  });
};
