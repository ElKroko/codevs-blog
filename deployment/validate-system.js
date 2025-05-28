#!/usr/bin/env node

/**
 * ✅ CODEVS SYSTEM VALIDATOR - Validador del Sistema
 * 
 * Script para verificar que todo el sistema de despliegue
 * esté configurado correctamente
 */

import fs from 'fs';
import path from 'path';

class SystemValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.passed = [];
    }

    async validate() {
        console.log('✅ CODEVS - Validador del Sistema de Despliegue');
        console.log('==============================================\n');

        await this.checkFiles();
        await this.checkEnvironment();
        await this.checkScripts();
        await this.checkProductionAccess();

        this.showResults();
    }

    checkFiles() {
        console.log('📋 Verificando archivos del sistema...');

        const requiredFiles = [
            'package.json',
            'astro.config.mjs',
            '.env.production',
            'deploy.js',
            'quick-deploy.js',
            'test-deploy.js',
            'deploy-watch.js',
            'DEPLOY-GUIDE.md',
            'QUICK-START.md'
        ];

        requiredFiles.forEach(file => {
            if (fs.existsSync(file)) {
                this.passed.push(`✅ ${file} existe`);
            } else {
                this.errors.push(`❌ ${file} no encontrado`);
            }
        });

        // Check WordPress files
        const wpPaths = [
            '../WP-WEB/wp-content/themes/twentytwentyfour/functions.php',
            '../WP-WEB/wp-content/themes/twentytwentyfour/functions-clean.php',
            '../WP-WEB/wp-content/themes/twentytwentyfour/functions-backup.php'
        ];

        wpPaths.forEach(wpPath => {
            if (fs.existsSync(wpPath)) {
                this.passed.push(`✅ WordPress: ${path.basename(wpPath)} existe`);
            } else {
                this.warnings.push(`⚠️  WordPress: ${path.basename(wpPath)} no encontrado`);
            }
        });

        // Check dist directory
        if (fs.existsSync('dist')) {
            const distFiles = fs.readdirSync('dist');
            if (distFiles.length > 0) {
                this.passed.push(`✅ Directorio dist contiene ${distFiles.length} archivos`);
            } else {
                this.warnings.push('⚠️  Directorio dist está vacío (ejecuta npm run build)');
            }
        } else {
            this.warnings.push('⚠️  Directorio dist no existe (ejecuta npm run build)');
        }
    }

    async checkEnvironment() {
        console.log('\n🔧 Verificando configuración...');

        // Check .env.production
        if (fs.existsSync('.env.production')) {
            const envContent = fs.readFileSync('.env.production', 'utf8');
            if (envContent.includes('cms.kroko.cl')) {
                this.passed.push('✅ .env.production configurado correctamente');
            } else {
                this.warnings.push('⚠️  .env.production puede necesitar configuración');
            }
        }

        // Check astro.config.mjs
        if (fs.existsSync('astro.config.mjs')) {
            const configContent = fs.readFileSync('astro.config.mjs', 'utf8');
            if (configContent.includes('codevs.kroko.cl')) {
                this.passed.push('✅ astro.config.mjs configurado para producción');
            } else {
                this.warnings.push('⚠️  astro.config.mjs puede necesitar configuración');
            }
        }

        // Check package.json scripts
        if (fs.existsSync('package.json')) {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const deployScripts = ['deploy', 'deploy:quick', 'deploy:test', 'deploy:watch'];
            
            const hasAllScripts = deployScripts.every(script => 
                packageJson.scripts && packageJson.scripts[script]
            );

            if (hasAllScripts) {
                this.passed.push('✅ Todos los scripts de despliegue están configurados');
            } else {
                this.errors.push('❌ Faltan scripts de despliegue en package.json');
            }
        }
    }

    checkScripts() {
        console.log('\n📝 Verificando scripts de despliegue...');

        const scripts = [
            { file: 'deploy.js', name: 'Deploy Principal' },
            { file: 'quick-deploy.js', name: 'Deploy Rápido' },
            { file: 'test-deploy.js', name: 'Test de Producción' },
            { file: 'deploy-watch.js', name: 'Monitor de Cambios' }
        ];

        scripts.forEach(script => {
            if (fs.existsSync(script.file)) {
                const content = fs.readFileSync(script.file, 'utf8');
                if (content.includes('kroko.cl')) {
                    this.passed.push(`✅ ${script.name} configurado correctamente`);
                } else {
                    this.warnings.push(`⚠️  ${script.name} puede necesitar configuración`);
                }
            }
        });
    }

    async checkProductionAccess() {
        console.log('\n🌐 Verificando acceso a producción...');

        try {
            const fetch = (await import('node-fetch')).default;

            // Test WordPress API
            const wpResponse = await fetch('https://cms.kroko.cl/wp-json/wp/v2/posts?per_page=1', {
                timeout: 5000
            });

            if (wpResponse.ok) {
                this.passed.push('✅ WordPress API accesible');
            } else {
                this.warnings.push(`⚠️  WordPress API: Status ${wpResponse.status}`);
            }

            // Test Frontend
            const frontResponse = await fetch('https://codevs.kroko.cl/', {
                timeout: 5000
            });

            if (frontResponse.ok) {
                this.passed.push('✅ Frontend accesible');
            } else {
                this.warnings.push(`⚠️  Frontend: Status ${frontResponse.status}`);
            }

        } catch (error) {
            this.warnings.push('⚠️  No se pudo verificar acceso a producción (conexión/DNS)');
        }
    }

    showResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESULTADOS DE VALIDACIÓN');
        console.log('='.repeat(50));

        if (this.passed.length > 0) {
            console.log('\n✅ TESTS PASADOS:');
            this.passed.forEach(item => console.log(`   ${item}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  ADVERTENCIAS:');
            this.warnings.forEach(item => console.log(`   ${item}`));
        }

        if (this.errors.length > 0) {
            console.log('\n❌ ERRORES:');
            this.errors.forEach(item => console.log(`   ${item}`));
        }

        console.log('\n' + '='.repeat(50));
        
        if (this.errors.length === 0) {
            console.log('🎉 SISTEMA LISTO PARA DESPLIEGUE');
            console.log('\nComandos disponibles:');
            console.log('   npm run deploy        # Despliegue completo');
            console.log('   npm run deploy:quick  # Despliegue rápido');
            console.log('   npm run deploy:test   # Verificar estado');
            console.log('   npm run deploy:watch  # Monitor de cambios');
        } else {
            console.log('🔧 SISTEMA NECESITA CONFIGURACIÓN');
            console.log('\nPor favor, revisa los errores antes de continuar.');
        }

        console.log('\n📖 Consulta DEPLOY-GUIDE.md para más información');
    }
}

new SystemValidator().validate().catch(console.error);
