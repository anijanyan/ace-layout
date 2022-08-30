"use strict";
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
    let loader;
    loader = {
        test: /\.(t|j)sx?$/,
        use: {
            loader: 'ts-loader',
            options: {
                transpileOnly: true
            }
        },
        exclude: /node_modules/
    };
    return {
        devtool: 'source-map',
        entry: {
            simple: './src/demo.ts',
        },
        mode: "production",
        module: {
            rules: [
                loader, {
                    test: /\.(png|jpe?g|gif)$/i,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: '[path][name].[ext]'
                            }
                        }
                    ]
                }
            ]
        },
        resolveLoader: {
            modules: [
                "node_modules", __dirname + "/node_modules"
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js']
        },
        output: {
            filename: 'bundle.[name].js',
            path: __dirname + '/built'
        },
        optimization: {
            minimize: false
        },
        devServer: {
            compress: true,
            port: 9000
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    {
                        from: "src/demo.html",
                        to: "."
                    }
                ]
            })
        ]
    };
};