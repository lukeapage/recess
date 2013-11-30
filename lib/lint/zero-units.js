// ================================================
// RECESS
// RULE: No need to specify units when a value is 0
// ================================================
// Copyright 2012 Twitter, Inc
// Licensed under the Apache License v2.0
// http://www.apache.org/licenses/LICENSE-2.0
// ================================================

'use strict'

var util = require('../util')
  , units = [
      '%'
    , 'in'
    , 'cm'
    , 'mm'
    , 'em'
    , 'ex'
    , 'pt'
    , 'pc'
    , 'px'
    ]
  , RULE = {
      type: 'zeroUnits'
    , exp: new RegExp('\\b0\\s?(' + units.join('|') + ')')
    , message: 'No need to specify units when a value is 0'
    }

var tree = require("less").tree;

function NoZeroUnits() {
    this._visitor = new tree.visitor(this);
    this.errors = [];
};

NoZeroUnits.prototype = {
    isReplacing: false,
    isPreEvalVisitor: false,
    run: function (root) {
        return this._visitor.visit(root);
    },
    visitDimension: function (dimension, visitArgs) {

        if (dimension.value !== 0) { return; }

        var unit = dimension.unit.toCSS({});
        for(var i = 0; i < units.length; i++) {
            if (units[i] === unit) {
                this.errors.push({
                    type: RULE.type
                    , message: RULE.message
                    , currentFileInfo: element.currentFileInfo
                    , index: element.index - element.value.length
                    , info: element.value.replace(RULE.exp, '.js-'.magenta)
                });
            }
        }
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

module.exports = NoZeroUnits;