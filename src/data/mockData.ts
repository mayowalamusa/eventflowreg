export type Category =
  | "Business"
  | "Technology"
  | "Church"
  | "Education"
  | "Health"
  | "Career"
  | "Finance"
  | "Networking";

export interface Event {
  id: string;
  title: string;
  description: string;
  category: Category;
  date: string;
  time: string;
  endDate?: string;
  location: string;
  locationType: "online" | "in-person";
  price: number;
  currency: string;
  banner: string;
  organizer: string;
  organizerAvatar: string;
  attendees: number;
  capacity: number;
  tags: string[];
  featured?: boolean;
}

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  ticketType: string;
  date: string;
  status: "confirmed" | "pending" | "cancelled";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "host" | "attendee";
  avatar: string;
  joined: string;
  events?: number;
}

export const categories: { name: Category; icon: string; count: number }[] = [
  { name: "Business", icon: "💼", count: 48 },
  { name: "Technology", icon: "💻", count: 63 },
  { name: "Church", icon: "⛪", count: 22 },
  { name: "Education", icon: "🎓", count: 37 },
  { name: "Health", icon: "🏃", count: 29 },
  { name: "Career", icon: "🚀", count: 41 },
  { name: "Finance", icon: "📈", count: 18 },
  { name: "Networking", icon: "🤝", count: 55 },
];

