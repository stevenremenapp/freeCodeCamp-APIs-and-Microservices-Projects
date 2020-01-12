// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/api/timestamp/:date_string?", function(req, res) {
  let date;
  const numbersOnlyRegex = /^[0-9]*$/;
  // set date variable based on param
  if (req.params.date_string === undefined) {
    date = new Date();
  } else if (req.params.date_string.match(numbersOnlyRegex)) {
    date = new Date(Number(req.params.date_string));
  } else {
    date = new Date(req.params.date_string);
  };
  // check and return JSON based on if param is valid
  if (date instanceof Date && isFinite(date)) {
    res.json({
      "unix": date.getTime(),
      "utc": date.toUTCString()
    });
  } else {
    res.json({
      "error": "Invalid Date"
    })
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});