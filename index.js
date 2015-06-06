/**
 * status-code.
 * Give me a status code, HTTP Request
 *
 * The MIT License (MIT)
 * Copyright (c) 2015 GochoMugo <mugo@forfuture.co.ke>
 */


"use strict";


// built-in modules
var url = require("url");


// npm-installed modules
var _ = require("lodash");
var debug = require("debug")("pageup");
var readGlob = require("read-glob");
var request = require("superagent");


/**
 * Take an array of file paths, flattens it if nested and remove
 * duplicates
 *
 * @param <pathsArray> - {Array} array of file paths
 * @return {Array}
 */
function uniquePaths(pathsArray) {
  pathsArray = _.flatten(pathsArray, true);
  pathsArray = _.uniq(pathsArray);
  return pathsArray;
}


/**
 * Take an array of globs and combine them to one glob that can match
 * any of the targets of the initial globs
 *
 * @param <globsArray> - {Array} array of globs
 * @return {String} final glob
 */
function joinGlobs(globsArray) {
  var glob = globsArray.join("|");
  glob = "*(" + glob + ")";
  return glob;
}


/**
 * Take an array of strings and try convert them to JSON
 * Note: throws error (if a string can not be parsed to JSON)
 * Note: Fails fast (if string can NOT parsed to JSON)
 *
 * @param <array> - {Array} array of strings
 */
function stringArrayToJsonArray(array) {
  var jsonArray = [ ];
  for (var index = 0, tmp; index < array.length; index++) {
    tmp = JSON.parse(array[index]);
    jsonArray.push(tmp);
  }
  return jsonArray;
}


/**
 * Map absolute urls to statuses
 *
 * @param <contents> - {Array} array of test files
 * @return {Object} mapping of url: status
 */
function map(contents) {
  var mapping = { };
  contents.forEach(function(content) {
    var baseurl = content.baseurl;
    var endpoints = content.endpoints;
    if (endpoints) {
      for (var endpoint in endpoints) {
        var absUrl = url.resolve(baseurl, endpoint);
        var statusCode = endpoints[endpoint];
        mapping[absUrl] = statusCode;
      }
    }
    // for convenience
    var ok = content.ok;
    if (ok) {
      ok.forEach(function(endpoint) {
        var absUrl = url.resolve(baseurl, endpoint);
        mapping[absUrl] = 200;
      });
    }
  });
  return mapping;
}


/**
 * Build request objects
 *
 * @param <mapping> - {Object} mapping from `map()`
 * @param [options] - {Object} options to apply to requests
 * @return {Array} array of requests e.g.
 * [{ request: [Object], url: "http://localhost:8080/try", status: 200 }]
 */
function buildRequests(mapping, options) {
  var requests = [];
  for (var url in mapping) {
    var rawRequest = _.cloneDeep(request);
    rawRequest = rawRequest.get(url);
    if (options) {
        if (options.timeout) {
            rawRequest = rawRequest.timeout(options.timeout);
        }
    }
    requests.push({
      request: rawRequest,
      url: url,
      status: mapping[url]
    });
  }
  return requests;
}


/**
 * Send requests and run tester on the reponse status codes
 *
 * @param <requests> - {Object} requests from `buildRequests`
 * @param <tester> - {Function} tester(err, actual, expected, url)
 * @param <done> - {Function} done(err)
 */
function sendRequests(requests, tester, done) {
  var undone = requests.length;
  requests.forEach(function(req) {
    req.request.end(function(err, res) {
      err = (err && err.status) ? null : err;
      tester(err, res.status, req.status, req.url);
      if (--undone === 0) {
        return done();
      }
    }); // req.request.end
  }); // requests.forEach
}


exports = module.exports = (function() {
  /**
   * Constructor.
   *
   * @param [options] - {Object} passed to .configure as is
   * @return {PageupTest}
   */
  function PageupTest(options) {
    debug("creating new instance of Pageup Test");
    this._files = [];
    this._timeout = null;
    if (options) {
      this.configure(options);
    }
    return this;
  }

  /**
   * Configure the instance
   *
   * @param <options> - {Object} configurations
   * @return {this}
   */
  PageupTest.prototype.configure = function(options) {
    debug("configuring the test instance");
    if (options.file) {
      this._files.push(options.file);
    }
    if (options.files) {
      this._files.push(options.files);
    }
    this._timeout = options.timeout || this._timeout;
    return this;
  };

  /**
   * Run the PageupTest
   *
   * @param <tester> - {Function} tester function
   * @param <done> - {Function} done(err)
   */
  PageupTest.prototype.run = function(tester, done) {
    var _this = this;
    debug("obtaining unique file paths");
    var files = uniquePaths(this._files);
    debug("creating a general glob for matching all target files");
    var glob = joinGlobs(files);
    debug("reading any target files found");
    return readGlob(glob, "utf-8", function(err, contents) {
      if (err) {
        debug("errored reading files: %s", err);
        return done(err);
      }
      debug("converting all file contents to JSON");
      try {
        contents = stringArrayToJsonArray(contents);
      } catch (err) {
        debug("errored converting to json: %s", err);
        return done(err);
      }
      debug("creating a single url-status mapping");
      var mapping = map(contents);
      debug("building requests");
      var buildOptions = { timeout: _this._timeout };
      var requests = buildRequests(mapping, buildOptions);
      debug("sending off requests. REAL TESTING begins... " +
        "See you on the other side");
      return sendRequests(requests, tester, done);
    }); // return readGlob
  };

  return PageupTest;
})();
