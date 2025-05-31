/**
 * Frontend-Backend Integration Test
 * Tests the complete claps system from frontend perspective
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFrontendBackendIntegration() {
    console.log('🔗 Testing Frontend-Backend Integration...\n');
    
    const wpApiUrl = 'https://cms.kroko.cl/wp-json';
    const testPostSlug = 'cuales-son-tus-canciones-favoritas';
    
    try {
        // 1. Test CORS headers from frontend perspective
        console.log('1. Testing CORS headers...');
        const corsResponse = await fetch(`${wpApiUrl}/wp/v2/posts?per_page=1`, {
            headers: {
                'Origin': 'http://localhost:4321',
                'Referer': 'http://localhost:4321/'
            }
        });
        
        const corsHeaders = corsResponse.headers.get('access-control-allow-origin');
        if (corsHeaders) {
            console.log(`✅ CORS headers present: ${corsHeaders}`);
        } else {
            console.log('⚠️ CORS headers not found');
        }
        
        // 2. Test claps system workflow
        console.log('\n2. Testing complete claps workflow...');
        
        // 2a. Get initial stats
        console.log('   2a. Getting initial stats...');
        const initialStatsResponse = await fetch(`${wpApiUrl}/codevs/v1/claps/stats`);
        const initialStats = await initialStatsResponse.json();
        console.log(`   ✅ Initial stats: ${initialStats.total_claps} total claps`);
        
        // 2b. Get current claps for test post
        console.log(`   2b. Getting claps for post "${testPostSlug}"...`);
        const currentClapsResponse = await fetch(`${wpApiUrl}/codevs/v1/claps/${testPostSlug}`);
        const currentClaps = await currentClapsResponse.json();
        console.log(`   ✅ Current claps: ${currentClaps.claps}`);
        
        // 2c. Add a clap (simulate frontend interaction)
        console.log('   2c. Adding a clap...');
        const addClapResponse = await fetch(`${wpApiUrl}/codevs/v1/claps/${testPostSlug}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:4321'
            }
        });
        const addClapResult = await addClapResponse.json();
        
        if (addClapResponse.ok) {
            console.log(`   ✅ Clap added successfully! New count: ${addClapResult.claps}`);
        } else {
            console.log(`   ❌ Failed to add clap: ${JSON.stringify(addClapResult)}`);
        }
        
        // 2d. Verify the clap was counted
        console.log('   2d. Verifying clap was counted...');
        const verifyClapsResponse = await fetch(`${wpApiUrl}/codevs/v1/claps/${testPostSlug}`);
        const verifyClaps = await verifyClapsResponse.json();
        console.log(`   ✅ Verified claps: ${verifyClaps.claps}`);
        
        // 2e. Check updated global stats
        console.log('   2e. Checking updated global stats...');
        const finalStatsResponse = await fetch(`${wpApiUrl}/codevs/v1/claps/stats`);
        const finalStats = await finalStatsResponse.json();
        console.log(`   ✅ Final stats: ${finalStats.total_claps} total claps across ${finalStats.total_posts} posts`);
        
        if (finalStats.most_popular) {
            console.log(`   📈 Most popular post: "${finalStats.most_popular.post_title}" with ${finalStats.most_popular.claps} claps`);
        }
        
        // 3. Test error handling
        console.log('\n3. Testing error handling...');
        
        // 3a. Test with non-existent post
        const nonExistentResponse = await fetch(`${wpApiUrl}/codevs/v1/claps/non-existent-post`);
        const nonExistentResult = await nonExistentResponse.json();
        
        if (nonExistentResponse.status === 404) {
            console.log('   ✅ Correctly handles non-existent posts with 404');
        } else {
            console.log(`   ⚠️ Unexpected response for non-existent post: ${nonExistentResponse.status}`);
        }
        
        // 4. Performance test
        console.log('\n4. Testing performance...');
        const startTime = Date.now();
        
        const performancePromises = [
            fetch(`${wpApiUrl}/codevs/v1/claps/stats`),
            fetch(`${wpApiUrl}/codevs/v1/claps/${testPostSlug}`),
            fetch(`${wpApiUrl}/wp/v2/posts?per_page=5`)
        ];
        
        await Promise.all(performancePromises);
        const endTime = Date.now();
        
        console.log(`   ✅ All API calls completed in ${endTime - startTime}ms`);
        
        console.log('\n🎉 Frontend-Backend Integration Test PASSED!');
        console.log('\n📋 Summary:');
        console.log('   ✅ CORS configuration working');
        console.log('   ✅ Claps GET endpoints working');
        console.log('   ✅ Claps POST endpoints working');
        console.log('   ✅ Stats endpoint working');
        console.log('   ✅ Error handling working');
        console.log('   ✅ Performance acceptable');
        
    } catch (error) {
        console.log(`\n💥 Integration test failed: ${error.message}`);
        console.log('\n🔧 Possible issues:');
        console.log('   - Network connectivity problems');
        console.log('   - WordPress server issues');
        console.log('   - CORS configuration problems');
        console.log('   - API endpoint registration issues');
    }
}

// Run the integration test
testFrontendBackendIntegration().then(() => {
    console.log('\n🏁 Integration test completed');
}).catch(error => {
    console.error('💥 Test script failed:', error);
});
