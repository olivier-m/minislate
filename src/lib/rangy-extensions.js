/* global require:true */
var rangy = require('../vendor/rangy/core');

rangy.api.createCoreModule('RangyExtensions', [], function(api) {
    //
    // Selection extensions
    //
    api.selectionPrototype.getBoundaryNodes = function() {
        var startNode, startOffset, endNode, endOffset;
        if (!this.isBackwards()) {
            startNode = this.anchorNode;
            startOffset = this.anchorOffset;
            endNode = this.focusNode;
            endOffset = this.focusOffset;
        } else {
            startNode = this.focusNode;
            startOffset = this.focusOffset;
            endNode = this.anchorNode;
            endOffset = this.anchorOffset;
        }

        // Push & pull boundaries
        if (startNode.nodeType === 3 && startNode.nextSibling && startNode.length === startOffset) {
            startNode = startNode.nextSibling;
        } else if (startNode.nodeType === 1 && startNode.childNodes.length > startOffset) {
            startNode = startNode.childNodes[startOffset];
        }
        while (startNode.firstChild && startNode.firstChild.nodeType === 1) {
            startNode = startNode.firstChild;
        }

        if (endNode.nodeType === 3 && endNode.previousSibling && endOffset === 0) {
            endNode = endNode.previousSibling;
        } else if (endOffset > 0 && endNode.nodeType === 1 && endNode.childNodes.length > 0) {
            endNode = endNode.childNodes[endOffset - 1];
        }
        while (endNode.lastChild && endNode.lastChild.nodeType === 1) {
            endNode = endNode.lastChild;
        }


        // Pull boundaries outside text nodes
        startNode = startNode && startNode.nodeType !== 1 ? startNode.parentNode : startNode;
        endNode = endNode && endNode.nodeType !== 1 ? endNode.parentNode : endNode;

        return {
            start: startNode,
            end: endNode
        };
    };
    api.selectionPrototype.getEnclosingNode = function() {
        // Returns the deepest node containing the whole selection.
        //
        var nodes = this.getBoundaryNodes(),
            node;

        if (nodes.start === nodes.end) {
            node = nodes.start;
        } else {
            node = api.dom.getCommonAncestor(nodes.start, nodes.end);
        }

        // Get the deeper node fully contained in resulting node
        return api.dom.getDeepestNode(node);
    };
    api.selectionPrototype.getTopNodes = function(boundary, filter) {
        boundary = boundary || document.body;
        var node = this.getEnclosingNode(),
            result = [node];

        if (node === boundary) {
            return [];
        }

        while (node.parentNode !== boundary) {
            node = node.parentNode;
            result.push(node);
        }

        if (typeof(filter) !== 'function') {
            return result;
        }

        var _result = result;
        result = [];
        for (var i=0; i<_result.length; i++) {
            if (filter(_result[i])) {
                result.push(_result[i]);
            }
        }
        return result;
    };
    api.selectionPrototype.getSurroundingNodes = function() {
        var nodes = this.getBoundaryNodes(),
            parent = this.getEnclosingNode(),
            started = false,
            node,
            result = [];

        if (api.dom.isAncestorOf(nodes.start, nodes.end, true)) {
            return [nodes.start];
        }
        if (api.dom.isAncestorOf(nodes.end, nodes.start, true)) {
            return [nodes.end];
        }

        for (var i=0; i<parent.childNodes.length; i++) {
            node = parent.childNodes[i];
            if (!started) {
                started = api.dom.isAncestorOf(node, nodes.start, true);
            }
            if (started) {
                result.push(node);
            }
            if (api.dom.isAncestorOf(node, nodes.end, true)) {
                break;
            }
        }
        return result;
    };

    //
    // DOM extensions
    //
    api.dom.hasParents = function(node, parents) {
        while ([document, document.body].indexOf(node) === -1) {
            if (parents.indexOf(node) !== -1) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    };

    api.dom.getDeepestNode = function(node) {
        while (node.childNodes.length === 1 && node.firstChild.nodeType === 1) {
            node = node.firstChild;
        }
        return node;
    };

    api.dom.replaceNodeByContents = function(node) {
        var content = this.getDocument(node).createDocumentFragment();

        for (var i=0; i<node.childNodes.length; i++) {
            content.appendChild(node.childNodes[i].cloneNode(true));
        }

        node.parentNode.replaceChild(content, node);
    };
});
