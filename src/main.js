/* global require, exports */
exports.VERSION = '{{version}}';

// Rangy and extensions
exports.rangy = require('./vendor/rangy/core').api;
require('./vendor/rangy/dom');
require('./vendor/rangy/domrange');
require('./vendor/rangy/selectionsaverestore');
require('./vendor/rangy/wrappedrange');
require('./vendor/rangy/wrappedselection');
require('./lib/rangy-extensions');

// Utils
exports.extend = require('./lib/util').extend;
exports.tr = require('./lib/util').tr;
exports.Class = require('./lib/util').Class;
exports.HtmlCleaner = require('./lib/html-cleaner').HtmlCleaner;

// Editor
exports.Editor = require('./lib/editor').Editor;
exports.controls = require('./lib/editor').controls;
exports.simpleEditor = require('./lib/editor').simpleEditor;
