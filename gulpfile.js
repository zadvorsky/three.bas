var gulp = require('gulp');
var watch = require('gulp-watch');
var del = require('del');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var template = require('gulp-template');
var data = require('gulp-data');
var fs = require('fs');
var shell = require('gulp-shell');
var jsdoc = require("gulp-jsdoc3");
var uglify = require('gulp-uglify');

var glslSourceDir = './src/glsl';
var glslTemplate = './src/ShaderChunk.template';
var glslDestDir = './src';

var jsSources = [
  './src/BufferAnimationSystem.js',
  './src/materials/BaseAnimationMaterial.js',
  './src/timeline/Timeline.js',
  './src/**/*.js'
];

gulp.task('build-js', function (callback) {
  return gulp.src(jsSources)
    .pipe(concat('bas.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('build-glsl', function () {
  return gulp.src(glslTemplate)
    .pipe(data(getFileContents(glslSourceDir)))
    .pipe(template())
    .pipe(rename('ShaderChunk.js'))
    .pipe(gulp.dest(glslDestDir));
});

gulp.task('build-minify', ['build-glsl'], function() {
  return gulp.src(jsSources)
    .pipe(concat('bas.js'))
    .pipe(uglify())
    .pipe(rename('bas.min.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('watch-glsl', function() {
  return watch(glslSourceDir + '/**/*.glsl', function() {
    gulp.start('build-glsl')
  });
});

gulp.task('watch-js', function() {
  return watch(jsSources, function() {
    gulp.start('build-js')
  });
});

gulp.task('build-three-post', function() {
  return gulp.src([
    'bower_components/three.js/examples/js/postprocessing/EffectComposer.js',
    'bower_components/three.js/examples/js/postprocessing/ShaderPass.js',
    'bower_components/three.js/examples/js/postprocessing/RenderPass.js',
    'bower_components/three.js/examples/js/postprocessing/MaskPass.js',
    'bower_components/three.js/examples/js/postprocessing/BloomPass.js',
    'bower_components/three.js/examples/js/shaders/CopyShader.js',
    'bower_components/three.js/examples/js/shaders/ConvolutionShader.js',
  ]).pipe(concat('three_post.js'))
    .pipe(gulp.dest('./examples/js'));
});

gulp.task('deploy', ['build-glsl', 'build-js'], shell.task([
  'surge ./ --domain three-bas-examples.surge.sh'
]));

gulp.task('local', shell.task([
  'live-server'
]));

gulp.task('doc', function(){
  gulp.src(['./src/**/*.js'], {})
    .pipe(jsdoc())
});

gulp.task('default', [
  'build-glsl',
  'build-js',
  'watch-glsl',
  'watch-js',
  'local'
]);

function getFileContents(basePath) {
  var srcFiles = fs.readdirSync(basePath);
  var chunks = [];

  srcFiles.forEach(function (fileName) {
    // get the file name without extension
    var name = fileName.split('.')[0];
    // replace newlines and line breaks with escaped newlines
    var content = fs.readFileSync(basePath + '/' + fileName, 'utf-8').replace(/\r?\n|\r/g, '\\n');

    chunks.push({
      name: name,
      content: content
    });
  });

  return {chunks: chunks};
}
