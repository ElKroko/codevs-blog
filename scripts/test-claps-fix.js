/**
 * Test script para verificar que los endpoints de claps funcionen
 * después del fix del orden de registro
 */

import fetch from 'node-fetch';

async function testClapsAfterFix() {
    const baseURL = 'https://cms.kroko.cl';
    console.log('🔧 Testing claps endpoints after fix...\n');
    
    // Test 1: Stats endpoint
    try {
        console.log('1️⃣ Testing /claps/stats endpoint...');
        const statsResponse = await fetch(`${baseURL}/wp-json/codevs/v1/claps/stats`);
        console.log(`   Status: ${statsResponse.status} ${statsResponse.statusText}`);
        
        if (statsResponse.ok) {
            const data = await statsResponse.json();
            console.log('   ✅ Stats endpoint working!');
            console.log(`   📊 Total posts with claps: ${data.total_posts || 0}`);
            console.log(`   👏 Total claps: ${data.total_claps || 0}`);
        } else {
            console.log(`   ❌ Stats endpoint error: ${statsResponse.status}`);
            const errorText = await statsResponse.text();
            console.log(`   Error: ${errorText.substring(0, 200)}...`);
        }
    } catch (error) {
        console.log(`   ❌ Stats endpoint error: ${error.message}`);
    }
    
    // Test 2: Individual post endpoint (should work for existing posts)
    try {
        console.log('\n2️⃣ Testing individual post endpoint...');
        
        // First, get a real post slug
        const postsResponse = await fetch(`${baseURL}/wp-json/wp/v2/posts?per_page=1`);
        if (postsResponse.ok) {
            const posts = await postsResponse.json();
            if (posts.length > 0) {
                const testSlug = posts[0].slug;
                console.log(`   Using real post slug: ${testSlug}`);
                
                const clapResponse = await fetch(`${baseURL}/wp-json/codevs/v1/claps/${testSlug}`);
                console.log(`   Status: ${clapResponse.status} ${clapResponse.statusText}`);
                
                if (clapResponse.ok) {
                    const data = await clapResponse.json();
                    console.log('   ✅ Individual post endpoint working!');
                    console.log(`   👏 Claps for "${data.post_title}": ${data.claps}`);
                } else {
                    console.log(`   ❌ Individual post error: ${clapResponse.status}`);
                    const errorText = await clapResponse.text();
                    console.log(`   Error: ${errorText.substring(0, 200)}...`);
                }
            } else {
                console.log('   ⚠️ No posts found to test with');
            }
        }
    } catch (error) {
        console.log(`   ❌ Individual post error: ${error.message}`);
    }
    
    // Test 3: Verify routing order
    console.log('\n3️⃣ Testing routing priority...');
    console.log('   The /stats endpoint should NOT be caught by the individual post pattern');
    console.log('   If stats works and individual posts work, routing is fixed! ✅');
    
    console.log('\n📋 Summary:');
    console.log('   - Fix applied: Reordered endpoint registration');
    console.log('   - /stats now registers BEFORE the generic /{slug} pattern');
    console.log('   - This prevents "stats" from being treated as a post slug');
    console.log('\n🚀 Next step: Upload the fixed functions.php to cms.kroko.cl');
}

testClapsAfterFix().catch(console.error);
