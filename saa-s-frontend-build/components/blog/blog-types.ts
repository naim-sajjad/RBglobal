export type PublicBlogCategory = {
  id?: number | string
  name: string
  slug?: string | null
} | null

export type PublicBlogSummary = {
  id?: number | string
  title: string
  slug: string
  excerpt?: string | null
  featuredImage?: string | null
  category?: PublicBlogCategory
  publishedAt?: string | null
  readingTime?: string | null
}

export type PublicBlogPost = PublicBlogSummary & {
  content: string
  seoTitle?: string | null
  metaDescription?: string | null
  cta?: {
    title?: string | null
    description?: string | null
    buttonLabel?: string | null
    buttonUrl?: string | null
  } | null
  relatedPosts?: PublicBlogSummary[]
}
