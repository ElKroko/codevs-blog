#!/usr/bin/env node

/**
 * 🌐 CODEVS FTP DEPLOY - Deploy Automático via FTP
 * 
 * Sistema de deploy automatizado que sube directamente a tu servidor
 * usando FTP, eliminando la necesidad de subidas manuales.
 * 
 * Uso:
 *   node ftp-deploy.js setup    - Configurar credenciales FTP
 *   node ftp-deploy.js test     - Probar conexión FTP
 *   node ftp-deploy.js deploy   - Deploy completo (build + upload)
 *   node ftp-deploy.js upload   - Solo upload (sin build)
 */

import { Client } from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

// Configuración desde variables de entorno o valores por defecto
let FTP_CONFIG = {
    host: process.env.FTP_HOST || 'tu-hosting.com',
    user: process.env.FTP_USER || 'tu-usuario',
    password: process.env.FTP_PASSWORD || 'tu-password',
    port: parseInt(process.env.FTP_PORT) || 21,
    secure: process.env.FTP_SECURE === 'true' || false,
    remote_path: process.env.FTP_REMOTE_PATH || 'public_html'
};

// Función para validar configuración
function validateFTPConfig() {
    const missing = [];
    if (FTP_CONFIG.host === 'tu-hosting.com') missing.push('FTP_HOST');
    if (FTP_CONFIG.user === 'tu-usuario') missing.push('FTP_USER');
    if (FTP_CONFIG.password === 'tu-password') missing.push('FTP_PASSWORD');
    
    if (missing.length > 0) {
        console.error('❌ Faltan credenciales FTP:');
        missing.forEach(var_name => console.error(`   - ${var_name}`));
        console.error('\n📝 Ejecuta: npm run ftp:setup para configurar');
        return false;
    }
    return true;
}

// Función para cargar configuración desde archivo .env.ftp
function loadFTPConfig() {
    const envFile = path.join(process.cwd(), '.env.ftp');
    if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        const config = {};
        
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                config[key.trim()] = value.trim().replace(/['"]/g, '');
            }
        });
        
        // Actualizar configuración global
        FTP_CONFIG = {
            host: config.FTP_HOST || FTP_CONFIG.host,
            user: config.FTP_USER || FTP_CONFIG.user,
            password: config.FTP_PASSWORD || FTP_CONFIG.password,
            port: parseInt(config.FTP_PORT) || FTP_CONFIG.port,
            secure: config.FTP_SECURE === 'true' || FTP_CONFIG.secure,
            remote_path: config.FTP_REMOTE_PATH || FTP_CONFIG.remote_path
        };
        
        console.log('✅ Configuración FTP cargada desde .env.ftp');
        return true;
    }
    return false;
}

// Función para crear backup del sitio actual
async function createBackup(client) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
        console.log('📦 Creando backup del sitio actual...');
        
        // Crear directorio de backup local si no existe
        const backupDir = './backup';
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }
        
        // Intentar descargar algunos archivos críticos para backup
        const criticalFiles = ['index.html', '.htaccess'];
        let backedUpFiles = 0;
        
        for (const file of criticalFiles) {
            try {
                const localPath = path.join(backupDir, `${timestamp}-${file}`);
                const remotePath = `${FTP_CONFIG.remote_path}/${file}`;
                await client.downloadTo(localPath, remotePath);
                backedUpFiles++;
                console.log(`   ✓ ${file}`);
            } catch (error) {
                console.log(`   ⚠️ ${file} (no existe o no accesible)`);
            }
        }
        
        if (backedUpFiles > 0) {
            console.log(`✅ Backup completado: ${backedUpFiles} archivos`);
        } else {
            console.log('⚠️ No se pudieron respaldar archivos (sitio nuevo?)');
        }
    } catch (error) {
        console.log('⚠️ Error en backup:', error.message);
    }
}

