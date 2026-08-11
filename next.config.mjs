/** @type {import('next').NextConfig} */
// all-24: Clerk 웹훅·관리자 API·Supabase service role 을 위해 서버 모드 (정적 export 해제)
const nextConfig = {
  images: { unoptimized: true },
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;
