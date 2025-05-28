// Test script to verify cache functionality
import { WordPressKnowledgeService } from './src/lib/wp-knowledge.js';

const wpKnowledgeService = new WordPressKnowledgeService();

async function testCache() {
  console.log('🧪 Testing Cache Functionality\n');
  
  try {
    // Test 1: Initial fetch (should hit the API)
    console.log('1️⃣ First fetch (should hit API):');
    const startTime1 = Date.now();
    const posts1 = await wpKnowledgeService.getAllPosts();
    const endTime1 = Date.now();
    console.log(`   ✅ Fetched ${posts1.length} posts in ${endTime1 - startTime1}ms\n`);
    
    // Test 2: Second fetch (should use cache)
    console.log('2️⃣ Second fetch (should use cache):');
    const startTime2 = Date.now();
    const posts2 = await wpKnowledgeService.getAllPosts();
    const endTime2 = Date.now();
    console.log(`   ⚡ Fetched ${posts2.length} posts in ${endTime2 - startTime2}ms\n`);
    
    // Test 3: Cache stats
    console.log('3️⃣ Cache statistics:');
    const stats = wpKnowledgeService.getCacheStats();
    console.log(`   📊 Cache size: ${stats.size} entries`);
    console.log(`   🔑 Cache keys: ${stats.keys.join(', ')}\n`);
    
    // Test 4: Single post cache
    if (posts1.length > 0) {
      const firstPost = posts1[0];
      console.log('4️⃣ Testing single post cache:');
      
      const startTime3 = Date.now();
      const post1 = await wpKnowledgeService.getPostBySlug(firstPost.slug);
      const endTime3 = Date.now();
      console.log(`   ✅ First fetch of "${firstPost.slug}" in ${endTime3 - startTime3}ms`);
      
      const startTime4 = Date.now();
      const post2 = await wpKnowledgeService.getPostBySlug(firstPost.slug);
      const endTime4 = Date.now();
      console.log(`   ⚡ Cached fetch of "${firstPost.slug}" in ${endTime4 - startTime4}ms\n`);
    }
    
    // Test 5: Enhanced features
    if (posts1.length > 0) {
      const samplePost = posts1[0];
      console.log('5️⃣ Enhanced features verification:');
      console.log(`   📂 Category: ${samplePost.category_slug}`);
      console.log(`   ⏱️ Reading time: ${samplePost.reading_time}`);
      console.log(`   📊 Ranking: ${samplePost.ranking}/5`);
      console.log(`   📎 Attachments: ${samplePost.attachments?.length || 0}`);
      console.log(`   🔗 Resources: ${samplePost.resources?.length || 0}`);
      console.log(`   🏷️ Tags: ${samplePost.tags_list?.join(', ') || 'None'}\n`);
    }
    
    // Test 6: Clear cache
    console.log('6️⃣ Cache cleanup:');
    wpKnowledgeService.clearCache();
    const statsAfterClear = wpKnowledgeService.getCacheStats();
    console.log(`   🧹 Cache cleared. Size: ${statsAfterClear.size} entries\n`);
    
    console.log('✅ All cache tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCache();
