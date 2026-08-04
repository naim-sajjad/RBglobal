export type Job = {
  title: string
  location: string
  category: string
  image: string
  bullets: string[]
  note?: string
}

export const jobs: Job[] = [
  {
    title: "AZ Driver | London, ON",
    location: "London, ON",
    category: "Trucking",
    image: "/jobs/az-highway.png",
    bullets: [
      "Minimum 3-6 months experience required",
      "Heavy handbombing",
      "On-call shifts",
      "Morning and afternoon shift",
    ],
  },
  {
    title: "AZ Driver | Ajax, ON",
    location: "Ajax, ON",
    category: "Trucking",
    image: "/jobs/truck-yard.png",
    bullets: ["Minimum 6 months of experience"],
    note: "Hiring 2 individuals for this role",
  },
  {
    title: "AZ Driver | Cambridge, ON",
    location: "Cambridge, ON",
    category: "Trucking",
    image: "/jobs/loading-dock.png",
    bullets: ["Minimum 3 months experience", "All shifts available"],
  },
  {
    title: "AZ Driver | Whitby, ON",
    location: "Whitby, ON",
    category: "Trucking",
    image: "/jobs/dock-aerial.png",
    bullets: [
      "2 years of experience required",
      "Clean record",
      "Weekend availability",
      "5 to 6 day week",
    ],
  },
  {
    title: "Deep Reach Operator | Mississauga, ON",
    location: "Mississauga, ON",
    category: "Warehousing",
    image: "/jobs/forklift-operator.png",
    bullets: [
      "2 years of experience required",
      "Full time availability",
      "Weekend availability",
    ],
  },
  {
    title: "General Labour | Mississauga, ON",
    location: "Mississauga, ON",
    category: "General Labour",
    image: "/jobs/general-labour.png",
    bullets: ["Full time & part time availability", "Weekend availability"],
  },
  {
    title: "Experienced Accountant | Mississauga, ON",
    location: "Mississauga, ON",
    category: "Office & Accounting",
    image: "/jobs/accountant.png",
    bullets: [],
    note: "Apply for more details",
  },
]
