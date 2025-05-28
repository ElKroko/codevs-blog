#!/usr/bin/env node

/**
 * 🚀 CODEVS SISTEMA DE DESPLIEGUE AUTOMATIZADO
 * 
 * Script principal para automatizar el despliegue a producción
 * - Frontend Astro: codevs.kroko.cl
 * - Backend WordPress: cms.kroko.cl
 * 
 * Uso: npm run deploy [frontend|backend|all]
 */

import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const CONFIG = {
    frontend: {
        domain: 'codevs.kroko.cl',
        buildDir: 'dist',
        prodEnv: '.env.production'
    },
    backend: {
        domain: 'cms.kroko.cl',
        wpPath: '../WP-WEB',
        functionsFile: 'wp-content/themes/twentytwentyfour/functions.php'
    },
    ftp: {
        host: 'kroko.cl',
        // Credenciales se cargan desde .env
    }
};

class DeploymentManager {
    constructor() {
        this.step = 0;
    }

    log(message, type = 'info') {
        const icons = {
            info: '📋',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            process: '🔄'
        };
        console.log(`${icons[type]} ${message}`);
    }

    async checkEnvironment() {
        this.log('Verificando entorno de desarrollo...', 'process');
        
        // Verificar archivos necesarios
        const requiredFiles = ['.env.production', 'package.json', 'astro.config.mjs'];
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                this.log(`Archivo requerido no encontrado: ${file}`, 'error');
                return false;
            }
        }

        // Verificar Node.js y npm
        try {
            const { stdout: nodeVersion } = await execAsync('node --version');
            const { stdout: npmVersion } = await execAsync('npm --version');
            this.log(`Node.js: ${nodeVersion.trim()}, npm: ${npmVersion.trim()}`, 'success');
        } catch (error) {
            this.log('Error verificando Node.js/npm', 'error');
            return false;
        }

        this.log('Entorno verificado correctamente', 'success');
        return true;
    }

    async buildFrontend() {
        this.log('🏗️  Construyendo frontend Astro...', 'process');
        
        try {
            // Limpiar directorio dist
            if (fs.existsSync('dist')) {
                fs.rmSync('dist', { recursive: true, force: true });
                this.log('Directorio dist limpiado', 'info');
            }

            // Construir proyecto
            this.log('Ejecutando: npm run build', 'info');
            const { stdout, stderr } = await execAsync('npm run build');
            
            if (stderr && !stderr.includes('warning')) {
                throw new Error(stderr);
            }
            
            this.log('Build completado exitosamente', 'success');
            
            // Verificar que dist existe y tiene contenido
            if (!fs.existsSync('dist') || fs.readdirSync('dist').length === 0) {
                throw new Error('El directorio dist está vacío o no existe');
            }
            
            const distSize = this.getDirectorySize('dist');
            this.log(`Tamaño del build: ${distSize}`, 'info');
            
            return true;
        } catch (error) {
            this.log(`Error en build: ${error.message}`, 'error');
            return false;
        }
    }

    async createDeploymentPackage() {
        this.log('📦 Creando paquete de despliegue...', 'process');
        
        try {
            // Crear archivo zip del dist
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const zipName = `dist-${timestamp}.zip`;
            
            await execAsync(`powershell Compress-Archive -Path dist\\* -DestinationPath ${zipName} -Force`);
            
            this.log(`Paquete creado: ${zipName}`, 'success');
            return zipName;
        } catch (error) {
            this.log(`Error creando paquete: ${error.message}`, 'error');
            return null;
        }
    }

    async testProductionAPI() {
        this.log('🧪 Probando API de producción...', 'process');
        
        try {
            const fetch = (await import('node-fetch')).default;
            
            // Test basic WordPress API
            const response = await fetch('https://cms.kroko.cl/wp-json/wp/v2/posts?per_page=1');
            
            if (!response.ok) {
                throw new Error(`API respondió con status ${response.status}`);
            }
            
            const data = await response.json();
            this.log(`API funcionando - ${data.length} posts encontrados`, 'success');
            
            // Test knowledge base endpoint
            const kbResponse = await fetch('https://cms.kroko.cl/wp-json/wp/v2/knowledge-base?per_page=1');
            if (kbResponse.ok) {
                const kbData = await kbResponse.json();
                this.log(`Knowledge Base API - ${kbData.length} entradas encontradas`, 'success');
            } else {
                this.log('Knowledge Base API no disponible (normal si no hay entradas)', 'warning');
            }
            
            return true;
        } catch (error) {
            this.log(`Error probando API: ${error.message}`, 'error');
            return false;
        }
    }

    async deployFrontend() {
        this.log('🌐 Iniciando despliegue del frontend...', 'process');
        
        // 1. Verificar entorno
        if (!(await this.checkEnvironment())) {
            return false;
        }
        
        // 2. Construir proyecto
        if (!(await this.buildFrontend())) {
            return false;
        }
        
        // 3. Crear paquete
        const packageName = await this.createDeploymentPackage();
        if (!packageName) {
            return false;
        }
        
        // 4. Mostrar instrucciones de subida manual
        this.showUploadInstructions(packageName);
        
        return true;
    }

    async deployBackend() {
        this.log('🔧 Verificando configuración del backend...', 'process');
        
        const wpPath = path.resolve('../WP-WEB');
        if (!fs.existsSync(wpPath)) {
            this.log('Directorio WordPress no encontrado en ../WP-WEB', 'error');
            return false;
        }
        
        // Verificar functions.php limpio
        const functionsPath = path.join(wpPath, 'wp-content/themes/twentytwentyfour/functions.php');
        if (fs.existsSync(functionsPath)) {
            const content = fs.readFileSync(functionsPath, 'utf8');
            
            if (content.includes('function add_cors_http_header()') && 
                content.split('function add_cors_http_header()').length > 2) {
                this.log('⚠️  DETECTADAS FUNCIONES DUPLICADAS en functions.php', 'warning');
                this.log('Por favor, usa el archivo functions-clean.php como referencia', 'warning');
                return false;
            }
        }
        
        this.log('Configuración WordPress verificada', 'success');
        this.showWordPressInstructions();
        
        return true;
    }

    async deployAll() {
        this.log('🚀 Iniciando despliegue completo...', 'process');
        
        // 1. Probar API primero
        const apiOk = await this.testProductionAPI();
        if (!apiOk) {
            this.log('⚠️  API no disponible, continuando con frontend solamente', 'warning');
        }
        
        // 2. Desplegar frontend
        const frontendOk = await this.deployFrontend();
        if (!frontendOk) {
            return false;
        }
        
        // 3. Verificar backend
        const backendOk = await this.deployBackend();
        
        this.log('🎉 Proceso de despliegue completado', 'success');
        return true;
    }

    showUploadInstructions(packageName) {
        console.log('\n' + '='.repeat(60));
        console.log('📤 INSTRUCCIONES DE SUBIDA MANUAL');
        console.log('='.repeat(60));
        console.log('');
        console.log('1. 🌐 Accede a tu cPanel de kroko.cl');
        console.log('2. 📁 Ve a File Manager → public_html → codevs (subdomain folder)');
        console.log('3. 🗑️  Elimina todos los archivos existentes en la carpeta');
        console.log(`4. 📦 Sube el archivo: ${packageName}`);
        console.log('5. 📂 Extrae el contenido del ZIP en la carpeta');
        console.log('6. ✅ Verifica que los archivos estén en la raíz (no en subcarpeta)');
        console.log('');
        console.log('7. 🧪 Prueba la página: https://codevs.kroko.cl');
        console.log('');
        console.log('💡 TIP: También puedes usar un cliente FTP como FileZilla');
        console.log('    para subir directamente la carpeta dist/');
        console.log('');
    }

    showWordPressInstructions() {
        console.log('\n' + '='.repeat(60));
        console.log('🔧 VERIFICACIÓN WORDPRESS BACKEND');
        console.log('='.repeat(60));
        console.log('');
        console.log('✅ Tu WordPress ya está configurado correctamente');
        console.log('');
        console.log('Si necesitas hacer cambios:');
        console.log('1. 🌐 Accede a https://cms.kroko.cl/wp-admin');
        console.log('2. 📝 Usa functions-clean.php como referencia');
        console.log('3. 🔄 Evita duplicar funciones');
        console.log('4. 🧪 Prueba la API después de cambios');
        console.log('');
    }

    getDirectorySize(dirPath) {
        let size = 0;
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                size += this.getDirectorySize(fullPath);
            } else {
                size += fs.statSync(fullPath).size;
            }
        }
        
        return `${(size / 1024 / 1024).toFixed(2)} MB`;
    }
}

// Ejecutar script
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'all';
    
    const deployer = new DeploymentManager();
    
    console.log('🚀 CODEVS - Sistema de Despliegue Automatizado');
    console.log('===============================================\n');
    
    switch (command.toLowerCase()) {
        case 'frontend':
        case 'front':
            await deployer.deployFrontend();
            break;
        case 'backend':
        case 'back':
            await deployer.deployBackend();
            break;
        case 'test':
            await deployer.testProductionAPI();
            break;
        case 'all':
        default:
            await deployer.deployAll();
            break;
    }
}

main().catch(console.error);
