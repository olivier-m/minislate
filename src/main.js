/* global require, exports */
exports.VERSION = '{{version}}';

// Rangy and extensions
var rangy = require('./vendor/rangy/core');
require('./vendor/rangy/dom');
require('./vendor/rangy/domrange');
require('./vendor/rangy/selectionsaverestore');
require('./vendor/rangy/wrappedrange');
require('./vendor/rangy/wrappedselection');
require('./lib/rangy-extensions');

exports.rangy = rangy.api;

exports.editor = require('./lib/editor').editor;
require('./lib/editor-buttons');
