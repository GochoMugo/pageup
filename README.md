
# pageup

> Do Check If My Page Is UP

An **easy** way to **test** if your page is available in Node.js, without tying you to any testing framework out there.


## toc:

1. [installation](#install)
1. [API](#api)
1. [debugging](#debugging)
1. [license](#license)


<a name="install"></a>
## installation:

```bash
⇒ npm install pageup
```


<a name="api"></a>
## API:

```js
var PageupTest = require("pageup");
```

### new PageupTest(config)

Creates a new test harness.

* `config` (Object): passed as it to [`PageupTest#configure`](#configure)

Example:

```js
var pageupTest = new PageupTest({
  file: "test-description.json"
});
```


<a name="configure"></a>
### pageupTest.configure(config)

Configures the test harness.

* `config` (Object): test configurations. Properties include:
    * `files` (Array): array of absolute filepaths
    * `file` (String): an absolute filepath.

If both `config.files` and `config.file` are provided, `config.file` will be appended to `config.files` (if **not** found in `config.files`). See [`test description`](#description) for how the file should be formatted.

Example:

```js
pageupTest.configure({
    files: ["server.one.js", "server.two.js"]
});
```


### pageupTest.run(tester, done)

Runs your tests.

* `tester` (Function): Test the status code
    * **signature**: `tester(err, actual, expected, url)`
    * `err` (Error): truthy, if an error occurring making request such as network failures. **Note**: `404`s and other status codes usually regarded as errors are not passed as `err`. **Status codes do not signify anything specific to pageup.**
    * `actual` (Integer): response status code e.g. `200`
    * `expected` (Integer): expected status code e.g. `404`
    * `url` (String): url the current request was sent to. e.g. `"http://localhost:8080/endpoint"`
* `done` (Function): called when all requests are done
    * **signature**: `done()`

Example:

```js
var assert = require("assert");

pageupTest.run(function(err, actual, expected, url) {
    assert.ok(!!err, "error making request to " + url);
    assert.equal(actual, expected, "failed test!");
}, function() {
    console.log("we are done");
});
```


<a name="description"></a>
### test description:

Tests are described using valid `.json` files. The following are the **required** properties:

* `baseurl` (String): base url to use to resolve endpoints

These properties are **optional**:

* `endpoints` (Object): mapping of endpoints to expected response status codes
* `ok` (Array): an array of endpoints, that we expect status code `200`

Sample description file:

```json
{
  "baseurl": "http://localhost:8080",
  "endpoints": {
    "/200": 200,
    "/404": 404,
    "/500": 500
  },
  "ok": [
    "/"
  ]
}
```


<a name="debugging"></a>
## debugging:

To run your tests with debugging output of pageup enabled, set the `DEBUG` environment variable to `pageup`.

For example, in *nix:

```bash
⇒ DEBUG="pageup"
```


<a name="license"></a>
## license:

**The MIT License (MIT)**

Copyright (c) 2015 GochoMugo <mugo@forfuture.co.ke>
