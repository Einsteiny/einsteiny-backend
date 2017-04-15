

Parse.Cloud.define('hello', function (req, res) {
  res.success('Hi');
});

var kue = require('kue')
var redisUrl = process.env.REDIS_URL 
kue.createQueue({ redis: redisUrl })
app.use('/kue', kue.app) // For the kue dashboard





