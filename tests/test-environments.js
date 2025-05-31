// scripts/test-environments.js
async function testBothEnvironments() {
    console.log('🧪 Testing Both Environments\n');
    
    // Test local
    console.log('1️⃣ Testing LOCAL environment...');
    try {
        const localResponse = await fetch('http://localhost:8881/wp-json/wp/v2/posts?per_page=1');
        if (localResponse.ok) {
            console.log('   ✅ Local WordPress: OK');
        } else {
            console.log('   ❌ Local WordPress: Error', localResponse.status);
        }
    } catch (error) {
        console.log('   ❌ Local WordPress: Not accessible');
    }
    
    // Test production
    console.log('\n2️⃣ Testing PRODUCTION environment...');
    try {
        const prodResponse = await fetch('https://cms.kroko.cl/wp-json/wp/v2/posts?per_page=1');
        if (prodResponse.ok) {
            console.log('   ✅ Production WordPress: OK');
        } else {
            console.log('   ❌ Production WordPress: Error', prodResponse.status);
        }
    } catch (error) {
        console.log('   ❌ Production WordPress: Not accessible');
    }
    
    console.log('\n🔍 Environment Detection:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   WP_API_URL: ${process.env.WP_API_URL}`);
}

testBothEnvironments();