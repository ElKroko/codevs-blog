# CODEVS - Solución para cPanel Node.js

## Problema Identificado
cPanel está ejecutando una aplicación Node.js en lugar de servir los archivos estáticos de Astro.

## Solución 1: Configurar como Aplicación Estática

### Opción A: Eliminar la aplicación Node.js y usar hosting estático
1. Ve a cPanel → Node.js App
2. **ELIMINA** la aplicación Node.js que creaste
3. Ve a cPanel → File Manager
4. Navega a la carpeta de codevs.kroko.cl (probablemente `public_html/codevs/` o similar)
5. Sube TODOS los archivos del folder `dist/` directamente a esa carpeta
6. Asegúrate que `index.html` esté en la raíz del dominio

### Opción B: Configurar la aplicación Node.js para servir archivos estáticos
Si prefieres mantener la aplicación Node.js, necesitas un servidor que sirva archivos estáticos.

## Archivos Necesarios para la Opción B

### 1. server.js (crear en la raíz de codevs.kroko.cl)
```javascript
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Servir archivos estáticos desde el directorio actual
app.use(express.static('.'));

// Manejar rutas SPA - todas las rutas deben servir index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});
```

### 2. package.json (crear en la raíz de codevs.kroko.cl)
```json
{
  "name": "codevs-static-server",
  "version": "1.0.0",
  "description": "Static server for CODEVS Astro site",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

## Estructura de Carpetas Correcta

Para codevs.kroko.cl, la estructura debe ser:
```
public_html/codevs/ (o la carpeta del subdominio)
├── index.html          (desde dist/)
├── knowledge-base/     (desde dist/)
├── blog/               (desde dist/)
├── _astro/             (desde dist/)
├── favicon.svg         (desde dist/)
├── server.js           (opcional, solo si usas Node.js)
├── package.json        (opcional, solo si usas Node.js)
└── ... (todos los demás archivos de dist/)
```

## Pasos de Implementación

### Si eliges Opción A (Recomendado - más simple):
1. Elimina la aplicación Node.js de cPanel
2. Sube todos los archivos de dist/ a la carpeta del subdominio
3. Verifica que index.html esté en la raíz
4. El sitio debería funcionar inmediatamente

### Si eliges Opción B (Node.js con Express):
1. Mantén la aplicación Node.js en cPanel
2. Configura Node.js versión 18+
3. Sube todos los archivos de dist/ + server.js + package.json
4. En cPanel Node.js App, configura:
   - Startup file: server.js
   - Run "npm install" para instalar express
5. Reinicia la aplicación

## Verificación
Después de implementar cualquier opción:
- https://codevs.kroko.cl debe mostrar la página principal de Astro
- https://codevs.kroko.cl/knowledge-base debe mostrar la página de conocimiento
- https://codevs.kroko.cl/blog debe mostrar el blog
