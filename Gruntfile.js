/*global module:true, require:true */

module.exports = function(grunt) {
    'use strict';

    var utils = require('./build/utils');
    var pkg = grunt.file.readJSON('package.json');

    grunt.initConfig({
        pkg: pkg,

        clean: {
            dist: ['dist/'],
            tmp: ['.grunt/tmp']
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
                out: '.grunt/tmp/<%= pkg.name.toLowerCase() %>.js',
                context: {
                    name: pkg.name,
                    author: pkg.author.name,
                    version: pkg.version,
                    license: pkg.license,
                    year: (new Date()).getFullYear(),
                    date: (new Date()).toUTCString()
                }
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
                    preserveComments: 'some'
                }
            },
            distmin: {
                src: '.grunt/tmp/<%= pkg.name.toLowerCase() %>.js',
                dest: 'dist/js/<%= pkg.name.toLowerCase() %>.min.js',
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - '+
                    '<%= grunt.template.today("isoUtcDateTime") %> - <%= pkg.author.name %> and contributors. */\n'
                }
            }
        },

        cssmin: {
            simple: {
                src: 'dist/css/<%= pkg.name.toLowerCase() %>.css',
                dest: 'dist/css/<%= pkg.name.toLowerCase() %>.min.css'
            },
            full: {
                src: 'dist/css/<%= pkg.name.toLowerCase() %>-full.css',
                dest: 'dist/css/<%= pkg.name.toLowerCase() %>-full.min.css',
                options: {
                    keepSpecialComments: '0'
                }
            }
        },

        zip: {
            dist: {
                dest: 'dist/<%= pkg.name.toLowerCase() %>-<%= pkg.version %>.zip',
                src: ['README.md', 'LICENSE', 'demo/index.html', 'dist/js/**', 'dist/css/**'],
                router: function(path) {
                    var re_dist = /^dist\/(.+)$/;
                    if (path.match(re_dist)) {
                        path =  path.replace(re_dist, '$1');
                    } else if (path === 'demo/index.html') {
                        path = 'demo.html';
                    }
                    return 'minislate-' + pkg.version + '/' + path;
                }
            }
        },

        watch: {
            dev: {
                files: ['src/**', 'build/templates/*'],
                tasks: ['build', 'uglify:dist', 'concat:css', 'copy:css', 'clean:tmp']
            }
        },

        'gh-pages': {
            options: {
                push: false,
                message: 'Automatic update',
                clone: '.grunt/gh-pages',
                add: true
            },
            src: ['dist/**']
        }
    });

    grunt.loadTasks('build/tasks');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-gh-pages');
    grunt.loadNpmTasks('grunt-zip');

    grunt.registerTask('build', ['rangy', 'bundle:editor']);
    grunt.registerTask('dist', ['build', 'uglify', 'concat:css', 'copy:css', 'cssmin', 'zip', 'clean:tmp']);
    grunt.registerTask('rangy', ['copy:rangy', 'bundle:rangy']);
    grunt.registerTask('runserver', ['dist', 'connect:dev', 'watch:dev']);
    grunt.registerTask('release', ['clean', 'dist', 'gh-pages']);
};
