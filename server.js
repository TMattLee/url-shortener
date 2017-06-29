 /******************************************************
 * PLEASE DO NOT EDIT THIS FILE
 * the verification process may break
 * ***************************************************/

'use strict';

var fs = require('fs');
var express = require('express');
var app = express();
var rand = require("random-key");
var mongodb = require('mongodb')
var mongo = mongodb.MongoClient
var url = process.env.MONGOLAB_URI;

if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });
  
app.route('/')
    .get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    });
    
app.get('/:docKey', function(req, res) {
  mongo.connect(url,function(err, db) {
    if (err) throw err;
    var collection = db.collection('shorturls');
   
    collection.find({
        "key": req.params.docKey
      }, function(err, result){
        if (err) throw err;
        result.toArray(function(err, result) {
          if (err) throw err;
          res.redirect(result[0]["original-url"]);
        });
      }
    )
    db.close();
  });
});
    
app.get('/new/:webAddress', function(req,res){
  console.log(req.params.webAddress)
  var baseUrl = "https://tmattlee-urlshortener.herokuapp.com/";
  var newEndPoint = rand.generateBase30(6);
  var outputUrl = baseUrl + newEndPoint;
  var doc = {
    "key":  newEndPoint,
    "original-url": req.params.webAddress,
    "short-url": outputUrl
  }
  mongo.connect(url, function(err, db) {
    if (err) throw err
    var collection = db.collection('shorturls');
    collection.insert(doc, function(err, data) {
      if (err) throw err;
      res.send({
        "original-url": req.params.webAddress,
        "short-url": outputUrl
      });
    });
    db.close()
  });
});



// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});

