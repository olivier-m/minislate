/*global module:true, require:true */

module.exports = function(grunt) {
    'use strict';

    var utils = require('./build/utils');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            dist: ['dist/'],
            grunt: ['.grunt/']
        },

        connect: {
            dev: {
                options: {
                    port: 5000,
                    base: ['demo', 'dist']
                }
            }
        },

        concat: {
            css: {
                src: ['src/css/font-awesome.css', 'src/css/editor.css'],
                dest: 'dist/css/<%= pkg.name.toLowerCase() %>-full.css'
            }
        },

        copy: {
            css: {
                files: [
                    {
                        src: 'src/css/editor.css',
                        dest: 'dist/css/<%= pkg.name.toLowerCase() %>.css'
                    },
                    {
                        expand: true,
                        cwd: 'src/css/fonts',
                        src: '**',
                        dest: 'dist/css/fonts'
                    }
                ]
            },
            rangy: {
                src: 'src/vendor/rangy/core/*.js',
                dest: '.grunt/tmp/rangy/',
                flatten: true,
                expand: true,
                options: {
                    process: function(content, srcpath) {
                        return utils.removeLogCalls(grunt, content, srcpath)
                            .replace(/\s+$/gm, '');
                    }
                }
            }
        },

        bundle: {
            rangy: {
                template: 'build/templates/rangy.js',
                out: '.grunt/tmp/rangy-core.js'
            },
            editor: {
                template: 'build/templates/editor.js',
                out: '.grunt/tmp/<%= pkg.name.toLowerCase() %>.js'
            }
        },

        uglify: {
            dist: {
                src: '.grunt/tmp/<%= pkg.name.toLowerCase() %>.js',
                dest: 'dist/js/<%= pkg.name.toLowerCase() %>.js',
                options: {
                    mangle: false,
                    compress: false,
                    beautify: true,
                    preserveComment: false
                }
            },
            distmin: {
                src: '.grunt/tmp/<%= pkg.name.toLowerCase() %>.js',
                dest: 'dist/js/<%= pkg.name.toLowerCase() %>.min.js'
            }
        },

        watch: {
            dev: {
                files: ['src/**', 'build/templates/*'],
                tasks: ['build', 'uglify:dist', 'concat:css', 'copy:css', 'clean:grunt']
            }
        }
    });

    grunt.loadTasks('build/tasks');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('build', ['rangy', 'bundle:editor']);
    grunt.registerTask('dist', ['build', 'uglify', 'concat:css', 'copy:css', 'clean:grunt']);
    grunt.registerTask('rangy', ['copy:rangy', 'bundle:rangy']);
    grunt.registerTask('runserver', ['dist', 'connect:dev', 'watch:dev']);
};
