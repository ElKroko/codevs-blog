#!/usr/bin/env node

/**
 * 🧪 CODEVS TEST DEPLOY - Verificación de Despliegue
 * 
 * Script para probar el estado del sistema en producción
 * antes y después de los despliegues
 */

import { performance } from 'perf_hooks';

class DeploymentTester {
    async run() {
        console.log('🧪 CODEVS - Verificación de Despliegue');
        console.log('=====================================\n');
        
        await this.testWordPressAPI();
        await this.testFrontendSite();
        await this.testIntegration();
        
        console.log('\n🎯 Resumen de Tests Completado');
    }
    
    async testWordPressAPI() {
        console.log('🔧 Testing WordPress API (cms.kroko.cl)...');
        
        try {
            const fetch = (await import('node-fetch')).default;
            
            // Test 1: Basic API
            const start1 = performance.now();
            const response1 = await fetch('https://cms.kroko.cl/wp-json/wp/v2/posts?per_page=1');
            const end1 = performance.now();
            
            if (response1.ok) {
                const data = await response1.json();
                console.log(`  ✅ Posts API: ${response1.status} (${Math.round(end1 - start1)}ms)`);
                console.log(`     📊 ${data.length} posts encontrados`);
            } else {
                console.log(`  ❌ Posts API: ${response1.status}`);
                return false;
            }
            
            // Test 2: Knowledge Base API
            const start2 = performance.now();
            const response2 = await fetch('https://cms.kroko.cl/wp-json/wp/v2/knowledge-base?per_page=1');
            const end2 = performance.now();
            
            if (response2.ok) {
                const kbData = await response2.json();
                console.log(`  ✅ Knowledge Base API: ${response2.status} (${Math.round(end2 - start2)}ms)`);
                console.log(`     📊 ${kbData.length} entradas KB encontradas`);
            } else if (response2.status === 404) {
                console.log(`  ⚠️  Knowledge Base API: No encontrado (normal si vacío)`);
            } else {
                console.log(`  ❌ Knowledge Base API: ${response2.status}`);
            }
            
            // Test 3: Categories
            const response3 = await fetch('https://cms.kroko.cl/wp-json/wp/v2/categories');
            if (response3.ok) {
                const categories = await response3.json();
                const kbCategory = categories.find(cat => cat.slug === 'knowledge-base');
                if (kbCategory) {
                    console.log(`  ✅ Categoría KB encontrada: ID ${kbCategory.id}`);
                } else {
                    console.log(`  ⚠️  Categoría 'knowledge-base' no encontrada`);
                }
            }
            
            return true;
            
        } catch (error) {
            console.log(`  ❌ Error WordPress API: ${error.message}`);
            return false;
        }
    }
    
    async testFrontendSite() {
        console.log('\n🌐 Testing Frontend Site (codevs.kroko.cl)...');
        
        try {
            const fetch = (await import('node-fetch')).default;
            
            // Test homepage
            const start = performance.now();
            const response = await fetch('https://codevs.kroko.cl/', {
                timeout: 10000
            });
            const end = performance.now();
            
            if (response.ok) {
                const html = await response.text();
                console.log(`  ✅ Homepage: ${response.status} (${Math.round(end - start)}ms)`);
                
                // Check for key elements
                if (html.includes('CODEVS')) {
                    console.log('     📄 Título CODEVS encontrado');
                }
                if (html.includes('knowledge') || html.includes('Knowledge')) {
                    console.log('     📚 Contenido Knowledge Base detectado');
                }
                if (html.includes('astro')) {
                    console.log('     🚀 Build Astro detectado');
                }
                
                return true;
            } else {
                console.log(`  ❌ Homepage: ${response.status}`);
                return false;
            }
            
        } catch (error) {
            console.log(`  ❌ Error Frontend: ${error.message}`);
            return false;
        }
    }
    
    async testIntegration() {
        console.log('\n🔗 Testing Frontend-Backend Integration...');
        
        try {
            const fetch = (await import('node-fetch')).default;
            
            // Simular llamada desde frontend a backend
            const response = await fetch('https://cms.kroko.cl/wp-json/wp/v2/posts?per_page=3', {
                headers: {
                    'Origin': 'https://codevs.kroko.cl',
                    'Referer': 'https://codevs.kroko.cl/'
                }
            });
            
            if (response.ok) {
                // Check CORS headers
                const corsHeader = response.headers.get('access-control-allow-origin');
                if (corsHeader && (corsHeader === '*' || corsHeader.includes('codevs.kroko.cl'))) {
                    console.log('  ✅ CORS configurado correctamente');
                } else {
                    console.log('  ⚠️  CORS header missing o incorrecto');
                }
                
                const data = await response.json();
                console.log(`  ✅ Integración API: ${data.length} posts recibidos`);
                
                // Verificar estructura de datos
                if (data[0] && data[0].title && data[0].content) {
                    console.log('  ✅ Estructura de datos correcta');
                } else {
                    console.log('  ⚠️  Estructura de datos incompleta');
                }
                
                return true;
            } else {
                console.log(`  ❌ Integration test failed: ${response.status}`);
                return false;
            }
            
        } catch (error) {
            console.log(`  ❌ Error Integration: ${error.message}`);
            return false;
        }
    }
}

new DeploymentTester().run().catch(console.error);
