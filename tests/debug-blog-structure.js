#!/usr/bin/env node

/**
 * 🔍 CODEVS Blog Structure Debugger
 * Este script analiza la estructura de datos de los posts de WordPress
 * para entender qué información tenemos disponible para la tabla de metadata.
 */

const WP_API_BASE = 'https://cms.kroko.cl/wp-json/wp/v2';

/**
 * Clase para debuggear la estructura de posts de blog
 */
class BlogStructureDebugger {
    constructor() {
        this.apiBase = WP_API_BASE;
    }

    /**
     * Obtener un post completo con todos los datos embebidos
     */
    async getFullPostData(slug) {
        try {
            console.log(`🔍 Analizando estructura del post: ${slug}`);
            
            const response = await fetch(`${this.apiBase}/posts?slug=${slug}&_embed`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const posts = await response.json();
            
            if (posts.length === 0) {
                console.log('❌ Post no encontrado');
                return null;
            }
            
            const post = posts[0];
            console.log('\n📋 ESTRUCTURA COMPLETA DEL POST:');
            console.log('=====================================');
            
            // Datos básicos
            console.log('\n📊 DATOS BÁSICOS:');
            console.log(`   ID: ${post.id}`);
            console.log(`   Título: ${post.title.rendered}`);
            console.log(`   Slug: ${post.slug}`);
            console.log(`   Fecha: ${post.date}`);
            console.log(`   Modificado: ${post.modified}`);
            console.log(`   Estado: ${post.status}`);
            console.log(`   Tipo: ${post.type}`);
            console.log(`   Autor ID: ${post.author}`);
            
            // Categorías y tags
            if (post.categories && post.categories.length > 0) {
                console.log('\n🏷️ CATEGORÍAS:');
                console.log(`   IDs: ${post.categories.join(', ')}`);
            }
            
            if (post.tags && post.tags.length > 0) {
                console.log('\n🔖 TAGS:');
                console.log(`   IDs: ${post.tags.join(', ')}`);
            }
            
            // Datos embebidos
            if (post._embedded) {
                console.log('\n🔗 DATOS EMBEBIDOS:');
                
                // Autor
                if (post._embedded.author) {
                    const author = post._embedded.author[0];
                    console.log('\n👤 AUTOR:');
                    console.log(`   Nombre: ${author.name}`);
                    console.log(`   Descripción: ${author.description}`);
                    console.log(`   Email: ${author.email || 'No disponible'}`);
                    console.log(`   URL: ${author.url || 'No disponible'}`);
                    console.log(`   Avatar URLs: ${Object.keys(author.avatar_urls || {}).join(', ')}`);
                }
                
                // Imagen destacada
                if (post._embedded['wp:featuredmedia']) {
                    const media = post._embedded['wp:featuredmedia'][0];
                    console.log('\n🖼️ IMAGEN DESTACADA:');
                    console.log(`   URL: ${media.source_url}`);
                    console.log(`   Alt: ${media.alt_text}`);
                    console.log(`   Título: ${media.title.rendered}`);
                }
                
                // Términos (categorías y tags con nombres)
                if (post._embedded['wp:term']) {
                    console.log('\n🏷️ TÉRMINOS COMPLETOS:');
                    post._embedded['wp:term'].forEach((termGroup, index) => {
                        console.log(`   Grupo ${index}:`);
                        termGroup.forEach(term => {
                            console.log(`     - ${term.name} (${term.taxonomy}, slug: ${term.slug})`);
                        });
                    });
                }
            }
            
            // Custom fields
            if (post.meta) {
                console.log('\n📝 META FIELDS:');
                Object.keys(post.meta).forEach(key => {
                    if (post.meta[key] && post.meta[key] !== '' && post.meta[key] !== 0) {
                        console.log(`   ${key}: ${post.meta[key]}`);
                    }
                });
            }
            
            // Campos de aplausos
            if (post.claps_count !== undefined) {
                console.log('\n👏 APLAUSOS:');
                console.log(`   Count: ${post.claps_count}`);
            }
            
            return post;
            
        } catch (error) {
            console.error(`❌ Error analizando post: ${error.message}`);
            return null;
        }
    }

    /**
     * Obtener estadísticas de aplausos desde la API
     */
    async getClapStats(slug) {
        try {
            console.log(`\n👏 VERIFICANDO APLAUSOS PARA: ${slug}`);
            
            const response = await fetch(`https://cms.kroko.cl/wp-json/codevs/v1/claps/${slug}`);
            
            if (!response.ok) {
                console.log(`   ⚠️ Error obteniendo aplausos: ${response.status}`);
                return null;
            }
            
            const data = await response.json();
            console.log(`   ✅ Aplausos: ${data.claps}`);
            return data;
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return null;
        }
    }

    /**
     * Analizar qué datos podemos usar para la tabla de información
     */
    async analyzeForInfoTable(slug) {
        console.log('\n📊 ANÁLISIS PARA TABLA DE INFORMACIÓN');
        console.log('=====================================');
        
        const post = await this.getFullPostData(slug);
        const claps = await this.getClapStats(slug);
        
        if (!post) return;
        
        console.log('\n✅ DATOS DISPONIBLES PARA LA TABLA:');
        
        // Popularidad (aplausos)
        console.log(`📈 Popularidad: ${claps ? claps.claps : 0} aplausos`);
        
        // Autor
        const author = post._embedded?.author?.[0];
        if (author) {
            console.log(`👤 Autor: ${author.name}`);
        }
        
        // Fecha de publicación
        console.log(`📅 Fecha: ${new Date(post.date).toLocaleDateString('es-ES')}`);
        
        // Última modificación
        if (post.modified !== post.date) {
            console.log(`🔄 Última modificación: ${new Date(post.modified).toLocaleDateString('es-ES')}`);
        }
        
        // Categorías
        if (post._embedded?.['wp:term']) {
            const categories = post._embedded['wp:term']
                .flat()
                .filter(term => term.taxonomy === 'category')
                .map(cat => cat.name);
            
            if (categories.length > 0) {
                console.log(`🏷️ Categorías: ${categories.join(', ')}`);
            }
        }
        
        // Tags
        if (post._embedded?.['wp:term']) {
            const tags = post._embedded['wp:term']
                .flat()
                .filter(term => term.taxonomy === 'post_tag')
                .map(tag => tag.name);
            
            if (tags.length > 0) {
                console.log(`🔖 Tags: ${tags.join(', ')}`);
            }
        }
        
        // Tiempo de lectura estimado
        const wordCount = post.content?.rendered ? 
            post.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));
        console.log(`⏱️ Tiempo de lectura: ~${readingTime} minutos`);
        
        // Estado del post
        console.log(`📊 Estado: ${post.status}`);
        
        console.log('\n🎯 RESUMEN PARA TABLA DE INFORMACIÓN:');
        console.log('- ✅ Aplausos (popularidad)');
        console.log('- ✅ Autor');
        console.log('- ✅ Fecha de publicación');
        console.log('- ✅ Última modificación');
        console.log('- ✅ Categorías');
        console.log('- ✅ Tags');
        console.log('- ✅ Tiempo de lectura estimado');
        console.log('- ❓ Ranking (necesita implementarse)');
    }
}

/**
 * Función principal
 */
async function main() {
    const debugger = new BlogStructureDebugger();
    
    // Usar el slug del post que sabemos que existe
    const testSlug = 'de-idea-a-produccion-construyendo-una-web-moderna-con-astro-y-wordpress-headless';
    
    console.log('🔍 CODEVS Blog Structure Debugger');
    console.log('==================================');
    
    await debugger.analyzeForInfoTable(testSlug);
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { BlogStructureDebugger };
