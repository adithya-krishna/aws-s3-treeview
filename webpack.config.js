var debug = true; //true: dev, false: production
var webpack = require('webpack');
var path = require('path');

module.exports = {
    context: path.join(__dirname, "src"),
    devtool: debug ? "inline-sourcemap" : null,
    entry: "./js/client.js",
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: ['react', 'es2015', 'stage-0']
                }
            }
        ],
        noParse:[/aws\-sdk/]
    },
    output: {
        path: path.join(__dirname, "src"),
        publicPath: '/',
        filename: 'client.min.js'
    },
    plugins: debug ? [] : [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false, compress:{ warnings: true }}),
        new webpack.DefinePlugin({'process.env':{'NODE_ENV': JSON.stringify('production')}})
    ],
    devServer: {
        historyApiFallback: true,
        contentBase: './'
    }
};
