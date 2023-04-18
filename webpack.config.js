"use strict";
const CopyPlugin = require("copy-webpack-plugin");
module.exports = (env, argv) => {
    let loader;
    loader = {
        test: /\.(t|j)sx?$/,
        use: {
            loader: 'esbuild-loader'
        },
        exclude: /node_modules/
    };
    return {
        devtool: 'source-map',
        entry: {
            simple: './packages/demo/simple/demo.ts',
            preferences: './packages/demo/preferences/demo.ts',
            layout: './packages/demo/layout/demo.ts'
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
            path: __dirname + '/built'
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
                        from: "packages/demo/index.html",
                        to: "."
                    },
                    {
                        from: "packages/demo/simple/index.html",
                        to: "simple"
                    }, {
                        from: "packages/demo/preferences/index.html",
                        to: "preferences"
                    }, {
                        from: "packages/demo/layout/index.html",
                        to: "layout"
                    }
                ]
            })
        ]
    };
};
