/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  compiler: {
    removeConsole: false,
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

export default nextConfig
