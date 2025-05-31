/**
 * CODEVS - Test Claps CORS Configuration
 * Script to verify that CORS is working correctly for the claps system
 */

const https = require('https');
const http = require('http');

// Test configuration
const WORDPRESS_API_URL = 'https://cms.kroko.cl';
const ASTRO_ORIGIN = 'https://codevs.kroko.cl';
const TEST_POST_SLUG = 'test-post'; // Change this to an actual post slug

console.log('🚀 CODEVS - Testing CORS Configuration for Claps System');
console.log('=' .repeat(60));

// Test 1: Check if WordPress API is accessible
function testWordPressAPI() {
    return new Promise((resolve, reject) => {
        console.log('\n📡 Test 1: WordPress API Accessibility');
        console.log(`Testing: ${WORDPRESS_API_URL}/wp-json/wp/v2/posts`);
        
        const url = new URL(`${WORDPRESS_API_URL}/wp-json/wp/v2/posts`);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(url, {
            method: 'GET',
            headers: {
                'Origin': ASTRO_ORIGIN,
                'User-Agent': 'CODEVS-CORS-Test/1.0'
            }
        }, (res) => {
            console.log(`Status: ${res.statusCode}`);
            console.log('CORS Headers received:');
            
            Object.keys(res.headers).forEach(header => {
                if (header.toLowerCase().includes('access-control')) {
                    console.log(`  ${header}: ${res.headers[header]}`);
                }
            });
            
            if (res.statusCode === 200) {
                console.log('✅ WordPress API accessible');
                resolve(true);
            } else {
                console.log('❌ WordPress API error');
                resolve(false);
            }
        });
        
        req.on('error', (error) => {
            console.log(`❌ Request failed: ${error.message}`);
            resolve(false);
        });
        
        req.end();
    });
}

// Test 2: Test OPTIONS preflight request
function testPreflight() {
    return new Promise((resolve, reject) => {
        console.log('\n🔄 Test 2: CORS Preflight (OPTIONS) Request');
        console.log(`Testing: ${WORDPRESS_API_URL}/wp-json/codevs/v1/claps/stats`);
        
        const url = new URL(`${WORDPRESS_API_URL}/wp-json/codevs/v1/claps/stats`);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(url, {
            method: 'OPTIONS',
            headers: {
                'Origin': ASTRO_ORIGIN,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        }, (res) => {
            console.log(`Status: ${res.statusCode}`);
            console.log('Preflight CORS Headers:');
            
            let corsHeadersFound = false;
            Object.keys(res.headers).forEach(header => {
                if (header.toLowerCase().includes('access-control')) {
                    console.log(`  ${header}: ${res.headers[header]}`);
                    corsHeadersFound = true;
                }
            });
            
            if (corsHeadersFound && res.statusCode === 200) {
                console.log('✅ CORS Preflight working');
                resolve(true);
            } else {
                console.log('❌ CORS Preflight failed');
                resolve(false);
            }
        });
        
        req.on('error', (error) => {
            console.log(`❌ Preflight request failed: ${error.message}`);
            resolve(false);
        });
        
        req.end();
    });
}

// Test 3: Test claps API endpoint
function testClapsAPI() {
    return new Promise((resolve, reject) => {
        console.log('\n👏 Test 3: Claps API Endpoint');
        console.log(`Testing: ${WORDPRESS_API_URL}/wp-json/codevs/v1/claps/stats`);
        
        const url = new URL(`${WORDPRESS_API_URL}/wp-json/codevs/v1/claps/stats`);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(url, {
            method: 'GET',
            headers: {
                'Origin': ASTRO_ORIGIN,
                'Content-Type': 'application/json'
            }
        }, (res) => {
            console.log(`Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('✅ Claps API responding');
                    console.log(`Response: ${JSON.stringify(response, null, 2)}`);
                    resolve(true);
                } catch (error) {
                    console.log('❌ Invalid JSON response');
                    console.log(`Raw response: ${data}`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Claps API request failed: ${error.message}`);
            resolve(false);
        });
        
        req.end();
    });
}

// Test 4: Test actual clap POST request
function testClapPost() {
    return new Promise((resolve, reject) => {
        console.log('\n📝 Test 4: POST Clap Request');
        console.log(`Testing: ${WORDPRESS_API_URL}/wp-json/codevs/v1/claps`);
        
        const postData = JSON.stringify({
            post_slug: TEST_POST_SLUG,
            claps: 1
        });
        
        const url = new URL(`${WORDPRESS_API_URL}/wp-json/codevs/v1/claps`);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(url, {
            method: 'POST',
            headers: {
                'Origin': ASTRO_ORIGIN,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            console.log(`Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('✅ Clap POST working');
                    console.log(`Response: ${JSON.stringify(response, null, 2)}`);
                    resolve(true);
                } catch (error) {
                    console.log('❌ POST request failed');
                    console.log(`Raw response: ${data}`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ POST clap failed: ${error.message}`);
            resolve(false);
        });
        
        req.write(postData);
        req.end();
    });
}

// Run all tests
async function runAllTests() {
    console.log(`🎯 Testing CORS configuration from ${ASTRO_ORIGIN} to ${WORDPRESS_API_URL}`);
    
    const test1 = await testWordPressAPI();
    const test2 = await testPreflight();
    const test3 = await testClapsAPI();
    const test4 = await testClapPost();
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESULTS SUMMARY:');
    console.log(`WordPress API: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`CORS Preflight: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Claps API: ${test3 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Clap POST: ${test4 ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = test1 && test2 && test3 && test4;
    console.log(`\n🎯 OVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎉 CORS configuration is working correctly!');
        console.log('The claps system should now work properly.');
    } else {
        console.log('\n🚨 CORS issues detected!');
        console.log('Check the WordPress functions.php file and server configuration.');
    }
}

// Execute tests
runAllTests().catch(console.error);
