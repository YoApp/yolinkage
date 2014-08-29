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
	MESSAGES : "Message1|Message2",
	MAX_TRIES : 3
});

var messages = config.get("MESSAGES").split("|");
var url_template = _.template(config.get("RESPONSE_URL_FORMAT"), { interpolate : /\$\{(.+?)\}/ });

var app = express();
app.use(morgan('dev'));

app.use("/public", express.static(__dirname + "/public"));

function sendYo(model, tries, callback) {
	request.post(config.get("YO_API_SEND_URL"), { form : { api_token : config.get("YO_API_KEY"), username : model.USERNAME, link : model.link } }, function(err, response) {
		if(err || response.statusCode !== 200) {
			if(/Rate limit exceeded/.test(response.body)) {
				if(tries < config.get("MAX_TRIES")) {
					tries = tries + 1;
					console.log("Rate limited YOing " + model.USERNAME + ", trying again in 60 seconds. Try " + tries);
					setTimeout(function() { sendYo(model, tries, function(err2, response2) {}); }, 60000);
				}
				else {
					console.log("Exceeded MAX_TRIES=" + config.get("MAX_TRIES") + ", trying to YO " + model.USERNAME);
				}
			}
			else {
				console.log("ERROR Sending Yo to " + model.USERNAME + " - " + response.body);
			}
			return callback(err, response);
		}
		else {
			return callback(null, response);
		}
	}); 
}

app.get("/yo", function(req, res) {
	var model = {
		HOST : req.get("HOST"),
		SCHEME : (req.connection.encrypted || req.headers['x-forwarded-proto'] === "https") ? "https" : "http",
		TOKEN : encodeURIComponent(messages[Math.floor(Math.random()*messages.length)]),
		USERNAME : req.query.username
	};
	model.link = url_template(model);
	sendYo(model, 1, function(err, response) {
		if(err) {
			console.log("ERROR Sending Yo to " + req.query.username + " - " + response.body);
			return res.send("ERROR: " + err);
		}
		else {
			console.log("YO to " + req.query.username + " - " + model.link);
			res.send(model.link);
		}
	}); 
});

app.listen(config.get("PORT"), function(err) {
	if(err)
		return console.error("Error - " + err);
	console.log("Listening on " + config.get("PORT"));
});
