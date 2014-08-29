This is a simple app for the justyo|http://www.justyo.co service where you can listen for yo messages 
and then respond with a custom url formatted with a randomly selected item from a configured list.

Initial use-cases for this are:
* Magic eight-ball (YOEIGHTBALL)
* Random Bible-verse (YOBIBLE)
* Heads or Tails

To use the app, environment variables need to be specified:
* YO_API_KEY - Your api key from justyo
* MESSAGES - a pipe "|" delimited list of your custom messages
* RESPONSE_URL_FORMAT - a formatted string containing the response url

For the RESPONSE_URL_FORMAT the default value is "${SCHEME}://${HOST}/message.html?${MESSAGE}"
SCHEME and HOST are relative to the current request. MESSAGE is the url-encoded randomly selected item
from your messages list.

The RESPONSE_URL needs to be an absolute url, and it does not need to live within the application.
i.e. for the "YOBIBLE" application, the response URL is:
https://www.bible.com/bible/111/${MESSAGE}

and the MESSAGE setting is a list of bible verses in the format that Youversion expects on their urls:
i.e. "john.3.16.niv|rom.8.28.niv"

The "Yo" endpoint for the service is "/yo" and the justyo service will append the username of the user
as a querysting parameter.

To test the service directly, you can use the "/go" endpoint instead.

"/about" will redirect to the URL specified in the "ABOUT" environment variable.
