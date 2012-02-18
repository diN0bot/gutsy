var fs = require('fs');
var path = require('path');

var optimist = require('optimist');
var app = require('./web/app');

exports.run = function() {
  var argv, devops;
  optimist = optimist.usage('Usage: $0 -p [port] -d [devops.json]');
  optimist = optimist['default']('p', 3000);
  optimist = optimist['default']('d', path.join(__dirname, '..', 'fixtures', 'devops.json'));
  argv = optimist.argv;

  devops = fs.readFileSync(argv.d);
  devops = JSON.parse(devops);

  app.run(argv, devops);
}
