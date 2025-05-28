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
  }  private transformPost(post: any): WordPressKnowledgePost {
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
      else if (contentLength < 1000) ranking = 2;
    }
    
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
      custom_author: {
        name: post._embedded?.author?.[0]?.name || 'CODEVS Team',
        bio: post._embedded?.author?.[0]?.description || 'Equipo de desarrollo de CODEVS',
        avatar: post._embedded?.author?.[0]?.avatar_urls?.['96'] || '',
      },
      category_slug: specificCategory?.slug || this.mapCategoryFromTags(tags) || 'other',
      tags_list: tags.filter((tag: any) => tag.taxonomy === 'post_tag').map((tag: any) => tag.name) || [],
      prerequisites: this.extractPrerequisites(post.content?.rendered || ''),
      objectives: this.extractObjectives(post.content?.rendered || ''),
      resources: this.extractResources(post.content?.rendered || ''),
      attachments: [], // TODO: Implementar extracción de attachments
    };
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
    const linkMatches = content.match(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi);
    
    if (linkMatches) {
      linkMatches.forEach(link => {
        const urlMatch = link.match(/href="([^"]+)"/);
        const titleMatch = link.match(/>([^<]+)</);
        
        if (urlMatch && titleMatch) {
          const url = urlMatch[1];
          const title = titleMatch[1].replace(/&#\d+;/g, '').trim();
          
          // Determinar tipo de recurso basado en URL
          let type = 'link';
          if (url.includes('docs.') || url.includes('documentation')) type = 'documentation';
          if (url.includes('github.com')) type = 'code';
          if (url.includes('youtube.com') || url.includes('youtu.be')) type = 'video';
          if (url.includes('.pdf')) type = 'pdf';
          
          resources.push({ title, url, type });
        }
      });
    }
    
    return resources;
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
        title: { rendered: 'Fundamentos de Docker - Guía Completa' },
        content: { rendered: `
          <h2>Introducción a Docker</h2>
          <p>Docker es una plataforma de contenedorización que permite empaquetar aplicaciones con todas sus dependencias.</p>
          
          <h3>¿Qué aprenderás?</h3>
          <ul>
            <li>Conceptos básicos de Docker</li>
            <li>Cómo crear tu primer contenedor</li>
            <li>Docker Compose para aplicaciones multi-contenedor</li>
            <li>Mejores prácticas de seguridad</li>
          </ul>
          
          <h3>Comandos básicos</h3>
          <pre><code>
# Descargar una imagen
docker pull nginx

# Ejecutar un contenedor
docker run -d -p 80:80 nginx

# Listar contenedores
docker ps
          </code></pre>
          
          <p>Docker revoluciona la forma en que desarrollamos y desplegamos aplicaciones, proporcionando consistencia entre entornos de desarrollo y producción.</p>
        ` },
        excerpt: { rendered: 'Aprende los conceptos básicos de Docker con ejemplos prácticos y comandos esenciales para contenedorización.' },
        date: '2025-05-27T10:00:00',
        modified: '2025-05-27T10:00:00',
        featured_media: 0,
        hero_image_url: '/blog-placeholder-1.jpg',
        ranking: 5,
        reading_time: '15 minutos',
        custom_author: {
          name: 'Carlos Mendoza',
          bio: 'DevOps Engineer especializado en contenedorización y CI/CD',
          avatar: '/codevs logo.png'
        },
        category_slug: 'devops',
        tags_list: ['docker', 'containers', 'devops', 'tutorial'],
        prerequisites: [
          'Conocimientos básicos de terminal/línea de comandos',
          'Conceptos básicos de sistemas operativos',
          'Familiaridad con el desarrollo de software'
        ],
        objectives: [
          'Entender qué es Docker y por qué es importante',
          'Crear y ejecutar tu primer contenedor',
          'Comprender la diferencia entre imágenes y contenedores',
          'Aplicar mejores prácticas de Docker'
        ],
        resources: [
          {
            title: 'Documentación oficial de Docker',
            url: 'https://docs.docker.com',
            type: 'documentation'
          },
          {
            title: 'Docker Hub - Registro de imágenes',
            url: 'https://hub.docker.com',
            type: 'tool'
          }
        ],
        attachments: [
          {
            id: 1,
            title: 'Docker Cheat Sheet',
            description: 'Guía rápida de comandos Docker más utilizados',
            url: '/downloads/docker-cheatsheet.pdf',
            type: 'pdf',
            size: '2.5 MB',
            mime_type: 'application/pdf'
          },
          {
            id: 2,
            title: 'Dockerfile Examples',
            description: 'Ejemplos de Dockerfiles para diferentes tecnologías',
            url: '/downloads/dockerfile-examples.zip',
            type: 'code',
            size: '1.2 MB',
            mime_type: 'application/zip'
          }
        ]
      },
      {
        id: 2,
        slug: 'react-hooks-guia-completa',
        title: { rendered: 'React Hooks: Guía Completa y Práctica' },
        content: { rendered: `
          <h2>Dominando React Hooks</h2>
          <p>Los React Hooks han revolucionado la forma en que escribimos componentes en React, permitiendo usar estado y otras características sin clases.</p>
          
          <h3>Hooks Fundamentales</h3>
          <h4>useState</h4>
          <pre><code>
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Has hecho clic {count} veces</p>
      <button onClick={() => setCount(count + 1)}>
        Clic aquí
      </button>
    </div>
  );
}
          </code></pre>
          
          <h4>useEffect</h4>
          <pre><code>
import { useEffect, useState } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  return user ? <div>{user.name}</div> : <div>Cargando...</div>;
}
          </code></pre>
        ` },
        excerpt: { rendered: 'Domina los React Hooks con ejemplos prácticos y casos de uso reales para modernizar tus componentes.' },
        date: '2025-05-26T14:30:00',
        modified: '2025-05-26T14:30:00',
        featured_media: 0,
        hero_image_url: '/blog-placeholder-2.jpg',
        ranking: 4,
        reading_time: '20 minutos',
        custom_author: {
          name: 'Ana García',
          bio: 'Frontend Developer especializada en React y TypeScript',
          avatar: '/codevs logo.png'
        },
        category_slug: 'frontend',
        tags_list: ['react', 'hooks', 'javascript', 'frontend'],
        prerequisites: [
          'Conocimientos básicos de JavaScript ES6+',
          'Experiencia básica con React',
          'Familiaridad con JSX'
        ],
        objectives: [
          'Comprender qué son los React Hooks',
          'Implementar useState y useEffect correctamente',
          'Crear hooks personalizados',
          'Migrar componentes de clase a hooks'
        ],
        resources: [
          {
            title: 'Documentación oficial de React Hooks',
            url: 'https://react.dev/reference/react',
            type: 'documentation'
          },
          {
            title: 'React Hooks Playground',
            url: 'https://codesandbox.io/examples/package/react',
            type: 'tool'
          }
        ],
        attachments: [
          {
            id: 3,
            title: 'React Hooks Reference',
            description: 'Referencia completa de todos los hooks de React',
            url: '/downloads/react-hooks-reference.pdf',
            type: 'pdf',
            size: '3.1 MB',
            mime_type: 'application/pdf'
          }
        ]
      },
      {
        id: 3,
        slug: 'python-data-science-introduccion',
        title: { rendered: 'Python para Data Science: Tu Primera Inmersión' },
        content: { rendered: `
          <h2>Comenzando con Data Science en Python</h2>
          <p>Python se ha convertido en el lenguaje de facto para Data Science gracias a su simplicidad y poderosas bibliotecas.</p>
          
          <h3>Bibliotecas Esenciales</h3>
          <ul>
            <li><strong>NumPy</strong>: Computación numérica</li>
            <li><strong>Pandas</strong>: Manipulación de datos</li>
            <li><strong>Matplotlib/Seaborn</strong>: Visualización</li>
            <li><strong>Scikit-learn</strong>: Machine Learning</li>
          </ul>
          
          <h3>Primer Análisis de Datos</h3>
          <pre><code>
import pandas as pd
import matplotlib.pyplot as plt

# Cargar datos
df = pd.read_csv('datos.csv')

# Exploración básica
print(df.head())
print(df.describe())

# Visualización simple
df['columna'].hist()
plt.show()
          </code></pre>
        ` },
        excerpt: { rendered: 'Inicia tu journey en Data Science con Python aprendiendo las bibliotecas fundamentales y técnicas de análisis.' },
        date: '2025-05-25T16:15:00',
        modified: '2025-05-25T16:15:00',
        featured_media: 0,
        hero_image_url: '/blog-placeholder-3.jpg',
        ranking: 5,
        reading_time: '25 minutos',
        custom_author: {
          name: 'Dr. Roberto Silva',
          bio: 'Data Scientist con 10+ años de experiencia en análisis predictivo',
          avatar: '/codevs logo.png'
        },
        category_slug: 'data-science',
        tags_list: ['python', 'data-science', 'pandas', 'numpy', 'machine-learning'],
        prerequisites: [
          'Conocimientos básicos de Python',
          'Conceptos básicos de estadística',
          'Matemáticas nivel bachillerato'
        ],
        objectives: [
          'Configurar entorno de Data Science',
          'Realizar análisis exploratorio de datos',
          'Crear visualizaciones básicas',
          'Entender el flujo de trabajo típico'
        ],
        resources: [
          {
            title: 'Kaggle Learn - Python',
            url: 'https://www.kaggle.com/learn/python',
            type: 'course'
          },
          {
            title: 'Google Colab',
            url: 'https://colab.research.google.com',
            type: 'tool'
          }
        ],
        attachments: [
          {
            id: 4,
            title: 'Dataset de Ejemplo',
            description: 'Dataset para practicar análisis de datos',
            url: '/downloads/sample-dataset.csv',
            type: 'data',
            size: '5.2 MB',
            mime_type: 'text/csv'
          },
          {
            id: 5,
            title: 'Jupyter Notebook Completo',
            description: 'Notebook con todos los ejemplos del tutorial',
            url: '/downloads/data-science-intro.ipynb',
            type: 'code',
            size: '890 KB',
            mime_type: 'application/x-ipynb+json'
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
