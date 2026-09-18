import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["mammoth", "pdfjs-dist"],
};

export default nextConfig;
