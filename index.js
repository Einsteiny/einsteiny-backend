// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var fs = require('fs');
var kue = require('kue');
var redis = require('redis');

var Promise = require("bluebird");
var request = require('request-promise');

<<<<<<< HEAD
=======
kue.redis.createClient = function() {
    var redisUrl = url.parse(process.env.REDIS_URL)
      , client = redis.createClient(redisUrl.port, redisUrl.hostname);
    if (redisUrl.auth) {
        client.auth(redisUrl.auth.split(":")[1]);
    }
    return client;
};

>>>>>>> fc0330173c39f2acf1a6854aca602186927a6576
// create our job queue
var jobs = kue.createQueue();

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

var pushConfig = {};
if (process.env.GCM_SENDER_ID && process.env.GCM_API_KEY) {
  pushConfig['android'] = {
    senderId: process.env.GCM_SENDER_ID || '',
    apiKey: process.env.GCM_API_KEY || ''
  };
}

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  push: pushConfig,
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
// app.use(express.static('public'));



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
var apiUrl = "https://www.khanacademy.org/api/v1/topic/";

function requestCategory(topics, categoryName, res) {
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
      resObj.id = `${resInfo.id}_${resInfo.creation_date}`
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
    console.error("resobjs = ", resObjs);
    let response = JSON.parse(`{ "title": "${categoryName}", "courses": ${JSON.stringify(resObjs)} }`);
    console.log("response = ", response);
    res.json(response);
  }, function (err) {
    console.error(err);
    // handle all your errors here
    res.json(JSON.parse(fs.readFileSync('content/humanities.json', 'utf-8')));
  });

}

app.get('/humanities', function (req, res) {
  // create request objects
  let topics = ["second-empire", "realism", "impressionism", "post-impressionism", "avant-garde-sculpture", "art-1010-ddp", "ceramics-glass", "sculpture",
    "painting-materials-techniques", "printmaking", "tools-understanding-art"];

  requestCategory(topics, "Arts", res);

});

app.get('/economics-finance-domain', function (req, res) {
  let topics = ["demand-curve-tutorial", "supply-curve-tutorial", "market-equilibrium-tutorial", "oil-prices-tutorial", "perfect-competition", "monopolies-tutorial", "monopolistic-competition-oligop", "stocks-intro-tutorial"]

  requestCategory(topics, "Economics & finance", res);

});

app.get('/computing', function (req, res) {
  let topics = ["meet-the-computing-professional", "internet-works-intro", "moderninfotheory", "modern-crypt"];

  requestCategory(topics, "Computing", res);
});

app.get('/science', function (req, res) {
  let topics = ["introduction-to-the-atom", "introduction-to-compounds", "big-bang-expansion-topic", "intro-to-ee"];

  requestCategory(topics, "Science", res);

});



var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
  console.log('parse-server-example running on port ' + port + '.');
});




// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);

Parse.Cloud.define('subscribe', function (request, response) {
  var params = request.params;
  var customData = params.customData;

  if (!customData) {
    response.error("Missing customData!")
  }

  var sender = JSON.parse(customData).sender;
  var courseId = JSON.parse(customData).course;


  // one minute
  var minute = 60000;

  var job = jobs.create('parseCloud', {
    course: courseId

  }).delay(minute * 1 * 1)
    .priority('high')
    .save();

  job.on('complete', function () {
    console.log(`course ${courseId} job completed`);
  });

  jobs.process('parseCloud', function (job, done) {
    var query = new Parse.Query(Parse.Installation);
    query.equalTo("installationId", sender);

    Parse.Push.send({
      where: query, // Set our Installation query                                                                                                                                                              
      data: {
        course: job.data.course
      },
    }, {
        success: function () {

          console.log("#### PUSH OK");
          done();
        }, error: function (error) {
          console.log("#### PUSH ERROR" + error.message);
          done();
        }, useMasterKey: true
      });

  });

  response.success('success');
});

<<<<<<< HEAD
=======
app.use(kue.app);
>>>>>>> fc0330173c39f2acf1a6854aca602186927a6576
