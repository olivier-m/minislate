/*global module:true */

module.exports = function(grunt) {
    'use strict';

    var pkg = grunt.file.readJSON('package.json');

    grunt.initConfig({
        pkg: pkg,

        clean: {
            dist: ['dist/']
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
            dist: {
                src: 'dist/js/<%= pkg.name.toLowerCase() %>.js',
                dest: 'dist/js/<%= pkg.name.toLowerCase() %>.js',
                options: {
                    process: function(content) {
                        return content.replace('{{version}}', pkg.version);
                    }
                }
            }
        },

        browserify: {
            editor: {
                src: 'src/main.js',
                dest: 'dist/js/<%= pkg.name.toLowerCase() %>.js',
                options: {
                    bundleOptions: {
                        standalone: 'Minislate'
                    }
                }
            }
        },

        uglify: {
            dist: {
                src: 'dist/js/<%= pkg.name.toLowerCase() %>.js',
                dest: 'dist/js/<%= pkg.name.toLowerCase() %>.js',
                options: {
                    mangle: false,
                    compress: false,
                    beautify: true,
                    preserveComments: 'some',
                    banner: '/*!\n' +
                            ' * <%= pkg.name %>\n' +
                            ' * Version: <%= pkg.version %>\n' +
                            ' *\n' +
                            ' * Includes Rangy\n' +
                            ' * https://code.google.com/p/rangy/\n' +
                            ' *\n' +
                            ' * Copyright <%= grunt.template.today("yyyy") %>, <%= pkg.author.name %> and contributors\n' +
                            ' * Released under the <%= pkg.license %> license\n' +
                            ' *\n' +
                            ' * Date: <%= grunt.template.today("isoUtcDateTime") %>\n' +
                            ' */\n'
                }
            },
            distmin: {
                src: 'dist/js/<%= pkg.name.toLowerCase() %>.js',
                dest: 'dist/js/<%= pkg.name.toLowerCase() %>.min.js',
                options: {
                    sourceMap: true,
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
                dest: 'dist/<%= pkg.name.toLowerCase() %>.zip',
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
                files: ['package.json', 'src/**'],
                tasks: ['build', 'copy:dist', 'uglify:dist', 'concat:css', 'copy:css']
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

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-gh-pages');
    grunt.loadNpmTasks('grunt-zip');

    grunt.registerTask('build', ['browserify']);
    grunt.registerTask('dist', ['build', 'copy:dist', 'uglify', 'concat:css', 'copy:css', 'cssmin', 'zip']);
    grunt.registerTask('rangy', ['copy:rangy', 'bundle:rangy']);
    grunt.registerTask('runserver', ['dist', 'connect:dev', 'watch:dev']);
    grunt.registerTask('release', ['clean', 'dist', 'gh-pages']);
};
