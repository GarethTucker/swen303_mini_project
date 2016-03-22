var express = require('express');
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
var prettyData = require('pretty-data').pd;
client.execute("OPEN Colenso");

var tei = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; "

/* GET home page. */
router.get("/",function(req,res){
	client.execute(tei +
		" (//name[@type='place'])[1] ",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				res.render('index', { title: 'ECS Video Rental', place: result.result, database_list: [] });
			}
		}
	);
});

router.get("/search",function(req,res){
	var q = req.query;
	client.execute( tei +
		" (//name[@type='"+q.bob+"'])[1] ",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				res.render('index', { title: 'ECS Video Rental', database_list: [], place: result.result });
			}
		}
	);
});

router.get("/browse",function(req,res){
	client.execute("XQUERY db:list('Colenso')",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				var list = result.result;
				var arraylist = list.split("\n");
				res.render('index', { title: 'Browse', place: 'default', database_list: arraylist });
			}
		}
	);
});

router.get("/display/*", function(req, res){
	var url = req.originalUrl;
	console.log(url);
	var path = url.replace('/display', 'Colenso');
	// path = path.shift();
	console.log('path:'+path);
	// path = path.join('/');
	// client.execute(tei + "for $doc in ('Colenso') where matches(document-uri($doc),  '" +path+ "') return $doc",
		client.execute("XQUERY doc('"+path+"')",
			function(error, result){
				if(error){ console.error(error);}
				else {
					res.render('index', {title: 'display', database_list: [], xml_doc: result.result});
				}
			}
	);
});

router.post('/', function (req, res) {
    console.log(req.body.title);
    res.render('index', {title: 'Colenso', place: req.body.title});
});


module.exports = router;

// XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; for $doc in ('Colenso') where matches(document-uri($doc),  'PrLHadfld-0017.xml') return $doc