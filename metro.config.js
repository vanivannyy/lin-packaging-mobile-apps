const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: path.resolve(__dirname, "node_modules/react"),
  "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
  scheduler: path.resolve(__dirname, "node_modules/scheduler"),
  "react-native": path.resolve(__dirname, "node_modules/react-native"),
};

module.exports = config;
