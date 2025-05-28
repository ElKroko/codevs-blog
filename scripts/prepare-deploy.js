#!/usr/bin/env node

/**
 * Preparación de archivos para despliegue en cPanel
 * Este script prepara tanto la opción estática como la opción Node.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 Preparando archivos para despliegue en cPanel\n');

// Crear carpeta de despliegue
const deployDir = path.join(__dirname, 'deploy');
const staticDir = path.join(deployDir, 'static');
const nodejsDir = path.join(deployDir, 'nodejs');

// Limpiar y crear directorios
if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true });
}
fs.mkdirSync(deployDir);
fs.mkdirSync(staticDir);
fs.mkdirSync(nodejsDir);

// Copiar archivos del dist para ambas opciones
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

console.log('📁 Copiando archivos de dist/...');

// Verificar que existe dist/
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
    console.log('❌ Error: dist/ folder no encontrado. Ejecuta "npm run build" primero.');
    process.exit(1);
}

// Copiar dist/ a ambas carpetas
copyDirectory(distPath, staticDir);
copyDirectory(distPath, nodejsDir);

console.log('✅ Archivos de Astro copiados');

// Preparar opción estática
console.log('\n📄 Preparando opción estática...');
fs.copyFileSync(path.join(__dirname, '.htaccess'), path.join(staticDir, '.htaccess'));
console.log('✅ .htaccess copiado para opción estática');

// Preparar opción Node.js
console.log('\n⚙️  Preparando opción Node.js...');
fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(nodejsDir, 'server.js'));
fs.copyFileSync(path.join(__dirname, 'server-package.json'), path.join(nodejsDir, 'package.json'));
console.log('✅ server.js y package.json copiados para opción Node.js');

// Crear archivos README para cada opción
const staticReadme = `# CODEVS - Opción Estática

## Instrucciones:
1. Ve a cPanel → File Manager
2. Elimina cualquier aplicación Node.js existente para codevs.kroko.cl
3. Sube TODOS los archivos de esta carpeta a la carpeta de codevs.kroko.cl
4. Asegúrate que index.html esté en la raíz del dominio
5. El sitio debería funcionar inmediatamente

## Estructura:
- Todos los archivos de esta carpeta van a la raíz del dominio
- .htaccess maneja las rutas automáticamente
- No necesita configuración adicional

## Verificación:
- https://codevs.kroko.cl → Página principal
- https://codevs.kroko.cl/knowledge-base → Base de conocimiento
- https://codevs.kroko.cl/blog → Blog`;

const nodejsReadme = `# CODEVS - Opción Node.js

## Instrucciones:
1. Ve a cPanel → Node.js App
2. Configura la aplicación:
   - Node.js Version: 18+
   - Application Mode: Production
   - Application Startup File: server.js
3. Sube TODOS los archivos de esta carpeta
4. En cPanel Node.js App, ejecuta: npm install
5. Reinicia la aplicación

## Estructura:
- server.js: Servidor Express para archivos estáticos
- package.json: Dependencias Node.js
- Todos los demás archivos: Contenido estático de Astro

## Verificación:
- Revisa los logs de la aplicación Node.js en cPanel
- https://codevs.kroko.cl → Página principal
- https://codevs.kroko.cl/knowledge-base → Base de conocimiento`;

fs.writeFileSync(path.join(staticDir, 'README.md'), staticReadme);
fs.writeFileSync(path.join(nodejsDir, 'README.md'), nodejsReadme);

console.log('\n📋 Resumen de archivos preparados:');
console.log('');
console.log('📁 deploy/static/ - Para hosting estático (recomendado)');
console.log('  ├── index.html');
console.log('  ├── knowledge-base/');
console.log('  ├── blog/');
console.log('  ├── _astro/');
console.log('  ├── .htaccess');
console.log('  └── README.md');
console.log('');
console.log('📁 deploy/nodejs/ - Para aplicación Node.js');
console.log('  ├── index.html');
console.log('  ├── knowledge-base/');
console.log('  ├── blog/');
console.log('  ├── _astro/');
console.log('  ├── server.js');
console.log('  ├── package.json');
console.log('  └── README.md');
console.log('');
console.log('🚀 Recomendación: Usa la opción estática (deploy/static/) por simplicidad');
console.log('');
console.log('📝 Próximos pasos:');
console.log('1. Decide qué opción usar (estática recomendada)');
console.log('2. Sube los archivos de la carpeta elegida a cPanel');
console.log('3. Sigue las instrucciones del README.md correspondiente');
console.log('4. Verifica que el sitio funcione correctamente');

// Crear un zip para facilitar la subida
console.log('\n📦 Creando archivos ZIP...');

try {
    const { execSync } = await import('child_process');
    
    // Crear ZIP de la opción estática
    execSync(`powershell Compress-Archive -Path "${staticDir}\\*" -DestinationPath "${deployDir}\\codevs-static.zip" -Force`, { stdio: 'inherit' });
    console.log('✅ codevs-static.zip creado');
    
    // Crear ZIP de la opción Node.js
    execSync(`powershell Compress-Archive -Path "${nodejsDir}\\*" -DestinationPath "${deployDir}\\codevs-nodejs.zip" -Force`, { stdio: 'inherit' });
    console.log('✅ codevs-nodejs.zip creado');
    
    console.log('\n🎉 ¡Archivos preparados! Encuentra los ZIPs en la carpeta deploy/');
    
} catch (error) {
    console.log('\n⚠️  No se pudieron crear los ZIPs automáticamente.');
    console.log('   Puedes crear manualmente los ZIPs de las carpetas static/ y nodejs/');
}
