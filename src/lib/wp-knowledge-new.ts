// Servicio para consumir la API de WordPress Knowledge Base

export interface KnowledgeAttachment {
  id: number;
  title: string;
  description: string;
  url: string;
  type: string;
  size: string;
  mime_type: string;
}

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
  attachments: KnowledgeAttachment[];
}

class WordPressKnowledgeService {
  private baseUrl: string;

  constructor() {
    // Configura aquí la URL de tu WordPress
    this.baseUrl = 'http://localhost:8881'; // WordPress Studio en puerto 8881
  }

  async getAllPosts(): Promise<WordPressKnowledgePost[]> {
    try {
      // Primero obtenemos el ID de la categoría 'knowledge-base'
      const categoryResponse = await fetch(`${this.baseUrl}/wp-json/wp/v2/categories?slug=knowledge-base`);
      
      if (!categoryResponse.ok) {
        throw new Error(`HTTP error getting category! status: ${categoryResponse.status}`);
      }
      
      const categories = await categoryResponse.json();
      
      if (categories.length === 0) {
        console.warn('No se encontró la categoría knowledge-base');
        return [];
      }
      
      const categoryId = categories[0].id;
      
      // Ahora obtenemos los posts de esa categoría
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts?categories=${categoryId}&_embed&per_page=100`);
      
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
      // Primero obtenemos el ID de la categoría 'knowledge-base'
      const categoryResponse = await fetch(`${this.baseUrl}/wp-json/wp/v2/categories?slug=knowledge-base`);
      
      if (!categoryResponse.ok) {
        throw new Error(`HTTP error getting category! status: ${categoryResponse.status}`);
      }
      
      const categories = await categoryResponse.json();
      
      if (categories.length === 0) {
        console.warn('No se encontró la categoría knowledge-base');
        return null;
      }
      
      const categoryId = categories[0].id;
      
      // Ahora obtenemos el post específico por slug dentro de esa categoría
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts?slug=${slug}&categories=${categoryId}&_embed`);
      
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
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts/${id}?_embed`);
      
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
    // Extraer tags si existen
    const tags = post._embedded?.['wp:term']?.find((termGroup: any[]) => 
      termGroup.some((term: any) => term.taxonomy === 'post_tag')
    ) || [];
    
    // Extraer categorías para determinar la categoría específica
    const categories = post._embedded?.['wp:term']?.find((termGroup: any[]) => 
      termGroup.some((term: any) => term.taxonomy === 'category')
    ) || [];
    
    // Buscar una categoría específica que no sea 'knowledge-base'
    const specificCategory = categories.find((cat: any) => 
      cat.slug !== 'knowledge-base' && cat.taxonomy === 'category'
    );
    
    // Extraer attachments del post embedded data
    const attachments = this.extractAttachments(post);
    
    // Determinar el ranking basado en tags, contenido o meta
    let ranking = post.ranking || this.calculateRanking(post.content?.rendered || '', attachments);
    
    // Extraer información del autor personalizada
    const customAuthor = this.extractCustomAuthor(post);
    
    // Procesar contenido para extraer información estructurada
    const content = post.content?.rendered || '';
    const prerequisites = post.prerequisites ? 
      post.prerequisites.split('\n').filter((p: string) => p.trim()) : 
      this.extractPrerequisites(content);
    
    const objectives = post.objectives ? 
      post.objectives.split('\n').filter((o: string) => o.trim()) : 
      this.extractObjectives(content);
    
    const resources = post.resources ? 
      (typeof post.resources === 'string' ? JSON.parse(post.resources) : post.resources) : 
      this.extractResources(content);
    
    // Calcular tiempo de lectura aproximado
    const wordCount = post.content?.rendered ? 
      post.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200)) + ' minutos';
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      date: post.date,
      modified: post.modified,
      featured_media: post.featured_media,
      hero_image_url: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
      ranking: ranking,
      reading_time: readingTime,
      custom_author: customAuthor,
      category_slug: specificCategory?.slug || this.mapCategoryFromTags(tags) || 'other',
      tags_list: tags.filter((tag: any) => tag.taxonomy === 'post_tag').map((tag: any) => tag.name) || [],
      prerequisites: prerequisites,
      objectives: objectives,
      resources: resources,
      attachments: attachments,
    };
  }

  private extractAttachments(post: any): KnowledgeAttachment[] {
    const attachments: KnowledgeAttachment[] = [];
    
    // Intentar extraer attachments de diferentes fuentes
    if (post._embedded?.['wp:attachment']) {
      post._embedded['wp:attachment'].forEach((attachment: any) => {
        attachments.push({
          id: attachment.id,
          title: attachment.title?.rendered || 'Sin título',
          description: attachment.caption?.rendered || attachment.description?.rendered || '',
          url: attachment.source_url,
          type: this.getAttachmentType(attachment.mime_type),
          size: this.formatFileSize(attachment.filesize || 0),
          mime_type: attachment.mime_type
        });
      });
    }
    
    // También buscar enlaces a archivos en el contenido
    const content = post.content?.rendered || '';
    const fileRegex = /href="([^"]+\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip|rar|txt))"/gi;
    let match;
    
    while ((match = fileRegex.exec(content)) !== null) {
      const url = match[1];
      const extension = match[2].toLowerCase();
      
      attachments.push({
        id: Date.now() + Math.random(), // ID temporal
        title: url.split('/').pop() || 'Archivo',
        description: `Archivo ${extension.toUpperCase()}`,
        url: url,
        type: this.getAttachmentType(`application/${extension}`),
        size: 'Desconocido',
        mime_type: `application/${extension}`
      });
    }
    
    return attachments;
  }

  private calculateRanking(content: string, attachments: KnowledgeAttachment[]): number {
    let ranking = 1; // Ranking por defecto
    
    const contentLength = content.replace(/<[^>]*>/g, '').length;
    const hasAttachments = attachments.length > 0;
    const hasCodeBlocks = content.includes('<pre>') || content.includes('<code>');
    const hasImages = content.includes('<img');
    
    // Algoritmo básico de ranking
    if (contentLength > 3000 && hasAttachments && hasCodeBlocks) {
      ranking = 5;
    } else if (contentLength > 2000 && (hasAttachments || hasCodeBlocks)) {
      ranking = 4;
    } else if (contentLength > 1500 && hasImages) {
      ranking = 3;
    } else if (contentLength > 1000) {
      ranking = 2;
    }
    
    return ranking;
  }

  private extractCustomAuthor(post: any): { name: string; bio: string; avatar: string } {
    // Intentar extraer del autor embebido primero
    const embeddedAuthor = post._embedded?.author?.[0];
    
    if (embeddedAuthor) {
      return {
        name: embeddedAuthor.name || 'CODEVS Team',
        bio: embeddedAuthor.description || 'Equipo de desarrollo de CODEVS',
        avatar: embeddedAuthor.avatar_urls?.['96'] || ''
      };
    }
    
    // Fallback a autor por defecto
    return {
      name: 'CODEVS Team',
      bio: 'Equipo de desarrollo de CODEVS',
      avatar: ''
    };
  }

  private getAttachmentType(mimeType: string): string {
    if (!mimeType) return 'file';
    
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('audio')) return 'audio';
    if (mimeType.includes('text')) return 'text';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    
    return 'file';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return 'Desconocido';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Mapear categoría basada en tags
  private mapCategoryFromTags(tags: any[]): string {
    const tagNames = tags.map((tag: any) => tag.name.toLowerCase());
    
    if (tagNames.some(tag => ['react', 'vue', 'angular', 'css', 'html', 'frontend'].includes(tag))) {
      return 'frontend';
    }
    if (tagNames.some(tag => ['node', 'python', 'backend', 'api', 'server'].includes(tag))) {
      return 'backend';
    }
    if (tagNames.some(tag => ['docker', 'kubernetes', 'devops', 'ci/cd', 'deployment'].includes(tag))) {
      return 'devops';
    }
    if (tagNames.some(tag => ['react-native', 'flutter', 'mobile', 'ios', 'android'].includes(tag))) {
      return 'mobile';
    }
    if (tagNames.some(tag => ['pandas', 'numpy', 'datascience', 'machine learning', 'ai'].includes(tag))) {
      return 'data-science';
    }
    if (tagNames.some(tag => ['tensorflow', 'pytorch', 'ai', 'ml', 'machine learning'].includes(tag))) {
      return 'ai-ml';
    }
    if (tagNames.some(tag => ['security', 'auth', 'encryption', 'cybersecurity'].includes(tag))) {
      return 'security';
    }
    if (tagNames.some(tag => ['git', 'vscode', 'tools', 'productivity'].includes(tag))) {
      return 'tools';
    }
    if (tagNames.some(tag => ['database', 'sql', 'mongodb', 'postgresql'].includes(tag))) {
      return 'databases';
    }
    if (tagNames.some(tag => ['aws', 'azure', 'gcp', 'cloud', 'serverless'].includes(tag))) {
      return 'cloud';
    }
    
    return 'other';
  }
  
  // Extraer prerrequisitos del contenido
  private extractPrerequisites(content: string): string[] {
    const match = content.match(/<h[3-6][^>]*>Prerrequisitos?<\/h[3-6]>(.*?)(?=<h[2-6]|$)/is);
    if (match) {
      const listMatch = match[1].match(/<li[^>]*>(.*?)<\/li>/gi);
      if (listMatch) {
        return listMatch.map(item => item.replace(/<[^>]*>/g, '').trim());
      }
    }
    return [];
  }

  // Extraer objetivos del contenido
  private extractObjectives(content: string): string[] {
    const match = content.match(/<h[3-6][^>]*>(?:Objetivos?|¿Qué aprenderás\?|Aprenderás)<\/h[3-6]>(.*?)(?=<h[2-6]|$)/is);
    if (match) {
      const listMatch = match[1].match(/<li[^>]*>(.*?)<\/li>/gi);
      if (listMatch) {
        return listMatch.map(item => item.replace(/<[^>]*>/g, '').trim());
      }
    }
    return [];
  }

  // Extraer recursos del contenido
  private extractResources(content: string): Array<{title: string; url: string; type: string}> {
    const resources: Array<{title: string; url: string; type: string}> = [];
    
    // Buscar enlaces en el contenido
    const linkMatches = content.match(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi);
    
    if (linkMatches) {
      linkMatches.forEach(link => {
        const urlMatch = link.match(/href="([^"]+)"/);
        const textMatch = link.match(/>([^<]+)</);
        
        if (urlMatch && textMatch) {
          const url = urlMatch[1];
          const title = textMatch[1].trim();
          const type = this.getResourceType(url);
          
          resources.push({ title, url, type });
        }
      });
    }
    
    return resources;
  }

  private getResourceType(url: string): string {
    if (url.includes('github.com')) return 'github';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'video';
    if (url.includes('docs.') || url.includes('documentation')) return 'docs';
    if (url.endsWith('.pdf')) return 'pdf';
    if (url.includes('tutorial') || url.includes('guide')) return 'tutorial';
    return 'link';
  }

  // Métodos utilitarios para la UI
  getCategoryInfo(category: string) {
    const categories: { [key: string]: { name: string; icon: string; color: string } } = {
      'frontend': { name: 'Frontend', icon: '🎨', color: 'blue' },
      'backend': { name: 'Backend', icon: '⚙️', color: 'green' },
      'devops': { name: 'DevOps', icon: '🚀', color: 'purple' },
      'mobile': { name: 'Mobile', icon: '📱', color: 'pink' },
      'data-science': { name: 'Data Science', icon: '📊', color: 'yellow' },
      'ai-ml': { name: 'AI/ML', icon: '🤖', color: 'red' },
      'security': { name: 'Security', icon: '🔒', color: 'gray' },
      'tools': { name: 'Tools', icon: '🛠️', color: 'indigo' },
      'databases': { name: 'Databases', icon: '🗄️', color: 'cyan' },
      'cloud': { name: 'Cloud', icon: '☁️', color: 'sky' },
      'other': { name: 'Other', icon: '📚', color: 'slate' }
    };
    
    return categories[category] || categories['other'];
  }

  getAttachmentIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'pdf': '📄',
      'image': '🖼️',
      'video': '🎥',
      'audio': '🎵',
      'text': '📝',
      'archive': '📦',
      'document': '📃',
      'spreadsheet': '📊',
      'presentation': '📽️',
      'file': '📁'
    };
    
    return icons[type] || icons['file'];
  }

  getRankingStars(ranking: number): string {
    return '★'.repeat(ranking) + '☆'.repeat(5 - ranking);
  }

  // Método para probar la conexión
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts?per_page=1`);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Datos mock para cuando no hay conexión a WordPress
  getMockPosts(): WordPressKnowledgePost[] {
    return [
      {
        id: 1,
        slug: 'introduccion-react',
        title: { rendered: 'Introducción a React' },
        content: { rendered: '<p>Una guía completa para empezar con React...</p>' },
        excerpt: { rendered: 'Aprende los fundamentos de React desde cero' },
        date: '2024-01-15T10:00:00',
        modified: '2024-01-15T10:00:00',
        featured_media: 0,
        hero_image_url: null,
        ranking: 3,
        reading_time: '8 minutos',
        custom_author: {
          name: 'CODEVS Team',
          bio: 'Equipo de desarrollo de CODEVS',
          avatar: ''
        },
        category_slug: 'frontend',
        tags_list: ['react', 'javascript', 'frontend'],
        prerequisites: ['Conocimientos básicos de JavaScript', 'HTML y CSS'],
        objectives: ['Entender qué es React', 'Crear tu primer componente', 'Manejar props y state'],
        resources: [
          { title: 'Documentación oficial de React', url: 'https://react.dev', type: 'docs' }
        ],
        attachments: []
      }
    ];
  }

  // Método principal con fallback
  async getAllPostsWithFallback(): Promise<WordPressKnowledgePost[]> {
    const isConnected = await this.testConnection();
    
    if (!isConnected) {
      console.warn('WordPress no disponible, usando datos mock');
      return this.getMockPosts();
    }
    
    return this.getAllPosts();
  }
}

// Exportar instancia singleton
export const wpKnowledgeService = new WordPressKnowledgeService();
export default wpKnowledgeService;
