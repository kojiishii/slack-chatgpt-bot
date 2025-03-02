/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // TypeScriptのエラーをビルド時に無視する（開発時は表示される）
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLintのエラーをビルド時に無視する
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig
