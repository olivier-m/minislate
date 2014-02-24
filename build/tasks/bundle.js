/* global module:true */

var INCLUDE_REG = /\{%[ ]*include[ ]+"(.*?)"[ ]*%\}/g;

module.exports = function(grunt) {
    grunt.registerMultiTask('bundle', 'Create JS bundle based on a template', function() {
        var code = grunt.file.read(this.data.template);

        code = code.replace(INCLUDE_REG, function(match, path) {
            path = path.trim();
            if (!grunt.file.isFile(path)) {
                grunt.fatal('File "' + path + '" does not exist.');
            }
            return grunt.file.read(path);
        });

        grunt.file.write(this.data.out, code);
    });
};
