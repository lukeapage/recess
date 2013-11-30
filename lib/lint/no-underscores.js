// ==========================================================
// RECESS
// RULE: Underscores should not be used when naming selectors
// ==========================================================
// Copyright 2012 Twitter, Inc
// Licensed under the Apache License v2.0
// http://www.apache.org/licenses/LICENSE-2.0
// ==========================================================

'use strict'

var util = require('../util')
  , RULE = {
      type: 'noUnderscores'
    , exp: /_/g
    , message: 'Underscores should not be used when naming selectors'
    }

var tree = require("less").tree;

function NoUnderscores() {
    this._visitor = new tree.visitor(this);
    this.errors = [];
};

NoUnderscores.prototype = {
    isReplacing: false,
    isPreEvalVisitor: false,
    run: function (root) {
        return this._visitor.visit(root);
    },
    visitElement: function (element, visitArgs) {

        if (!RULE.exp.test(element.value)) return

        this.errors.push({
            type: RULE.type
            , message: RULE.message
            , currentFileInfo: element.currentFileInfo
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

module.exports = NoUnderscores;