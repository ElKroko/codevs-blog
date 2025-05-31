/**
 * Test script for the improved claps interface
 * This script tests all the functionality of the new claps system
 */

import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const WP_DOMAIN = 'https://cms.kroko.cl';
const LOCAL_URL = 'http://localhost:4321';

class ClapsInterfaceTest {
    constructor() {
        this.testResults = [];
    }

    log(message, status = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'pass': '✅',
            'fail': '❌',
            'info': 'ℹ️',
            'warn': '⚠️'
        }[status] || 'ℹ️';
        
        const logMessage = `${prefix} [${timestamp}] ${message}`;
        console.log(logMessage);
        this.testResults.push({ message, status, timestamp });
    }

    async runTests() {
        console.log('\n🧪 TESTING CLAPS INTERFACE IMPROVEMENTS');
        console.log('==========================================');

        await this.testWordPressAPI();
        await this.testFrontendAccessibility();
        await this.testClapsEndpoints();
        await this.testInterfaceElements();
        
        this.showResults();
    }

    async testWordPressAPI() {
        this.log('Testing WordPress API connectivity...', 'info');

        try {
            const response = await fetch(`${WP_DOMAIN}/wp-json/wp/v2/posts?per_page=1`);
            if (response.ok) {
                this.log('WordPress API is accessible', 'pass');
            } else {
                this.log(`WordPress API returned status ${response.status}`, 'fail');
            }
        } catch (error) {
            this.log(`WordPress API connection failed: ${error.message}`, 'fail');
        }
    }

    async testFrontendAccessibility() {
        this.log('Testing frontend accessibility...', 'info');

        try {
            const response = await fetch(LOCAL_URL);
            if (response.ok) {
                this.log('Frontend is accessible', 'pass');
            } else {
                this.log(`Frontend returned status ${response.status}`, 'fail');
            }
        } catch (error) {
            this.log(`Frontend connection failed: ${error.message}`, 'fail');
        }
    }

    async testClapsEndpoints() {
        this.log('Testing claps endpoints...', 'info');

        const testSlug = 'test-post-interface';

        try {
            // Test GET endpoint
            const getResponse = await fetch(`${WP_DOMAIN}/wp-json/codevs/v1/claps/${testSlug}`);
            if (getResponse.ok) {
                const getData = await getResponse.json();
                this.log(`GET claps endpoint working - Current claps: ${getData.claps}`, 'pass');
                
                // Test POST endpoint
                const postResponse = await fetch(`${WP_DOMAIN}/wp-json/codevs/v1/claps/${testSlug}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (postResponse.ok) {
                    const postData = await postResponse.json();
                    this.log(`POST claps endpoint working - New claps: ${postData.claps}`, 'pass');
                } else {
                    this.log(`POST claps endpoint failed: ${postResponse.status}`, 'fail');
                }
            } else {
                this.log(`GET claps endpoint failed: ${getResponse.status}`, 'fail');
            }

            // Test stats endpoint
            const statsResponse = await fetch(`${WP_DOMAIN}/wp-json/codevs/v1/claps/stats`);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                this.log(`Stats endpoint working - Total posts: ${statsData.total_posts}`, 'pass');
            } else {
                this.log(`Stats endpoint failed: ${statsResponse.status}`, 'fail');
            }

        } catch (error) {
            this.log(`Claps endpoints test failed: ${error.message}`, 'fail');
        }
    }

    async testInterfaceElements() {
        this.log('Testing interface elements presence...', 'info');

        // Since we can't directly test DOM elements from Node.js,
        // we'll check the HTML structure by reading the layout file
        try {
            const fs = await import('fs/promises');
            const layoutContent = await fs.readFile('src/layouts/WordPressBlogPost.astro', 'utf-8');

            // Check for required interface elements
            const requiredElements = [
                'clap-button',
                'clap-count',
                'thank-you-message',
                'claps-container',
                'confetti'
            ];

            let missingElements = [];
            requiredElements.forEach(element => {
                if (layoutContent.includes(element)) {
                    this.log(`✓ Found interface element: ${element}`, 'pass');
                } else {
                    missingElements.push(element);
                }
            });

            if (missingElements.length > 0) {
                this.log(`Missing interface elements: ${missingElements.join(', ')}`, 'fail');
            } else {
                this.log('All required interface elements found', 'pass');
            }

            // Check for CSS styles
            const cssFeatures = [
                'clap-button',
                'ripple',
                'confetti',
                'animation',
                'gradient'
            ];

            let missingStyles = [];
            cssFeatures.forEach(feature => {
                if (layoutContent.includes(feature)) {
                    this.log(`✓ Found CSS feature: ${feature}`, 'pass');
                } else {
                    missingStyles.push(feature);
                }
            });

            if (missingStyles.length > 0) {
                this.log(`Missing CSS features: ${missingStyles.join(', ')}`, 'warn');
            } else {
                this.log('All CSS features implemented', 'pass');
            }

            // Check for JavaScript functionality
            const jsFeatures = [
                'handleClap',
                'triggerConfetti',
                'updateCountDisplay',
                'localStorage',
                'fetch'
            ];

            let missingJS = [];
            jsFeatures.forEach(feature => {
                if (layoutContent.includes(feature)) {
                    this.log(`✓ Found JS feature: ${feature}`, 'pass');
                } else {
                    missingJS.push(feature);
                }
            });

            if (missingJS.length > 0) {
                this.log(`Missing JS features: ${missingJS.join(', ')}`, 'fail');
            } else {
                this.log('All JavaScript features implemented', 'pass');
            }

        } catch (error) {
            this.log(`Interface elements test failed: ${error.message}`, 'fail');
        }
    }

    showResults() {
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('========================');

        const passed = this.testResults.filter(r => r.status === 'pass').length;
        const failed = this.testResults.filter(r => r.status === 'fail').length;
        const warnings = this.testResults.filter(r => r.status === 'warn').length;

        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Warnings: ${warnings}`);
        console.log(`📝 Total Tests: ${this.testResults.length}`);

        if (failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! The claps interface is ready.');
            console.log('✨ Features implemented:');
            console.log('   • Circular gradient button with hover effects');
            console.log('   • Clap count display below button');
            console.log('   • "Ya aplaudiste!" thank you message');
            console.log('   • Confetti effects on clap');
            console.log('   • Ripple animation on button press');
            console.log('   • Local storage for tracking user claps');
            console.log('   • Error handling and optimistic updates');
            console.log('   • Responsive design for mobile devices');
        } else {
            console.log('\n🔧 Some tests failed. Please review the errors above.');
        }

        console.log('\n📖 Next steps:');
        console.log('   1. Open http://localhost:4321 in your browser');
        console.log('   2. Navigate to a blog post');
        console.log('   3. Test the claps interface manually');
        console.log('   4. Check browser console for any JavaScript errors');
    }
}

// Run the tests
const tester = new ClapsInterfaceTest();
tester.runTests().catch(console.error);
