const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath : './',
  devServer:{
    port: 3636,
    proxy:{
      '/server/':{
        ws: true,
        target: 'http://43.142.78.228:3636/',
        changeOrigin: true,
        pathRewrite:{
          '^/server/':'',
        },
      },
    },
  }
})