// ===================================================
// RECESS
// RULE: Element selectors should not be overqualified
// ===================================================
// Copyright 2012 Twitter, Inc
// Licensed under the Apache License v2.0
// http://www.apache.org/licenses/LICENSE-2.0
// ===================================================

'use strict'

var util = require('../util')
  , RULE = {
      type: 'noOverqualifying'
    , exp: /\b[\w\-\_]+(?=#|\.)/
    , message: 'Element selectors should not be overqualified'
    }

var tree = require("less").tree;

function NoOverqualifying() {
    this._visitor = new tree.visitor(this);
    this.errors = [];
};

NoOverqualifying.prototype = {
    isReplacing: false,
    isPreEvalVisitor: false,
    run: function (root) {
        return this._visitor.visit(root);
    },
    visitRuleset: function (rulesetNode, visitArgs) {
        var i, j, env = {}, selectorCSS, path;
        for(i = 0; i < rulesetNode.paths.length; i++) {
            env.firstSelector = true;
            selectorCSS = "";
            path = rulesetNode.paths[i];
            for(j = 0; j < path.length; j++) {
                selectorCSS += path[j].toCSS(env);
                env.firstSelector = false;
            }
            if (RULE.exp.test(element.value)){
                this.errors.push({
                    type: RULE.type
                    , message: RULE.message
                    , index: path[0].index
                    , currentFileInfo: path[0].currentFileInfo
                    , info: selectorCSS.replace(RULE.exp, function ($1) { return $1.magenta })
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

module.exports = NoOverqualifying;