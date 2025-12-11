/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  compiler: {
    emotion: false,
    styledComponents: false,
  },
  // Note: removed unsupported swc config keys for Next.js v16/Turbopack
}

module.exports = nextConfig