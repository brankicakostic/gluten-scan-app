
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Explicitly disable Strict Mode
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1748589189575.cluster-ombtxv25tbd6yrjpp3lukp6zhc.cloudworkstations.dev',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // This is the correct hostname for Firebase Storage
      },
    ],
  },
};

export default nextConfig;
