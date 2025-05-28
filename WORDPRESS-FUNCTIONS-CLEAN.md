# 🚨 WORDPRESS - FUNCIONES DUPLICADAS

## Error Actual
```
Fatal error: Cannot redeclare include_knowledge_base_in_queries() 
(previously declared in functions.php:213) in functions.php on line 830
```

## Problema Principal
El archivo `functions.php` tiene **múltiples funciones duplicadas**. Necesitas eliminar TODAS las duplicaciones.

## Lista de Funciones Posiblemente Duplicadas
- ✅ `add_cors_http_header()` - Ya arreglado
- ❌ `include_knowledge_base_in_queries()` - **Error actual**
- ❌ `include_knowledge_base_in_feed()` - **Probablemente también duplicada**
- ❌ `add_custom_fields_to_rest_api()` - **Probablemente también duplicada**

## SOLUCIÓN RÁPIDA

### Opción 1: Eliminar todo y empezar limpio
1. **Haz backup** del archivo `functions.php` actual
2. Elimina TODAS las funciones CORS y knowledge base del archivo
3. Agrega solo UNA vez el código limpio que te daré abajo

### Opción 2: Eliminar duplicados manualmente
1. Busca la función `include_knowledge_base_in_queries` en la línea ~830
2. **ELIMINA** toda esa sección duplicada
3. Repite para otras funciones duplicadas

## CÓDIGO LIMPIO PARA AGREGAR (solo una vez)

```php
<?php
// ==============================================
// CODEVS Knowledge Base Functions - SOLO UNA VEZ
// ==============================================

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

// Incluir knowledge base en queries principales
function include_knowledge_base_in_queries($query) {
    if (!is_admin() && $query->is_main_query()) {
        if (is_home()) {
            $query->set('post_type', array('post', 'knowledge_base'));
        }
        if (is_search()) {
            $query->set('post_type', array('post', 'knowledge_base'));
        }
    }
}
add_action('pre_get_posts', 'include_knowledge_base_in_queries');

// Incluir knowledge base en feeds RSS
function include_knowledge_base_in_feed($query) {
    if ($query->is_feed()) {
        $query->set('post_type', array('post', 'knowledge_base'));
    }
}
add_action('pre_get_posts', 'include_knowledge_base_in_feed');

// Agregar campos personalizados al REST API
function add_custom_fields_to_rest_api() {
    register_rest_field(
        ['post', 'knowledge_base'],
        'prerequisites',
        array(
            'get_callback' => function($post) {
                $prerequisites = get_post_meta($post['id'], 'prerequisites', true);
                return $prerequisites ?: [];
            }
        )
    );
    
    register_rest_field(
        ['post', 'knowledge_base'],
        'objectives',
        array(
            'get_callback' => function($post) {
                $objectives = get_post_meta($post['id'], 'objectives', true);
                return $objectives ?: [];
            }
        )
    );
    
    register_rest_field(
        ['post', 'knowledge_base'],
        'difficulty_level',
        array(
            'get_callback' => function($post) {
                return get_post_meta($post['id'], 'difficulty_level', true) ?: 'beginner';
            }
        )
    );
}
add_action('rest_api_init', 'add_custom_fields_to_rest_api');

// ==============================================
// FIN - CODEVS Knowledge Base Functions
// ==============================================
?>
```

## INSTRUCCIONES PASO A PASO

1. **Ve a cPanel → File Manager**
2. **Navega a**: `/public_html/cms.kroko.cl/wp-content/themes/twentytwentyfour/`
3. **Haz backup**: Descarga `functions.php` como respaldo
4. **Edita**: `functions.php`
5. **Busca**: Todas las funciones que empiecen con `add_cors_http_header`, `include_knowledge_base`, etc.
6. **Elimina**: TODAS las versiones duplicadas
7. **Agrega**: El código limpio de arriba AL FINAL del archivo
8. **Guarda**: El archivo

## VERIFICACIÓN INMEDIATA

Después de guardar, prueba:
```bash
https://cms.kroko.cl/wp-json/wp/v2/posts
```

Debería devolver JSON sin errores.

## 🆘 SI NADA FUNCIONA

Como último recurso, envíame el contenido completo del archivo `functions.php` y te ayudo a limpiarlo manualmente.
