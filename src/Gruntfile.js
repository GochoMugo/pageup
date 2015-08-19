/**
 * Run script for Grunt, task runner
 *
 * The MIT License (MIT)
 * Copyright (c) 2015 GochoMugo <mugo@forfuture.co.ke>
 */


import load from "load-grunt-tasks";


export default function(grunt) {
  load(grunt);

  grunt.initConfig({
    eslint: {
      all: ["src/**/*.js"],
    },
    tape: {
      options: {
        pretty: true,
      },
      all: ["test.*.js"],
    },
  });

  grunt.registerTask("test", ["eslint", "tape"]);
}
