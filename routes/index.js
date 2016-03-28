var express = require('express');
var multer = require('multer');
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
var prettyData = require('pretty-data').pd;
var cherrio = require('cheerio');
client.execute("OPEN Colenso");
var fs = require('fs');

var tei = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; ";
var storage = multer.memoryStorage();
var upload = multer({
	storage: storage,
	dest: './uploads'
});
router.use(upload.single('file'));



router.get("/",function(req,res){
	client.execute(tei +
		" (//name[@type='place'])[1] ",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				res.render('index', { title: 'ECS Video Rental', place: result.result });
			}
		}
	);
});

router.get('/submit_page', function (req, res) {
	res.render('submit_page');
});

router.post('/save', function(req, res){
	if(req.file){
		var path = req.file.originalname;
		var xml = req.file.buffer.toString();
		console.log("path:",path)
		client.execute('ADD TO Colenso/uploads/'+path+' "'+xml+'"', function(error, result){
			if(error){ console.error(error);}
			else{ console.log("FILE UPLOADED");}
		});
	}
	res.redirect('/')
});

router.get("/download/*",function(req,res,next){
	
	var url = req.originalUrl;
	var path = url.replace('/download/', '');
	client.execute("XQUERY doc('"+path+"')",
		function(error, result) {
			if (error) {
				console.error(error);
			}
			else {
				var doc = result.result;
				var filename = 'tei_document.xml';
				res.writeHead(200, {
					'Content-Disposition': 'attachment; filename=' + filename,
				});
				res.write(doc);
				res.end();
			}
		}
	)
});

router.get('/search/', function(req, res){
	var q = req.query;
	var raw_input = q.text_search;

	var input = decodeURI(raw_input)
		.replace(" AND ", '\' ftand \'')
		.replace(" NOT ", '\' ftnot \'')
		.replace(" OR ", '\' ftor \'');



	var full_query = tei +
	"for $t in *[.//text() contains text '"+input+"' using wildcards]return db:path($t)"
	client.execute( (full_query), function(error, result) {
		if (error) {
			console.error(error);
		}
		else {
			var xml_results = result.result;
			var xml_lines = xml_results.split('\n');
			res.render('index', { title: 'Search', database_list: xml_lines, search_result: result.result});
		}
	})

});

router.get("/browse", function(req,res){
	client.execute("XQUERY db:list('Colenso')",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				var xml_results = result.result;
				var xml_lines = xml_results.split("\n");
				res.render('index', { title: 'Browse', place: 'default', database_list: xml_lines, search_result: result.result});
			}
		}
	);
});

router.get("/browse/*", function(req,res){
	var path = req.originalUrl.replace('/browse', 'Colenso');
	path = path.substring(0, path.length - 1);
	client.execute(tei+"(collection('"+path+"'))",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				var xml_results = result.result;
				var xml_lines = xml_results.split("\n");
				res.render('index', { title: 'Browse', place: 'default', database_list: xml_lines, search_result: result.result});
			}
		}
	);
});

router.get("/display/*", function(req, res){
	var url = req.originalUrl;
	var path = url.replace('/display', 'Colenso');
		client.execute("XQUERY doc('"+path+"')",
			function(error, result){
				if(error){ console.error(error);}
				else {
					res.render('index', {
						title: 'display',
						database_list: [],
						xml_doc: {
							text: result.result,
							path: path
						},
						search_result: result.result
					});
				}
			}
	);
});

router.post("/edit/*", function (req, res) {
	var url = req.originalUrl;
	var path = url.replace('/edit/Colenso/', '');
	var xml = req.body.xml_text;
	var cherrio_xml = cherrio.load(xml, {xmlMode: true});
	var xml_id = cherrio_xml('TEI').attr('xml:id');
	var query = "REPLACE "+path+" "+xml
	console.log("EDIT: "+query)

	client.execute(query, function(error, result){
		if(error){ console.error(error);}
		else{
			res.redirect('/')
		}

	});
});

router.post('/', function (req, res) {
    console.log(req.body.title);
    res.render('index', {title: 'Colenso'});
});


module.exports = router;