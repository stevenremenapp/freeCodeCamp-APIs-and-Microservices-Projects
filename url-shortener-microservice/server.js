'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require("dns");

const cors = require('cors');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

// Connect to database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, err => {
  err ? console.log(err) : console.log("connected to db!")
});

app.use(cors());
app.use(bodyParser.urlencoded({extended: 'false'}));
app.use('/public', express.static(process.cwd() + '/public'));

// Set up Mongoose schemas and models
let urlSchema = new mongoose.Schema(
  {
  url: { type: String, required: true },
  shortUrl: { type: Number, required: true }
  },
  { collection: 'urls' }
);
let Url = mongoose.model('Url', urlSchema, 'urls');

let urlCounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    sequence_value: { type: Number, required: true }
  },
  { collection: 'urlCounters' }
);
let UrlCounter = mongoose.model('UrlCounter', urlCounterSchema, 'urlCounters');

// API routes
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get("/api/shorturl/:shortUrlId", async (req, res) => {
  try {
    // look up shortUrl in db
    let address = await Url.findOne({ shortUrl: req.params.shortUrlId });
    console.log('address', address);
    // redirect to shorturl initial url address
    res.redirect(address.url);
  } catch (err) {
    res.json({ error: "invalid URL" });
  }
});

app.post("/api/shorturl/new", (req, res) => {
  // Get domain name for dns.lookup
  const protocolRegex = /^https?:\/\//;
  const initialUrl = req.body.url;
  let domain;
  if (protocolRegex.test(initialUrl)) {
    let tempUrl = initialUrl.slice(initialUrl.indexOf("//") + 2);
    domain = tempUrl.indexOf("/") > 0 ? tempUrl.slice(0, tempUrl.indexOf("/")) : tempUrl;
  } else {
    domain = initialUrl.indexOf("/") > 0 ? initialUrl.slice(0, initialUrl.indexOf("/")) : initialUrl;
  }
  
  // shortUrl autoincrement function
  async function getNextSequenceValue(sequenceName){

   const sequenceDocument = await UrlCounter.findOneAndUpdate(
      {_id: sequenceName },
      { $inc: { sequence_value: 1 }},
      { new: true }
   );
   return sequenceDocument.sequence_value;
  };
  
  // dns lookup
  dns.lookup(domain, async (err, address, family) => {
    if (err) {
      console.log(err);
      res.json({ error: "invalid URL" });
    } else {
        try {
          // check db for initialUrl; if found return json
          let urlFound = await Url.findOne({ url: initialUrl });
          // console.log(urlFound.shortUrl);
          // return;
          if (urlFound) {
            res.json({ original_url: initialUrl, short_url: urlFound.shortUrl });
          } else {
            // else save new document to db and return that json
            // get next incremented number for shortUrl
            let sequenceValue = await getNextSequenceValue("shortUrlId");
            // console.log(sequenceValue);
            // create url record for initialUrl and return json
            let urlAdded = await Url.create({ url: initialUrl, shortUrl: sequenceValue });
            res.json({ original_url: urlAdded.url, short_url: urlAdded.shortUrl });
          }
        } catch(err) {
          console.log(err);
        }
    }
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});