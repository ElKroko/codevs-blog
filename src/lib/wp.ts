const domain = import.meta.env.WP_DOMAIN;
const apiUrl = `${domain}/wp-json/wp/v2`;
console.log(domain)

export const getPageInfo = async (slug: string) => {
    const res = await fetch(`${apiUrl}/pages?slug=${slug}`);
    if (!res.ok) {
        throw new Error('Failed to fetch page info');
    }
    const [data] = await res.json();
    const{ title: {rendered : title}, content : {rendered: content}} = data;
    console.log(data);

    return {title, content};
};

export const getLastestPosts = async ({perPage = 10}: {perPage?: number} = {}) => {
    const response = await fetch(`${apiUrl}/posts?per_page=${perPage}&_embed`);
    if (!response.ok) {
        throw new Error('Failed to fetch latest posts');
    }
    const results = await response.json();
    if (!results.length) throw new Error('No posts found');

    const posts = results.map(post => {
        const { 
            title: { rendered: title }, 
            excerpt: { rendered: excerpt },
            content: { rendered: content }, 
            date, 
            slug 
        } = post

        return { title, content, excerpt, date, slug }
    })

    return posts;
};

export const getPostBySlug = async (slug: string) => {
    const response = await fetch(`${apiUrl}/posts?slug=${slug}&_embed`);
    if (!response.ok) {
        throw new Error('Failed to fetch post');
    }
    const results = await response.json();
    if (!results.length) throw new Error('Post not found');

    const [post] = results;
    const { 
        title: { rendered: title }, 
        excerpt: { rendered: excerpt },
        content: { rendered: content }, 
        date, 
        slug: postSlug,
        featured_media,
        _embedded
    } = post;

    // Get featured image if available
    let featuredImage = null;
    if (featured_media && _embedded && _embedded['wp:featuredmedia']) {
        featuredImage = _embedded['wp:featuredmedia'][0]?.source_url;
    }

    return { title, content, excerpt, date, slug: postSlug, featuredImage };
};