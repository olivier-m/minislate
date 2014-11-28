/* jshint newcap:false */
/* global require, exports */
var Class = require('./util').Class;
var extend = require('./util').extend;
var _ = require('./util')._;

var HtmlCleaner = Class(Object, {
    defaults: {
        //
    },

    init: function(options) {
        this.options = extend({}, this.defaults, options);
    },

    formatRegexp: [
        [/(<[a-z][^>]*)margin\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)margin-bottom\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)margin-left\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)margin-right\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)margin-top\s*:[^;]*;/mg, '$1'],

        [/(<[a-z][^>]*)padding\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)padding-bottom\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)padding-left\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)padding-right\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)padding-top\s*:[^;]*;/mg, '$1'],

        [/(<[a-z][^>]*)font\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)font-family\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)font-size\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)font-style\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)font-variant\s*:[^;]*;/mg, '$1'],
        [/(<[a-z][^>]*)font-weight\s*:[^;]*;/mg, '$1'],

        [/(<[a-z][^>]*)color\s*:[^;]*;/mg, '$1']
    ],

    cleanRegexp: [
        // Remove every tags we don't need
        [/<meta[\w\W]*?>/gim,''],
        [/<style[\w\W]*?>[\w\W]*?<\/style>/gim, ''],
        [/<\/?font[\w\W]*?>/gim, ''],

        // Replacements
        [/<(\/?)(B|b|STRONG)([\s>\/])/g, '<$1strong$3'],
        [/<(\/?)(I|i|EM)([\s>\/])/g, '<$1em$3'],
        [/<IMG ([^>]*?[^\/])>/gi, '<img $1 />'],
        [/<INPUT ([^>]*?[^\/])>/gi, '<input $1 />'],
        [/<COL ([^>]*?[^\/])>/gi, '<col $1 />'],
        [/<AREA ([^>]*?[^\/])>/gi, '<area $1 />'],
        [/<PARAM ([^>]*?[^\/])>/gi, '<param $1 />'],
        [/<HR ([^>]*?[^\/])>/gi, '<hr $1/>'],
        [/<BR ([^>]*?[^\/])>/gi, '<br $1/>'],
        [/<(\/?)U([\s>\/])/gi, '<$1ins$2'],
        [/<(\/?)STRIKE([\s>\/])/gi, '<$1del$2'],
        [/<span style="font-weight: normal;">([\w\W]*?)<\/span>/gm, '$1'],
        [/<span style="font-weight: bold;">([\w\W]*?)<\/span>/gm, '<strong>$1</strong>'],
        [/<span style="font-style: italic;">([\w\W]*?)<\/span>/gm, '<em>$1</em>'],
        [/<span style="text-decoration: underline;">([\w\W]*?)<\/span>/gm, '<ins>$1</ins>'],
        [/<span style="text-decoration: line-through;">([\w\W]*?)<\/span>/gm, '<del>$1</del>'],
        [/<span style="text-decoration: underline line-through;">([\w\W]*?)<\/span>/gm, '<del><ins>$1</ins></del>'],
        [/<span style="(font-weight: bold; ?|font-style: italic; ?){2}">([\w\W]*?)<\/span>/gm, '<strong><em>$2</em></strong>'],
        [/<span style="(font-weight: bold; ?|text-decoration: underline; ?){2}">([\w\W]*?)<\/span>/gm, '<ins><strong>$2</strong></ins>'],
        [/<span style="(font-weight: italic; ?|text-decoration: underline; ?){2}">([\w\W]*?)<\/span>/gm, '<ins><em>$2</em></ins>'],
        [/<span style="(font-weight: bold; ?|text-decoration: line-through; ?){2}">([\w\W]*?)<\/span>/gm, '<del><strong>$2</strong></del>'],
        [/<span style="(font-weight: italic; ?|text-decoration: line-through; ?){2}">([\w\W]*?)<\/span>/gm, '<del><em>$2</em></del>'],
        [/<span style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: underline; ?){3}">([\w\W]*?)<\/span>/gm, '<ins><strong><em>$2</em></strong></ins>'],
        [/<span style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: line-through; ?){3}">([\w\W]*?)<\/span>/gm, '<del><strong><em>$2</em></strong></del>'],
        [/<span style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: underline line-through; ?){3}">([\w\W]*?)<\/span>/gm, '<del><ins><strong><em>$2</em></strong></ins></del>'],
        [/<strong style="font-weight: normal;">([\w\W]*?)<\/strong>/gm, '$1'],
        [/<([a-z]+) style="font-weight: normal;">([\w\W]*?)<\/\1>/gm, '<$1>$2</$1>'],
        [/<([a-z]+) style="font-weight: bold;">([\w\W]*?)<\/\1>/gm, '<$1><strong>$2</strong></$1>'],
        [/<([a-z]+) style="font-style: italic;">([\w\W]*?)<\/\1>/gm, '<$1><em>$2</em></$1>'],
        [/<([a-z]+) style="text-decoration: underline;">([\w\W]*?)<\/\1>/gm, '<ins><$1>$2</$1></ins>'],
        [/<([a-z]+) style="text-decoration: line-through;">([\w\W]*?)<\/\1>/gm, '<del><$1>$2</$1></del>'],
        [/<([a-z]+) style="text-decoration: underline line-through;">([\w\W]*?)<\/\1>/gm, '<del><ins><$1>$2</$1></ins></del>'],
        [/<([a-z]+) style="(font-weight: bold; ?|font-style: italic; ?){2}">([\w\W]*?)<\/\1>/gm, '<$1><strong><em>$3</em></strong></$1>'],
        [/<([a-z]+) style="(font-weight: bold; ?|text-decoration: underline; ?){2}">([\w\W]*?)<\/\1>/gm, '<ins><$1><strong>$3</strong></$1></ins>'],
        [/<([a-z]+) style="(font-weight: italic; ?|text-decoration: underline; ?){2}">([\w\W]*?)<\/\1>/gm, '<ins><$1><em>$3</em></$1></ins>'],
        [/<([a-z]+) style="(font-weight: bold; ?|text-decoration: line-through; ?){2}">([\w\W]*?)<\/\1>/gm, '<del><$1><strong>$3</strong></$1></del>'],
        [/<([a-z]+) style="(font-weight: italic; ?|text-decoration: line-through; ?){2}">([\w\W]*?)<\/\1>/gm, '<del><$1><em>$3</em></$1></del>'],
        [/<([a-z]+) style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: underline; ?){3}">([\w\W]*?)<\/\1>/gm, '<ins><$1><strong><em>$3</em></strong></$1></ins>'],
        [/<([a-z]+) style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: line-through; ?){3}">([\w\W]*?)<\/\1>/gm, '<del><$1><strong><em>$3</em></strong></$1></del>'],
        [/<([a-z]+) style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: underline line-through; ?){3}">([\w\W]*?)<\/\1>/gm, '<del><ins><$1><strong><em>$3</em></strong></$1></ins></del>'],
        [/<p><blockquote>(.*)(\n)+<\/blockquote><\/p>/i,'<blockquote>$1</blockquote>\n'],

        // identical contiguous formating
        [/<\/(strong|em|ins|del|q|code)>(\s*?)<\1>/gim, '$2'],
        [/<(br|BR)>/g, '<br />'],
        [/<(hr|HR)>/g, '<hr />'],

        // opera hack
        [/([^\s])\/>/g, '$1 />'],

        // remove end of block BRs
        [/<br \/>\s*<\/(h1|h2|h3|h4|h5|h6|ul|ol|li|p|blockquote|div)/gi, '</$1'],

        // various fixes
        [/<\/(h1|h2|h3|h4|h5|h6|ul|ol|li|p|blockquote)>([^\n\u000B\r\f])/gi, '</$1>\n$2'],
        [/<hr style="width: 100%; height: 2px;" \/>/g, '<hr />'],

        // empty inline style
        [/style="\s*?"/mgi, ''],
        [/<\s+/mgi, '<'],
        [/\s+>/mgi, '>']
    ],

    removeFormat: function(html) {
        _.each(this.formatRegexp, function(v) {
            html = ''.replace.apply(html, v);
        });

        return html;
    },

    tagsoup2html: function(html) {
        _.each(this.cleanRegexp, function(v) {
            html = ''.replace.apply(html, v);
        });

        // Empty tags (keeping comments)
        while ( /(<[^\/!]>|<[^\/!][^>]*[^\/]>)\s*<\/[^>]*[^-]>/.test(html) ) {
           html = html.replace(/(<[^\/!]>|<[^\/!][^>]*[^\/]>)\s*<\/[^>]*[^-]>/g, '');
        }

        // Lowercase tags
        html = html.replace(/<(\/?)([A-Z0-9]+)/g, function(m0, m1, m2) {
            return '<' + m1 + m2.toLowerCase();
        });

        // IE could leave unquoted attributes
        var reg = /<[^>]+((\s+\w+\s*=\s*)([^"'][\w~@+$,%\/:.#?=&;!*()-]*))[^>]*?>/;
        var _f = function(m0, m1, m2, m3) {
            var _r = m1.replace(/([\\\^\$*+[\]?{}.=!:(|)])/g, '\\$1');
            return m0.replace(_r, m2 + '"' + m3 + '"');
        };
        while (reg.test(html)) {
            html = html.replace(reg, _f);
        }

        // Fix null length units
        while ( /(<[^>]+style=(["'])[^>]+[\s:]+)0(pt|px)(\2|\s|;)/.test(html)) {
            html = html.replace(/(<[^>]+style=(["'])[^>]+[\s:]+)0(pt|px)(\2|\s|;)/gi, '$1'+'0$4');
        }

        // Fix line end
        html = html.replace(/\r\n/g, '\n');

        // Trim content
        html = html.replace(/^\s+/, '').replace(/\s+$/, '');

        return html;
    },

    clean: function(html) {
        html = this.removeFormat(html);
        html = this.tagsoup2html(html);

        return html;
    }
});


exports.HtmlCleaner = HtmlCleaner;
