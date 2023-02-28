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
            simple: './src/demo/simple/demo.ts',
            preferences: './src/demo/preferences/demo.ts',
            layout: './src/demo/layout/demo.ts',
            index: './src/index.ts'
        },
        mode: "production",
        module: {
            rules: [
                loader,
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.(jpe?g|png|gif|svg)$/i,
                    type: 'asset/inline'
                }
            ]
        },
        resolveLoader: {
            alias: {
                "ace-code/src/requirejs/text": __dirname + "/node_modules/text-loader"
            },
            modules: [
                "node_modules", __dirname + "/node_modules"
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js']
        },
        output: {
            filename: 'bundle.[name].js',
            path: __dirname + '/built',
            libraryTarget: 'umd'
        },
        optimization: {
            minimize: false
        },
        devServer: {
            compress: true,
            port: 9000,
            client: {
                overlay: false
            }
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    {
                        from: "src/demo/index.html",
                        to: "."
                    },
                    {
                        from: "src/demo/simple/index.html",
                        to: "simple"
                    }, {
                        from: "src/demo/preferences/index.html",
                        to: "preferences"
                    }, {
                        from: "src/demo/layout/index.html",
                        to: "layout"
                    }
                ]
            })
        ]
    };
};