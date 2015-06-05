/**
 * Run script for Grunt, task runner
 *
 * The MIT License (MIT)
 * Copyright (c) 2015 GochoMugo <mugo@forfuture.co.ke>
 */


"use strict";


exports = module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    eslint: {
      all: ["*.js"]
    },
    tape: {
      options: {
        pretty: true
      },
      all: ["test.*.js"]
    }
  });

  grunt.registerTask("test", ["eslint", "tape"]);
};

