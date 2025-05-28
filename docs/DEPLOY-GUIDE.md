# 🚀 CODEVS - Sistema de Despliegue Automatizado

## 📋 Resumen

Sistema completo para automatizar el despliegue de tu proyecto CODEVS Knowledge Base:
- **Frontend Astro**: `codevs.kroko.cl`
- **Backend WordPress**: `cms.kroko.cl`

## 🛠️ Scripts Disponibles

### 1. Despliegue Completo
```bash
npm run deploy
```
- ✅ Verifica entorno
- 🏗️ Construye el proyecto
- 📦 Crea paquete ZIP
- 🧪 Prueba API de producción
- 📋 Muestra instrucciones de subida

### 2. Despliegue Rápido
```bash
npm run deploy:quick
```
- ⚡ Build rápido
- 📦 Paquete con timestamp
- 🧪 Test rápido de API
- 📤 Instrucciones mínimas

### 3. Solo Frontend
```bash
npm run deploy:frontend
```
- 🌐 Enfocado solo en Astro
- 🏗️ Build optimizado
- 📦 Paquete listo para cPanel

### 4. Solo Backend
```bash
npm run deploy:backend
```
- 🔧 Verifica WordPress
- 📋 Instrucciones específicas
- ⚠️ Detecta problemas comunes

### 5. Modo Observador (Desarrollo)
```bash
npm run deploy:watch
```
- 👀 Observa cambios en archivos
- 🔄 Build automático al detectar cambios
- 📦 Paquetes listos para deploy
- ⚡ Perfecto para desarrollo activo

### 6. Testing de Producción
```bash
npm run deploy:test
```
- 🧪 Prueba WordPress API
- 🌐 Verifica frontend
- 🔗 Test de integración
- 📊 Métricas de rendimiento

## 📋 Flujo de Trabajo Recomendado

### Para Desarrollo Diario:
1. **Inicia el observador** para desarrollo activo:
   ```bash
   npm run deploy:watch
   ```

2. **Haz tus cambios** en el código

3. **El sistema automáticamente**:
   - Detecta cambios
   - Construye el proyecto
   - Crea paquete ZIP
   - Te notifica cuando está listo

### Para Despliegue a Producción:

#### Opción A: Despliegue Completo (Recomendado)
```bash
npm run deploy
```

#### Opción B: Despliegue Rápido
```bash
npm run deploy:quick
```

#### Después de subir archivos:
```bash
npm run deploy:test
```

## 📤 Instrucciones de Subida Manual

### Para cPanel:
1. 🌐 Accede a tu cPanel de `kroko.cl`
2. 📁 Ve a **File Manager** → **public_html** → **codevs** (carpeta del subdominio)
3. 🗑️ **Elimina** todos los archivos existentes
4. 📦 **Sube** el archivo ZIP generado
5. 📂 **Extrae** el contenido en la carpeta raíz
6. ✅ **Verifica** que los archivos estén en la raíz (no en subcarpeta)
7. 🧪 **Prueba**: https://codevs.kroko.cl

### Para FTP:
1. 🔗 Conecta con FileZilla o tu cliente FTP favorito
2. 📁 Navega a `/public_html/codevs/`
3. 🗑️ Elimina archivos existentes
4. 📂 Sube directamente la carpeta `dist/`
5. ✅ Verifica permisos (644 para archivos, 755 para carpetas)

## 🔧 Configuración WordPress

### Estado Actual: ✅ Configurado
Tu WordPress está funcionando correctamente. Si necesitas hacer cambios:

1. 🌐 Accede a https://cms.kroko.cl/wp-admin
2. 📝 Usa `functions-clean.php` como referencia
3. ⚠️ **EVITA duplicar funciones**
4. 🧪 Prueba la API después de cambios

### Archivos Importantes:
- `functions.php` - Configuración principal
- `functions-backup.php` - Respaldo original
- `functions-clean.php` - Versión limpia (usa esta como referencia)

## 🧪 Resolución de Problemas

### Error 500 en WordPress:
```bash
# Verificar funciones duplicadas
npm run deploy:backend
```

### Frontend no carga:
```bash
# Verificar build y subida
npm run deploy:frontend
npm run deploy:test
```

### API no responde:
```bash
# Test completo de integración
npm run deploy:test
```

### Cambios no se ven:
1. 🔄 Fuerza refresh (Ctrl+F5)
2. 🧹 Limpia caché del navegador
3. ⏱️ Espera propagación DNS (1-5 minutos)

## 📊 Información Técnica

### Estructura del Proyecto:
```
CODEVS/
├── ASTRO-WEB/codevs-blog/          # Frontend Astro
│   ├── src/                        # Código fuente
│   ├── dist/                       # Build de producción
│   ├── deploy.js                   # Script principal
│   ├── quick-deploy.js             # Despliegue rápido
│   └── test-deploy.js              # Testing
└── WP-WEB/                         # Backend WordPress
    └── wp-content/themes/twentytwentyfour/
        ├── functions.php           # Configuración activa
        ├── functions-backup.php    # Respaldo
        └── functions-clean.php     # Versión limpia
```

### URLs de Producción:
- **Frontend**: https://codevs.kroko.cl
- **Backend**: https://cms.kroko.cl
- **API Base**: https://cms.kroko.cl/wp-json/wp/v2/

### Dominios y Subdominiots:
- `kroko.cl` - Dominio principal
- `codevs.kroko.cl` - Frontend (Astro estático)
- `cms.kroko.cl` - Backend (WordPress API)

## 🎯 Comandos de Ejemplo

```bash
# Desarrollo diario
npm run deploy:watch

# Deploy después de cambios importantes
npm run deploy

# Deploy rápido de cambios menores
npm run deploy:quick

# Verificar que todo funciona
npm run deploy:test

# Solo actualizar frontend
npm run deploy:frontend

# Solo verificar backend
npm run deploy:backend
```

## 🚨 Notas Importantes

1. **⚠️ Siempre verifica** con `npm run deploy:test` después de cambios
2. **📦 Los archivos ZIP** se crean automáticamente con timestamps
3. **🗑️ Limpia archivos antiguos** antes de subir nuevos
4. **🔄 El caché del navegador** puede tardar en actualizarse
5. **📱 Usa el modo watch** para desarrollo activo

## 🆘 Soporte

Si tienes problemas:
1. 🧪 Ejecuta `npm run deploy:test` para diagnóstico
2. 📋 Revisa los logs del script
3. 🔍 Verifica la configuración en `.env.production`
4. 🌐 Comprueba el estado de ambos dominios

---

¡Tu sistema de despliegue está listo! 🎉
