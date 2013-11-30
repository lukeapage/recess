// ==========================================
// RECESS
// CORE: The core class definition
// ==========================================
// Copyright 2012 Twitter, Inc
// Licensed under the Apache License v2.0
// http://www.apache.org/licenses/LICENSE-2.0
// ==========================================

'use strict'

var _ = require('underscore')
  , colors = require('colors')
  , less = require('less')
  , util = require('./util')
  , path = require('path')
  , fs = require('fs')

// core class defintion
function RECESS(path, options, callback) {
  this.path = path
  this.output = []
  this.errors = []
  this.options = _.extend({}, RECESS.DEFAULTS, options)
  path && this.read()
  this.callback = callback
}

// instance methods
RECESS.prototype = {

  constructor: RECESS

, log: function (str, force) {

    if (this.options.stripColors) str = str.stripColors

    // if compiling only write with force flag
    if (!this.options.compile || force) {
      this.options.cli ? console.log(str) : this.output.push(str)
    }

  }

, read: function () {
    var that = this

    // try to read data from path
    fs.readFile(this.path, 'utf8', function (err, data) {

      //  if err, exit with could not read message
      if (err) {
        that.errors.push(err)
        that.log('Error reading file: '.red + String(that.path).grey + '\n', true)
        return that.callback && that.callback()
      }

      // set instance data
      that.data = data

      // parse data
      that.parse()

    })
  }

, parse: function () {
    var that = this
      , options = {
          paths: [path.dirname(this.path)].concat(this.options.includePath)
        , optimization: 0
        , filename: this.path && this.path.replace(/.*(?=\/)\//, '')
        }

    if (options.compile) {
        // activate all relevant compilers
        Object.keys(this.options).forEach(function (key) {
            that.options[key]
                && RECESS.COMPILERS[key]
            && RECESS.COMPILERS[key].on.call(that)
        });
    }
    else
    {
        // lint
    }

    // try to parse with less parser
    try {

      // instantiate new parser with options
      new less.Parser(options)

        // parse data into tree
        .parse(this.data, function (err, tree) {

          if (err) {
            // push to errors array
            that.errors.push(err)

            if (err.type == 'Parse') {
              // parse error
              that.log("Parser error".red + (err.filename ? ' in ' + err.filename : '') + '\n')
            } else {
              // other exception
              that.log(String(err.name).red + ": " + err.message + ' of ' + String(err.filename).yellow + '\n')
            }

            // if extract - then log it
            err.extract && err.extract.forEach(function (line, index) {
              that.log(util.padLine(err.line + index) + line)
            })

            // add extra line for readability after error log
            that.log(" ")

            // exit with callback if present
            return that.callback && that.callback()
          }

          // set definitions to parse tree
          that.css = tree.toCSS(options);

          // validation defintions
          that.options.compile ? that.compile() : that.validate()
        })

    } catch (err) {

      // less exploded trying to parse the file (╯°□°）╯︵ ┻━┻
      // push to errors array
      that.errors.push(err)

      // log a message trying to explain why
      that.log(
          "Parse error".red
        + ": "
        + err.message
        + " on line "
        + util.getLine(err.index, this.data)
      )

      // exit with callback if present
      this.callback && this.callback()
    }
  }

, compile: function () {
    var that = this
      , key
      , css = that.css;

    // minify with cssmin
    if (that.options.compress) css = require('./min').compressor.cssmin(css)

    // cleanup trailing newlines
    css = css.replace(/[\n\s\r]*$/, '')

    // output css
    this.log(css, true)

    // callback and exit
    this.callback && this.callback()
  }

, validate: function () {
    var errors = []
      , key

    // iterate over instance options
    for (key in this.options) {

      // if option has a validation, then we test it
      if (this.options[key] && RECESS.RULES[key]) {
        errors = errors.concat(RECESS.RULES[key].getErrors())
      }
    }

    // exit with failed flag to validateStatus
    this.validateStatus(errors)
  }

, validateStatus: function (fails) {
    var that = this
      , formatter

    if (fails.length) {

      if (!this.options.noSummary) {
        // log file overview
        this.log('FILE: ' + this.path.cyan)
        this.log('STATUS: ' + 'Busted'.magenta)
        this.log('FAILURES: ' + (fails + ' failure' + (fails > 1 ? 's' : '')).magenta + '\n')
      }

      if (this.options.format && this.options.format == 'compact') {
        formatter = function (err) {
          that.log(that.path + ':' + err.line + ':' + err.message)
        }
      } else {
        formatter = function (err) {
          that.log(err.message)
          err.extract && that.log(err.extract + '\n')
        }
      }

      // iterate through each definition
      this.definitions.forEach(function (def) {

        // if there's an error, log the error and optional err.extract
        def.errors
          && def.errors.length
          && def.errors.forEach(formatter)
      })

    } else {
      // it was a success - let the user know!
      this.log('FILE: ' + this.path.cyan)
      this.log('STATUS: ' + 'Perfect!\n'.yellow)
    }

    // callback and exit
    this.callback && this.callback()
  }

}

// import validation rules
RECESS.RULES = {}

fs.readdirSync(path.join(__dirname, 'lint')).forEach(function (name) {
  var camelName = name
    .replace(/(\-[a-z])/gi, function ($1) { return $1.toUpperCase().replace('-', '') })
    .replace(/\.js$/, '')
  RECESS.RULES[camelName] = require(path.join(__dirname, 'lint', name))
})

// import compilers
RECESS.COMPILERS = {}

fs.readdirSync(path.join(__dirname, 'compile')).forEach(function (name) {
  var camelName = name
    .replace(/(\-[a-z])/gi, function ($1) { return $1.toUpperCase().replace('-', '') })
    .replace(/\.js$/, '')
  RECESS.COMPILERS[camelName] = require(path.join(__dirname, 'compile', name))
})

RECESS.COMPILERS["inlineImages"] = require("less-plugins").InlineImages;

// export class
module.exports = RECESS