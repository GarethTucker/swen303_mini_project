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
				res.render('index', { title: 'Colenso', place: result.result });
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
	console.log("PATH: ", path)
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
	if(req.query.text_search !== ""){
		var q = req.query;
		var raw_input = q.text_search;

		var input = decodeURI(raw_input)
			.replace(" AND ", '\' ftand \'')
			.replace(" NOT ", '\' ftnot \'')
			.replace(" OR ", '\' ftor \'');
		var previous_input = req.query.previous_input;
		var query;
		if(previous_input.length > 0) {
			query = "for $t in *[. contains text '" + input + "' ftand '" + previous_input + "' using wildcards]return db:path($t)";
		}else{
			query = "for $t in *[. contains text '" + input + "' using wildcards]return db:path($t)";
		}
		console.log("previous_input: ", previous_input )
		var full_query = tei + query;
		console.log("full_query: ",full_query);
		client.execute( (full_query), function(error, result) {
			if (error) {
				console.error(error);
			}
			else {
				var xml_results = result.result;
				var xml_lines = xml_results.split('\n');
				console.log("QUERY:"+query);
				res.render('index', {
					title: 'Search',
					database_list: xml_lines,
					search_result: result.result,
					previous_input: input
				});
			}
		})
	}else{
		var q = req.query;
		var input = q.query_input;
		console.log("tei+input: "+tei+input);
		client.execute( (tei+input),
			function (error, result) {
				if(error){ console.error(error);}
				else {
					console.log("result: "+result.result);
					res.render('index', {
						title: 'Colenso',
						database_list: [],
						query_search_results: result.result
					});
				}
			}
		);
	}

});

router.get("/browse_page", function(req,res){
	client.execute("XQUERY db:list('Colenso')",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				var xml_results = result.result;
				var xml_lines = xml_results.split("\n");
				res.render('browse_page', {
					title: 'Browse',
					place: 'default',
					database_list: xml_lines,
					search_result: result.result,
					depth: 0,
					old_folder: 'Colenso/'
				});
			}
		}
	);
});

router.get("/browse_page/*", function(req,res){
	var depth = Number(req.query.depth);
	path = req.query.folder;
	client.execute('XQUERY let $collection := collection("'+path+'") ' +
		'for $file in $collection ' +
		'return db:path($file)',
			function (error, result) {
				if(error){ console.error(error);}
				else {
					var xml_results = result.result;
					var xml_lines = xml_results.split("\n");
					res.render('browse_page', {
						title: 'Browse', 
						database_list: xml_lines, 
						search_result: result.result, 
						depth: depth+1, 
						old_folder: req.query.folder
					});
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
	// client.execute("XQUERY " +
	// 	"try {" +
	// 	"	let $doc := <invalid/>" +
	// 		let $schema := '<!ELEMENT root (#PCDATA)>'
	// 		return validate:dtd($doc, $schema)
	// 	} catch bxerr:BXVA0001 {
	// 		'DTD Validation failed.'
	// 	}

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

router.get("/delete/*", function (req, res) {
	console.log("DELETE")
	var url = req.originalUrl;
	var path = url.replace('/delete/Colenso/', '');
	console.log("PATH: ", path)
	var query = "DELETE "+path
	client.execute(query, function (error, result) {
		if(error){ console.error(error);}
		else{
			console.log("file was deleted")
			res.redirect('/')
		}
	})
})

router.post('/', function (req, res) {
    console.log(req.body.title);
    res.render('index', {title: 'Colenso'});
});


module.exports = router;