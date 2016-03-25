var express = require('express');
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
var prettyData = require('pretty-data').pd;
var cherrio = require('cheerio');
client.execute("OPEN Colenso");
var fs = require('fs')

var tei = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; ";


/* GET home page. */
router.get("/",function(req,res){
	client.execute(tei +
		" (//name[@type='place'])[1] ",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				res.render('index', { title: 'ECS Video Rental', place: result.result, database_list: [], search_result: []});
			}
		}
	);
});

router.post('/save', function(req, res){
	console.log("Save")
	//var path = req.files.path
	//console.log("path: "+path)
	console.log("pipe"+req.file)

})




router.get("/download/id/:docId",function(req,res,next){
	var docId = req.params.docId;
	client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; (//TEI[@xml:id='" + docId + "'])",
		function (error, result) {
			if(error){ console.error(error);}
			var doc = result.result;
			console.log("get: ");
			var filename = 'tei_document.xml';
			res.writeHead(200, {
				'Content-Disposition': 'attachment; filename='+filename,
			});
			res.write(doc);
			res.end();
		}
	)
});

router.get("/display/id/:id", function(req, res){
	var id = req.params.id
	console.log("id: "+id)
	var query = tei+"//TEI[@xml:id='"+ id+"']";
	console.log("query: "+query)
	client.execute(query, function(error, result){
		if(error){ console.error(error);}
		else{
			console.log("id: "+id)
			var xml_document = {
				
			}
			res.render('index', {
				title: 'Display_by_id',
				xml_doc: {
					text: result.result,
					xml_id: id
				}
			})
		}
	})
})

router.get("/search/", function(req, res){

	if(req.query.text_search !== ""){
		var q = req.query;
		var input = q.text_search;
		console.log("input.length: "+input.length)
		console.log("Input: "+input);
		var full_query = (tei+ "//TEI[. contains text "+input+"]");
		console.log("Full Query: "+full_query)
		client.execute( (full_query),
			function (error, result) {
				if(error){ console.error(error);}
				else {
					console.log("result.result.length: "+result.result.length);
					var parse = cherrio.load(result.result, {xmlMode: true});
					var doc_data = parse('TEI');
					var xmls = [];
					doc_data.each(function(index, element){
						element = cherrio(element);
						xmls.push({
							title: element.find('title').first().text(),
							author: element.find('author').first().text(),
							id: element.attr('xml:id')
						})
					})
					res.render('index', { 
						title: 'Search Results', 
						database_list: [], 
						text_search_result: xmls
					});
				}
			}
		);
	}else{
		var q = req.query;
		var input = q.query_search;
		console.log("tei+input: "+tei+input);
		client.execute( (tei+input),
			function (error, result) {
				if(error){ console.error(error);}
				else {
					console.log("result: "+result.result);
					res.render('index', { title: 'ECS Video Rental', database_list: [], query_search_results: result.result });
				}
			}
		);
	}
})

// router.get("/search/XQUERY",function(req,res){
// 	//tei = "XQUERY declare namespace tei = 'http://www.tei-c.org/ns/1.0'; ";
// 	var q = req.query;
// 	var input = q.input;
// 	console.log("tei+input: "+tei+input);
// 	client.execute( (tei+input),
// 		function (error, result) {
// 			if(error){ console.error(error);}
// 			else {
// 				console.log("result: "+result.result);
// 				res.render('index', { title: 'ECS Video Rental', database_list: [], search_result: result.result });
// 			}
// 		}
// 	);
// });
//
// router.get("/search/Text",function(req,res){
// 	//tei = "XQUERY declare namespace tei = 'http://www.tei-c.org/ns/1.0'; ";
// 	var q = req.query;
// 	var input = q.input;
// 	console.log("input: "+input);
// 	//var full_query = tei+ "\nfor $t in //TEI \nwhere matches($t,'" + input + "', 'i')  = true() \nreturn db:path($t)"
// 	var full_query = (tei+ "TEI[. contains text "+input+"]");
// 	console.log("Full Query: "+full_query)
// 	client.execute( (full_query),
// 		function (error, result) {
// 			if(error){ console.error(error);}
// 			else {
// 				console.log("result.result.length: "+result.result.length)
// 				xml_split = result.result.split('/n');
// 				res.render('index', { title: 'Search Results', database_list: [], text_search_result: xml_split});
// 			}
// 		}
// 	);
// });

router.get("/browse", function(req,res){
	client.execute("XQUERY db:list('Colenso')",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				var xml_results = result.result;
				var xml_lines = xml_results.split("\n");
				res.render('index', { title: 'Browse', place: 'default', database_list: xml_lines, search_result: result.result, text_search_result: []});
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
				console.log("xml_results; "+xml_results);
				var xml_lines = xml_results.split("\n");
				res.render('index', { title: 'Browse', place: 'default', database_list: xml_lines, search_result: result.result, text_search_result: []});
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
					res.render('index', {title: 'display', database_list: [], xml_doc: result.result, search_result: result.result, text_search_result: []});
					//res.send(result.result);
				}
			}
	);
});

router.post('/', function (req, res) {
    console.log(req.body.title);
    res.render('index', {title: 'Colenso', place: req.body.title});
});


module.exports = router;