var express = require("express");
var morgan = require("morgan");
var http = require("http");
var request = require("request");
var _ = require("underscore");

var config = require("./lib/config")({
	PORT : 3000,
	YO_API_KEY : "INSERT KEY HERE",
	YO_API_SEND_URL : "https://api.justyo.co/yo/",
	RESPONSE_URL_FORMAT : "${SCHEME}://${HOST}/message.html?${MESSAGE}",
	MESSAGES : "Message1|Message2",
	MAX_TRIES : 3,
	ABOUT_URL : "/about.html"
});

// Messages are a pipe "|" delimited list of items
var messages = config.get("MESSAGES").split("|");

// Process the RESPONSE_URL_FORMAT to replace scheme, hostname, etc.
// Switching out the default underscore <%=%> for %{} delimiters
var url_template = _.template(config.get("RESPONSE_URL_FORMAT"), { interpolate : /\$\{(.+?)\}/ });

var app = express();
app.use(morgan('dev'));
app.use("/", express.static(__dirname + "/public"));

function sendYo(model, tries, callback) {
	request.post(config.get("YO_API_SEND_URL"), { form : { api_token : config.get("YO_API_KEY"), username : model.USERNAME, link : model.link } }, function(err, response) {
		if(err || response.statusCode !== 200) {
			if(/Rate limit exceeded. Only one Yo per recipient per minute./.test(response.body)) { // Need to find a less fragile way to detect this
				if(tries < config.get("MAX_TRIES")) {
					tries = tries + 1;
					console.log("Rate limited YOing " + model.USERNAME + ", trying again in 60 seconds. Try #" + tries);
					setTimeout(function() { 
						console.log("Retrying for " + model.USERNAME);
						sendYo(model, tries, function() {}); 
					}, 60000);
					err = "Once per minute per user rate limit exceeded, will try again up to " + config.get("MAX_TRIES") + " times.";
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

function build_model(req) {
	var model = {
		HOST : req.get("HOST"),
		SCHEME : (req.connection.encrypted || req.headers['x-forwarded-proto'] === "https") ? "https" : "http",
		MESSAGE : encodeURIComponent(messages[Math.floor(Math.random()*messages.length)]),
		USERNAME : req.query.username
	};
	model.link = url_template(model);
	return model;
}

// GET Endpoint triggered as the yo application callback
// YO will call this and supply the username as a querystring
app.get("/yo", function(req, res) {
	var model = build_model(req);
	sendYo(model, 1, function(err, response) {
		if(err || response.statusCode !== 200) {
			console.log("ERROR sending Yo to " + req.query.username + " - " + response.body);
			return res.send("ERROR: " + err);
		}
		else {
			console.log("YO to " + req.query.username + " - " + model.link);
			return res.send(model.link);
		}
	}); 
});

app.get("/go", function(req, res) {
	var model = build_model(req);
	res.redirect(model.link);
});

app.get("/", function(req, res) {
	res.redirect(config.get("ABOUT_URL"));
});

app.listen(config.get("PORT"), function(err) {
	if(err)
		return console.error("Error - " + err);
	console.log("Listening on " + config.get("PORT"));
});
