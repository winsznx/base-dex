/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Fallbacks for native modules that aren't available in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    // Suppress warnings about native modules in metamask sdk
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Module not found:.*@react-native-async-storage/,
    ];
    
    return config;
  },
};

module.exports = nextConfig;

