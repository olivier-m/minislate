/* jshint newcap:false */
/* global exports, require */

var _util = require('../util'),
    _controls = require('../controls'),
    rangy = require('../../vendor/rangy/core').api,

    Class = _util.Class,
    extend = _util.extend,
    Button = _controls.Button,
    tr = _util.tr,
    Dialog = _controls.Dialog;


var ImageDialog = Class(Dialog, {
    show: function(node) {
        var control = this.control,
            editor = this.toolbar.editor,
            selection = rangy.saveSelection();

        editor.showDialog(function() {
            input.focus();
        });

        var input = this.addTextField('URL: ', {
            escape: function() {
                editor.restoreSelection(selection);
            },
            enter: function(evt) {
                editor.restoreSelection(selection);
                control.saveImage(node, evt.target.value);
            }
        });

        this.addButton('Save', {
            fontAwesomeID: 'check',
            click: function(evt) {
                evt.stopImmediatePropagation();
                editor.restoreSelection(selection);
                control.saveImage(node, input.value);
            }
        });

        if (node) {
            input.value = node.getAttribute('src');
        }
    }
});

exports.Image = Class(Button, {
    defaults: extend({}, Button.prototype.defaults, {
        label: 'IMG',
        title: tr('Image'),
        fontAwesomeID: 'picture-o'
    }),

    init: function() {
        Button.prototype.init.apply(this, arguments);

        // Select image when clicked
        var editor = this.toolbar.editor;
        editor.on('click', function(evt) {
            if (evt.target.tagName.toLowerCase() === 'img') {
                editor.setRange(evt.target);
                editor.showToolbar();
            }
        });
    },

    isHighlighted: function() {
        return this.toolbar.editor.filterTopNodeNames('img').length > 0;
    },

    click: function() {
        var editor = this.toolbar.editor,
            node = editor.filterTopNodeNames('img');

        node = node.length === 0 ? null : node[0];
        (new ImageDialog(this)).show(node);
    },

    saveImage: function(node, url) {
        var editor = this.toolbar.editor,
            range = editor.getRange();

        if (node && url) {
            node.setAttribute('src', url);
            editor.setRange(node);
        } else if (url) {
            node = document.createElement('img');
            node.setAttribute('src', url);
            range.deleteContents();
            range.insertNode(node);
            editor.cleanBlock(node.parentNode);
            editor.setRange(node);
        }
        editor.showToolbar();
        return node;
    }
});


exports.Oembed = Class(Button, {
    defaults: extend({}, Button.prototype.defaults, {
        label: 'Embeded',
        title: tr('Embeded content'),
        fontAwesomeID: 'youtube-play'
    }),

    click: function() {
        window.alert('No implemented yet :)');
    }
});
