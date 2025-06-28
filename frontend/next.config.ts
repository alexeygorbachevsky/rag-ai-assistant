import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    devIndicators: false,
    turbopack: {
        rules: {
            '*.svg': {
                as: '*.js',
                loaders: ['@svgr/webpack'],
            },
        },
    },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/i,
            use: ['@svgr/webpack'],
        });
        return config;
    },
}

export default nextConfig;
