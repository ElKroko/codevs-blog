# 🚨 SOLUCIÓN URGENTE - WordPress Error 500

## Problema Identificado
```
Fatal error: Cannot redeclare include_knowledge_base_in_queries() 
(previously declared in functions.php:213) in functions.php on line 830
```

## Causa
Hay **múltiples funciones duplicadas** en el archivo `functions.php` de WordPress:
- `add_cors_http_header()` ✅ (ya arreglado)
- `include_knowledge_base_in_queries()` ❌ (nuevo error)
- Posiblemente otras funciones también duplicadas

## Solución INMEDIATA

### Paso 1: Acceder al archivo functions.php
1. Ve a cPanel → File Manager
2. Navega a: `/public_html/cms.kroko.cl/wp-content/themes/twentytwentyfour/`
3. Edita el archivo `functions.php`

### Paso 2: Eliminar la función duplicada
Busca y **ELIMINA** una de las dos declaraciones de `add_cors_http_header()`.

**Opción A**: Eliminar la que está alrededor de la línea 501 (la más nueva)
**Opción B**: Eliminar la que está alrededor de la línea 219 (la más antigua)

### Paso 3: Mantener solo UNA versión de las funciones CORS
Asegúrate de que solo quede una versión de estas funciones:

```php
// CORS headers para producción
function add_cors_http_header() {
    $allowed_origins = [
        'https://codevs.kroko.cl',
        'http://codevs.kroko.cl',
        'https://localhost:4321',
        'http://localhost:4321'
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
}

add_action('rest_api_init', function() {
    add_cors_http_header();
});

add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        add_cors_http_header();
        exit(0);
    }
});
```

### Paso 4: Verificar
1. Guarda el archivo
2. Prueba: https://cms.kroko.cl/wp-json/wp/v2/posts
3. Debería devolver JSON en lugar del error 500

## ⚠️ IMPORTANTE
- Solo debe haber UNA declaración de cada función
- Si hay otras funciones duplicadas, elimina también las duplicadas
- Mantén solo las versiones más completas/recientes

## Verificación Rápida
Después de la corrección, estos comandos deberían funcionar:

```bash
curl https://cms.kroko.cl/wp-json/wp/v2/posts
curl https://cms.kroko.cl/wp-json/wp/v2/knowledge-base
```

## Estado Actual del Sistema
✅ **Astro Frontend**: codevs.kroko.cl - FUNCIONANDO
❌ **WordPress API**: cms.kroko.cl - ERROR 500 (función duplicada)
✅ **SSL y Dominios**: Configurados correctamente
✅ **CORS**: Configurado (pero con función duplicada)

Una vez solucionado esto, el sistema completo estará 100% operativo! 🚀
