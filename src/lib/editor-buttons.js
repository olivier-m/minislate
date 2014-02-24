/* global Editor:true */

Editor.getInlineButtonSpec = function(command, tagList, options) {
    options.isHighlighted = function() {
        return this.editor.filterSelectionNodeName.apply(this.editor, tagList).length > 0;
    };

    options.isVisible = function() {
        return !this.editor.getRange().collapsed || this.options.isHighlighted.call(this);
    };

    options.click = function() {
        var editor = this.editor,
            info = this.editor.getRangeInfo();

        if (info.range.collapsed) {
            var node = editor.filterSelectionNodeName.apply(editor, tagList);
            if (node.length === 0) {
                return;
            }
            node = node[0];
            editor.setRange(node);
        }

        editor.exec(command);
        editor.showToolbar();
    };

    return options;
};


Editor.getBlockButtonSpec = function(tag, tagList, options) {
    options.isHighlighted = function() {
        return this.editor.filterSelectionNodeName.apply(this.editor, tagList).length > 0;
    };

    options.isVisible = function() {
        return true;
    };

    var command = 'formatblock';
    if (typeof(options.command) !== 'undefined') {
        command = options.command;
        delete(options.command);
    }

    options.click = function() {
        this.editor.exec(command, '<' + tag + '>');
        this.editor.showToolbar();
    };
    return options;
};


// Paragraph
Editor.addDefaultButton('P', Editor.getBlockButtonSpec('p', ['p'], {
    label: '¶',
    title: 'Paragraph',
    className: 'p'
}));


// Titles
var levels = [1,2,3,4];
for (var i=0; i<levels.length; i++) {
    Editor.addDefaultButton('H' + levels[i], Editor.getBlockButtonSpec('h' + levels[i], ['h' + levels[i]], {
        title: 'Title level ' + levels[i],
        className: 'h' + levels[i]
    }));
}


// Preformated text
Editor.addDefaultButton('pre', Editor.getBlockButtonSpec('pre', ['pre'], {
    label: '<>',
    title: 'Preformated text',
    className: 'pre'
}));


// Unordered list
Editor.addDefaultButton('ul', Editor.getBlockButtonSpec('ul', ['ul'], {
    label: 'UL',
    title: 'Unordered list',
    className: 'ul',
    faId: 'list-ul',
    command: 'insertunorderedlist'
}));


// Ordered list
Editor.addDefaultButton('ol', Editor.getBlockButtonSpec('ol', ['ol'], {
    label: 'OL',
    title: 'Ordered list',
    className: 'ol',
    faId: 'list-ol',
    command: 'insertorderedlist'
}));


// Bold
Editor.addDefaultButton('B', Editor.getInlineButtonSpec('bold', ['b', 'strong'], {
    title: 'Bold',
    className: 'bold',
    faId: 'bold'
}));


// Italic
Editor.addDefaultButton('I', Editor.getInlineButtonSpec('italic', ['i', 'em'], {
    title: 'Italic',
    className: 'italic',
    faId: 'italic'
}));


// Underline
Editor.addDefaultButton('U', Editor.getInlineButtonSpec('underline', ['u', 'ins'], {
    title: 'Underline',
    className: 'underline',
    faId: 'underline'
}));


// Strike
Editor.addDefaultButton('S', Editor.getInlineButtonSpec('strikeThrough', ['strike', 'del'], {
    title: 'Strike',
    className: 'strike',
    faId: 'strikethrough'
}));


// Link
Editor.addDefaultButton('Link', {
    base_title: 'Link',
    title: '',
    className: 'link',
    faId: 'link',
    isHighlighted: function() {
        var title = this.options.base_title;
        var nodes = this.editor.filterSelectionNodeName('a');
        if (nodes.length > 0) {
            title += ': ' + nodes[0].href;
        }
        this.element.setAttribute('title', title);
        return nodes.length > 0;
    },
    isVisible: function() {
        return !this.editor.getRange().collapsed || this.options.isHighlighted.call(this);
    },
    click: function() {
        var self = this,
            editor = this.editor,
            info = editor.getRangeInfo();

        var node = editor.filterSelectionNodeName('a');
        if (info.range.collapsed && node.length === 0) {
            return;
        }

        node = node.length === 0 ? null : node[0];
        if (info.range.collapsed) {
            this.editor.setRange(node);
        }

        var selection = editor.rangy.saveSelection();
        this.editor.showDialog(function() {
            input.focus();
        });

        var dialog = this.editor.dialog;
        var label = document.createElement('label');
        label.appendChild(document.createTextNode('URL: '));
        var input = document.createElement('input');
        input.setAttribute('size', 30);
        input.setAttribute('type', 'text');
        label.appendChild(input);
        dialog.appendChild(label);

        if (node) {
            input.value = node.getAttribute('href');
        }

        input.addEventListener('keyup', function(evt) {
            evt.stopImmediatePropagation();
            var ENTER = 13,
                ESC = 27;

            if ([ENTER, ESC].indexOf(evt.which) === -1) {
                return;
            }

            // Restore selection and remove dialog
            self.options.restoreSelection.call(self, selection);

            if (evt.which === ESC) {
                // Stop on ESC
                return;
            }

            // ENTER key
            self.options.saveLink.call(self, node, evt.target.value);
        });
    },
    restoreSelection: function(selection) {
        var r = this.editor.rangy;
        r.restoreSelection(selection);
        r.removeMarkers(selection);
        this.editor.showToolbar();
    },
    saveLink: function(node, url) {
        var editor = this.editor,
            info = editor.getRangeInfo();

        if (node) {
            if (!url) { //  Remove link
                var selection = editor.rangy.saveSelection();
                info.range.replaceNodeByContents(node, true);
                editor.rangy.restoreSelection(selection);
                editor.rangy.removeMarkers(selection);
            } else {  // Update link
                node.setAttribute('href', url);
                editor.setRange(node);
            }
        } else if (url) { //  New link
            node = document.createElement('a');
            node.setAttribute('href', url);
            var contents = info.range.cloneContents();
            for (var i=0; i<contents.childNodes.length; i++) {
                node.appendChild(contents.childNodes[i].cloneNode(true));
            }
            info.range.deleteContents();
            info.range.insertNode(node);
            editor.setRange(node);
        }
        editor.showToolbar();
    }
});


// Image
Editor.addDefaultButton('Image', {
    title: 'Image',
    className: 'image',
    faId: 'picture-o'
});


// Oembed
Editor.addDefaultButton('Embed', {
    title: 'Embeded',
    className: 'oembed',
    faId: 'youtube-play'
});
