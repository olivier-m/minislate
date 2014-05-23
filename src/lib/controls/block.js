/* jshint newcap:false */
/* global exports, require */

var _util = require('../util'),
    _controls = require('../controls'),

    Class = _util.Class,
    extend = _util.extend,
    Button = _controls.Button;


// Base block (paragraph)
var Block = Class(Button, {
    tagList: ['p'],
    tag: 'p',
    command: 'formatblock',
    defaults: extend({}, Button.prototype.defaults, {
        label: '¶',
        title: 'Paragraph'
    }),

    isHighlighted: function() {
        return this.toolbar.editor.filterSelectionNodeName.apply(
            this.toolbar.editor, this.tagList
        ).length > 0;
    },

    click: function() {
        if (this.command == 'formatblock') {
            this.toolbar.editor.exec(this.command, '<' + this.tag + '>');
        } else {
            this.toolbar.editor.exec(this.command);
        }
        this.toolbar.editor.showToolbar();
    }
});
exports.Block = Block;


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
var Preformated = Class(Block, {
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
                var filter = editor.filterSelectionNodeName('pre');
                if (filter.length > 0) {
                    evt.preventDefault();
                    editor.exec('insertHtml', '    ');
                }
            }
        });
    }
});
exports.Preformated = Preformated;


var UnorderedList = Class(Block, {
    tagList: ['ul'],
    tag: 'ul',
    command: 'insertunorderedlist',
    defaults: extend({}, Block.prototype.defaults, {
        label: 'UL',
        title: 'Unordered list',
        fontAwesomeID: 'list-ul'
    })
});
exports.UnorderedList = UnorderedList;


var OrderedList = Class(Block, {
    tagList: ['ol'],
    tag: 'ol',
    command: 'insertorderedlist',
    defaults: extend({}, Block.prototype.defaults, {
        label: 'OL',
        title: 'Ordered list',
        fontAwesomeID: 'list-ol'
    })
});
exports.OrderedList = OrderedList;
