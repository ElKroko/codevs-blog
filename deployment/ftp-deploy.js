const { Client } = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FTPDeployer {
    constructor() {
        this.config = this.loadConfig();
        this.client = new ftp.Client();
        this.client.ftp.verbose = false; // Set to true for debugging
    }

    loadConfig() {
        // Intentar cargar configuración desde .env
        const envPath = '.env.ftp';
        let config = {};

        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            
            lines.forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    config[key.trim()] = value.trim().replace(/['"]/g, '');
                }
            });
        }

        // Configuración por defecto (puedes cambiar estos valores)
        return {
            host: config.FTP_HOST || 'kroko.cl',
            user: config.FTP_USER || '', // Tu usuario de cPanel
            password: config.FTP_PASSWORD || '', // Tu contraseña de cPanel
            remotePath: config.FTP_REMOTE_PATH || '/public_html/codevs/',
            secure: config.FTP_SECURE === 'true' || false,
            port: parseInt(config.FTP_PORT) || 21
        };
    }

    async deploy(options = {}) {
        const { buildOnly = false, testOnly = false } = options;

        console.log('🚀 CODEVS FTP Deploy');
        console.log('====================\n');

        try {
            if (testOnly) {
                return await this.testConnection();
            }

            // 1. Build del proyecto
            await this.buildProject();

            if (buildOnly) {
                console.log('✅ Build completado. Use --deploy para subir a servidor.');
                return;
            }

            // 2. Verificar configuración FTP
            if (!this.config.user || !this.config.password) {
                console.log('❌ Configuración FTP incompleta');
                console.log('💡 Ejecuta: npm run ftp:setup para configurar credenciales');
                return;
            }

            // 3. Conectar al servidor FTP
            await this.connectFTP();

            // 4. Limpiar directorio remoto
            await this.cleanRemoteDirectory();

            // 5. Subir archivos
            await this.uploadFiles();

            // 6. Verificar deploy
            await this.verifyDeploy();

            console.log('\n🎉 Deploy completado exitosamente!');
            console.log('🌐 Tu sitio: https://codevs.kroko.cl');

        } catch (error) {
            console.log(`❌ Error en deploy: ${error.message}`);
            console.log('\n💡 Posibles soluciones:');
            console.log('  - Verifica credenciales FTP');
            console.log('  - Ejecuta: npm run ftp:test');
            console.log('  - Revisa conexión a internet');
        } finally {
            this.client.close();
        }
    }

    async buildProject() {
        console.log('🏗️  Construyendo proyecto...');
        
        try {
            // Limpiar dist anterior
            if (fs.existsSync('dist')) {
                fs.rmSync('dist', { recursive: true, force: true });
            }

            // Build
            await execAsync('npm run build');
            console.log('✅ Build completado');

            // Verificar que dist existe y tiene contenido
            if (!fs.existsSync('dist') || fs.readdirSync('dist').length === 0) {
                throw new Error('Build falló - directorio dist vacío');
            }

            const distFiles = fs.readdirSync('dist');
            console.log(`📦 ${distFiles.length} archivos preparados para deploy`);

        } catch (error) {
            throw new Error(`Build falló: ${error.message}`);
        }
    }

    async connectFTP() {
        console.log('🔗 Conectando al servidor FTP...');
        
        try {
            await this.client.access({
                host: this.config.host,
                user: this.config.user,
                password: this.config.password,
                secure: this.config.secure,
                port: this.config.port
            });

            console.log('✅ Conectado al servidor FTP');
        } catch (error) {
            throw new Error(`Conexión FTP falló: ${error.message}`);
        }
    }

    async cleanRemoteDirectory() {
        console.log('🧹 Limpiando directorio remoto...');
        
        try {
            // Intentar navegar al directorio
            await this.client.ensureDir(this.config.remotePath);
            
            // Listar archivos existentes
            const list = await this.client.list();
            
            if (list.length > 0) {
                console.log(`🗑️  Eliminando ${list.length} archivos existentes...`);
                
                // Eliminar archivos (no directorios para evitar problemas)
                for (const item of list) {
                    if (item.type === 1) { // archivo
                        try {
                            await this.client.remove(item.name);
                        } catch (e) {
                            console.log(`⚠️  No se pudo eliminar: ${item.name}`);
                        }
                    }
                }
            }
            
            console.log('✅ Directorio limpiado');
        } catch (error) {
            console.log(`⚠️  Advertencia limpiando directorio: ${error.message}`);
        }
    }

    async uploadFiles() {
        console.log('📤 Subiendo archivos...');
        
        try {
            // Subir todo el contenido de dist/
            await this.client.uploadFromDir('dist', this.config.remotePath);
            console.log('✅ Archivos subidos exitosamente');
        } catch (error) {
            throw new Error(`Subida falló: ${error.message}`);
        }
    }

    async verifyDeploy() {
        console.log('🧪 Verificando deploy...');
        
        try {
            // Esperar un poco para que se propaguen los cambios
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const response = await fetch('https://codevs.kroko.cl/', {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                const html = await response.text();
                if (html.includes('CODEVS')) {
                    console.log('✅ Deploy verificado - sitio funcionando');
                } else {
                    console.log('⚠️  Deploy parcial - contenido puede estar cacheado');
                }
            } else {
                console.log(`⚠️  Sitio responde con status ${response.status}`);
            }
        } catch (error) {
            console.log(`⚠️  No se pudo verificar deploy: ${error.message}`);
        }
    }

    async testConnection() {
        console.log('🧪 Probando conexión FTP...');
        
        if (!this.config.user || !this.config.password) {
            console.log('❌ Credenciales FTP no configuradas');
            console.log('💡 Ejecuta: npm run ftp:setup');
            return false;
        }

        try {
            await this.connectFTP();
            
            // Probar navegación al directorio
            await this.client.ensureDir(this.config.remotePath);
            console.log(`✅ Acceso al directorio: ${this.config.remotePath}`);
            
            // Listar contenido
            const list = await this.client.list();
            console.log(`📁 Archivos en servidor: ${list.length}`);
            
            console.log('✅ Conexión FTP OK');
            return true;
        } catch (error) {
            console.log(`❌ Error de conexión: ${error.message}`);
            return false;
        } finally {
            this.client.close();
        }
    }

    async setupCredentials() {
        console.log('🔧 Configuración FTP');
        console.log('====================\n');
        
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

        try {
            console.log('Ingresa las credenciales de tu cPanel FTP:');
            console.log('(Los datos se guardarán en .env.ftp)\n');

            const host = await question('Host FTP (ej: kroko.cl): ') || 'kroko.cl';
            const user = await question('Usuario FTP: ');
            const password = await question('Contraseña FTP: ');
            const remotePath = await question('Ruta remota (ej: /public_html/codevs/): ') || '/public_html/codevs/';

            // Crear archivo .env.ftp
            const envContent = `FTP_HOST=${host}
FTP_USER=${user}
FTP_PASSWORD=${password}
FTP_REMOTE_PATH=${remotePath}
FTP_SECURE=false
FTP_PORT=21`;

            fs.writeFileSync('.env.ftp', envContent);
            
            // Agregar a .gitignore si no está
            const gitignorePath = '.gitignore';
            let gitignoreContent = '';
            if (fs.existsSync(gitignorePath)) {
                gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            }
            
            if (!gitignoreContent.includes('.env.ftp')) {
                fs.appendFileSync(gitignorePath, '\n# FTP credentials\n.env.ftp\n');
            }

            console.log('\n✅ Configuración guardada en .env.ftp');
            console.log('🔒 Archivo agregado a .gitignore por seguridad');
            
            // Probar conexión
            console.log('\n🧪 Probando conexión...');
            this.config = this.loadConfig();
            await this.testConnection();

        } catch (error) {
            console.log(`❌ Error en configuración: ${error.message}`);
        } finally {
            rl.close();
        }
    }
}

// CLI
async function main() {
    const args = process.argv.slice(2);
    const deployer = new FTPDeployer();

    switch (args[0]) {
        case 'setup':
            await deployer.setupCredentials();
            break;
        case 'test':
            await deployer.testConnection();
            break;
        case 'build':
            await deployer.deploy({ buildOnly: true });
            break;
        case 'deploy':
        default:
            await deployer.deploy();
            break;
    }
}

main().catch(console.error);
