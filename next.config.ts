import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["razorpay", "@prisma/client"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
