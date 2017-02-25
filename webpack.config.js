const path = require('path');
const webpack = require('webpack');

const config = {
    devtool: 'cheap-source-map',
    entry: './src/js/main',
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: 'orex.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: ['es2015'],
                    cacheDirectory: true
                },
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true
        }),
    ],
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.common.js'
        },
        modules: [
            path.resolve('./src/js'),
            path.resolve('./node_modules')
        ]
    }
}

module.exports = config;