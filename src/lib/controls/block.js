/* jshint newcap:false */
/* global exports, require */

var _util = require('../util'),
    _controls = require('../controls'),
    rangy = require('../../vendor/rangy/core').api,

    Class = _util.Class,
    extend = _util.extend,
    Button = _controls.Button;


// Base block (paragraph)
var Block = Class(Button, {
    tagList: [],
    tag: null,
    command: 'formatblock',
    defaults: extend({}, Button.prototype.defaults),

    isHighlighted: function() {
        return this.toolbar.editor.filterTopNodeNames.apply(
            this.toolbar.editor, this.tagList
        ).length > 0;
    },

    click: function() {
        if (this.command === 'formatblock') {
            this.toolbar.editor.exec(this.command, '<' + this.tag + '>');
        } else {
            this.toolbar.editor.exec(this.command);
        }
        this.toolbar.editor.showToolbar();
    }
});
exports.Block = Block;


exports.Paragraph = Class(Block, {
    tagList: ['p'],
    tag: 'p',
    command: 'formatblock',
    defaults: extend({}, Block.prototype.defaults, {
        label: '¶',
        title: 'Paragraph'
    })
});

// Titles (H1 -> H6)
for (var i=1; i<=6; i++) {
    var C = Class(Block, {
        tagList: ['h' + i],
        tag: 'h' + i,
        defaults: extend({}, Block.prototype.defaults, {
            label: 'H' + i,
            title: 'Title level ' + i
        })
    });
    exports['H' + i] = C;
}


// Preformated text
exports.Preformated = Class(Block, {
    tagList: ['pre'],
    tag: 'pre',
    defaults: extend({}, Block.prototype.defaults, {
        label: '<>',
        title: 'Code',
        fontAwesomeID: 'code'
    }),

    init: function() {
        Block.prototype.init.apply(this, arguments);
        var editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            // Activate tab in preformated blocks
            if (evt.which === 9 && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
                if (editor.filterTopNodeNames('pre').length > 0) {
                    evt.preventDefault();
                    editor.exec('insertHtml', '    ');
                }
            }
        });
    }
});


// Lists
var BaseList = Class(Block, {
    init: function() {
        Block.prototype.init.apply(this, arguments);
        var self = this,
            editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            if (evt.which === 9 && !evt.ctrlKey && !evt.metaKey) {
                var node = editor.filterTopNodeNames('li');
                if (node.length === 0) {
                    return;
                }
                node = node[0];
                if (node.parentNode.nodeName.toLowerCase() === self.tag) {
                    evt.preventDefault();
                    // TODO: this produces deprecated HTML code for nested lists. Should be fixed.
                    editor.exec(evt.shiftKey ? 'outdent' : 'indent');
                }
            }
        });
    }
});

exports.UnorderedList = Class(BaseList, {
    tagList: ['ul'],
    tag: 'ul',
    command: 'insertunorderedlist',
    defaults: extend({}, BaseList.prototype.defaults, {
        label: 'UL',
        title: 'Unordered list',
        fontAwesomeID: 'list-ul'
    })
});


exports.OrderedList = Class(BaseList, {
    tagList: ['ol'],
    tag: 'ol',
    command: 'insertorderedlist',
    defaults: extend({}, BaseList.prototype.defaults, {
        label: 'OL',
        title: 'Ordered list',
        fontAwesomeID: 'list-ol'
    })
});


// Blockquotes
exports.Blockquote = Class(Block, {
    tagList: ['blockquote'],
    defaults: extend({}, Block.prototype.defaults, {
        label: 'Quote',
        title: 'Quote',
        fontAwesomeID: 'quote-right'
    }),

    init: function() {
        Block.prototype.init.apply(this, arguments);

        // Leave blockquote after an empty paragraph
        var editor = this.toolbar.editor;
        editor.on('keyup', function(evt) {
            if (evt.which === 13 && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
                var node = editor.filterTopNodeNames('blockquote');
                if (node.length === 0 || !editor.getSelection().isCollapsed) {
                    return;
                }

                var parent = node[0];
                node = editor.filterTopNodeNames('p');
                if (node.length === 0) {
                    return;
                }

                node = node[0];
                if(node.previousSibling && node.previousSibling.textContent === '') {
                    node.previousSibling.parentNode.removeChild(node.previousSibling);
                    parent.parentNode.insertBefore(node, parent.nextSibling);
                    editor.setRange(node.firstChild);
                    editor.getRange().collapse();
                    editor.showToolbar();
                }
            }
        });
    },

    click: function() {
        var editor = this.toolbar.editor,
            selection = editor.getSelection(),
            nodeList = editor.getTopNodes(),
            quoteNodes = editor.filterTopNodeNames('blockquote');

        if (selection.isCollapsed && nodeList.length === 0) {
            return;
        }

        if (quoteNodes.length > 0) {
            // Remove blockquote
            selection = rangy.saveSelection();
            rangy.dom.replaceNodeByContents(quoteNodes[0]);
            rangy.restoreSelection(selection);
            rangy.removeMarkers(selection);
        } else {
            // Insert blockquote
            // TODO: improve this
            var node = nodeList[nodeList.length - 1];
            if (node) {
                nodeList = [node];
            } else {
                nodeList = selection.getSurroundingNodes();
            }

            // Expand selection to top nodes
            editor.setRange.apply(editor, nodeList);

            // // Push nodes to blockquote
            var e = document.createElement('blockquote');
            nodeList[0].parentNode.insertBefore(e, nodeList[0]);
            for (var i=0; i<nodeList.length; i++) {
                e.appendChild(nodeList[i]);
            }

            // Select new node
            editor.setRange(e);
        }
        editor.showToolbar();
    }
});
