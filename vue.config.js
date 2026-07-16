const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  // GitHub Pages serves project pages from /<repo-name>/, not the domain root.
  publicPath: process.env.NODE_ENV === "production" ? "/echo-jump/" : "/",
  transpileDependencies: ["vuetify"],
  lintOnSave: false,
  devServer: {
    port: Number(process.env.PORT) || 8081,
    host: "0.0.0.0",
  },
  chainWebpack: (config) => {
    // Disable the outdated cache-loader and rely on webpack 5's built-in caching
    config.module.rule("js").uses.delete("cache-loader");
    config.module.rule("ts").uses.delete("cache-loader");
    config.module.rule("vue").uses.delete("cache-loader");

    // Set HTML page title
    config.plugin("html").tap((args) => {
      args[0].title = "Echo Jump";
      return args;
    });
  },
});
