/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        module: false,
      };

      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };

      // Force webpack to use the CJS browser bundle — avoids ESM import.meta errors
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-web': path.resolve(
          __dirname,
          'node_modules/onnxruntime-web/dist/ort.min.js'
        ),
      };
    }

    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [
        ...externals,
        'onnxruntime-web',
        '@mediapipe/tasks-vision',
      ];
    }

    // Let webpack handle .wasm as static assets, not JS
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    // onnxruntime-web uses internal dynamic require() that webpack can't statically
    // extract — known false-positive; suppress to keep the console clean.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /onnxruntime-web/ },
    ];

    return config;
  },

  // Required headers for SharedArrayBuffer + WebGPU / WASM threads
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // credentialless allows CDN resources (MediaPipe, models) while keeping SharedArrayBuffer
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
