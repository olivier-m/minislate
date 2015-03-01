/* globals Minislate, module, test */
var rangy = Minislate.rangy;

window.addEventListener('DOMContentLoaded', function() {
    rangy.init();

    var root = document.getElementById('editor');
    root.setAttribute('contenteditable', true);

    var getSelection = function() {
        return rangy.getSelection();
    };

    var createRange = function(node) {
        var args = [].slice.call(arguments),
            range = rangy.createRange();
        if (args.length === 1) {
            range.selectNode(node);
        } else {
            var start = args[0],
                startOffset = args[1],
                end = args[2],
                endOffset = args[3];

            range.setStart(start, startOffset);
            range.setEnd(end, endOffset);
        }
        rangy.getSelection().setSingleRange(range);
        return range;
    };

    module('Rangy Extensions', {
        setup: function() {
            root.innerHTML = '<ul><li>test</li></ul>';
            this.ul = root.firstChild;
            this.li = root.querySelector('li');
            this.txt = this.li.firstChild;
        }
    });
    test('get all nodes', function(test) {
        var nodes = rangy.dom.getNodes(root);
        test.deepEqual(nodes, [root, this.ul, this.li, this.txt]);
    });
    test('get node by type', function(test) {
        var nodes = rangy.dom.getNodes(root, 3);
        test.deepEqual(nodes, [this.txt]);
    });


    module('Simple selections', {
        setup: function() {
            root.innerHTML = '<p>lorem <em><strong>ipsum</strong></em> dolor</p>';
            this.p = root.firstChild;
            this.strong = root.querySelector('strong');
            this.em = root.querySelector('em');
        }
    });
    test('select single node', function(test) {
        createRange(this.strong);
        test.strictEqual(getSelection().getEnclosingNode(), this.strong);
        test.deepEqual(getSelection().getTopNodes(root), [this.strong, this.em, this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.strong]);
    });
    test('select node boundaries', function(test) {
        createRange(this.strong, 0, this.strong, 1);
        test.strictEqual(getSelection().getEnclosingNode(), this.strong);
        test.deepEqual(getSelection().getTopNodes(root), [this.strong, this.em, this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.strong]);
    });
    test('select double click node', function(test) {
        createRange(this.p.childNodes[0], 6, this.p.childNodes[2], 0);
        test.strictEqual(getSelection().getEnclosingNode(), this.strong);
        test.deepEqual(getSelection().getTopNodes(root), [this.strong, this.em, this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.strong]);
    });
    test('select inside node', function(test) {
        createRange(this.strong.firstChild, 1, this.strong.firstChild, 4);
        test.strictEqual(getSelection().getEnclosingNode(), this.strong);
        test.deepEqual(getSelection().getTopNodes(root), [this.strong, this.em, this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.strong]);
    });
    test('select collapsed node', function(test) {
        createRange(this.strong.firstChild, 2, this.strong.firstChild, 2);
        test.strictEqual(getSelection().getEnclosingNode(), this.strong);
        test.deepEqual(getSelection().getTopNodes(root), [this.strong, this.em, this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.strong]);
    });
    test('select outer single node', function(test) {
        createRange(this.em);
        test.strictEqual(getSelection().getEnclosingNode(), this.strong);
        test.deepEqual(getSelection().getTopNodes(root), [this.strong, this.em, this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.strong]);
    });
    test('select outer node boundaries', function(test) {
        createRange(this.em, 0, this.em, 1);
        test.strictEqual(getSelection().getEnclosingNode(), this.strong);
        test.deepEqual(getSelection().getTopNodes(root), [this.strong, this.em, this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.strong]);
    });
    test('select outer right boundary', function(test) {
        createRange(this.p.childNodes[0], 6, this.p.childNodes[2], 3);
        test.strictEqual(getSelection().getEnclosingNode(), this.p);
        test.deepEqual(getSelection().getTopNodes(root), [this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.p]);
    });
    test('select outer left boundary', function(test) {
        createRange(this.p.childNodes[0], 3, this.p.childNodes[2], 0);
        test.strictEqual(getSelection().getEnclosingNode(), this.p);
        test.deepEqual(getSelection().getTopNodes(root), [this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.p]);
    });
    test('select outer left & right boundary', function(test) {
        createRange(this.p.childNodes[0], 3, this.p.childNodes[2], 3);
        test.strictEqual(getSelection().getEnclosingNode(), this.p);
        test.deepEqual(getSelection().getTopNodes(root), [this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.p]);
    });
    test('select main node', function(test) {
        createRange(this.p);
        test.strictEqual(getSelection().getEnclosingNode(), this.p);
        test.deepEqual(getSelection().getTopNodes(root), [this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.p]);
    });
    test('select root node', function(test) {
        createRange(root, 0, root, 1);
        test.strictEqual(getSelection().getEnclosingNode(), this.p);
        test.deepEqual(getSelection().getTopNodes(root), [this.p]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.p]);
    });
    test('empty content', function(test) {
        root.innerHTML = '';
        createRange(root, 0, root, 0);
        test.strictEqual(getSelection().getEnclosingNode(), root);
        test.deepEqual(getSelection().getTopNodes(root), []);
        test.deepEqual(getSelection().getSurroundingNodes(), [root]);
    });

    module('Complex selections', {
        setup: function() {
            root.innerHTML = '<p>lorem <em>dolor</em></p>' +
                '<blockquote><p>test</p></blockquote>' +
                '<p>lorem <em>lorem <strong>ipsum</strong></em> dolor <span>amet</span></p>' +
                '<p>woot!</p>';
            this.p1 = root.childNodes[0];
            this.blockquote = root.childNodes[1];
            this.p2 = root.childNodes[2];
            this.p3 = root.childNodes[3];
            this.strong = root.querySelector('strong');
            this.em1 = root.querySelectorAll('em')[0];
            this.em2 = root.querySelectorAll('em')[1];
            this.span = root.querySelector('span');
        }
    });
    test('select double click single node', function(test) {
        createRange(this.em2.childNodes[0], 6, this.p2.childNodes[2], 0);
        test.strictEqual(getSelection().getEnclosingNode(), this.strong);
        test.deepEqual(getSelection().getTopNodes(root), [this.strong, this.em2, this.p2]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.strong]);
    });
    test('select double click complex node', function(test) {
        createRange(this.p2.childNodes[0], 6, this.em2.childNodes[0], 5);
        test.strictEqual(getSelection().getEnclosingNode(), this.em2);
        test.deepEqual(getSelection().getTopNodes(root), [this.em2, this.p2]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.em2]);
    });
    test('select multiple blocks (from start)', function(test) {
        createRange(this.p1, 0, this.p2, 3);
        test.strictEqual(getSelection().getEnclosingNode(), root);
        test.deepEqual(getSelection().getTopNodes(root), []);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.p1, this.blockquote, this.p2]);
    });
    test('select multiple blocks (to end)', function(test) {
        createRange(this.blockquote.firstChild.firstChild, 2, this.p3, 1);
        test.strictEqual(getSelection().getEnclosingNode(), root);
        test.deepEqual(getSelection().getTopNodes(root), []);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.blockquote, this.p2, this.p3]);
    });
    test('select multiple nodes', function(test) {
        createRange(this.p2.firstChild, 2, this.p2, 4);
        test.strictEqual(getSelection().getEnclosingNode(), this.p2);
        test.deepEqual(getSelection().getTopNodes(root), [this.p2]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.p2]);
    });
    test('select multiple tag nodes', function(test) {
        createRange(this.em2.firstChild, 2, this.span.firstChild, 2);
        test.strictEqual(getSelection().getEnclosingNode(), this.p2);
        test.deepEqual(getSelection().getTopNodes(root), [this.p2]);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.em2, this.p2.childNodes[2], this.span]);
    });
    test('select disconnected nodes', function(test) {
        createRange(this.em1.firstChild, 1, this.strong.firstChild, 2);
        test.strictEqual(getSelection().getEnclosingNode(), root);
        test.deepEqual(getSelection().getTopNodes(root), []);
        test.deepEqual(getSelection().getSurroundingNodes(), [this.p1, this.blockquote, this.p2]);
    });
    test('select root node', function(test) {
        createRange(root, 0, root, 4);
        test.strictEqual(getSelection().getEnclosingNode(), root);
        test.deepEqual(getSelection().getTopNodes(root), []);
        test.deepEqual(getSelection().getSurroundingNodes(), [].slice.call(root.childNodes));
    });

    module('I18n');
    test('should be set via register', function (test) {
        Minislate.tr.register({'string': 'translated'});
        test.equal(Minislate.tr('string'), 'translated');
    });
    test('should be lazy', function (test) {
        var translated = Minislate.tr('string');
        Minislate.tr.register({'string': 'chaîne'});
        test.equal(translated, 'chaîne');
    });
    test('should allow variables', function (test) {
        var translated = Minislate.tr('title level {level}', {level: '1'});
        Minislate.tr.register({'title level {level}': 'titre niveau {level}'});
        test.equal(translated, 'titre niveau 1');
    });
    test('should be set via editor options', function (test) {
        var element = document.createElement('div');
        new Minislate.simpleEditor(element, {i18n: {'string': 'from options'}});
        test.equal(Minislate.tr('string'), 'from options');
    });
});
