// ==========================================
// RECESS
// RULE: .js prefixes should not be styled
// ==========================================
// Copyright 2013 Twitter, Inc
// Licensed under the Apache License v2.0
// http://www.apache.org/licenses/LICENSE-2.0
// ==========================================

'use strict'

var util = require('../util')
  , RULE = {
      type: 'noJSPrefix'
    , exp: /^\.js\-/
    , message: '.js prefixes should not be styled'
    }

var tree = require("less").tree;

function NoJSPrefix() {
    this._visitor = new tree.visitor(this);
    this.errors = [];
};

NoJSPrefix.prototype = {
    isReplacing: false,
    isPreEvalVisitor: false,
    run: function (root) {
        return this._visitor.visit(root);
    },
    visitElement: function (element, visitArgs) {

        // continue to next element if no ID reference
        if (!RULE.exp.test(element.value)) return

        // set error object on defintion token
        this.errors.push({
            type: RULE.type
            , message: RULE.message
            , index: element.index - element.value.length
            , info: element.value.replace(RULE.exp, '.js-'.magenta)
        });
    },

    getErrors: function(data) {
        return this.errors
            .map(function(item) {
                var line, extract;

                // calculate line number for the extract
                line = util.getLine(item.index, data)
                extract = util.padLine(line)

                // highlight invalid styling of ID
                extract += item.info;

                item.line = line;
                item.extract = extract;
            });
    }
};

module.exports = NoJSPrefix;