import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Supabase Storage — dish photos uploaded from /admin/menu land in
        // the public "menu-images" bucket (see the 20260911160000
        // migration) and are served from this same project host.
        protocol: "https",
        hostname: "rqiqqeuqjgvlvngdhlhj.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
