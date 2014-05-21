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

// Editor
exports.editor = require('./lib/editor').editor;
require('./lib/editor-buttons');
