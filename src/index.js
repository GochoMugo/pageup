/**
 * status-code.
 * Give me a status code, HTTP Request
 *
 * The MIT License (MIT)
 * Copyright (c) 2015 GochoMugo <mugo@forfuture.co.ke>
 */


// built-in modules
import url from "url";


// npm-installed modules
import _ from "lodash";
import Debug from "debug";
import readGlob from "read-glob";
import request from "superagent";


// add debug
const debug = Debug("pageup");


/**
 * Take an array of file paths, flattens it if nested and remove
 * duplicates
 *
 * @param  {Array} pathsArray - array of file paths
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
 * @param  {String[]} globsArray - array of globs
 * @return {String} final glob
 */
function joinGlobs(globsArray) {
  let glob = globsArray.join("|");
  glob = "*(" + glob + ")";
  return glob;
}


/**
 * Take an array of strings and try convert them to JSON
 * Note: throws error (if a string can not be parsed to JSON)
 * Note: Fails fast (if string can NOT parsed to JSON)
 *
 * @param  {String[]} array - array of strings
 * @return {String[]} array of valid JSON
 */
function stringArrayToJsonArray(array) {
  let jsonArray = [ ];
  for (let index = 0, tmp; index < array.length; index++) {
    tmp = JSON.parse(array[index]);
    jsonArray.push(tmp);
  }
  return jsonArray;
}


/**
 * Map absolute urls to statuses
 *
 * @param  {Array} contents - array of test files
 * @return {Object} mapping of url: status
 */
function map(contents) {
  let mapping = { };
  contents.forEach(function(content) {
    const baseurl = content.baseurl;
    const endpoints = content.endpoints;
    if (endpoints) {
      for (let endpoint in endpoints) {
        let absUrl = url.resolve(baseurl, endpoint);
        let statusCode = endpoints[endpoint];
        mapping[absUrl] = statusCode;
      }
    }
    // for convenience
    const ok = content.ok;
    if (ok) {
      ok.forEach(function(endpoint) {
        let absUrl = url.resolve(baseurl, endpoint);
        mapping[absUrl] = 200;
      });
    }
  });
  return mapping;
}


/**
 * Build request objects
 *
 * @param  {Object} mapping - mapping from `map()`
 * @param  {Object} [options] - options to apply to requests
 * @return {Array} array of requests e.g.
 *  [{ request: [Object], url: "http://localhost:8080/try", status: 200 }]
 */
function buildRequests(mapping, options) {
  var requests = [ ];
  for (let endpoint in mapping) {
    let rawRequest = _.cloneDeep(request);
    rawRequest = rawRequest.get(endpoint);
    if (options) {
        if (options.timeout) {
            rawRequest = rawRequest.timeout(options.timeout);
        }
    }
    requests.push({
      request: rawRequest,
      status: mapping[endpoint],
      url: endpoint,
    });
  }
  return requests;
}


/**
 * Send requests and run tester on the reponse status codes
 *
 * @param  {Object} requests - requests from `buildRequests`
 * @param  {Function} tester - tester(err, actual, expected, url)
 * @param  {Function} done - done(err)
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


export default class PageupTest {
  /**
   * Constructor.
   *
   * @param  {Object} [options] - passed to .configure as is
   * @return {PageupTest}
   */
  constructor(options) {
    debug("creating new instance of Pageup Test");
    this._files = [ ];
    this._description = null;
    this._timeout = null;
    if (options) {
      this.configure(options);
    }
    return this;
  }

  /**
   * Configure the instance
   *
   * @param  {Object} options - configurations
   * @return {this}
   */
  configure(options={}) {
    debug("configuring the test instance");
    if (options.file) {
      this._files.push(options.file);
    }
    if (options.files) {
      this._files.push.apply(this._files, options.files);
    }
    if (options.description) {
      this._description = options.description;
    }
    this._timeout = options.timeout || this._timeout;
    return this;
  }

  /**
   * Run the PageupTest
   *
   * @param  {Function} tester - tester function (err, actualStatus, expectedStatus, url)
   * @param  {Function} done - done(err)
   */
  run(tester, done) {
    const _this = this;

    let descriptions = [];

    if (_this._description) {
      debug("adding description from configurations");
      descriptions.push(_this._description);
    }

    if (!_this._files.length) {
      // invoke run if no description file is available
      return run();
    }

    debug("obtaining unique file paths");
    var files = uniquePaths(_this._files);

    debug("creating a general glob for matching all target files");
    var glob = joinGlobs(files);

    debug("reading any target files found");
    return readGlob(glob, "utf-8", function(readErr, contents) {
      if (readErr) {
        debug(`errored reading files: ${readErr}`);
        return done(readErr);
      }

      debug("converting all file contents to JSON");
      try {
        contents = stringArrayToJsonArray(contents);
      } catch (jsonErr) {
        debug(`errored converting to json: ${jsonErr}`);
        return done(jsonErr);
      }

      debug("registering descriptions from files");
      descriptions = descriptions.concat(contents);

      return run();
    }); // return readGlob

    function run() {
      debug("creating a single url-status mapping");
      var mapping = map(descriptions);

      debug("building requests");
      var buildOptions = { timeout: _this._timeout };
      var requests = buildRequests(mapping, buildOptions);

      debug("sending off requests. REAL TESTING begins... See you on the other side");
      return sendRequests(requests, tester, done);
    }
  }
}
