/**
 * Terminal Interface
 */


// npm-installed modules
import Debug from "debug";
import symbols from "log-symbols";
import out from "cli-output";


// own modules
import PageupTest from "./index";


// module variables
const debug = Debug("pageup:cli");
let descriptions = [];
let test;


debug("generating descriptions from command-line arguments");
for (let index = 2; index < process.argv.length; index++) {
  let arg = process.argv[index];
  let hasStatus = arg.match(/^(\d{3})=/);
  let status = hasStatus ? hasStatus[1] : 200;
  let baseurl = hasStatus ? arg.match(/=(.+)$/)[1] : arg;

  if (!baseurl) {
    out.warn(`ignoring '${arg}' as its format is invalid`);
    continue;
  }

  if (!/\w+:\/\//.test(baseurl)) {
    baseurl = "http://" + baseurl;
  }

  descriptions.push({
    baseurl,
    endpoints: {
      "/": Number(status),
    },
  });
}


if (!descriptions.length) {
  out.error("no tests to run. Exiting!");
  process.exit(1); // eslint-disable-line no-process-exit
}


debug("creating a new pageup test harness");
test = new PageupTest({
  descriptions,
});


debug("running tests");
test.run(function(err, actual, expected, url) {
  if (err) {
    return out.error(`[${url}] errored: ${err}`);
  }

  if (expected !== actual) {
    return console.error(`${symbols.error} (${actual}) ${url} :: expected ${expected}`);
  }

  return console.log(`${symbols.success} (${actual}) ${url}`);
}, function(err) {
  if (err) {
    process.exit(1); // eslint-disable-line no-process-exit
  }
});
