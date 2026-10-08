"use client"
import { api } from "./api"

export type Campaign = {
  id: number; subject: string; body: string; audience: "all" | "seeker" | "employer"; status: string
  recipient_count: number; sent_count: number; failed_count: number; skipped_count: number; pending_count: number
}
export async function getCampaigns() { return (await api.get<{ data: Campaign[] }>("/admin/newsletter-campaigns")).data.data }
export async function saveCampaign(payload: Pick<Campaign, "subject" | "body" | "audience">, id?: number) {
  return (id ? await api.put<{ data: Campaign }>(`/admin/newsletter-campaigns/${id}`, payload) : await api.post<{ data: Campaign }>("/admin/newsletter-campaigns", payload)).data.data
}
export async function sendCampaign(id: number, recipient_count: number) { return (await api.post(`/admin/newsletter-campaigns/${id}/send`, { recipient_count })).data }
export async function testCampaign(id: number, email: string) { return (await api.post(`/admin/newsletter-campaigns/${id}/test`, { email })).data }
