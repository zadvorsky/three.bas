var gulp = require('gulp');
var del = require('del');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var template = require('gulp-template');
var data = require('gulp-data');
var fs = require('fs');

var glslSourceDir = './src/glsl';
var glslTemplate = './src/ShaderChunk.template';
var glslDestDir = './src';

var jsSources = [
    './src/BufferAnimationSystem.js',
    './src/Materials/BaseAnimationMaterial',
    './src/**/*.js'
];

gulp.task('build-js', function(callback) {
    return gulp.src(jsSources)
        .pipe(concat('bas.js'))
        .pipe(gulp.dest('./dist'));
});


gulp.task('build-glsl', function() {
    return gulp.src(glslTemplate)
        .pipe(data(getFileContents(glslSourceDir)))
        .pipe(template())
        .pipe(rename('ShaderChunk.js'))
        .pipe(gulp.dest(glslDestDir));
});

gulp.task('watch-glsl', function() {
    return gulp.watch([glslSourceDir], ['build-glsl']);
});

gulp.task('watch-js', function() {
  return gulp.watch([jsSources], ['build-js']);
});

function getFileContents(basePath) {
    var srcFiles = fs.readdirSync(basePath);
    var chunks = [];

    srcFiles.forEach(function(fileName) {
        // get the file name without extension
        var name = fileName.split('.')[0];
        // replace newlines and line breaks with escaped newlines
        var content = fs.readFileSync(basePath + '/' + fileName, 'utf-8').replace(/\r?\n|\r/g, '\\n');

        chunks.push({
            name:name,
            content:content
        });
    });

    return {chunks:chunks};
}
