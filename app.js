var express = require('express')
  , http = require('http')
  , path = require('path')
  , util = require('util')
  , fs = require('fs')
  , form = require('formidable');

var app = express();

var databaseUrl = "mydb"; 
var collections = ["ged"];
var db = require("mongojs").connect(databaseUrl, collections);
var BSON = require("mongodb").BSONPure;

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser({ 
    keepExtensions: true, 
    uploadDir: __dirname + '/tmp',
    limit: '10mb'
  }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res) {
  res.render('index');
});


app.get('/doc/:id', function(req, res) {
var id = new BSON.ObjectID(req.params.id);
var path = "";
var perimetre = "";
console.log("id : " + id);
  db.ged.find({'_id': id}, function(err, docs) {
  if( err || !docs.length) 
    console.log("No doc found");
  else {
    path = docs[0].path;
    perimetre = docs[0].perimetre;
    console.log("Doc : " + path);
    console.log("Perimetre : " + perimetre);
    res.render('file', {'path': path, 'perimetre': perimetre});

  }
  });
});

app.post('/upload', function(req, res) {
  fs.rename(req.files.myFile.path, __dirname + '/tmp/' + req.files.myFile.filename, function(error) {
    if(error) {
        console.log('File not renamed');
        res.send({error: 'File not renamed'});
        }
  });
  console.log(req.body);
  console.log(req.body.perimetre);

  db.ged.save({perimetre: req.body.perimetre, path: __dirname + '/tmp/' + req.files.myFile.filename }, function(err, saved) {
  if( err || !saved ) 
    console.log("Doc not saved");
  else 
    console.log("Doc saved ; id : " + saved._id + " " + saved.path + " " + saved.perimetre);
});


  res.redirect('/');
});

// Start the app
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

