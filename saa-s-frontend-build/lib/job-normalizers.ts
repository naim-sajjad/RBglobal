import type { JobPost } from "@/app/dashboard/services/jobService"
import { jobs as staticJobs, type Job } from "@/lib/jobs"

export function slugifyJob(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function getJobApplyHref(job: Pick<JobPost, "title" | "location">) {
  const position = job.title.includes(" | ") ? job.title : `${job.title} | ${job.location}`
  return `/apply-form/?job=${encodeURIComponent(position)}`
}

export function staticJobToPost(job: Job): JobPost {
  return {
    id: `static-${slugifyJob(`${job.title}-${job.location}`)}`,
    title: job.title,
    slug: slugifyJob(job.title.includes(" | ") ? job.title : `${job.title}-${job.location}`),
    location: job.location,
    category: job.category,
    image_url: job.image,
    bullets: job.bullets,
    note: job.note,
    application_email: null,
    application_url: null,
    status: "published",
  }
}

export function mergeJobsWithApiPriority(apiJobs: JobPost[], localStaticJobs = staticJobs.map(staticJobToPost)) {
  const apiSlugs = new Set(apiJobs.map((job) => job.slug))

  return [
    ...localStaticJobs.filter((job) => !apiSlugs.has(job.slug)),
    ...apiJobs,
  ]
}
