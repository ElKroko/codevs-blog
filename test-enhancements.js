// Test script to verify enhanced knowledge base functionality
import { wpKnowledgeService } from './src/lib/wp-knowledge.ts';

async function testEnhancements() {
  console.log('🧪 Testing Knowledge Base Enhancements\n');

  try {
    // Test connection first
    console.log('1. Testing WordPress connection...');
    const isConnected = await wpKnowledgeService.testConnection();
    console.log(`   ✅ Connection status: ${isConnected ? 'Connected' : 'Disconnected'}\n`);

    if (!isConnected) {
      console.log('   Using mock data for testing...\n');
    }

    // Test getting all posts
    console.log('2. Testing enhanced post retrieval...');
    const posts = await wpKnowledgeService.getAllPostsWithFallback();
    console.log(`   ✅ Retrieved ${posts.length} posts\n`);

    if (posts.length > 0) {
      const firstPost = posts[0];
      
      console.log('3. Testing enhanced features on first post:');
      console.log(`   📰 Title: ${firstPost.title.rendered}`);
      console.log(`   📂 Smart Category: ${firstPost.category_slug}`);
      console.log(`   ⏱️ Enhanced Reading Time: ${firstPost.reading_time}`);
      console.log(`   🔗 Resources Found: ${firstPost.resources.length}`);
      console.log(`   📎 Attachments: ${firstPost.attachments.length}`);
      console.log(`   🏷️ Tags: ${firstPost.tags_list.join(', ')}`);
      
      // Test category info
      const categoryInfo = wpKnowledgeService.getCategoryInfo(firstPost.category_slug);
      console.log(`   📊 Category Info: ${categoryInfo.icon} ${categoryInfo.name} (${categoryInfo.color})`);
      
      console.log('\n4. Testing enhanced resource extraction:');
      if (firstPost.resources.length > 0) {
        firstPost.resources.forEach((resource, index) => {
          console.log(`   ${index + 1}. ${resource.title} (${resource.type})`);
          console.log(`      🔗 ${resource.url}`);
        });
      } else {
        console.log('   No external resources found');
      }
      
      console.log('\n5. Testing enhanced attachments:');
      if (firstPost.attachments.length > 0) {
        firstPost.attachments.forEach((attachment, index) => {
          const icon = wpKnowledgeService.getAttachmentIcon(attachment.type);
          console.log(`   ${index + 1}. ${icon} ${attachment.title}`);
          console.log(`      📄 Type: ${attachment.type}`);
          if (attachment.size) console.log(`      📊 Size: ${attachment.size}`);
        });
      } else {
        console.log('   No attachments found');
      }
    }

    console.log('\n✅ All enhancement tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEnhancements();
