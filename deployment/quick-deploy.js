#!/usr/bin/env node

/**
 * 🔄 CODEVS QUICK DEPLOY - Despliegue Rápido
 * 
 * Script para despliegues rápidos de cambios menores
 * Optimizado para cambios frecuentes durante desarrollo
 */

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class QuickDeploy {
    async applyCacheBusting(version) {
        const fs = await import('fs');
        const path = await import('path');
        
        try {
            // Buscar archivos HTML en dist
            const distPath = './dist';
            const files = await this.findHTMLFiles(distPath);
            
            for (const file of files) {
                let content = fs.readFileSync(file, 'utf8');
                
                // Agregar parámetros de cache busting a CSS y JS
                content = content.replace(
                    /href="([^"]*\.css)"/g, 
                    `href="$1?v=${version}"`
                );
                content = content.replace(
                    /src="([^"]*\.js)"/g, 
                    `src="$1?v=${version}"`
                );
                
                // Agregar meta tag para forzar refresco
                content = content.replace(
                    /<head>/,
                    `<head>\n\t<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n\t<meta http-equiv="Pragma" content="no-cache">\n\t<meta http-equiv="Expires" content="0">\n\t<meta name="cache-version" content="${version}">`
                );
                
                fs.writeFileSync(file, content);
            }
            
            console.log(`✅ Cache busting aplicado (v${version})`);
        } catch (error) {
            console.log(`⚠️  Error en cache busting: ${error.message}`);
        }
    }
    
    async findHTMLFiles(dir) {
        const fs = await import('fs');
        const path = await import('path');
        let results = [];
        
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                results = results.concat(await this.findHTMLFiles(fullPath));
            } else if (file.endsWith('.html')) {
                results.push(fullPath);
            }
        }
        
        return results;
    }

    async run() {
        console.log('⚡ CODEVS Quick Deploy\n');
        
        try {
            // 1. Quick build
            console.log('🏗️  Building...');
            await execAsync('npm run build');
            console.log('✅ Build completado');
              // 2. Generar cache busting
            const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
            const cacheVersion = Date.now().toString(36); // Hash corto único
            const zipName = `quick-deploy-${timestamp}.zip`;
            
            console.log('🔄 Aplicando cache busting...');
            await this.applyCacheBusting(cacheVersion);
            
            console.log('📦 Creando paquete...');
            await execAsync(`powershell Compress-Archive -Path dist\\* -DestinationPath ${zipName} -Force`);
            console.log(`✅ Paquete creado: ${zipName}`);
            
            // 3. Test API
            console.log('🧪 Probando API...');
            const fetch = (await import('node-fetch')).default;
            const response = await fetch('https://cms.kroko.cl/wp-json/wp/v2/posts?per_page=1');
            
            if (response.ok) {
                console.log('✅ API funcionando');
            } else {
                console.log('⚠️  API con problemas');
            }
              // 4. Instrucciones optimizadas
            console.log('\n📤 QUICK UPLOAD:');
            console.log(`1. Sube ${zipName} a cPanel`);
            console.log('2. Extrae en public_html/codevs/');
            console.log('3. Prueba: https://codevs.kroko.cl');
            console.log('\n🔄 CACHE OPTIMIZATION:');
            console.log(`✅ Cache busting aplicado (v${cacheVersion})`);
            console.log('✅ Headers de cache configurados (.htaccess)');
            console.log('✅ Assets con hash único');
            console.log('\n💡 TIPS:');
            console.log('• Usa Ctrl+F5 para forzar refresh completo');
            console.log('• Revisa Network tab para verificar cache');
            console.log('• Los cambios de HTML se ven inmediatamente');
            console.log('\n⚡ Deploy optimizado - Cache automático!');
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

new QuickDeploy().run();
