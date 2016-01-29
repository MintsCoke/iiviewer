var gulp = require('gulp');
var concat = require('gulp-concat');
var stylus = require('gulp-stylus');

gulp.task('default', ['modernizr', 'normalize', 'stylus', 'js']);

gulp.task('modernizr', function() {
    gulp.src('node_modules/modernizr/modernizr.js')
        .pipe(gulp.dest('./js/'));
});

gulp.task('normalize', function() {
    gulp.src('node_modules/normalize.css/normalize.css')
        .pipe(gulp.dest('./css/'));
});

gulp.task('stylus', function() {
    gulp.src('css/source/main.styl')
        .pipe(stylus({ compress: true }))
        .pipe(gulp.dest('./css/'));
});

gulp.task('js', function() {
    gulp.src([
        'node_modules/pdfjs-dist/build/pdf.combined.js',
        'node_modules/tooltip/dist/Tooltip.js',
        'bower_components/dragscroll/dragscroll.js',
        'js/source/custom.js',
    ]).pipe(concat('main.js')).pipe(gulp.dest('./js/'));
});

gulp.task('watch', function() {
    gulp.watch('js/**/*.js', ['js']);
    gulp.watch('css/**/*.styl', ['stylus']);
});
