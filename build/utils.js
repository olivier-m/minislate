/* global module:true */
module.exports = {
    //
    // Utility function to remove log calls in rangy files
    //
    removeLogCalls: function(grunt, content, srcpath) {
        var logCallRegex = /^\s*(\/\/\s*)?log\.(trace|debug|info|warn|error|fatal|time|timeEnd|group|groupEnd)/;
        var loggerRegex = /^\s*var\s+log\s*=/;

        var logLineCount = 0;
        var nonLoggingLines = content.split('\n').filter(function(line) {
            if (logCallRegex.test(line) || loggerRegex.test(line)) {
                logLineCount++;
                return false;
            }
            return true;
        });
        grunt.log.write('Removed ' + logLineCount + ' logging line(s) from ' + srcpath + '\n');

        return nonLoggingLines.join('\n');
    }
};
