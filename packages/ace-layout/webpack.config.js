"use strict";
const { writeFileSync } = require("fs");
const { generateDtsBundle } = require("dts-bundle-generator");
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
            index: './src/index.ts'
        },
        mode: "production",
        externals: /ace-code/,
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
            path: __dirname + '/build',
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
            {
                apply: (compiler) => {
                    compiler.hooks.afterEmit.tap("GenerateDeclarations", () => {
                        try {
                            const dtsContent = generateDtsBundle([
                                {
                                    filePath: "./src/index.ts",
                                    output: {
                                        noBanner: true,
                                        exportReferencedTypes: true,
                                        sortNodes: true
                                    },
                                }
                            ]);
                            writeFileSync("./build/index.d.ts", dtsContent.join("\n"), "utf-8");
                        } catch (error) {
                            console.error("⚠️ Declaration generation failed:", error);
                        }
                    });
                }
            }
        ]
    };
};
