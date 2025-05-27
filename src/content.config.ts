import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
	}),
});

const knowledgeBase = defineCollection({
	// Load Markdown and MDX files in the `src/content/knowledge-base/` directory.
	loader: glob({ base: './src/content/knowledge-base', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		excerpt: z.string(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		// Author information
		author: z.object({
			name: z.string(),
			avatar: z.string().optional(),
			bio: z.string().optional(),
		}),
		// Knowledge category
		category: z.enum([
			'frontend',
			'backend', 
			'devops',
			'mobile',
			'data-science',
			'ai-ml',
			'security',
			'tools',
			'best-practices',
			'architecture',
			'databases',
			'cloud',
			'other'
		]),
		// Tags for filtering and search
		tags: z.array(z.string()),
		// Difficulty/Quality ranking (1-5)
		ranking: z.number().min(1).max(5),
		// Featured image
		heroImage: z.string().optional(),
		// Attachments (PDFs, videos, etc.)
		attachments: z.array(z.object({
			title: z.string(),
			type: z.enum(['pdf', 'video', 'link', 'code', 'image', 'other']),
			url: z.string(),
			description: z.string().optional(),
			size: z.string().optional(), // e.g., "2.5 MB"
		})).optional(),
		// External resources
		resources: z.array(z.object({
			title: z.string(),
			url: z.string(),
			type: z.enum(['documentation', 'tutorial', 'repository', 'video', 'article', 'tool']),
		})).optional(),
		// Estimated reading time
		readingTime: z.string().optional(),
		// Prerequisites
		prerequisites: z.array(z.string()).optional(),
		// Learning objectives
		objectives: z.array(z.string()).optional(),
	}),
});

export const collections = { blog, knowledgeBase };
