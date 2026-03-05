import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/nv-school-ratings' : '',
  assetPrefix: isProd ? '/nv-school-ratings' : '',
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
