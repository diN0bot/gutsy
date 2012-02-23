var fs = require('fs');
var path = require('path');
var optimist = require('optimist');

var app = require('./web/app');
var crawler = require('./crawler/app');
var tester = require('../tests/view_tests/test_index');


exports.run = function() {
  var argv, devops;

  optimist = optimist.usage('Usage: $0 -p [port] -d [devops.json] [-c] [-h]');
  optimist = optimist['default']('p', 3000);
  optimist = optimist['default']('d', path.join(__dirname, '..', 'fixtures', 'devops.json'));
  optimist = optimist['default']('c', false);
  optimist = optimist['default']('h', false);
  optimist = optimist.alias('c', 'crawler');
  optimist = optimist.describe('c', 'Run the crawler to update devops.json');
  optimist = optimist.alias('t', 'test');
  optimist = optimist.describe('t', 'Run tests');
  optimist = optimist.alias('h', 'help');
  optimist = optimist.describe('h', 'Print usage help');
  argv = optimist.argv;

  if (argv.h) {
    optimist.showHelp(console.log);
  } else if (argv.c) {
    crawler.run(argv);
  } else if (argv.t) {
    tester.run(argv);
  } else {
    devops = fs.readFileSync(argv.d);
    devops = JSON.parse(devops);

    app.run(argv, devops);
  }
}
