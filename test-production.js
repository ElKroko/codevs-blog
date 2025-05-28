#!/usr/bin/env node

/**
 * Production API Test Script
 * 
 * Tests the production WordPress API endpoints to ensure
 * everything is working correctly with the dual-source setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://cms.kroko.cl/wp-json/wp/v2';

async function testProductionAPI() {
    console.log('🧪 Testing Production API Endpoints\n');

    try {
        const fetch = (await import('node-fetch')).default;

        // Test 1: Basic connection
        console.log('1. Testing basic API connection...');
        const basicResponse = await fetch(`${BASE_URL}/posts?per_page=1`);
        if (basicResponse.ok) {
            console.log('✅ Basic API connection successful');
        } else {
            console.log(`❌ Basic API connection failed: ${basicResponse.status}`);
            return;
        }

        // Test 2: Regular posts with knowledge-base category
        console.log('\n2. Testing regular posts with knowledge-base category...');
        const categoryResponse = await fetch(`${BASE_URL}/posts?categories=knowledge-base&per_page=100`);
        if (categoryResponse.ok) {
            const categoryPosts = await categoryResponse.json();
            console.log(`✅ Found ${categoryPosts.length} regular posts with knowledge-base category`);
            
            if (categoryPosts.length > 0) {
                console.log('   Sample post titles:');
                categoryPosts.slice(0, 3).forEach(post => {
                    console.log(`   - ${post.title.rendered}`);
                });
            }
        } else {
            console.log(`❌ Failed to fetch category posts: ${categoryResponse.status}`);
        }

        // Test 3: Custom post type knowledge_base
        console.log('\n3. Testing custom post type knowledge_base...');
        const customResponse = await fetch(`${BASE_URL}/knowledge-base?per_page=100`);
        if (customResponse.ok) {
            const customPosts = await customResponse.json();
            console.log(`✅ Found ${customPosts.length} custom knowledge_base posts`);
            
            if (customPosts.length > 0) {
                console.log('   Sample post titles:');
                customPosts.slice(0, 3).forEach(post => {
                    console.log(`   - ${post.title.rendered}`);
                });
            }
        } else {
            console.log(`❌ Failed to fetch custom posts: ${customResponse.status}`);
        }

        // Test 4: Check for custom fields
        console.log('\n4. Testing custom fields...');
        const allPostsResponse = await fetch(`${BASE_URL}/posts?per_page=1`);
        if (allPostsResponse.ok) {
            const allPosts = await allPostsResponse.json();
            if (allPosts.length > 0) {
                const firstPost = allPosts[0];
                console.log('✅ Custom fields check:');
                console.log(`   - prerequisites: ${firstPost.prerequisites ? '✅' : '❌'}`);
                console.log(`   - objectives: ${firstPost.objectives ? '✅' : '❌'}`);
                console.log(`   - difficulty_level: ${firstPost.difficulty_level ? '✅' : '❌'}`);
            }
        }

        // Test 5: CORS headers
        console.log('\n5. Testing CORS headers...');
        const corsResponse = await fetch(`${BASE_URL}/posts?per_page=1`, {
            headers: {
                'Origin': 'https://codevs.kroko.cl'
            }
        });
        
        const corsHeaders = corsResponse.headers.get('access-control-allow-origin');
        if (corsHeaders) {
            console.log('✅ CORS headers present');
            console.log(`   Allow-Origin: ${corsHeaders}`);
        } else {
            console.log('⚠️  CORS headers not found - may need configuration');
        }

        console.log('\n🎉 Production API testing completed!');

    } catch (error) {
        console.log('\n❌ Production API test failed:');
        console.log(`Error: ${error.message}`);
        console.log('\nThis is expected if WordPress is not yet deployed to cms.kroko.cl');
    }
}

// Test Astro production build
async function testAstroBuild() {
    console.log('\n🏗️  Testing Astro Build Configuration\n');

    // Check if dist folder exists
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
        console.log('✅ dist/ folder exists');
          // Check key files
        const keyFiles = [
            'index.html',
            '_astro',
            'knowledge-base'
        ];

        keyFiles.forEach(file => {
            const filePath = path.join(distPath, file);
            if (fs.existsSync(filePath)) {
                console.log(`✅ ${file} exists in dist/`);
            } else {
                console.log(`❌ ${file} missing from dist/`);
            }
        });

        // Check index.html for correct base URL
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            if (indexContent.includes('codevs.kroko.cl')) {
                console.log('✅ index.html contains production site URL');
            } else {
                console.log('⚠️  index.html may not have correct production URL');
            }
        }

    } else {
        console.log('❌ dist/ folder not found');
        console.log('   Run: npm run build');
    }
}

// Main execution
async function main() {
    console.log('🚀 CODEVS Production Testing Suite\n');
    
    await testProductionAPI();
    await testAstroBuild();
    
    console.log('\n📋 Pre-deployment Checklist:');
    console.log('□ WordPress deployed to cms.kroko.cl');
    console.log('□ Knowledge Base Manager plugin active');
    console.log('□ CORS configuration added to functions.php');
    console.log('□ SSL certificates installed');
    console.log('□ Astro dist/ folder built and ready');
    console.log('□ cPanel Node.js app configured');
    console.log('□ Environment variables set in cPanel');
    
    console.log('\n🔗 Useful URLs:');
    console.log('WordPress Admin: https://cms.kroko.cl/wp-admin/');
    console.log('WordPress API: https://cms.kroko.cl/wp-json/wp/v2/posts');
    console.log('Astro Site: https://codevs.kroko.cl');
    console.log('Knowledge Base: https://codevs.kroko.cl/knowledge-base');
}

main().catch(console.error);
