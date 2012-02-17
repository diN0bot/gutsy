var optimist = require('optimist');
var app = require('./web/app');

exports.run = function() {
  var argv;
  optimist = optimist.usage('Usage: $0 -p [port]');
  optimist = optimist['default']('p', 3000);
  argv = optimist.argv;

  app.run(argv);
}