export const events: Event[] = [
  {
    id: "1",
    title: "Lagos Tech Summit 2025",
    description:
      "Africa's largest technology conference bringing together 5,000+ developers, founders, and investors for three days of keynotes, workshops, and networking. Explore AI, blockchain, fintech, and the future of African tech.",
    category: "Technology",
    date: "2025-03-15",
    time: "9:00 AM",
    endDate: "2025-03-17",
    location: "Eko Convention Centre, Lagos",
    locationType: "in-person",
    price: 0,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop&auto=format",
    organizer: "TechHub Lagos",
    organizerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format",
    attendees: 2847,
    capacity: 5000,
    tags: ["AI", "Fintech", "Blockchain"],
    featured: true,
  },
  {
    id: "2",
    title: "Startup Founders Bootcamp",
    description:
      "An intensive three-day bootcamp for early-stage founders. Learn lean startup methodology, fundraising tactics, go-to-market strategy, and how to build a team that ships.",
    category: "Business",
    date: "2025-02-20",
    time: "8:00 AM",
    location: "Co-Creation Hub, Yaba",
    locationType: "in-person",
    price: 25000,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop&auto=format",
    organizer: "Founders Africa",
    organizerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&auto=format",
    attendees: 312,
    capacity: 400,
    tags: ["Startup", "Fundraising", "MVP"],
    featured: true,
  },
  {
    id: "3",
    title: "Women in Finance Forum",
    description:
      "A full-day forum celebrating and empowering women in financial services. Panel discussions, mentorship sessions, and a career fair with 30+ leading financial institutions.",
    category: "Finance",
    date: "2025-03-08",
    time: "10:00 AM",
    location: "Zoom (Virtual)",
    locationType: "online",
    price: 0,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=400&fit=crop&auto=format",
    organizer: "She Leads Finance",
    organizerAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=64&h=64&fit=crop&auto=format",
    attendees: 890,
    capacity: 2000,
    tags: ["Women", "Finance", "Career"],
    featured: true,
  },
  {
    id: "4",
    title: "Digital Health Innovation Summit",
    description:
      "Explore the intersection of technology and healthcare. Featuring demos from 40+ healthtech startups, FDA regulatory panel, telemedicine best practices, and AI diagnostics.",
    category: "Health",
    date: "2025-04-02",
    time: "9:30 AM",
    location: "Landmark Centre, Lagos",
    locationType: "in-person",
    price: 15000,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop&auto=format",
    organizer: "HealthTech Africa",
    organizerAvatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=64&h=64&fit=crop&auto=format",
    attendees: 620,
    capacity: 1000,
    tags: ["Healthtech", "AI", "Telemedicine"],
  },
  {
    id: "5",
    title: "Annual Prayer & Worship Night",
    description:
      "Join thousands of believers for a powerful night of prayer, prophetic worship, and the Word. Guest ministers from across the continent. Free entry, all are welcome.",
    category: "Church",
    date: "2025-02-28",
    time: "6:00 PM",
    location: "National Stadium, Abuja",
    locationType: "in-person",
    price: 0,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1438232992991-995b671e5f87?w=800&h=400&fit=crop&auto=format",
    organizer: "Kingdom Connect",
    organizerAvatar: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=64&h=64&fit=crop&auto=format",
    attendees: 4200,
    capacity: 10000,
    tags: ["Worship", "Prayer", "Faith"],
  },
  {
    id: "6",
    title: "Growth Marketing Masterclass",
    description:
      "A one-day intensive workshop on growth marketing for B2B and B2C products. Learn acquisition funnels, retention loops, A/B testing at scale, and data-driven creative strategy.",
    category: "Career",
    date: "2025-03-22",
    time: "9:00 AM",
    location: "Zoom (Virtual)",
    locationType: "online",
    price: 12000,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop&auto=format",
    organizer: "GrowthAfrica HQ",
    organizerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop&auto=format",
    attendees: 445,
    capacity: 500,
    tags: ["Marketing", "Growth", "B2B"],
  },
  {
    id: "7",
    title: "STEM for Secondary Schools Expo",
    description:
      "An interactive expo connecting secondary school students with STEM career pathways. Robotics demos, coding competitions, university booths, and scholarship announcements.",
    category: "Education",
    date: "2025-04-12",
    time: "10:00 AM",
    location: "University of Lagos",
    locationType: "in-person",
    price: 0,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1532094349884-543559059ffe?w=800&h=400&fit=crop&auto=format",
    organizer: "STEMafrica",
    organizerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&auto=format",
    attendees: 1200,
    capacity: 3000,
    tags: ["STEM", "Youth", "Scholarships"],
  },
  {
    id: "8",
    title: "Lagos Founders Mixer",
    description:
      "The most-anticipated quarterly networking event for Lagos tech founders and investors. Speed networking rounds, lightning pitches, open bar, and great conversations.",
    category: "Networking",
    date: "2025-02-14",
    time: "6:30 PM",
    location: "The Rooftop, Victoria Island",
    locationType: "in-person",
    price: 5000,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop&auto=format",
    organizer: "TechHub Lagos",
    organizerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format",
    attendees: 180,
    capacity: 200,
    tags: ["Networking", "Founders", "Investors"],
    featured: true,
  },
  {
    id: "9",
    title: "Personal Finance Bootcamp",
    description:
      "A practical weekend bootcamp covering budgeting, investing in Nigerian stocks and ETFs, real estate basics, emergency funds, and building generational wealth on any salary.",
    category: "Finance",
    date: "2025-03-29",
    time: "9:00 AM",
    location: "Zoom (Virtual)",
    locationType: "online",
    price: 8000,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop&auto=format",
    organizer: "MoneyWise NG",
    organizerAvatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&h=64&fit=crop&auto=format",
    attendees: 670,
    capacity: 1000,
    tags: ["Personal Finance", "Investing", "Wealth"],
  },
  {
    id: "10",
    title: "Remote Work Career Fair",
    description:
      "Connect with 50+ global companies hiring African talent for remote roles. Portfolio reviews, live interviews, salary negotiation workshop, and visa sponsorship panel.",
    category: "Career",
    date: "2025-04-18",
    time: "11:00 AM",
    location: "Zoom (Virtual)",
    locationType: "online",
    price: 0,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&h=400&fit=crop&auto=format",
    organizer: "RemoteAfrica",
    organizerAvatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=64&h=64&fit=crop&auto=format",
    attendees: 3100,
    capacity: 5000,
    tags: ["Remote Work", "Jobs", "Career"],
  },
  {
    id: "11",
    title: "AI & Machine Learning Conference",
    description:
      "Deep technical conference for ML practitioners. Keynotes from Google DeepMind, Meta AI, and African research labs. Hands-on workshops on LLMs, computer vision, and MLOps.",
    category: "Technology",
    date: "2025-05-10",
    time: "9:00 AM",
    location: "Balmoral Convention Centre, Lagos",
    locationType: "in-person",
    price: 20000,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=400&fit=crop&auto=format",
    organizer: "AI Nigeria",
    organizerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&auto=format",
    attendees: 890,
    capacity: 1500,
    tags: ["AI", "Machine Learning", "LLMs"],
  },
  {
    id: "12",
    title: "Educators Innovation Workshop",
    description:
      "A collaborative workshop for primary and secondary school teachers exploring EdTech tools, project-based learning, classroom management, and curriculum design for the 21st century.",
    category: "Education",
    date: "2025-03-05",
    time: "8:30 AM",
    location: "NOUN Study Centre, Abuja",
    locationType: "in-person",
    price: 3000,
    currency: "NGN",
    banner: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop&auto=format",
    organizer: "EduForward Africa",
    organizerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&auto=format",
    attendees: 220,
    capacity: 300,
    tags: ["EdTech", "Teachers", "Curriculum"],
  },
];