// Función principal de deployment
async function deployToFTP(options = {}) {
    const { 
        buildFirst = true, 
        createBackupFirst = false,
        deleteRemoteFiles = false,
        showProgress = true
    } = options;
    
    console.log('🚀 CODEVS FTP Deploy');
    console.log('==================\n');
    
    // Cargar configuración
    loadFTPConfig();
    
    if (!validateFTPConfig()) {
        console.log('\n💡 Para configurar credenciales ejecuta:');
        console.log('   npm run ftp:setup');
        return false;
    }
    
    const client = new Client();
    if (showProgress) {
        client.ftp.verbose = false; // Cambiar a true para debug
    }
    
    try {
        // Build del proyecto si se solicita
        if (buildFirst) {
            console.log('🔨 Construyendo el proyecto...');
            try {
                execSync('npm run build', { stdio: 'inherit' });
                console.log('✅ Build completado\n');
            } catch (error) {
                throw new Error('Build falló. Revisa los errores arriba.');
            }
        }
        
        // Verificar que existe el directorio dist
        if (!fs.existsSync('./dist')) {
            throw new Error('❌ No existe el directorio dist/. Ejecuta npm run build primero.');
        }
        
        const distFiles = fs.readdirSync('./dist');
        console.log(`📦 ${distFiles.length} archivos preparados para upload\n`);
        
        console.log('🔗 Conectando al servidor FTP...');
        console.log(`📡 Servidor: ${FTP_CONFIG.host}:${FTP_CONFIG.port}`);
        console.log(`👤 Usuario: ${FTP_CONFIG.user}`);
        
        await client.access({
            host: FTP_CONFIG.host,
            user: FTP_CONFIG.user,
            password: FTP_CONFIG.password,
            port: FTP_CONFIG.port,
            secure: FTP_CONFIG.secure
        });
        
        console.log('✅ Conexión FTP establecida\n');
        
        // Crear backup si se solicita
        if (createBackupFirst) {
            await createBackup(client);
            console.log('');
        }
        
        console.log(`📁 Navegando al directorio remoto: ${FTP_CONFIG.remote_path}`);
        await client.ensureDir(FTP_CONFIG.remote_path);
        
        // Limpiar directorio remoto si se solicita
        if (deleteRemoteFiles) {
            console.log('🧹 Limpiando archivos remotos...');
            try {
                const list = await client.list();
                const filesToDelete = list.filter(item => item.type === 1); // solo archivos
                
                for (const file of filesToDelete) {
                    try {
                        await client.remove(file.name);
                    } catch (e) {
                        console.log(`   ⚠️ No se pudo eliminar: ${file.name}`);
                    }
                }
                console.log(`   ✓ ${filesToDelete.length} archivos eliminados`);
            } catch (error) {
                console.log('   ⚠️ Error limpiando directorio');
            }
            console.log('');
        }
        
        console.log('📤 Subiendo archivos...');
        const startTime = Date.now();
        
        // Progreso personalizado
        if (showProgress) {
            client.trackProgress(info => {
                if (info.type === 'upload' && info.name) {
                    const fileName = path.basename(info.name);
                    process.stdout.write(`\r   📄 ${fileName.padEnd(30)} ${(info.bytes / 1024).toFixed(1)}KB`);
                }
            });
        }
        
        await client.uploadFromDir('./dist', FTP_CONFIG.remote_path);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        if (showProgress) {
            process.stdout.write('\r' + ' '.repeat(60) + '\r'); // Limpiar línea
        }
        
        console.log(`✅ Upload completado en ${duration}s\n`);
        
        // Mostrar información del deployment
        console.log('📊 Información del deployment:');
        console.log(`🌐 URL: http://${FTP_CONFIG.host}`);
        console.log(`📁 Directorio remoto: ${FTP_CONFIG.remote_path}`);
        console.log(`⏰ Fecha: ${new Date().toLocaleString()}`);
        console.log(`📈 Archivos: ${distFiles.length}`);
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Error durante el deployment:', error.message);
        
        if (error.message.includes('ENOTFOUND')) {
            console.error('💡 Verifica que el host FTP sea correcto');
        } else if (error.message.includes('Login incorrect')) {
            console.error('💡 Verifica usuario y contraseña FTP');
        } else if (error.message.includes('ETIMEDOUT')) {
            console.error('💡 Problema de conexión - verifica firewall/internet');
        }
        
        return false;
    } finally {
        client.close();
    }
}

// Función para probar la conexión FTP
async function testFTPConnection() {
    console.log('🧪 Probando conexión FTP...\n');
    
    loadFTPConfig();
    
    if (!validateFTPConfig()) {
        return false;
    }
    
    const client = new Client();
    
    try {
        console.log(`📡 Conectando a ${FTP_CONFIG.host}:${FTP_CONFIG.port}...`);
        await client.access({
            host: FTP_CONFIG.host,
            user: FTP_CONFIG.user,
            password: FTP_CONFIG.password,
            port: FTP_CONFIG.port,
            secure: FTP_CONFIG.secure
        });
        
        console.log('✅ Conexión FTP exitosa!\n');
        
        // Verificar acceso al directorio
        console.log(`📁 Verificando directorio: ${FTP_CONFIG.remote_path}`);
        await client.ensureDir(FTP_CONFIG.remote_path);
        console.log('✅ Acceso al directorio confirmado\n');
        
        // Listar contenido
        const list = await client.list();
        console.log('📂 Contenido actual del directorio:');
        if (list.length === 0) {
            console.log('   (vacío)');
        } else {
            list.slice(0, 10).forEach(item => { // Solo mostrar primeros 10
                const type = item.isDirectory ? '📁' : '📄';
                const size = item.isDirectory ? '' : ` (${(item.size / 1024).toFixed(1)}KB)`;
                console.log(`   ${type} ${item.name}${size}`);
            });
            if (list.length > 10) {
                console.log(`   ... y ${list.length - 10} más`);
            }
        }
        
        console.log('\n✅ Conexión FTP completamente funcional!');
        return true;
        
    } catch (error) {
        console.error('❌ Error de conexión FTP:', error.message);
        
        if (error.message.includes('ENOTFOUND')) {
            console.error('\n💡 Posibles soluciones:');
            console.error('   - Verifica que el host sea correcto');
            console.error('   - Verifica tu conexión a internet');
        } else if (error.message.includes('Login incorrect')) {
            console.error('\n💡 Credenciales incorrectas:');
            console.error('   - Verifica usuario y contraseña');
            console.error('   - Ejecuta: npm run ftp:setup');
        }
        
        return false;
    } finally {
        client.close();
    }
}

