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
    async run() {
        console.log('⚡ CODEVS Quick Deploy\n');
        
        try {
            // 1. Quick build
            console.log('🏗️  Building...');
            await execAsync('npm run build');
            console.log('✅ Build completado');
            
            // 2. Crear zip con timestamp
            const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
            const zipName = `quick-deploy-${timestamp}.zip`;
            
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
            
            // 4. Instrucciones rápidas
            console.log('\n📤 QUICK UPLOAD:');
            console.log(`1. Sube ${zipName} a cPanel`);
            console.log('2. Extrae en public_html/codevs/');
            console.log('3. Prueba: https://codevs.kroko.cl');
            console.log('\n⚡ Listo para subir!');
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

new QuickDeploy().run();
