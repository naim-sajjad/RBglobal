import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BlogDetailPage } from "@/components/blog/BlogDetailPage"
import type { PublicBlogPost } from "@/components/blog/blog-types"
import type { BlogPost } from "@/app/dashboard/services/blogService"
import { normalizeApiBlogPost } from "@/lib/blog-normalizers"

type PostPageProps = {
  params: Promise<{ slug: string }>
}

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "").replace(/\/api\/v1$/, "/api")
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

async function fetchPost(slug: string): Promise<PublicBlogPost | null> {
  const post = await fetchApiPost(slug)
  return post ? normalizeApiBlogPost(post) : null
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
