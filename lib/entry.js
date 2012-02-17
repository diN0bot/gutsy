var express = require('express');
var app = express.createServer();

exports.run = function() {
  app.get('/', function(req, res){
    res.send('Cluck cluck');
  });
  app.listen(3000);
}
