// Test WordPress API without local server dependency
console.log('🧪 Testing WordPress API Production\n');

async function testProductionAPI() {
    const baseURL = 'https://cms.kroko.cl';
    
    console.log('🔍 Testing WordPress API endpoints...\n');
    
    // Test basic WordPress API
    try {
        console.log('1️⃣ Testing main site...');
        const mainResponse = await fetch(baseURL);
        console.log(`   Status: ${mainResponse.status} ${mainResponse.statusText}`);
        
        if (mainResponse.status === 200) {
            console.log('   ✅ Main site is working');
        } else {
            console.log(`   ❌ Main site error: ${mainResponse.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Main site error: ${error.message}`);
    }
    
    // Test WordPress REST API
    try {
        console.log('\n2️⃣ Testing WordPress REST API...');
        const apiResponse = await fetch(`${baseURL}/wp-json/wp/v2/posts?per_page=1`);
        console.log(`   Status: ${apiResponse.status} ${apiResponse.statusText}`);
        
        if (apiResponse.status === 200) {
            const posts = await apiResponse.json();
            console.log('   ✅ REST API is working');
            console.log(`   📝 Found ${posts.length} post(s)`);
        } else {
            console.log(`   ❌ REST API error: ${apiResponse.status}`);
        }
    } catch (error) {
        console.log(`   ❌ REST API error: ${error.message}`);
    }
    
    // Test categories endpoint
    try {
        console.log('\n3️⃣ Testing categories endpoint...');
        const categoriesResponse = await fetch(`${baseURL}/wp-json/wp/v2/categories`);
        console.log(`   Status: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
        
        if (categoriesResponse.status === 200) {
            const categories = await categoriesResponse.json();
            console.log('   ✅ Categories endpoint is working');
            console.log(`   📂 Found ${categories.length} categories`);
            
            // Look for knowledge-base category
            const kbCategory = categories.find(cat => cat.slug === 'knowledge-base');
            if (kbCategory) {
                console.log(`   ✅ Knowledge Base category found (ID: ${kbCategory.id})`);
            } else {
                console.log('   ⚠️ Knowledge Base category not found');
            }
        } else {
            console.log(`   ❌ Categories error: ${categoriesResponse.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Categories error: ${error.message}`);
    }
    
    // Test knowledge-base posts
    try {
        console.log('\n4️⃣ Testing knowledge-base posts...');
        const kbResponse = await fetch(`${baseURL}/wp-json/wp/v2/posts?categories_exclude=&per_page=5&search=`);
        console.log(`   Status: ${kbResponse.status} ${kbResponse.statusText}`);
        
        if (kbResponse.status === 200) {
            const posts = await kbResponse.json();
            console.log('   ✅ Posts endpoint is working');
            console.log(`   📝 Found ${posts.length} posts`);
            
            if (posts.length > 0) {
                console.log('\n   📄 Sample post titles:');
                posts.slice(0, 3).forEach((post, index) => {
                    console.log(`   ${index + 1}. ${post.title.rendered}`);
                });
            }
        } else {
            console.log(`   ❌ Posts error: ${kbResponse.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Posts error: ${error.message}`);
    }
    
    console.log('\n🏁 Test completed!');
}

testProductionAPI();