// Función para configurar credenciales FTP
async function setupCredentials() {
    console.log('🔧 Configuración FTP para CODEVS');
    console.log('================================\n');
    
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    try {
        console.log('Necesitamos las credenciales de tu hosting para automatizar los deploys.');
        console.log('Estos datos se guardarán de forma segura en .env.ftp\n');

        const host = await question('🌐 Host FTP (ej: kroko.cl, ftp.tudominio.com): ') || 'kroko.cl';
        const user = await question('👤 Usuario FTP (de tu cPanel): ');
        const password = await question('🔑 Contraseña FTP: ');
        const remotePath = await question('📁 Directorio remoto (ej: /public_html/ o /public_html/codevs/): ') || '/public_html/';
        const port = await question('🔌 Puerto FTP (21 por defecto): ') || '21';
        const secure = await question('🔒 ¿Usar FTPS? (y/n): ') || 'n';

        // Crear archivo .env.ftp
        const envContent = `FTP_HOST=${host}
FTP_USER=${user}
FTP_PASSWORD=${password}
FTP_REMOTE_PATH=${remotePath}
FTP_PORT=${port}
FTP_SECURE=${secure.toLowerCase() === 'y' ? 'true' : 'false'}`;

        fs.writeFileSync('.env.ftp', envContent);
        
        // Agregar a .gitignore si no está
        const gitignorePath = '.gitignore';
        let gitignoreContent = '';
        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        }
        
        if (!gitignoreContent.includes('.env.ftp')) {
            fs.appendFileSync(gitignorePath, '\n# FTP credentials\n.env.ftp\n');
            console.log('\n🔒 Archivo .env.ftp agregado a .gitignore por seguridad');
        }

        console.log('\n✅ Configuración guardada exitosamente!');
        
        // Probar conexión inmediatamente
        console.log('\n🧪 Probando la conexión...');
        rl.close();
        
        // Recargar configuración y probar
        const success = await testFTPConnection();
        
        if (success) {
            console.log('\n🎉 ¡Perfecto! Ya puedes usar:');
            console.log('   npm run ftp:deploy    - Deploy completo');
            console.log('   npm run ftp:upload    - Solo upload');
            console.log('   npm run ftp:test      - Probar conexión');
        } else {
            console.log('\n❌ La conexión falló. Revisa los datos y vuelve a intentar con:');
            console.log('   npm run ftp:setup');
        }

    } catch (error) {
        console.error('❌ Error en configuración:', error.message);
    } finally {
        rl.close();
    }
}

// CLI
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'setup':
            await setupCredentials();
            break;
        case 'test':
            await testFTPConnection();
            break;
        case 'upload':
            await deployToFTP({ buildFirst: false });
            break;
        case 'deploy':
            const options = {
                buildFirst: !args.includes('--no-build'),
                createBackupFirst: args.includes('--backup'),
                deleteRemoteFiles: args.includes('--clean'),
                showProgress: !args.includes('--no-progress')
            };
            await deployToFTP(options);
            break;
        case 'backup':
            await deployToFTP({ buildFirst: false, createBackupFirst: true });
            break;
        default:
            console.log('🚀 CODEVS FTP Deploy Script');
            console.log('===========================\n');
            console.log('Comandos disponibles:');
            console.log('  setup    - Configurar credenciales FTP');
            console.log('  test     - Probar conexión FTP');
            console.log('  deploy   - Deploy completo (build + upload)');
            console.log('  upload   - Solo upload (sin build)');
            console.log('  backup   - Crear backup del sitio actual');
            console.log('');
            console.log('Opciones:');
            console.log('  --no-build     - No hacer build antes del deploy');
            console.log('  --backup       - Crear backup antes del deploy');
            console.log('  --clean        - Limpiar directorio remoto');
            console.log('  --no-progress  - Sin mostrar progreso');
            console.log('');
            console.log('Ejemplos:');
            console.log('  npm run ftp:setup');
            console.log('  npm run ftp:test');
            console.log('  npm run ftp:deploy');
            console.log('  npm run ftp:upload');
            console.log('  node ftp-deploy.js deploy --backup --clean');
    }
}

main().catch(console.error);
