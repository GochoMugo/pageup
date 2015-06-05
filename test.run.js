/**
 * Test run: Lets eat our own dogfood
 *
 * The MIT License (MIT)
 * Copyright (c) 2015 GochoMugo <mugo@forfuture.co.ke>
 */


"use strict";


// built-in modules
var http = require("http");


// npm-installed modules
var express = require("express");
var tapeTest = require("tape");


// own modules
var PageupTest = require("./index");


// module variables
var app = express();
var server = http.Server(app);


// some simple routes
app.use("/200", function(req, res) {
  res.sendStatus(200);
});
app.use("/404", function(req, res) {
  res.sendStatus(404);
});
app.use("/500", function(req, res) {
  res.sendStatus(500);
});
app.use("/", function(req, res) {
  res.sendStatus(200);
});


// create a new test
var pageupTest = new PageupTest({
  file: "sample.description.json"
});


// spinning up server
server.listen(3000, function() {
  // run our tests
  pageupTest.run(function(err, actual, expected, url) {
    tapeTest(url, function(t) {
      t.error(err);
      t.equal(actual, expected, "status code mismatch");
      t.end();
    });
  }, function() {
    server.close();
  });
});

