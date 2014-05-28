/* jshint newcap:false */
/* global exports, require */

var _util = require('../util'),
    _controls = require('../controls'),
    rangy = require('../../vendor/rangy/core').api,

    Class = _util.Class,
    extend = _util.extend,
    _ = _util._,
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
            selection = editor.getSelection();

        if (selection.isCollapsed && editor.getTopNodes().length === 0) {
            return;
        }

        if (editor.filterTopNodeNames('blockquote').length > 0) {
            // Remove blockquote
            this.removeBlockquote();
        } else {
            // Insert blockquote
            this.insertBlockquote();
        }
        editor.showToolbar();
    },

    insertBlockquote: function() {
        var editor = this.toolbar.editor,
            nodeList = editor.filterTopNodeNames.apply(editor, editor.BLOCK_NODES),
            node = nodeList.length > 0 ? nodeList[0] : null,
            surroundingBlocks = editor.getSurroundingNodes(function(n) {
                return editor.BLOCK_NODES.indexOf(n.nodeName.toUpperCase()) !== -1;
            });

        if (surroundingBlocks.length > 0) {
            nodeList = surroundingBlocks;
        } else if (node) {
            nodeList = [node];
        } else {
            nodeList = editor.getSurroundingNodes();
        }

        // Expand selection to top nodes
        editor.setRange.apply(editor, nodeList);
        nodeList = editor.getSurroundingNodes();

        // Push nodes to blockquote
        var e = document.createElement('blockquote');
        nodeList[0].parentNode.insertBefore(e, nodeList[0]);
        _.each(nodeList, e.appendChild, e);

        // Set new range
        editor.setRange(e);
    },

    removeBlockquote: function() {
        var nodeList = this.toolbar.editor.filterTopNodeNames('blockquote'),
            selection = rangy.saveSelection();

        rangy.dom.replaceNodeByContents(nodeList[0]);
        rangy.restoreSelection(selection);
        rangy.removeMarkers(selection);
    }
});
