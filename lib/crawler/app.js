var http = require("http"),
    fs = require("fs");

var options = {
    host: "projects.ifup.org",
    port: "80",
    path: "/devops.json",
    method: "GET",
    headers: {
        'Content-Type': 'application/json',
    }
};

var filename = "devops.json";

// retrieve devops.json and save it to a file
var req = http.get(options, function(res) {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function(d) {
        data += d;
        });
    res.on('end', function() {
        fs.writeFile(filename, data, function (err) {
            if (err) throw err;
            console.log("done");
            });
        });
    }).on('error', function(e) {
        console.error('Problem with request: ' + e.message);
        console.error('Cache NOT written to.');
    });
