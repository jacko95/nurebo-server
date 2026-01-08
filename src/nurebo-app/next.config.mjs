/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        // domains: [
        //     'lh5.googleusercontent.com',
        //     "images.pexels.com"
        // ],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
        // remotePatterns: [
        //     {
        //         protocol: 'https',
        //         hostname: 'lh5.googleusercontent.com',
        //         port: '',
        //         pathname: '/',
        //     },
        //     {
        //         protocol: 'https',
        //         hostname: 'images.pexels.com',
        //         port: '',
        //         pathname: '/',
        //     },
        // ],
    },
};

export default nextConfig;
