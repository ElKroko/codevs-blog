const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Servir archivos estáticos desde el directorio actual
app.use(express.static('.'));

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Manejar rutas SPA - todas las rutas deben servir index.html
app.get('*', (req, res) => {
    // Si la ruta es para un archivo con extensión, no redireccionar
    if (path.extname(req.url)) {
        return res.status(404).send('File not found');
    }
    
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`CODEVS Static Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
