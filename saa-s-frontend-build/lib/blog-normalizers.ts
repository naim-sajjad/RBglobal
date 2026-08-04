import type { BlogPost } from "@/app/dashboard/services/blogService"
import type { Insight } from "@/lib/insights"
import type { PublicBlogPost, PublicBlogSummary } from "@/components/blog/blog-types"
function categorySlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function normalizeStaticInsightSummary(insight: Insight): PublicBlogSummary {
  return {
    id: `static-${insight.slug}`,
    title: insight.title,
    slug: insight.slug,
    excerpt: insight.excerpt,
    featuredImage: insight.image,
    publishedAt: insight.date,
    readingTime: insight.readTime,
    category: {
      id: insight.category,
      name: insight.category,
      slug: categorySlug(insight.category),
    },
  }
}

export function normalizeStaticInsight(insight: Insight, related: Insight[]): PublicBlogPost {
  const content = insight.content
    ? [
        insight.content.intro,
        ...insight.content.sections.flatMap((section) => [`## ${section.title}`, section.body]),
        `## ${insight.content.conclusionTitle}`,
        insight.content.conclusion,
      ].join("\n\n")
    : insight.excerpt

  return {
    ...normalizeStaticInsightSummary(insight),
    content,
    seoTitle: insight.title,
    metaDescription: insight.excerpt,
    relatedPosts: related.map(normalizeStaticInsightSummary),
  }
}

export function normalizeApiBlogSummary(post: BlogPost): PublicBlogSummary {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImage: post.featured_image_url ?? post.featured_image ?? null,
    publishedAt: post.published_at,
    readingTime: post.reading_time ? `${post.reading_time} min read` : post.read_time ?? null,
    category: post.category
      ? {
          id: post.category.id,
          name: post.category.name,
          slug: post.category.slug,
        }
      : null,
  }
}

export function normalizeApiBlogPost(post: BlogPost): PublicBlogPost {
  return {
    ...normalizeApiBlogSummary(post),
    content: post.content ?? post.excerpt ?? "",
    seoTitle: post.seo_title,
    metaDescription: post.meta_description,
    cta: {
      title: post.cta_title,
      description: post.cta_description,
      buttonLabel: post.cta_button_label,
      buttonUrl: post.cta_button_url,
    },
    relatedPosts: post.related_posts?.map(normalizeApiBlogSummary),
  }
}

export function mergeBlogSummaries(staticPosts: PublicBlogSummary[], apiPosts: PublicBlogSummary[]) {
  const seen = new Set(staticPosts.map((post) => post.slug))

  return [
    ...staticPosts,
    ...apiPosts.filter((post) => {
      if (seen.has(post.slug)) return false
      seen.add(post.slug)
      return true
    }),
  ]
}
