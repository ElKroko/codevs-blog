/**
 * WordPress CORS Configuration
 * 
 * Add this to your WordPress functions.php file on cms.kroko.cl
 * to allow API requests from codevs.kroko.cl
 */

// Add CORS headers for production domain
function add_cors_http_header() {
    // Allow requests from the Astro frontend
    $allowed_origins = [
        'https://codevs.kroko.cl',
        'http://codevs.kroko.cl',  // fallback for development
        'https://localhost:4321',  // local development
        'http://localhost:4321'    // local development
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
}

// Add CORS headers to REST API
add_action('rest_api_init', function() {
    add_cors_http_header();
});

// Handle preflight OPTIONS requests
add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        add_cors_http_header();
        exit(0);
    }
});

/**
 * Ensure knowledge base posts are included in main queries
 * (This should already be in your functions.php, but here for reference)
 */
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

/**
 * Include knowledge base posts in RSS feeds
 */
function include_knowledge_base_in_feed($query) {
    if ($query->is_feed()) {
        $query->set('post_type', array('post', 'knowledge_base'));
    }
}
add_action('pre_get_posts', 'include_knowledge_base_in_feed');

/**
 * Add custom fields to REST API response
 */
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
