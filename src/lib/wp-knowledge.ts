// Servicio para consumir la API de WordPress Knowledge Base
export interface WordPressKnowledgePost {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  modified: string;
  featured_media: number;
  hero_image_url: string | null;
  ranking: number;
  reading_time: string;
  custom_author: {
    name: string;
    bio: string;
    avatar: string;
  };
  category_slug: string;
  tags_list: string[];
  prerequisites: string[];
  objectives: string[];
  resources: Array<{
    title: string;
    url: string;
    type: string;
  }>;
  attachments: Array<{
    id: number;
    title: string;
    description: string;
    url: string;
    type: string;
    size: string;
    mime_type: string;
  }>;
}

class WordPressKnowledgeService {  private baseUrl: string;
  constructor() {
    // Configura aquí la URL de tu WordPress
    this.baseUrl = 'http://localhost:8881'; // WordPress Studio en puerto 8881
  }

  async getAllPosts(): Promise<WordPressKnowledgePost[]> {
    try {
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/knowledge-base?_embed&per_page=100`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const posts = await response.json();
      
      return posts.map((post: any) => this.transformPost(post));
    } catch (error) {
      console.error('Error fetching knowledge base posts:', error);
      return [];
    }
  }

  async getPostBySlug(slug: string): Promise<WordPressKnowledgePost | null> {
    try {
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/knowledge-base?slug=${slug}&_embed`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const posts = await response.json();
      
      if (posts.length === 0) {
        return null;
      }
      
      return this.transformPost(posts[0]);
    } catch (error) {
      console.error('Error fetching knowledge base post:', error);
      return null;
    }
  }

  async getPostById(id: number): Promise<WordPressKnowledgePost | null> {
    try {
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/knowledge-base/${id}?_embed`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const post = await response.json();
      
      return this.transformPost(post);
    } catch (error) {
      console.error('Error fetching knowledge base post:', error);
      return null;
    }
  }

  private transformPost(post: any): WordPressKnowledgePost {
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      date: post.date,
      modified: post.modified,
      featured_media: post.featured_media,
      hero_image_url: post.hero_image_url,
      ranking: post.ranking || 3,
      reading_time: post.reading_time || '',
      custom_author: {
        name: post.custom_author?.name || 'CODEVS Team',
        bio: post.custom_author?.bio || '',
        avatar: post.custom_author?.avatar || '',
      },
      category_slug: post.category_slug || 'other',
      tags_list: post.tags_list || [],
      prerequisites: post.prerequisites || [],
      objectives: post.objectives || [],
      resources: post.resources || [],
      attachments: post.attachments || [],
    };
  }

  // Método para categorías disponibles
  getCategoryInfo(category: string) {
    const categories: Record<string, { icon: string; color: string }> = {
      frontend: { icon: '🎨', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      backend: { icon: '⚙️', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      devops: { icon: '🔧', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
      mobile: { icon: '📱', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
      'data-science': { icon: '📊', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
      'ai-ml': { icon: '🤖', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' },
      security: { icon: '🔒', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
      tools: { icon: '🛠️', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
      'best-practices': { icon: '✨', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
      architecture: { icon: '🏗️', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
      databases: { icon: '🗄️', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' },
      cloud: { icon: '☁️', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' },
      other: { icon: '📋', color: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300' }
    };
    return categories[category] || categories.other;
  }

  // Método para iconos de archivos adjuntos
  getAttachmentIcon(type: string): string {
    const icons: Record<string, string> = {
      pdf: '📄',
      video: '🎥',
      link: '🔗',
      code: '💻',
      image: '🖼️',
      other: '📁'
    };
    return icons[type] || icons.other;
  }

  // Método para generar estrellas de ranking
  getRankingStars(ranking: number): string {
    return '⭐'.repeat(ranking) + '☆'.repeat(5 - ranking);
  }

  // Método para probar la conexión con WordPress
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts?per_page=1`);
      return response.ok;
    } catch (error) {
      console.error('Error testing WordPress connection:', error);
      return false;
    }
  }

  // Método para obtener posts mock si WordPress no está disponible
  getMockPosts(): WordPressKnowledgePost[] {
    return [
      {
        id: 1,
        slug: 'docker-fundamentals-wordpress',
        title: { rendered: 'Fundamentos de Docker - Desde WordPress' },
        content: { rendered: '<p>Este es un post de ejemplo desde WordPress para probar la integración con Astro.</p>' },
        excerpt: { rendered: 'Aprende los conceptos básicos de Docker con ejemplos prácticos desde WordPress.' },
        date: new Date().toISOString(),
        modified: new Date().toISOString(),
        featured_media: 0,
        hero_image_url: null,
        ranking: 5,
        reading_time: '15 minutos',
        custom_author: {
          name: 'CODEVS Team',
          bio: 'Equipo de desarrollo de CODEVS',
          avatar: ''
        },
        category_slug: 'devops',
        tags_list: ['docker', 'containers', 'devops'],
        prerequisites: ['Conocimientos básicos de terminal', 'Conceptos de virtualización'],
        objectives: ['Entender qué es Docker', 'Crear tu primer container'],
        resources: [
          {
            title: 'Documentación oficial de Docker',
            url: 'https://docs.docker.com',
            type: 'documentation'
          }
        ],
        attachments: [
          {
            id: 1,
            title: 'Docker Cheat Sheet',
            description: 'Guía rápida de comandos Docker',
            url: '#',
            type: 'pdf',
            size: '2.5 MB',
            mime_type: 'application/pdf'
          }
        ]
      }
    ];
  }

  // Método modificado para usar datos mock si WordPress no está disponible
  async getAllPostsWithFallback(): Promise<WordPressKnowledgePost[]> {
    const isConnected = await this.testConnection();
    
    if (!isConnected) {
      console.warn('WordPress no está disponible, usando datos de ejemplo');
      return this.getMockPosts();
    }
    
    return this.getAllPosts();
  }
}

export const wpKnowledgeService = new WordPressKnowledgeService();
