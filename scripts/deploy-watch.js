#!/usr/bin/env node

/**
 * 📱 CODEVS DEPLOY WATCHER - Monitor de Cambios
 * 
 * Script para desarrollo que observa cambios y prepara deploys automáticamente
 * Útil para desarrollo activo con deploys frecuentes
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class DeployWatcher {
    constructor() {
        this.isBuilding = false;
        this.pendingBuild = false;
        this.lastBuildTime = 0;
        this.watchedPaths = ['src/', 'public/', 'astro.config.mjs'];
    }
    
    async start() {
        console.log('👀 CODEVS Deploy Watcher Started');
        console.log('=================================');
        console.log('🔍 Watching for changes in:');
        this.watchedPaths.forEach(p => console.log(`   - ${p}`));
        console.log('');
        console.log('📝 Changes will trigger automatic builds');
        console.log('🔄 Press Ctrl+C to stop\n');
        
        // Watch for file changes
        this.watchedPaths.forEach(watchPath => {
            if (fs.existsSync(watchPath)) {
                fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
                    if (filename && !filename.includes('node_modules') && !filename.includes('.git')) {
                        this.handleFileChange(path.join(watchPath, filename));
                    }
                });
            }
        });
        
        // Keep process alive
        process.stdin.resume();
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n👋 Deploy Watcher stopped');
            process.exit(0);
        });
    }
    
    async handleFileChange(filePath) {
        const now = Date.now();
        
        // Debounce: solo build si han pasado más de 2 segundos
        if (now - this.lastBuildTime < 2000) {
            this.pendingBuild = true;
            return;
        }
        
        if (this.isBuilding) {
            this.pendingBuild = true;
            return;
        }
        
        console.log(`📝 Change detected: ${filePath}`);
        await this.buildAndPrepare();
        
        // Check for pending builds
        if (this.pendingBuild) {
            this.pendingBuild = false;
            setTimeout(() => this.buildAndPrepare(), 1000);
        }
    }
    
    async buildAndPrepare() {
        if (this.isBuilding) return;
        
        this.isBuilding = true;
        this.lastBuildTime = Date.now();
        
        try {
            console.log('🏗️  Building...');
            
            const startTime = performance.now();
            await execAsync('npm run build');
            const endTime = performance.now();
            
            const buildTime = Math.round(endTime - startTime);
            console.log(`✅ Build completed in ${buildTime}ms`);
            
            // Crear paquete listo para deploy
            const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
            const zipName = `watch-deploy-${timestamp}.zip`;
            
            await execAsync(`powershell Compress-Archive -Path dist\\* -DestinationPath ${zipName} -Force`);
            console.log(`📦 Package ready: ${zipName}`);
            console.log('');
            
        } catch (error) {
            console.log(`❌ Build failed: ${error.message}`);
        } finally {
            this.isBuilding = false;
        }
    }
}

// Verificar si estamos en modo watch
const args = process.argv.slice(2);
if (args.includes('--watch') || args.includes('-w')) {
    new DeployWatcher().start();
} else {
    console.log('📱 CODEVS Deploy Watcher');
    console.log('');
    console.log('Usage: node deploy-watch.js --watch');
    console.log('');
    console.log('This will monitor your files and automatically build');
    console.log('deployment packages when changes are detected.');
}
