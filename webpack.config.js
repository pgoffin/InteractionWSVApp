const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const DelWebpackPlugin = require('del-webpack-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");


module.exports = {
  entry: "./index.ts",
  mode: "development",
  optimization: {
    splitChunks: {
      chunks: "all"
    }
  },
  plugins: [
    new DelWebpackPlugin({
      info: true,
      exclude: ["vendors*.js"]
    }),
    new HtmlWebpackPlugin({
      template: './src/template/_index.html',
      filename: "../../index.html"
    }),
    new ScriptExtHtmlWebpackPlugin({
      module: /\.js$/
    }),
    new WebpackMd5Hash(),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css"
    }),
    new webpack.ProvidePlugin({
      d3: "d3",
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
      "window.$": "jquery",
    })
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".css", ".html"],
    modules: ["src", "node_modules"]
  },
  output: {
    filename: "[name].[chunkhash].js",
    path: path.resolve(__dirname, "dist/js")
  },
  devtool: "source-map",
  module: {
    rules: [{
        test: /\.ts$/,
        loader: "awesome-typescript-loader"
      },
      {
        test: /\.(scss)$/,
        use: ['style-loader', MiniCssExtractPlugin.loader, 'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: function () {
                return [require('precss'), require('autoprefixer')];
              }
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.less$/,
        use: [{
            loader: 'style-loader'
          }, {
            loader: 'css-loader'
          },
          {
            loader: 'less-loader'
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }, {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader']
      }, {
        test: /\.html$/,
        use: {
          loader: 'html-loader',
          options: {}
        }
      }
    ],
  },

  watch: true
};
