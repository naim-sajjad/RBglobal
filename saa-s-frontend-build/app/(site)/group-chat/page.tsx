import type { Metadata } from "next"
import { SiteHeader } from "@/components/web/Header"
import { GroupChatHero } from "@/components/group-chat-hero"
import { GroupChatSteps } from "@/components/group-chat-steps"
import { SiteFooter } from "@/components/footer"

export const metadata: Metadata = {
  title: "Our Group Chat | R&B Services Plus Inc.",
  description:
    "Join the R&B Services Plus group chat to get instant alerts on the latest trucking, warehousing and office job openings across Toronto and the GTA.",
}

export default function GroupChatPage() {
  return (
    <main className="bg-background">
      <SiteHeader />
      <GroupChatHero />
      <GroupChatSteps />
      <SiteFooter />
    </main>
  )
}
