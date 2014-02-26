/* global rangy:true */
rangy.createCoreModule('RangyExtensions', [], function(api) {
    api.rangePrototype.getTopNodes = function() {
        var nodes = this.getNodes(null);

        if (nodes.length === 0) {
            return nodes;
        }

        var node,
            prev = null,
            result = [];

        for (var i=0; i<nodes.length; i++) {
            node = nodes[i];
            if (node.textContent !== this.toString()) {
                continue;
            }

            if (result.indexOf(node.parentNode) === -1 && node.parentNode !== prev) {
                result.push(node);
            }
            prev = node;
        }
        return result;
    };

    api.rangePrototype.getSurroundingNode = function() {
        var nodes = this.getTopNodes(),
            text = this.toString(),
            node = null;

        var invalidNodes =
            (nodes.length !== 1) ||
            (nodes[0].nodeType === 3 && this.toString() !== nodes[0].textContent);

        if (invalidNodes) {
            // last chance with selection ancestor
            var _node = this.commonAncestorContainer;
            if (_node && _node.textContent === text) {
                node = _node;
            }
        } else {
            node = nodes[0];
        }

        if (node === null) {
            return node;
        }

        while (text === node.parentNode.textContent) {
            node = node.parentNode;
        }

        return node;
    };

    api.rangePrototype.getContainer = function() {
        var node = this.getSurroundingNode();
        if (node && node !== this.commonAncestorContainer && node.parentNode.nodeType === 1) {
            return node.parentNode;
        }

        if (node === this.commonAncestorContainer) {
            node = node.parentNode;
        } else {
            node = this.commonAncestorContainer;
        }

        while (node.nodeType !== 1) {
            node = node.parentNode;
        }
        return node;
    };

    api.rangePrototype.replaceNodeByContents = function(node) {
        var content = this.getDocument().createDocumentFragment();

        for (var i=0; i<node.childNodes.length; i++) {
            content.appendChild(node.childNodes[i].cloneNode(true));
        }

        node.parentNode.replaceChild(content, node);
    };

    api.dom.getTopContainer = function(node) {
        // Returns top fully enclosing container for a node
        while (node.parentNode.childNodes.length === 1) {
            node = node.parentNode;
        }
        return node;
    };

    api.dom.hasParents = function(node, parents) {
        while ([document, document.body].indexOf(node) === -1) {
            if (parents.indexOf(node) !== -1) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    };
});
