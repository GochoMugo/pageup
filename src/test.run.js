/**
 * Test run: Lets eat our own dogfood
 *
 * The MIT License (MIT)
 * Copyright (c) 2015 GochoMugo <mugo@forfuture.co.ke>
 */


// built-in modules
import http from "http";


// npm-installed modules
import express from "express";
import tapeTest from "tape";


// own modules
import PageupTest from "./index";


// module variables
const app = express();
const server = http.Server(app);


// some simple routes
app.use("/200", function(req, res) {
  res.sendStatus(200);
});
app.use("/401", function(req, res) {
  res.sendStatus(401);
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
  file: "sample.*.json",
  timeout: 5000,
  description: {
    baseurl: "http://localhost:3000",
    endpoints: {
      "/401": 401,
    },
    ok: [
      "/",
    ],
  },
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
