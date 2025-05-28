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
  
  // Cache para mejorar performance
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // Configura aquí la URL de tu WordPress
    this.baseUrl = 'http://localhost:8881'; // WordPress Studio en puerto 8881
  }
  // Método para cache con expiración
  private getCachedData(key: string): any | null {
    // Limpiar caché caducada ocasionalmente (10% de probabilidad)
    if (Math.random() < 0.1) {
      this.cleanExpiredCache();
    }
    
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Método para limpiar la caché manualmente
  public clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared successfully');
  }

  // Método para obtener estadísticas de caché
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Método para limpiar entradas caducadas de la caché
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if ((now - value.timestamp) >= this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }  async getAllPosts(): Promise<WordPressKnowledgePost[]> {
    try {
      // Verificar caché primero
      const cacheKey = 'all-knowledge-posts';
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log('Returning cached knowledge base posts');
        return cachedData;
      }

      let allPosts: any[] = [];

      // 1. Obtener posts del custom post type 'knowledge_base'
      try {
        const cptResponse = await fetch(`${this.baseUrl}/wp-json/wp/v2/knowledge-base?_embed&per_page=100`);
        if (cptResponse.ok) {
          const cptPosts = await cptResponse.json();
          allPosts.push(...cptPosts);
          console.log(`Found ${cptPosts.length} posts from custom post type`);
        }
      } catch (error) {
        console.warn('Custom post type knowledge_base not available:', error);
      }

      // 2. Obtener posts regulares con categoría 'knowledge-base'
      try {
        const categoryResponse = await fetch(`${this.baseUrl}/wp-json/wp/v2/categories?slug=knowledge-base`);
        
        if (categoryResponse.ok) {
          const categories = await categoryResponse.json();
          
          if (categories.length > 0) {
            const categoryId = categories[0].id;
            const regularPostsResponse = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts?categories=${categoryId}&_embed&per_page=100`);
            
            if (regularPostsResponse.ok) {
              const regularPosts = await regularPostsResponse.json();
              allPosts.push(...regularPosts);
              console.log(`Found ${regularPosts.length} posts from regular posts with knowledge-base category`);
            }
          }
        }
      } catch (error) {
        console.warn('Knowledge-base category not available:', error);
      }

      if (allPosts.length === 0) {
        console.warn('No knowledge base posts found in either source');
        return [];
      }

      // Eliminar duplicados basados en el slug
      const uniquePosts = allPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.slug === post.slug)
      );

      const transformedPosts = uniquePosts.map((post: any) => this.transformPost(post));
      
      // Almacenar en caché
      this.setCachedData(cacheKey, transformedPosts);
      console.log(`Cached ${transformedPosts.length} unique knowledge base posts from ${allPosts.length} total found`);
      
      return transformedPosts;
    } catch (error) {
      console.error('Error fetching knowledge base posts:', error);
      return [];
    }
  }  async getPostBySlug(slug: string): Promise<WordPressKnowledgePost | null> {
    try {
      // Verificar caché primero
      const cacheKey = `knowledge-post-slug-${slug}`;
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log(`Returning cached knowledge base post: ${slug}`);
        return cachedData;
      }

      let post: any = null;

      // 1. Buscar en custom post type 'knowledge_base'
      try {
        const cptResponse = await fetch(`${this.baseUrl}/wp-json/wp/v2/knowledge-base?slug=${slug}&_embed`);
        if (cptResponse.ok) {
          const cptPosts = await cptResponse.json();
          if (cptPosts.length > 0) {
            post = cptPosts[0];
            console.log(`Found post "${slug}" in custom post type`);
          }
        }
      } catch (error) {
        console.warn('Custom post type search failed:', error);
      }

      // 2. Si no se encontró, buscar en posts regulares con categoría knowledge-base
      if (!post) {
        try {
          const categoryResponse = await fetch(`${this.baseUrl}/wp-json/wp/v2/categories?slug=knowledge-base`);
          
          if (categoryResponse.ok) {
            const categories = await categoryResponse.json();
            
            if (categories.length > 0) {
              const categoryId = categories[0].id;
              const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts?slug=${slug}&categories=${categoryId}&_embed`);
              
              if (response.ok) {
                const posts = await response.json();
                if (posts.length > 0) {
                  post = posts[0];
                  console.log(`Found post "${slug}" in regular posts with knowledge-base category`);
                }
              }
            }
          }
        } catch (error) {
          console.warn('Regular posts search failed:', error);
        }
      }

      if (!post) {
        console.warn(`Post with slug "${slug}" not found in either source`);
        return null;
      }
      
      const transformedPost = this.transformPost(post);
      
      // Almacenar en caché
      this.setCachedData(cacheKey, transformedPost);
      console.log(`Cached knowledge base post: ${slug}`);
      
      return transformedPost;
    } catch (error) {
      console.error('Error fetching knowledge base post:', error);
      return null;
    }
  }  async getPostById(id: number): Promise<WordPressKnowledgePost | null> {
    try {
      // Verificar caché primero
      const cacheKey = `knowledge-post-id-${id}`;
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log(`Returning cached knowledge base post ID: ${id}`);
        return cachedData;
      }

      let post: any = null;

      // 1. Buscar en custom post type 'knowledge_base'
      try {
        const cptResponse = await fetch(`${this.baseUrl}/wp-json/wp/v2/knowledge-base/${id}?_embed`);
        if (cptResponse.ok) {
          post = await cptResponse.json();
          console.log(`Found post ID ${id} in custom post type`);
        }
      } catch (error) {
        console.warn('Custom post type search failed:', error);
      }

      // 2. Si no se encontró, buscar en posts regulares
      if (!post) {
        try {
          const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts/${id}?_embed`);
          if (response.ok) {
            const regularPost = await response.json();
            // Verificar si tiene la categoría knowledge-base
            const hasKnowledgeCategory = regularPost.categories?.some((catId: number) => {
              // Esta verificación se hace de manera simplificada
              return true; // Por ahora aceptamos cualquier post por ID
            });
            if (hasKnowledgeCategory) {
              post = regularPost;
              console.log(`Found post ID ${id} in regular posts`);
            }
          }
        } catch (error) {
          console.warn('Regular posts search failed:', error);
        }
      }

      if (!post) {
        console.warn(`Post with ID ${id} not found`);
        return null;
      }
      
      const transformedPost = this.transformPost(post);
      
      // Almacenar en caché
      this.setCachedData(cacheKey, transformedPost);
      console.log(`Cached knowledge base post ID: ${id}`);
      
      return transformedPost;
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
      (Array.isArray(post.prerequisites) ? post.prerequisites : 
       (typeof post.prerequisites === 'string' ? post.prerequisites.split('\n').filter((p: string) => p.trim()) : [])) : 
      this.extractPrerequisites(content);
    
    const objectives = post.objectives ? 
      (Array.isArray(post.objectives) ? post.objectives : 
       (typeof post.objectives === 'string' ? post.objectives.split('\n').filter((o: string) => o.trim()) : [])) : 
      this.extractObjectives(content);
      const resources = post.resources ? 
      (typeof post.resources === 'string' ? JSON.parse(post.resources) : post.resources) : 
      this.extractResourcesEnhanced(post);
    
    // Calcular tiempo de lectura mejorado
    const readingTime = this.calculateReadingTime(post.content?.rendered || '', attachments, resources);
    
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
      category_slug: specificCategory?.slug || this.smartCategoryDetection(post, tags) || 'other',
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

  // Función mejorada para categorización automática inteligente
  private smartCategoryDetection(post: any, tags: any[]): string {
    const title = post.title?.rendered?.toLowerCase() || '';
    const content = post.content?.rendered?.toLowerCase() || '';
    
    // Análisis por contenido y palabras clave
    const contentAnalysis = this.analyzeContentForCategory(title + ' ' + content);
    
    // Análisis por tags
    const tagAnalysis = this.mapCategoryFromTags(tags);
    
    // Priorizar análisis de contenido si es específico
    if (contentAnalysis !== 'other') {
      return contentAnalysis;
    }
    
    // Fallback a análisis de tags
    if (tagAnalysis !== 'other') {
      return tagAnalysis;
    }
    
    return 'other';
  }

  // Nueva función para analizar contenido y determinar categoría
  private analyzeContentForCategory(content: string): string {
    const categoryKeywords = {
      'frontend': [
        'react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'jsx', 'tsx',
        'dom', 'webpack', 'vite', 'sass', 'scss', 'tailwind', 'bootstrap', 'ui', 'ux',
        'responsive', 'component', 'hooks', 'state', 'props', 'spa', 'pwa', 'browser'
      ],
      'backend': [
        'node.js', 'express', 'fastify', 'nest.js', 'python', 'django', 'flask', 'fastapi',
        'java', 'spring', 'php', 'laravel', 'ruby', 'rails', 'go', 'rust', 'c#', '.net',
        'api', 'rest', 'graphql', 'server', 'middleware', 'authentication', 'authorization'
      ],
      'data-science': [
        'pandas', 'numpy', 'matplotlib', 'seaborn', 'scikit-learn', 'jupyter', 'anaconda',
        'data analysis', 'data visualization', 'statistics', 'machine learning', 'ml',
        'dataset', 'dataframe', 'csv', 'excel', 'sql', 'etl', 'big data', 'analytics'
      ],
      'ai-ml': [
        'tensorflow', 'pytorch', 'keras', 'neural network', 'deep learning', 'ai',
        'artificial intelligence', 'computer vision', 'nlp', 'natural language processing',
        'classification', 'regression', 'clustering', 'supervised', 'unsupervised',
        'model', 'training', 'prediction', 'algorithm'
      ],
      'devops': [
        'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'jenkins', 'github actions',
        'deployment', 'infrastructure', 'terraform', 'ansible', 'monitoring', 'logging',
        'nginx', 'apache', 'load balancer', 'microservices', 'containerization'
      ],
      'mobile': [
        'react native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'mobile app',
        'xamarin', 'cordova', 'ionic', 'app store', 'play store', 'responsive design',
        'mobile development', 'cross-platform', 'native'
      ],
      'databases': [
        'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
        'database', 'sql', 'nosql', 'query', 'schema', 'migration', 'orm', 'sequelize',
        'mongoose', 'prisma', 'indexing', 'optimization', 'backup', 'replication'
      ],
      'security': [
        'cybersecurity', 'authentication', 'authorization', 'encryption', 'hashing',
        'jwt', 'oauth', 'ssl', 'tls', 'vulnerability', 'penetration testing', 'xss',
        'sql injection', 'csrf', 'security audit', 'firewall', 'vpn'
      ],
      'cloud': [
        'aws', 'azure', 'google cloud', 'gcp', 'cloud computing', 'serverless', 'lambda',
        'ec2', 's3', 'cloudfront', 'cloud storage', 'auto scaling', 'load balancing',
        'cdn', 'cloud functions', 'cloud run', 'cloud sql'
      ],
      'tools': [
        'git', 'github', 'gitlab', 'vscode', 'visual studio', 'intellij', 'sublime text',
        'vim', 'emacs', 'postman', 'insomnia', 'chrome devtools', 'debugging',
        'linting', 'formatting', 'productivity', 'workflow'
      ]
    };

    // Calcular scores por categoría
    const scores: { [key: string]: number } = {};
    
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      scores[category] = 0;
      keywords.forEach(keyword => {
        const occurrences = (content.match(new RegExp(keyword, 'gi')) || []).length;
        scores[category] += occurrences * (keyword.length > 3 ? 2 : 1); // Dar más peso a palabras más específicas
      });
    });

    // Encontrar la categoría con mayor score
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore >= 3) { // Umbral mínimo para considerar una categoría
      const bestCategory = Object.entries(scores).find(([, score]) => score === maxScore)?.[0];
      return bestCategory || 'other';
    }

    return 'other';
  }
  // Función mejorada para calcular tiempo de lectura
  private calculateReadingTime(content: string, attachments?: any[], resources?: any[]): string {
    const plainText = content.replace(/<[^>]*>/g, ''); // Remover HTML
    const wordCount = plainText.split(/\s+/).length;
    const averageReadingSpeed = 200; // palabras por minuto
    let minutes = Math.ceil(wordCount / averageReadingSpeed);
    
    // Agregar tiempo extra por attachments (asumir 30 segundos por cada uno)
    if (attachments && attachments.length > 0) {
      minutes += Math.ceil(attachments.length * 0.5);
    }
    
    // Agregar tiempo extra por recursos externos (asumir 1 minuto por cada uno)
    if (resources && resources.length > 0) {
      minutes += resources.length;
    }
    
    if (minutes <= 1) {
      return '< 1 min';
    } else if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }

  // Función para mejorar la extracción de recursos
  private extractResourcesEnhanced(post: any): Array<{ title: string; url: string; type: string }> {
    const resources: Array<{ title: string; url: string; type: string }> = [];
    
    // 1. Buscar recursos en campos personalizados
    if (post.resources && Array.isArray(post.resources)) {
      resources.push(...post.resources);
    }
    
    // 2. Buscar enlaces externos en el contenido
    const content = post.content?.rendered || '';
    const linkRegex = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match: RegExpExecArray | null;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[1];
      const title = match[2];
      
      // Filtrar enlaces que no sean del dominio local
      if (!url.includes('localhost') && !url.includes('codevs.com')) {
        const resourceType = this.determineResourceType(url, title);
        
        // Evitar duplicados
        if (!resources.some(r => r.url === url)) {
          resources.push({
            title: title.trim(),
            url: url,
            type: resourceType
          });
        }
      }
    }
    
    return resources;
  }

  // Función para determinar el tipo de recurso
  private determineResourceType(url: string, title: string): string {
    const lowercaseUrl = url.toLowerCase();
    const lowercaseTitle = title.toLowerCase();
    
    if (lowercaseUrl.includes('github.com') || lowercaseTitle.includes('github') || lowercaseTitle.includes('repositorio')) {
      return 'repository';
    }
    if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('vimeo.com') || lowercaseTitle.includes('video')) {
      return 'video';
    }
    if (lowercaseUrl.includes('docs.') || lowercaseTitle.includes('documentación') || lowercaseTitle.includes('docs')) {
      return 'documentation';
    }
    if (lowercaseTitle.includes('tutorial') || lowercaseTitle.includes('guía') || lowercaseTitle.includes('guide')) {
      return 'tutorial';
    }
    if (lowercaseTitle.includes('herramienta') || lowercaseTitle.includes('tool') || lowercaseTitle.includes('app')) {
      return 'tool';
    }
    if (lowercaseTitle.includes('artículo') || lowercaseTitle.includes('article') || lowercaseTitle.includes('blog')) {
      return 'article';
    }
    
    return 'external-link';
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
