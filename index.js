// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var fs = require('fs');

var Promise = require("bluebird");
var request = require('request-promise');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

var apiUrl = "https://www.khanacademy.org/api/v1/topic/";

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
//  app.use('/public', express.static(path.join(__dirname, '/public')));
app.use(express.static('public'));



// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function (req, res) {
  res.status(200).send('Einsteiny mobile application backend!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var eisteinyUrl = "https://einsteiny.herokuapp.com/";

app.get('/humanities', function (req, res) {
  // create request objects
  var topics = ["second-empire", "realism", "impressionism", "post-impressionism", "avant-garde-sculpture", "art-1010-ddp", "ceramics-glass", "sculpture",
    "painting-materials-techniques", "printmaking", "tools-understanding-art"];

  let requests = [];
  let requestsVideos = [];
  let topicsLength = topics.length;

  for (let i = 0; i < topicsLength; i++) {
    requests.push({ url: apiUrl + topics[i] });
    requestsVideos.push({ url: apiUrl + topics[i] + "/videos" });
  }

  Promise.map(requests.concat(requestsVideos), function (obj) {
    return request(obj).then(function (body) {
      return JSON.parse(body);
    });
  }).then(function (results) {
    let resObjs = [];
    for (let i = 0; i < topicsLength; i++) {
      let resInfo = results[i];
      let resVideos = results[topicsLength + i];
      let resObj = {};
      resObj.title = resInfo.title;
      resObj.description = resInfo.description;

      let lessons = []
      for (let i = 0; i < resVideos.length; i++) {
        let newLesson = {}
        newLesson.title = resVideos[i].title;
        newLesson.description = resVideos[i].description;
        newLesson.image_url = resVideos[i].download_urls.png;
        newLesson.video_url = resVideos[i].download_urls.mp4;
        lessons.push(newLesson)
      }
      resObj.lessons = lessons;
      resObjs.push(resObj);
    }
    let response = JSON.parse(`{ "standalone_title": "Arts", "children": ${JSON.stringify(resObjs)} }`);
    console.log("response = ", response);
    res.json(response);
  }, function (err) {
    console.error(err);
    // handle all your errors here
    res.json(JSON.parse(fs.readFileSync('content/humanities.json', 'utf-8')));
  });
});

app.get('/economics-finance-domain', function (req, res) {
  var requests = [
    { url: apiUrl + "demand-curve-tutorial" },
    { url: apiUrl + "supply-curve-tutorial" },
    { url: apiUrl + "market-equilibrium-tutorial" },
    { url: apiUrl + "oil-prices-tutorial" },
    { url: apiUrl + "perfect-competition" },
    { url: apiUrl + "monopolies-tutorial" },
    { url: apiUrl + "monopolistic-competition-oligop" },
    { url: apiUrl + "stocks-intro-tutorial" }
  ];

  Promise.map(requests, function (obj) {
    return request(obj).then(function (body) {
      return JSON.parse(body);
    });
  }).then(function (results) {
    let response = JSON.parse(`{ "standalone_title": "Economics & finance", "children": ${JSON.stringify(results)} }`);
    console.log("response = ", response);
    res.json(response);
  }, function (err) {
    console.error(err);
    // handle all your errors here
    res.json(JSON.parse(fs.readFileSync('content/humanities.json', 'utf-8')));
  });
});

app.get('/computing', function (req, res) {
  var requests = [{ url: apiUrl + "meet-the-computing-professional" },
  { url: apiUrl + "internet-works-intro" },
  { url: apiUrl + "moderninfotheory" },
  { url: apiUrl + "modern-crypt" },
    // { url: apiUrl + "" },
    // { url: apiUrl + "" },
    // { url: apiUrl + "" },
    // { url: apiUrl + "" },
    // { url: apiUrl + "" }
  ];

  Promise.map(requests, function (obj) {
    return request(obj).then(function (body) {
      return JSON.parse(body);
    });
  }).then(function (results) {
    let response = JSON.parse(`{ "standalone_title": "Computing", "children": ${JSON.stringify(results)} }`);
    console.log("response = ", response);
    res.json(response);
  }, function (err) {
    console.error(err);
    // handle all your errors here
    res.json(JSON.parse(fs.readFileSync('content/humanities.json', 'utf-8')));
  });

});

app.get('/science', function (req, res) {
  var requests = [{ url: apiUrl + "introduction-to-the-atom" },
  { url: apiUrl + "introduction-to-compounds" },
  { url: apiUrl + "big-bang-expansion-topic" },
  { url: apiUrl + "intro-to-ee" },
    // { url: apiUrl + "" },
    // { url: apiUrl + "" },
    // { url: apiUrl + "" },
    // { url: apiUrl + "" },
    // { url: apiUrl + "" }
  ];

  Promise.map(requests, function (obj) {
    return request(obj).then(function (body) {
      return JSON.parse(body);
    });
  }).then(function (results) {
    let response = JSON.parse(`{ "standalone_title": "Science", "children": ${JSON.stringify(results)} }`);
    console.log("response = ", response);
    res.json(response);
  }, function (err) {
    console.error(err);
    // handle all your errors here
    res.json(JSON.parse(fs.readFileSync('content/humanities.json', 'utf-8')));
  });
});



var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
  console.log('parse-server-example running on port ' + port + '.');
});




// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
