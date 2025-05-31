/**
 * Debug script to test WordPress post lookup issues
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugWordPressPosts() {
    console.log('🔍 Debugging WordPress Post Lookup Issues...\n');
    
    try {
        // 1. Test basic WordPress API
        console.log('1. Testing basic WordPress API...');
        const baseResponse = await fetch('https://cms.kroko.cl/wp-json/');
        if (baseResponse.ok) {
            console.log('✅ WordPress API is accessible');
        } else {
            console.log('❌ WordPress API not accessible');
            return;
        }
        
        // 2. Get posts with full details
        console.log('\n2. Getting posts with full details...');
        const postsResponse = await fetch('https://cms.kroko.cl/wp-json/wp/v2/posts?per_page=5');
        const posts = await postsResponse.json();
        
        console.log(`Found ${posts.length} posts:`);
        posts.forEach((post, index) => {
            console.log(`   ${index + 1}. ID: ${post.id}, Slug: "${post.slug}"`);
            console.log(`      Title: "${post.title.rendered}"`);
            console.log(`      Link: ${post.link}`);
        });
        
        // 3. Test claps endpoints for each post
        console.log('\n3. Testing claps endpoints for each post...');
        for (const post of posts) {
            const clapUrl = `https://cms.kroko.cl/wp-json/codevs/v1/claps/${post.slug}`;
            console.log(`\n   Testing: ${post.slug}`);
            console.log(`   URL: ${clapUrl}`);
            
            try {
                const clapResponse = await fetch(clapUrl);
                const clapData = await clapResponse.json();
                
                if (clapResponse.ok) {
                    console.log(`   ✅ SUCCESS: ${JSON.stringify(clapData)}`);
                } else {
                    console.log(`   ❌ FAILED (${clapResponse.status}): ${JSON.stringify(clapData)}`);
                }
            } catch (error) {
                console.log(`   ⚠️  ERROR: ${error.message}`);
            }
        }
        
        // 4. Test stats endpoint
        console.log('\n4. Testing claps stats endpoint...');
        const statsResponse = await fetch('https://cms.kroko.cl/wp-json/codevs/v1/claps/stats');
        const statsData = await statsResponse.json();
        
        if (statsResponse.ok) {
            console.log('✅ Stats endpoint working:');
            console.log(`   Total posts: ${statsData.total_posts}`);
            console.log(`   Total claps: ${statsData.total_claps}`);
        } else {
            console.log(`❌ Stats endpoint failed: ${JSON.stringify(statsData)}`);
        }
        
        // 5. Test POST to add claps
        console.log('\n5. Testing POST to add claps...');
        if (posts.length > 0) {
            const testPost = posts[0];
            const postUrl = `https://cms.kroko.cl/wp-json/codevs/v1/claps/${testPost.slug}`;
            
            try {
                const postResponse = await fetch(postUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                const postData = await postResponse.json();
                
                if (postResponse.ok) {
                    console.log(`✅ POST SUCCESS for "${testPost.slug}": ${JSON.stringify(postData)}`);
                } else {
                    console.log(`❌ POST FAILED for "${testPost.slug}" (${postResponse.status}): ${JSON.stringify(postData)}`);
                }
            } catch (error) {
                console.log(`⚠️  POST ERROR: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log(`\n💥 Script error: ${error.message}`);
    }
}

// Run the debug script
debugWordPressPosts().then(() => {
    console.log('\n🏁 Debug script completed');
}).catch(error => {
    console.error('💥 Script failed:', error);
});
