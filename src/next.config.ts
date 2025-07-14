
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
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Keep this for general access
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gluten-detective-8ukpw.appspot.com', // Added specific bucket hostname
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
