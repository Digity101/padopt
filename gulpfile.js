var gulp = require('gulp');
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var connect = require('gulp-connect');

// static file that need to process.
var paths = {
  js: ['js/image-analysis.js'],
  sass: ['css/source.scss'],
  html: ['testing.html']
};

// start development server
gulp.task('default', ['watch', 'sass', 'js'], function() {
  // place code for your default task here
  connect.server({
    root: '.',
    livereload: true
  });
});

// js
gulp.task('js', function () {
  gulp.src(paths.js)
    .pipe(uglify())
    .pipe(rename({suffix: '.min', basename: 'build'}))
    .pipe(gulp.dest("js"));
});

// sass
gulp.task('sass', function () {
  return gulp.src(paths.sass)
    .pipe(sass().on('error', sass.logError))
    .pipe(cssmin())
    .pipe(rename({suffix: '.min', basename: 'build'}))
    .pipe(gulp.dest('css'));
});

gulp.task('html', function () {
  return gulp.src(paths.html)
    .pipe(connect.reload());
});

// for development: watch file changes and build js/sass again.
gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass', 'html']);
  gulp.watch(paths.js, ['js', 'html']);
  gulp.watch(paths.html, ['html']);
});