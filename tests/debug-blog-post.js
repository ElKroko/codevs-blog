#!/usr/bin/env node

/**
 * 🔍 CODEVS BLOG POST DEBUGGER
 * 
 * Script para diagnosticar por qué no aparece un blog post específico
 */

import { performance } from 'perf_hooks';

class BlogPostDebugger {
    async debug() {
        console.log('🔍 CODEVS - Blog Post Debugger');
        console.log('==============================\n');

        await this.checkWordPressAPI();
        await this.checkKnowledgeBaseAPI();
        await this.checkCategories();
        await this.searchRecentPosts();
        
        console.log('\n📋 Diagnóstico completado');
    }

    async checkWordPressAPI() {
        console.log('📡 Verificando WordPress API...');
          try {
            // 1. Test basic API
            const response = await fetch('https://cms.kroko.cl/wp-json/wp/v2/posts?per_page=10&orderby=date&order=desc');
            
            if (!response.ok) {
                console.log(`❌ WordPress API error: ${response.status}`);
                return;
            }
            
            const posts = await response.json();
            console.log(`✅ WordPress API OK - ${posts.length} posts encontrados`);
            
            // 2. Buscar posts recientes (últimos 3 días)
            const recentPosts = posts.filter(post => {
                const postDate = new Date(post.date);
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                return postDate > threeDaysAgo;
            });
            
            console.log(`📅 Posts recientes (últimos 3 días): ${recentPosts.length}`);
            
            if (recentPosts.length > 0) {
                console.log('\n📝 Posts recientes encontrados:');
                recentPosts.forEach((post, index) => {
                    console.log(`   ${index + 1}. "${post.title.rendered}"`);
                    console.log(`      📅 Fecha: ${new Date(post.date).toLocaleString()}`);
                    console.log(`      🔗 Slug: ${post.slug}`);
                    console.log(`      📊 Status: ${post.status}`);
                    console.log(`      🏷️  Categorías: ${post.categories ? post.categories.join(', ') : 'Sin categorías'}`);
                    console.log('');
                });
            } else {
                console.log('⚠️  No hay posts recientes en los últimos 3 días');
            }
            
        } catch (error) {
            console.log(`❌ Error conectando con WordPress: ${error.message}`);
        }
    }

    async checkKnowledgeBaseAPI() {
        console.log('\n🧠 Verificando Knowledge Base API...');
          try {
            const response = await fetch('https://cms.kroko.cl/wp-json/wp/v2/knowledge-base?per_page=10&orderby=date&order=desc');
            
            if (response.status === 404) {
                console.log('⚠️  Knowledge Base custom post type no encontrado (normal si no hay entradas)');
                return;
            }
            
            if (!response.ok) {
                console.log(`❌ Knowledge Base API error: ${response.status}`);
                return;
            }
            
            const kbPosts = await response.json();
            console.log(`✅ Knowledge Base API OK - ${kbPosts.length} entradas encontradas`);
            
            if (kbPosts.length > 0) {
                console.log('\n📚 Knowledge Base entries:');
                kbPosts.forEach((post, index) => {
                    console.log(`   ${index + 1}. "${post.title.rendered}"`);
                    console.log(`      📅 Fecha: ${new Date(post.date).toLocaleString()}`);
                    console.log(`      🔗 Slug: ${post.slug}`);
                    console.log(`      📊 Status: ${post.status}`);
                    console.log('');
                });
            }
            
        } catch (error) {
            console.log(`❌ Error en Knowledge Base API: ${error.message}`);
        }
    }

    async checkCategories() {
        console.log('\n🏷️  Verificando categorías...');
          try {
            const response = await fetch('https://cms.kroko.cl/wp-json/wp/v2/categories');
            
            if (!response.ok) {
                console.log(`❌ Categories API error: ${response.status}`);
                return;
            }
            
            const categories = await response.json();
            console.log(`✅ Categorías encontradas: ${categories.length}`);
            
            // Buscar categoría knowledge-base específicamente
            const kbCategory = categories.find(cat => 
                cat.slug === 'knowledge-base' || 
                cat.name.toLowerCase().includes('knowledge')
            );
            
            if (kbCategory) {
                console.log(`📚 Categoría Knowledge Base encontrada:`);
                console.log(`   ID: ${kbCategory.id}`);
                console.log(`   Nombre: ${kbCategory.name}`);
                console.log(`   Slug: ${kbCategory.slug}`);
                console.log(`   Posts: ${kbCategory.count}`);
                
                // Buscar posts en esta categoría
                await this.checkPostsInCategory(kbCategory.id);
            } else {
                console.log('⚠️  Categoría "knowledge-base" no encontrada');
                console.log('\n📋 Categorías disponibles:');
                categories.forEach(cat => {
                    console.log(`   - ${cat.name} (${cat.slug}) - ${cat.count} posts`);
                });
            }
            
        } catch (error) {
            console.log(`❌ Error verificando categorías: ${error.message}`);
        }
    }

    async checkPostsInCategory(categoryId) {
        console.log(`\n🔍 Buscando posts en categoría ID ${categoryId}...`);
          try {
            const response = await fetch(`https://cms.kroko.cl/wp-json/wp/v2/posts?categories=${categoryId}&per_page=10&orderby=date&order=desc`);
            
            if (!response.ok) {
                console.log(`❌ Error buscando posts en categoría: ${response.status}`);
                return;
            }
            
            const posts = await response.json();
            console.log(`📊 Posts en categoría Knowledge Base: ${posts.length}`);
            
            if (posts.length > 0) {
                console.log('\n📝 Posts en Knowledge Base:');
                posts.forEach((post, index) => {
                    console.log(`   ${index + 1}. "${post.title.rendered}"`);
                    console.log(`      📅 Fecha: ${new Date(post.date).toLocaleString()}`);
                    console.log(`      🔗 Slug: ${post.slug}`);
                    console.log(`      📊 Status: ${post.status}`);
                    console.log('');
                });
            }
            
        } catch (error) {
            console.log(`❌ Error buscando posts en categoría: ${error.message}`);
        }
    }

    async searchRecentPosts() {
        console.log('\n🔎 Buscando tu blog post sobre Astro + WordPress...');
          try {
            // Buscar por términos clave
            const searchTerms = ['astro', 'wordpress', 'headless', 'produccion', 'deploy'];
            
            for (const term of searchTerms) {
                const response = await fetch(`https://cms.kroko.cl/wp-json/wp/v2/posts?search=${term}&per_page=5`);
                
                if (response.ok) {
                    const results = await response.json();
                    if (results.length > 0) {
                        console.log(`🔍 Resultados para "${term}": ${results.length} posts`);
                        results.forEach(post => {
                            console.log(`   - "${post.title.rendered}" (${post.slug})`);
                        });
                    }
                }
            }
            
        } catch (error) {
            console.log(`❌ Error en búsqueda: ${error.message}`);
        }
    }
}

// Ejecutar debugger
new BlogPostDebugger().debug().catch(console.error);
