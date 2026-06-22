import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/esrc26-portal/:path*",
        destination: "http://68.178.167.68:8080/esrc26/:path*",
      },
    ];
  },
};

export default nextConfig;
