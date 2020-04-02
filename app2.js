var express = require('express')
  , http = require('http')
  , path = require('path')
  , util = require('util')
  , fs = require('fs')
  , form = require('formidable');

var app = express();
var driver = require('couchbase');
driver.connect({
	"password": "",
	"hosts": ["localhost:8091"],
	"bucket": "GED"}, 
	function(err, cb) {
		if (err) {
			throw (err)
		}
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
        console.log("id : " + req.params.id);

        get(req, res, req.params.id);

    });
    
    app.get('/download/:id', function(req, res) {
        console.log("id : " + req.params.id);

        download(req, res, req.params.id);

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
      var docToSave = req.body;
      docToSave.path = __dirname + '/tmp/' + req.files.myFile.filename;

      upsert(req, res, docToSave);  
    });


    function upsert(req, res, doc) {
        cb.incr("counter:ged", function(err, value, meta) {
            id = "ged::" + value;
            console.log("ID : " + id);
            doc.id = id;
            console.log(JSON.stringify(doc));
            cb.set(id, JSON.stringify(doc), function(err, meta) {
                res.render('file', doc);
            });
        });
    };

    function download(req, res, docId) {
        cb.get(docId, function(err, doc, meta) {
            if (doc != null ) {
                res.download(doc.path, doc.filename, function(err){
                    if (err) {
                        res.send(404);
                    } else {
                        console.log("Doc : " + JSON.stringify(doc));
                    }
                });
            } else {
                res.send(404);
            }
        });
    };
    
    function get(req, res, docId) {
        cb.get(docId, function(err, doc, meta) {
            if (doc != null ) {
                res.render('file', doc);
            } else {
                res.send(404);
            }
        });
    };


    // Start the app
        http.createServer(app).listen(app.get('port'), function(){
          console.log("Express server listening on port " + app.get('port'));
        });
});

