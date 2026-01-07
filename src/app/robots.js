export default function robots() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/admin/', '/api/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
