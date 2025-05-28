#!/usr/bin/env node

/**
 * Production Deployment Script for CODEVS Knowledge Base
 * 
 * This script helps verify production configuration and build
 * the application for deployment to codevs.kroko.cl
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 CODEVS Production Deployment Helper\n');

// Check environment files
console.log('📋 Checking environment configuration...');

const envProdPath = '.env.production';
const envPath = '.env';

if (fs.existsSync(envProdPath)) {
    console.log('✅ .env.production file exists');
    
    const envContent = fs.readFileSync(envProdPath, 'utf8');
    console.log('🔍 Production environment variables:');
    console.log(envContent);
} else {
    console.log('❌ .env.production file missing');
}

// Check Astro configuration
console.log('\n📋 Checking Astro configuration...');

const astroConfigPath = 'astro.config.mjs';
if (fs.existsSync(astroConfigPath)) {
    const configContent = fs.readFileSync(astroConfigPath, 'utf8');
    
    if (configContent.includes('codevs.kroko.cl')) {
        console.log('✅ Astro config has correct production site URL');
    } else {
        console.log('❌ Astro config missing production site URL');
    }
} else {
    console.log('❌ astro.config.mjs file missing');
}

// Check package.json scripts
console.log('\n📋 Checking package.json scripts...');

const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('Available scripts:');
    Object.keys(packageJson.scripts || {}).forEach(script => {
        console.log(`  - npm run ${script}`);
    });
} else {
    console.log('❌ package.json file missing');
}

console.log('\n🎯 Production Deployment Checklist:');
console.log('');
console.log('WordPress Setup (cms.kroko.cl):');
console.log('  □ WordPress installed on cms.kroko.cl');
console.log('  □ Knowledge Base Manager plugin activated');
console.log('  □ Custom post types configured');
console.log('  □ CORS headers configured for codevs.kroko.cl');
console.log('  □ SSL certificate installed');
console.log('');
console.log('Astro Frontend Setup (codevs.kroko.cl):');
console.log('  □ cPanel Node.js application created');
console.log('  □ Node.js version 18+ selected');
console.log('  □ Environment variables configured');
console.log('  □ Build and upload dist/ folder');
console.log('  □ SSL certificate installed');
console.log('');
console.log('Testing:');
console.log('  □ Test WordPress API endpoints');
console.log('  □ Test Astro site loads');
console.log('  □ Test knowledge base posts display');
console.log('  □ Test search functionality');
console.log('');

console.log('🔧 Next Steps:');
console.log('1. Run: npm run build');
console.log('2. Upload dist/ folder to codevs.kroko.cl');
console.log('3. Configure cPanel Node.js app');
console.log('4. Test both domains');
console.log('');

// Test production API connection (if WordPress is already set up)
console.log('🌐 Testing production API connection...');

const testConnection = async () => {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://cms.kroko.cl/wp-json/wp/v2/posts?per_page=1', {
            timeout: 5000
        });
        
        if (response.ok) {
            console.log('✅ WordPress API connection successful');
            console.log(`   Status: ${response.status}`);
        } else {
            console.log('⚠️  WordPress API responded with error');
            console.log(`   Status: ${response.status}`);
        }
    } catch (error) {
        console.log('❌ WordPress API connection failed');
        console.log(`   Error: ${error.message}`);
        console.log('   This is expected if WordPress is not yet deployed');
    }
};

testConnection();
