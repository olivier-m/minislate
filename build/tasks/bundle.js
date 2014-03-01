/* global module:true */

var INCLUDE_REG = /\{%[ ]*include[ ]+"(.*?)"[ ]*%\}/g;
var SUB_REG = /\{\{[ ]*([A-Za-z0-9_]+)[ ]*\}\}/g;

module.exports = function(grunt) {
    grunt.registerMultiTask('bundle', 'Create JS bundle based on a template', function() {
        var data = this.data;
        var code = grunt.file.read(data.template);

        code = code.replace(INCLUDE_REG, function(match, path) {
            path = path.trim();
            if (!grunt.file.isFile(path)) {
                grunt.fatal('File "' + path + '" does not exist.');
            }
            return grunt.file.read(path);
        });

        code = code.replace(SUB_REG, function(match, name) {
            if (!data.context || typeof(data.context[name]) === 'undefined') {
                grunt.fatal('Identifier "' + name + '" not found.');
            }
            return data.context[name];
        });

        grunt.file.write(data.out, code);
    });
};
