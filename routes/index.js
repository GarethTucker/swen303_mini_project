var express = require('express');
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
var prettyData = require('pretty-data').pd;
client.execute("OPEN Colenso");

var tei = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; ";


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

router.get("/search/XQUERY",function(req,res){
	//tei = "XQUERY declare namespace tei = 'http://www.tei-c.org/ns/1.0'; ";
	var q = req.query;
	var input = q.input;
	console.log("tei+input: "+tei+input);
	client.execute( (tei+input),
		function (error, result) {
			if(error){ console.error(error);}
			else {
				console.log("result: "+result.result);
				res.render('index', { title: 'ECS Video Rental', database_list: [], search_result: result.result });
			}
		}
	);
});

router.get("/search/Text",function(req,res){
	//tei = "XQUERY declare namespace tei = 'http://www.tei-c.org/ns/1.0'; ";
	var q = req.query;
	var input = q.input;
	console.log("input: "+input);
	var full_query = (tei+ "\nfor $t in //p \nwhere matches($t,'"+input+"', 'i') = true() \nreturn db:path($t)")
	console.log("Full Query: "+full_query)
	client.execute( (full_query),
		function (error, result) {
			if(error){ console.error(error);}
			else {
				console.log("result: "+result.result);
				res.render('index', { title: 'ECS Video Rental', database_list: [], search_result: result.result });
			}
		}
	);
});

router.get("/browse", function(req,res){
	client.execute("XQUERY db:list('Colenso')",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				var xml_results = result.result;
				var xml_lines = xml_results.split("\n");
				res.render('index', { title: 'Browse', place: 'default', database_list: xml_lines });
			}
		}
	);
});

router.get("/browse/*", function(req,res){
	var path = req.originalUrl.replace('/browse', 'Colenso');
	path = path.substring(0, path.length - 1);
	console.log("path: "+path);
	client.execute(tei+"(collection('"+path+"'))",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				console.log("result.result length: "+result.result.length);
				var xml_results = result.result;
				var xml = prettyData.xml(xml_results);
				// var xml_lines = xml_results.split("\n");
				res.render('index', { title: 'Browse', place: 'default', database_list: xml_results });
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