export const registrations: Registration[] = [
  { id: "r1", eventId: "1", eventTitle: "Lagos Tech Summit 2025", name: "Amara Okafor", email: "amara@gmail.com", ticketType: "General", date: "2025-01-12", status: "confirmed" },
  { id: "r2", eventId: "2", eventTitle: "Startup Founders Bootcamp", name: "Emeka Nwosu", email: "emeka@ventures.io", ticketType: "VIP", date: "2025-01-14", status: "confirmed" },
  { id: "r3", eventId: "3", eventTitle: "Women in Finance Forum", name: "Fatima Aliyu", email: "fatima@outlook.com", ticketType: "General", date: "2025-01-15", status: "confirmed" },
  { id: "r4", eventId: "8", eventTitle: "Lagos Founders Mixer", name: "Chibuike Eze", email: "chibuike@startup.ng", ticketType: "Standard", date: "2025-01-16", status: "pending" },
  { id: "r5", eventId: "6", eventTitle: "Growth Marketing Masterclass", name: "Ngozi Adeyemi", email: "ngozi@agency.co", ticketType: "General", date: "2025-01-17", status: "confirmed" },
  { id: "r6", eventId: "11", eventTitle: "AI & Machine Learning Conference", name: "Tunde Bakare", email: "tunde@ai.ng", ticketType: "Early Bird", date: "2025-01-18", status: "confirmed" },
  { id: "r7", eventId: "9", eventTitle: "Personal Finance Bootcamp", name: "Aisha Mohammed", email: "aisha@finance.ng", ticketType: "Standard", date: "2025-01-19", status: "cancelled" },
  { id: "r8", eventId: "4", eventTitle: "Digital Health Innovation Summit", name: "Obinna Obi", email: "obinna@healthtech.ng", ticketType: "Pro", date: "2025-01-20", status: "confirmed" },
];

export const users: User[] = [
  { id: "u1", name: "Amara Okafor", email: "amara@gmail.com", role: "host", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=64&h=64&fit=crop&auto=format", joined: "2024-03-10", events: 8 },
  { id: "u2", name: "Emeka Nwosu", email: "emeka@ventures.io", role: "host", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&auto=format", joined: "2024-05-22", events: 5 },
  { id: "u3", name: "Fatima Aliyu", email: "fatima@outlook.com", role: "attendee", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=64&h=64&fit=crop&auto=format", joined: "2024-07-04" },
  { id: "u4", name: "Chibuike Eze", email: "chibuike@startup.ng", role: "host", avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=64&h=64&fit=crop&auto=format", joined: "2024-08-15", events: 3 },
  { id: "u5", name: "Ngozi Adeyemi", email: "ngozi@agency.co", role: "attendee", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&auto=format", joined: "2024-09-01" },
  { id: "u6", name: "Tunde Bakare", email: "tunde@ai.ng", role: "admin", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format", joined: "2024-01-01", events: 12 },
  { id: "u7", name: "Aisha Mohammed", email: "aisha@finance.ng", role: "attendee", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&auto=format", joined: "2024-10-11" },
  { id: "u8", name: "Obinna Obi", email: "obinna@healthtech.ng", role: "host", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop&auto=format", joined: "2024-11-03", events: 6 },
];

export const analyticsData = {
  registrationsOverTime: [
    { month: "Aug", registrations: 420, revenue: 2100000 },
    { month: "Sep", registrations: 630, revenue: 3150000 },
    { month: "Oct", registrations: 580, revenue: 2900000 },
    { month: "Nov", registrations: 910, revenue: 4550000 },
    { month: "Dec", registrations: 760, revenue: 3800000 },
    { month: "Jan", registrations: 1240, revenue: 6200000 },
  ],
  byCategory: [
    { category: "Technology", count: 1820 },
    { category: "Business", count: 1340 },
    { category: "Career", count: 980 },
    { category: "Networking", count: 760 },
    { category: "Finance", count: 540 },
    { category: "Education", count: 480 },
    { category: "Health", count: 320 },
    { category: "Church", count: 300 },
  ],
  eventTypes: [
    { name: "In-Person", value: 58 },
    { name: "Online", value: 42 },
  ],
};

export function formatPrice(price: number, currency = "NGN"): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}
