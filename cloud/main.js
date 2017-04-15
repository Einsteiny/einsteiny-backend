

// create our job queue
var jobs = kue.createQueue();

Parse.Cloud.define('hello', function (req, res) {
  res.success('Hi');
});

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


// start the UI
kue.app.listen(3000);
console.log('UI started on port 3000');
