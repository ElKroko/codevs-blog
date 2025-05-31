#!/usr/bin/env node

/**
 * 🧪 CODEVS CACHE TESTER
 * 
 * Script para verificar el estado del cache y headers HTTP
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class CacheTester {
    async run() {
        console.log('🧪 CODEVS Cache Tester\n');
        
        const baseUrl = 'https://codevs.kroko.cl';
        const testUrls = [
            '/',
            '/blog',
            '/proyectos',
            '/about'
        ];
        
        try {
            console.log('🔍 Verificando headers de cache...\n');
            
            for (const url of testUrls) {
                await this.testUrl(`${baseUrl}${url}`);
            }
            
            console.log('\n✅ Test de cache completado');
            console.log('\n💡 Consejos:');
            console.log('• Cache-Control: no-cache = Siempre fresh');
            console.log('• X-Deploy-Time = Timestamp del último deploy');
            console.log('• ETag = Identificador único del archivo');
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    async testUrl(url) {
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(url, { method: 'HEAD' });
            
            console.log(`📄 ${url}`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Cache-Control: ${response.headers.get('cache-control') || 'No definido'}`);
            console.log(`   ETag: ${response.headers.get('etag') || 'No definido'}`);
            console.log(`   Last-Modified: ${response.headers.get('last-modified') || 'No definido'}`);
            console.log(`   X-Deploy-Time: ${response.headers.get('x-deploy-time') || 'No definido'}`);
            console.log('');
            
        } catch (error) {
            console.log(`   ❌ Error al probar ${url}: ${error.message}\n`);
        }
    }
}

new CacheTester().run();
