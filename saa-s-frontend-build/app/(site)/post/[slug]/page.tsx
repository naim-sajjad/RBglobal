import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BlogDetailPage } from "@/components/blog/BlogDetailPage"
import type { PublicBlogPost, PublicBlogSummary } from "@/components/blog/blog-types"
import type { BlogPost } from "@/app/dashboard/services/blogService"
import { insights } from "@/lib/insights"
import {
  mergeBlogSummaries,
  normalizeApiBlogPost,
  normalizeApiBlogSummary,
  normalizeStaticInsight,
  normalizeStaticInsightSummary,
} from "@/lib/blog-normalizers"

type PostPageProps = {
  params: Promise<{ slug: string }>
}

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "")
const apiUrl = apiBaseUrl.endsWith("/api") ? apiBaseUrl : `${apiBaseUrl}/api`

async function fetchApiPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${apiUrl}/blog-posts/${slug}`, { cache: "no-store" })
    if (!response.ok) return null
    const result = await response.json()

    return result.data
  } catch {
    return null
  }
}

async function fetchApiSummaries(): Promise<PublicBlogSummary[]> {
  try {
    const response = await fetch(`${apiUrl}/blog-posts?per_page=3&sort=published`, { cache: "no-store" })
    if (!response.ok) return []
    const result = await response.json()

    return (result.data as BlogPost[]).map(normalizeApiBlogSummary)
  } catch {
    return []
  }
}

async function fetchPost(slug: string): Promise<PublicBlogPost | null> {
  const apiPost = await fetchApiPost(slug)
  const staticInsight = insights.find((insight) => insight.slug === slug)
  const staticSummaries = insights.filter((insight) => insight.slug !== slug).map(normalizeStaticInsightSummary)

  if (apiPost) {
    const normalized = normalizeApiBlogPost(apiPost)
    const apiRelated = (normalized.relatedPosts ?? []).filter((post) => post.slug !== slug)
    normalized.relatedPosts = mergeBlogSummaries(apiRelated, staticSummaries).slice(0, 3)

    return normalized
  }

  if (staticInsight) {
    const apiSummaries = (await fetchApiSummaries()).filter((post) => post.slug !== slug)
    const normalized = normalizeStaticInsight(staticInsight, insights.filter((insight) => insight.slug !== slug).slice(0, 3))
    normalized.relatedPosts = mergeBlogSummaries(apiSummaries, normalized.relatedPosts ?? []).slice(0, 3)

    return normalized
  }

  return null
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchPost(slug)

  if (!post) return { title: "Insight Not Found | R&B Services Plus Inc." }

  const title = post.seoTitle || post.title
  const description = post.metaDescription || post.excerpt || undefined
  const canonical = `${siteUrl}/post/${post.slug}`

  return {
    title: `${title} | R&B Services Plus Inc.`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await fetchPost(slug)
  if (!post) notFound()

  return <BlogDetailPage post={post} currentUrl={`${siteUrl}/post/${post.slug}`} />
}
