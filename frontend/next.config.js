/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  swcMinify: false,
  compiler: {
    emotion: false,
    styledComponents: false,
  },
  experimental: {
    swcDisableModuleTransforms: false,
  },
}

module.exports = nextConfig