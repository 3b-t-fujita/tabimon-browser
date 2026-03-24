import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // WebP/AVIF に変換する必要はなく静的 WebP を直接配信するため、
    // ランタイム変換コストをかけずにサイズ予約と遅延読み込みだけを利用する。
    unoptimized: true,
  },
};

export default nextConfig;
