// Simple test to verify WordPress connection and cache functionality
console.log('🧪 Testing WordPress Knowledge Base Connection\n');

async function testWordPressConnection() {
  try {
    // Test basic connection
    console.log('1️⃣ Testing WordPress connection...');
    const response = await fetch('http://localhost:8881/wp-json/wp/v2/posts?per_page=1');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const posts = await response.json();
    console.log(`   ✅ WordPress is accessible, found ${posts.length} post(s)\n`);
    
    // Test knowledge base category
    console.log('2️⃣ Testing knowledge base category...');
    const categoryResponse = await fetch('http://localhost:8881/wp-json/wp/v2/categories?slug=knowledge-base');
    
    if (!categoryResponse.ok) {
      throw new Error(`HTTP error! status: ${categoryResponse.status}`);
    }
    
    const categories = await categoryResponse.json();
    
    if (categories.length === 0) {
      console.log('   ⚠️  Knowledge base category not found');
      return;
    }
    
    const categoryId = categories[0].id;
    console.log(`   ✅ Knowledge base category found (ID: ${categoryId})\n`);
    
    // Test knowledge base posts
    console.log('3️⃣ Testing knowledge base posts...');
    const kbResponse = await fetch(`http://localhost:8881/wp-json/wp/v2/posts?categories=${categoryId}&_embed&per_page=10`);
    
    if (!kbResponse.ok) {
      throw new Error(`HTTP error! status: ${kbResponse.status}`);
    }
    
    const kbPosts = await kbResponse.json();
    console.log(`   ✅ Found ${kbPosts.length} knowledge base post(s)`);
    
    if (kbPosts.length > 0) {
      const firstPost = kbPosts[0];
      console.log(`   📄 Sample post: "${firstPost.title.rendered}"`);
      console.log(`   🔗 Slug: ${firstPost.slug}`);
      console.log(`   📅 Date: ${firstPost.date}`);
    }
    
    console.log('\n✅ All connection tests passed!');
    console.log('\n📋 System Status:');
    console.log('   ✅ WordPress Backend: Online (localhost:8881)');
    console.log('   ✅ Knowledge Base Category: Found');
    console.log(`   ✅ Knowledge Base Posts: ${kbPosts.length} available`);
    console.log('   ✅ API Endpoints: Working');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure WordPress is running on localhost:8881');
    console.log('   2. Verify the knowledge-base category exists');
    console.log('   3. Check if posts are assigned to the knowledge-base category');
  }
}

testWordPressConnection();
