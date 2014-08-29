var express = require("express");
var morgan = require("morgan");
var http = require("http");
var request = require("request");
var _ = require("underscore");

var config = require("./lib/config")({
	PORT : 3000,
	YO_API_KEY : "INSERT KEY HERE",
	YO_API_SEND_URL : "https://api.justyo.co/yo/",
	RESPONSE_URL_FORMAT : "${SCHEME}://${HOST}/public/message.html?${TOKEN}",
	MESSAGES : "Message1|Message2"
});

var messages = config.get("MESSAGES").split("|");
var url_template = _.template(config.get("RESPONSE_URL_FORMAT"), { interpolate : /\$\{(.+?)\}/ });

var app = express();
app.use(morgan('dev'));

app.use("/public", express.static(__dirname + "/public"));

app.get("/yo", function(req, res) {
	var model = {
		HOST : req.get("HOST"),
		SCHEME : (req.connection.encrypted || req.headers['x-forwarded-proto'] === "https") ? "https" : "http",
		TOKEN : encodeURIComponent(messages[Math.floor(Math.random()*messages.length)]),
		USERNAME : req.query.username
	 };
	request.post(config.get("YO_API_SEND_URL"), { form : { api_token : config.get("YO_API_KEY"), username : req.query.username, link : url_template(model) } }, function(err, response) {
		if(err || response.statusCode !== 200) {
			console.log("ERROR Sending Yo to " + req.query.username + " - " + response.body);
			return res.send("ERROR: " + err);
		}
		console.log("Success sending Yo to " + req.query.username + " - " + response.body);
		res.send(url_template(model));
	}); 
});

app.listen(config.get("PORT"), function(err) {
	if(err)
		return console.error("Error - " + err);
	console.log("Listening on " + config.get("PORT"));
});
