// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var fs = require('fs');

var Promise = require("bluebird");
var request = require('request-promise');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function (req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

app.get('/humanities', function (req, res) {
  // create request objects
  let apiUrl = "https://www.khanacademy.org/api/v1/topic/"
  var requests = [{
    url: apiUrl + "second-empire"

  }, {
    url: apiUrl + "realism"

  }];


  Promise.map(requests, function (obj) {
    return request(obj).then(function (body) {
      return JSON.parse(body);
    });
  }).then(function (results) {
    res.json(JSON.parse(`{ "standalone_title": "Arts", "children": ${results}}`));
    for (var i = 0; i < results.length; i++) {
      // access the result's body via results[i]
    }
  }, function (err) {
    console.log(err);
    // handle all your errors here
  });

  console.error("HERRRREE");
  res.json(JSON.parse(fs.readFileSync('content/humanities.json', 'utf-8')));
});

app.get('/economics-finance-domain', function (req, res) {
  res.json(JSON.parse(fs.readFileSync('content/humanities.json', 'utf-8')));
});

app.get('/computing', function (req, res) {
  res.json(JSON.parse(fs.readFileSync('content/humanities.json', 'utf-8')));
});

app.get('/science', function (req, res) {
  res.json(JSON.parse(fs.readFileSync('content/humanities.json', 'utf-8')));
});











var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
  console.log('parse-server-example running on port ' + port + '.');
});




// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
