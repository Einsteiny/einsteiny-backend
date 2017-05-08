// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var fs = require('fs');

var Promise = require("bluebird");
var request = require('request-promise');

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
  },
  auth: {
    facebook: {
      appIds: process.env.FACEBOOK_APP_ID
    }
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();


// Serve static assets from the /public folder
// app.use('/public', express.static(path.join(__dirname, '/public')));
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
var apiUrl = "https://www.khanacademy.org/api/v1/topic/";

//add descriptions for courses with empty descriptions
var descriptionsMap = {}
descriptionsMap["copy-of-khan-academy-living-room-chats"] =
  "Personal lessons and insights from accomplished entrepreneurs are the basis of this interview series produced by the Ewing Marion Kauffman Foundation and Khan Academy.";


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
      let courseId = `${resInfo.id}_${resInfo.creation_date}`;

      if (artTopics.indexOf(topics[i]) > -1) {
        resObj.category = "Arts";
      } else if (economicsTopics.indexOf(topics[i]) > -1) {
        resObj.category = "Entrepreneurship";
      } else if (computingTopics.indexOf(topics[i]) > -1) {
        resObj.category = "Computing & Science";
      } else if (historyTopics.indexOf(topics[i]) > -1) {
        resObj.category = "US History";
      }

      resObj.photo_url = eisteinyUrl + "images/" + images[i % images.length];

      resObj.id = courseId;
      resObj.title = resInfo.title;
      if (resInfo.description == null || resInfo.description.length == 0) {
        resObj.description = descriptionsMap[topics[i]];
      } else {
        resObj.description = resInfo.description;
      }



      let lessons = []
      for (let i = 0; i < resVideos.length; i++) {
        let newLesson = {}
        newLesson.id = courseId + i;
        newLesson.title = resVideos[i].title;
        newLesson.courseId = courseId;
        newLesson.description = resVideos[i].description;
        newLesson.image_url = resVideos[i].download_urls.png;
        newLesson.video_url = resVideos[i].download_urls.mp4;
        lessons.push(newLesson)
      }
      resObj.lessons = lessons;
      if (resObj.title == "Art 1010" || resObj.title == "Market equilibrium"
        || resObj.title == "Post-Impressionism" || resObj.title == "Painting") {
        resObj.complexity = 5.0;
      } else {
        resObj.complexity = generateRandomComplexity();
      }

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

function generateRandomComplexity() {
  var min = 2.0,
    max = 5.0,
    highlightedNumber = Math.random() * (max - min) + min;

  return highlightedNumber.toFixed(3);

};

let artTopics = ["realism", "impressionism", "post-impressionism", "avant-garde-sculpture", "art-1010-ddp", "ceramics-glass", "sculpture",
  "painting-materials-techniques", "printmaking", "intl-avant-garde", "surrealism1", "leonardo-da-vinci", "michelangelo", "high-renaissance1",
  "fauvism-matisse", "expressionism1", "cubism", "art-post-war-britain", "abstract-expressionism", "ny-school", "pop",
];

let economicsTopics = ["copy-of-khan-academy-living-room-chats", "richard-branson", "marc-ecko", "philip-rosedale", "zach-kaplan", "ta-mccann", "ben-milne",
  "giles-shih", "danny-oneill", "lara-morgan", "dave-smith", "jason-christiansen", "linda-jeschofnig", "lakeshia-grant", "warby-parker",
  "bottle-rocket-apps", "beth-schmidt-wishbone", "toby-rush-eyeverify"];

let computingTopics = ["modern-crypt", "moderninfotheory", "info-theory", "internet-works-intro", "introduction-to-the-atom", "introduction-to-compounds", "big-bang-expansion-topic", "intro-to-ee", "asthma2", "brain-teasers"];

let historyTopics = ["apush-early-english-settlement", "apush-declaration-of-independence", "apush-creating-a-nation",
  "apush-age-of-jackson", "apush-culture-and-reform", "apush-slavery-and-the-civil-war", "apush-south-after-civil-war", "ap-us-history",
  "apush-us-wwii", "apush-1960s-america"];

let popularTopics = ["mars-modern-exploration", "beginners-guide-20-21", "asthma2", "brain-teasers"];

let images = [
  "second-empire.jpg", "realism.jpg", "impressionism.jpg", "post-impressionism.jpg",
  "avant-garde-sculpture.jpg", "art-1010-ddp.jpg", "ceramics-glass.jpg", "sculpture.jpg",
  "painting-materials-techniques.jpg", "printmaking.jpg",

  "demand-curve-tutorial.jpg", "supply-curve-tutorial.jpg", "market-equilibrium-tutorial.jpg",
  "oil-prices-tutorial.jpg", "perfect-competition.jpg", "monopolies-tutorial.jpg",
  "monopolistic-competition-oligop.jpg", "stocks-intro-tutorial.jpg",


  "meet-the-computing-professional.jpg", "internet-works-intro.jpg", "moderninfotheory.jpg", "modern-crypt.jpg",
  "introduction-to-the-atom.jpeg", "introduction-to-compounds.png", "big-bang-expansion-topic.jpg", "intro-to-ee.jpg",
  "mars-modern-exploration.jpg", "beginners-guide-20-21.jpg", "asthma2.jpg", "brain-teasers.jpg"

];

app.get('/humanities', function (req, res) {
  // create request objects
  requestCategory(artTopics, "Arts", res);
});


app.get('/economics-finance-domain', function (req, res) {
  requestCategory(economicsTopics, "Entrepreneurship", res);
});

app.get('/computing', function (req, res) {
  requestCategory(computingTopics, "Computing & Science", res);
});

app.get('/ushistory', function (req, res) {
  requestCategory(historyTopics, "US History", res);

});

app.get('/popular', function (req, res) {
  requestCategory(popularTopics, "Popular", res)
})

app.get('/all-courses', function (req, res) {
  requestCategory(artTopics.concat(economicsTopics).concat(computingTopics).concat(historyTopics), "All", res)
});


var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
  console.log('parse-server-example running on port ' + port + '.');
});



// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);

var kue = require('kue')
var redisUrl = process.env.REDIS_URL
var jobs = kue.createQueue({ redis: redisUrl })
app.use('/kue', kue.app) // For the kue dashboard


Parse.Cloud.define('subscribe', function (request, response) {
  var params = request.params;
  var customData = params.customData;

  if (!customData) {
    response.error("Missing customData!")
  }

  var sender = JSON.parse(customData).sender;
  var courseId = JSON.parse(customData).course;
  var time = JSON.parse(customData).time;

  var job = jobs.create('parseCloud', {
    course: courseId

  }).delay(time - Date.now())
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


