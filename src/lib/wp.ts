import { fallbackData } from './fallback-data';

const domain = import.meta.env.WP_DOMAIN || 'https://cms.kroko.cl';
const apiUrl = `${domain}/wp-json/wp/v2`;

// Log para debugging
if (import.meta.env.DEV) {
    console.log('WordPress Domain:', domain);
    console.log('API URL:', apiUrl);
}

export const getPageInfo = async (slug: string) => {
    try {
        console.log(`Fetching page info for slug: ${slug} from ${apiUrl}`);
        const res = await fetch(`${apiUrl}/pages?slug=${slug}`);
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (!data || data.length === 0) {
            throw new Error(`No page found with slug: ${slug}`);
        }
        
        const [pageData] = data;
        
        if (!pageData.title || !pageData.content) {
            throw new Error('Invalid page data structure');
        }
        
        const { title: { rendered: title }, content: { rendered: content } } = pageData;
        
        console.log(`✅ Successfully fetched page: ${title}`);
        return { title, content };
        
    } catch (error) {
        console.warn(`⚠️  WordPress unavailable, using fallback data for page: ${slug}`);
        console.error('WordPress Error:', error);
        
        // Use fallback data
        const fallbackPage = fallbackData.pageInfo[slug as keyof typeof fallbackData.pageInfo];
        if (fallbackPage) {
            return fallbackPage;
        }
        
        // Default fallback if specific page not found
        return {
            title: 'Bienvenido a CODEVS',
            content: '<p>🚧 Sitio en mantenimiento. Mostrando contenido de respaldo.</p>'
        };
    }
};

export const getLastestPosts = async ({ perPage = 10 }: { perPage?: number } = {}) => {
    try {
        console.log(`Fetching latest posts (${perPage}) from ${apiUrl}`);
        const response = await fetch(`${apiUrl}/posts?per_page=${perPage}&_embed`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const results = await response.json();
        
        if (!results.length) {
            console.log('No posts found');
            return fallbackData.posts.slice(0, perPage);
        }

        const posts = results.map((post: any) => {
            const { 
                title: { rendered: title }, 
                excerpt: { rendered: excerpt },
                content: { rendered: content }, 
                date, 
                slug 
            } = post;

            return { title, content, excerpt, date, slug };
        });

        console.log(`✅ Successfully fetched ${posts.length} posts`);
        return posts;
        
    } catch (error) {
        console.warn(`⚠️  WordPress unavailable, using ${fallbackData.posts.length} fallback posts`);
        console.error('WordPress Error:', error);
        
        // Return fallback posts
        return fallbackData.posts.slice(0, perPage);
    }
};

export const getPostBySlug = async (slug: string) => {
    try {
        console.log(`Fetching post by slug: ${slug} from ${apiUrl}`);
        const response = await fetch(`${apiUrl}/posts?slug=${slug}&_embed`);
        
        if (!response.ok) {
            console.error(`Failed to fetch post. Status: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch post: ${response.status} ${response.statusText}`);
        }
        
        const results = await response.json();
        
        if (!results.length) {
            console.error(`Post not found with slug: ${slug}`);
            throw new Error(`Post not found with slug: ${slug}`);
        }        const [post] = results;
        const { 
            title: { rendered: title }, 
            excerpt: { rendered: excerpt },
            content: { rendered: content }, 
            date, 
            modified,
            slug: postSlug,
            featured_media,
            author,
            categories,
            tags,
            claps_count,
            _embedded
        } = post;

        // Get featured image if available
        let featuredImage = null;
        if (featured_media && _embedded && _embedded['wp:featuredmedia']) {
            featuredImage = _embedded['wp:featuredmedia'][0]?.source_url;
        }

        // Extract author information
        let authorInfo = null;
        if (_embedded && _embedded.author && _embedded.author[0]) {
            const authorData = _embedded.author[0];
            authorInfo = {
                name: authorData.name,
                description: authorData.description,
                avatar: authorData.avatar_urls?.['96'] || authorData.avatar_urls?.['48'] || '',
                url: authorData.url
            };
        }

        // Extract categories and tags
        let categoriesData = [];
        let tagsData = [];
        if (_embedded && _embedded['wp:term']) {
            const terms = _embedded['wp:term'].flat();
            categoriesData = terms.filter(term => term.taxonomy === 'category').map(cat => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug
            }));
            tagsData = terms.filter(term => term.taxonomy === 'post_tag').map(tag => ({
                id: tag.id,
                name: tag.name,
                slug: tag.slug
            }));
        }

        // Calculate reading time
        const wordCount = content ? content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));

        console.log(`Successfully fetched post: ${title}`);
        return { 
            title, 
            content, 
            excerpt, 
            date, 
            modified,
            slug: postSlug, 
            featuredImage,
            author: authorInfo,
            categories: categoriesData,
            tags: tagsData,
            claps: claps_count || 0,
            readingTime: `${readingTime} min`,
            id: post.id
        };
        
    } catch (error) {
        console.error('Error in getPostBySlug:', error);
        throw error; // Re-throw for individual post pages
    }
};