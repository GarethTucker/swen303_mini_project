var express = require('express');
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
client.execute("OPEN Colenso");

/* GET home page. */
router.post("/",function(req,res){
	client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0';" +
		" (//name[@type='place'])[1] ",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				res.render('index', { title: 'ECS Video Rental', place: result.result });
			}
		}
	);
});

router.get("/search",function(req,res){
	var q = req.query;
	client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0';" +
		" (//name[@type='"+q.query+"'])[1] ",
		function (error, result) {
			if(error){ console.error(error);}
			else {
				res.render('index', { title: 'ECS Video Rental', place: result.result });
			}
		}
	);
});

router.post('/', function (req, res) {
    console.log(req.body.title);
    res.render('index', {title: 'Colenso', place: req.body.title});
});


module.exports = router;
