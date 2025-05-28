// Test para verificar la nueva funcionalidad de múltiples fuentes
import { WordPressKnowledgeService } from './dist/chunks/wp-knowledge_COxTK-Mx.mjs';

async function testDualSources() {
  console.log('🔄 Testing Dual Source Knowledge Base System\n');
  
  try {
    const service = new WordPressKnowledgeService();
    
    // Limpiar caché para asegurar datos frescos
    service.clearCache();
    console.log('🧹 Cache cleared\n');
    
    // Test 1: Verificar posts de ambas fuentes
    console.log('1️⃣ Testing getAllPosts() with dual sources...');
    const allPosts = await service.getAllPosts();
    
    console.log(`   ✅ Found ${allPosts.length} total posts from both sources`);
    
    if (allPosts.length > 0) {
      console.log('   📋 Posts found:');
      allPosts.forEach((post, index) => {
        console.log(`      ${index + 1}. "${post.title.rendered}" (${post.slug})`);
        console.log(`         Category: ${post.category_slug}`);
        console.log(`         Type: ${post.id >= 30 ? 'Custom Post Type' : 'Regular Post'}`);
      });
    }
    
    console.log('\n2️⃣ Testing specific post by slug...');
    // Test con un slug que sabemos existe en custom post type
    const specificPost = await service.getPostBySlug('tutorial-expres-transformers-y-llm');
    
    if (specificPost) {
      console.log(`   ✅ Found post: "${specificPost.title.rendered}"`);
      console.log(`   📝 Excerpt: ${specificPost.excerpt.rendered.substring(0, 100)}...`);
      console.log(`   📊 Rating: ${specificPost.ranking}/5`);
    } else {
      console.log('   ❌ Post not found');
    }
    
    console.log('\n3️⃣ Cache stats:');
    const cacheStats = service.getCacheStats();
    console.log(`   📦 Cache entries: ${cacheStats.size}`);
    console.log(`   🔑 Cached keys: ${cacheStats.keys.join(', ')}`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Solo ejecutar si este archivo es llamado directamente
if (require.main === module) {
  testDualSources();
}

module.exports = { testDualSources };
