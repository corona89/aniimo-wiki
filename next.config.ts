import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Official Aniilog art is hotlinked (owner decision 2026-09-29), never copied.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "worldx-website-cdn.aniimo.com" }],
  },
};

export default nextConfig;
