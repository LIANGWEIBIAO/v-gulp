/*  工具基本库  */
const gulp = require('gulp')                    // 引入gulp基础库
const watch = require('gulp-watch')             // 监听
const plumber = require('gulp-plumber')         // 防止编译错误报错终止监听
const connect = require('gulp-connect')         // 启动WEB服务，热加载
const cache = require('gulp-cache')             // 拉取缓存

/*  htmlmin  */
const htmlmin = require('gulp-htmlmin')
/*  css  */
const minifyCSS = require('gulp-minify-css')    // css压缩
const less = require('gulp-less')          // less编译
const autoprefixer = require('gulp-autoprefixer')  // 兼容前缀
const fileinclude  = require('gulp-file-include'); //合并公共代码
/*  javascript  */
const uglify = require('gulp-uglify')           // JS代码压缩
const babel = require('gulp-babel')             // ES6转换（gulp-babel babel-preset-es2015）
/*  images  */
const imagemin = require('gulp-imagemin')       // 图片压缩

/*  dist输出路径  */
const DIST_PATH = 'dist'
/*  build输出路径  */
const BUILD_PATH = 'build'

gulp.task('connect', function() {
  connect.server({
    port: 8080,
    root: './dist',
    livereload: true
  })
})


/*  将html复制到dist目录  */
gulp.task('html',function(){
    gulp.src('./src/views/*.html')
        .pipe(plumber())
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest(DIST_PATH+'/views'))
        .pipe(connect.reload())
})


/*  task:编译less，并输出到dist/css目录下  */
gulp.task('less', () => {
    gulp.src('src/css/**/*.less')
    .pipe(plumber())
    .pipe(less())
    //.pipe(autoprefixer())
    //.pipe(minifyCSS())
    .pipe(gulp.dest(DIST_PATH + '/css'))
    .pipe(connect.reload())
})

/*  css  */
gulp.task('css', () => {
    gulp.src('./src/css/**/*.css')
        // .pipe(autoprefixer())
        .pipe(gulp.dest(DIST_PATH+'/css'))
        .pipe(connect.reload())
})

const webpackStream = require('webpack-stream');
const webpack = require('webpack');
const named = require('vinyl-named');//该插件保证webpack生成的文件名能够和原文件对上
const path = require('path');


var webpackConfig = {
    resolve: {
        //root 当webpack在 root（默认当前文件夹，配置时要绝对路径） 和 modulesDirectories（默认当前文件夹，相对路径）配置下面找不到相关modules，去哪个文件夹下找modules
        root: path.join(__dirname, 'node_modules'),
        alias: {
            components: '../../components', // 组件别名,js里引用路径可直接 'components/xxx/yyy'
            tool: '../../../views/tools/',
            static: '../../static'
        },
        //extensions 决定了哪些文件后缀在引用的时候可以省略点，Webpack帮助你补全名称。
        extensions: ['', '.js', '.vue', '.scss', '.css']
    },
    output: {
        // publicPath: 'yourcdnlink/static/',
        filename: '[name].js'
        // chunkFilename: 'js/[id].js?[hash]'
    },
    module: {
        loaders: [
            {test: /\.js$/, loader: 'babel', exclude: /node_modules/},
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.(png|jpg|jpeg|gif)(\?.+)?$/,
                loader: 'file-loader?name=/images/[name].[ext]'
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            'window.$': 'jquery',
        })
    ],
    babel: { //配置babel
        "presets": ["es2015",'stage-2'],
        "plugins": ["transform-runtime"]
    }
};


gulp.task('js', () => {
    return gulp.src('./src/js/*.js')
          .pipe(plumber())
          .pipe(named(function (file) {
                var path = JSON.parse(JSON.stringify(file)).history[0];
                var sp = path.indexOf('\\') > -1 ? '\\js\\' : '/js/';//\需要转义
                var target = path.split(sp)[1]; //找到文件名
                return target.substring(0,target.length - 3); //去掉.js
           }))
          .pipe(webpackStream(webpackConfig))
          // .pipe(uglify())
          .pipe(gulp.dest(DIST_PATH+'/js'))
          .pipe(connect.reload())
})




/*  压缩图片  */
gulp.task('images', () => {
  return watch('src/images/**/*.{png,jpg,gif,ico,JPG,PNG,GIF,ICO}', () => {
    gulp.src('src/images/**/*.{png,jpg,gif,ico,JPG,PNG,GIF,ICO}')
    .pipe(cache(imagemin({
      optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
      progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
      interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
      multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
    })))
    .pipe(gulp.dest(DIST_PATH + '/images'))
    .pipe(connect.reload())
  })
})
/* font */
gulp.task('font', ()=> {
  return gulp.src('src/font/**/*')
    .pipe(gulp.dest(DIST_PATH + '/font'))
})


// 自动监听
gulp.task('auto', () => {
    gulp.watch('src/views/*.html', ['html']),
    gulp.watch('src/js/**/*.js', ['js']),
     gulp.watch('src/js/**/*.css', ['css']),
    gulp.watch('src/css/**/*.less', ['less']),
    gulp.watch('src/images/**/*)', ['images'])
    gulp.watch('src/css/font/**/*)', ['font'])
})

// 默认动作
gulp.task('default', ['html', 'css', 'js', 'less', 'images', 'auto', 'connect', 'font'])
