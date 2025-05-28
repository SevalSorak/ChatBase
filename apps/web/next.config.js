/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' http://localhost:3000",
              "frame-src 'self' http://localhost:3000",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 