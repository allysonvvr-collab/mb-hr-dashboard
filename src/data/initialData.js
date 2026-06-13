export const initialData = {
  employees: [
    {
      id: 1,
      name: "Mike Torres",
      role: "Foreman",
      phone: "(555) 210-4401",
      email: "mike.torres@yourco.com",
      start: "2021-03-14",
      birthday: "Jul 21",
      wage: 24.50,
      strikes: 0,
      avatar: "MT"
    },
    {
      id: 2,
      name: "Jake Ramos",
      role: "Crew Leader",
      phone: "(555) 318-7723",
      email: "jake.ramos@yourco.com",
      start: "2022-05-01",
      birthday: "Apr 2",
      wage: 20.00,
      strikes: 0,
      avatar: "JR"
    },
    {
      id: 3,
      name: "Derek Williams",
      role: "Crew Member",
      phone: "(555) 407-9812",
      email: "derek.w@yourco.com",
      start: "2023-02-19",
      birthday: "Dec 14",
      wage: 17.00,
      strikes: 1,
      avatar: "DW"
    },
    {
      id: 4,
      name: "Aiden Park",
      role: "Crew Member",
      phone: "(555) 512-3345",
      email: "aiden.p@yourco.com",
      start: "2023-06-09",
      birthday: "Sep 7",
      wage: 16.00,
      strikes: 0,
      avatar: "AP"
    },
    {
      id: 5,
      name: "Luis Garcia",
      role: "Crew Member",
      phone: "(555) 623-8810",
      email: "luis.g@yourco.com",
      start: "2024-02-29",
      birthday: "Jan 29",
      wage: 16.50,
      strikes: 0,
      avatar: "LG"
    },
    {
      id: 6,
      name: "Mia Thompson",
      role: "Office Manager",
      phone: "(555) 714-2209",
      email: "mia.t@yourco.com",
      start: "2020-08-11",
      birthday: "Mar 16",
      wage: 28.00,
      strikes: 0,
      avatar: "MT"
    },
    {
      id: 7,
      name: "Sam Peters",
      role: "Crew Member",
      phone: "(555) 819-5534",
      email: "sam.p@yourco.com",
      start: "2024-04-21",
      birthday: "Jul 4",
      wage: 15.50,
      strikes: 2,
      avatar: "SP"
    }
  ],

  applicants: [
    {
      id: 1,
      name: "Tyrell Johnson",
      role: "Crew Member",
      phone: "(555) 901-2233",
      email: "tjohnson@gmail.com",
      applied: "2026-05-14",
      status: "Interview",
      stars: 4,
      notes: "2 yrs landscaping at GreenEdge. Strong reference from prior supervisor."
    },
    {
      id: 2,
      name: "Bobby Chen",
      role: "Crew Leader",
      phone: "(555) 342-881",
      email: "bobby.chen@gmail.com",
      applied: "2026-05-21",
      status: "Phone Screen",
      stars: 3,
      notes: "Former crew lead at TruGreen. Left due to lack of growth."
    },
    {
      id: 3,
      name: "Amanda Flores",
      role: "Office Assistant",
      phone: "(555) 210-6612",
      email: "aflores@hotmail.com",
      applied: "2026-05-31",
      status: "Applied",
      stars: 5,
      notes: "3 yrs admin experience, familiar with scheduling software."
    },
    {
      id: 4,
      name: "Devon King",
      role: "Crew Member",
      phone: "(555) 430-9921",
      email: "d.king@gmail.com",
      applied: "2026-06-07",
      status: "Rejected",
      stars: 2,
      notes: "No outdoor experience. No-showed first interview."
    }
  ],

  timeOff: [
    {
      id: 1,
      employeeId: 1,
      type: "Vacation",
      dates: "Jul 2 – Jul 6",
      days: 5,
      status: "Approved",
      notes: "Fourth of July week"
    },
    {
      id: 2,
      employeeId: 3,
      type: "Sick",
      dates: "Jun 8",
      days: 1,
      status: "Approved",
      notes: "—"
    },
    {
      id: 3,
      employeeId: 5,
      type: "Personal",
      dates: "Jun 19",
      days: 1,
      status: "Pending",
      notes: "Family appointment"
    },
    {
      id: 4,
      employeeId: 7,
      type: "Vacation",
      dates: "Aug 9 – Aug 13",
      days: 5,
      status: "Pending",
      notes: "Family trip"
    }
  ],

  raises: [
    {
      id: 1,
      employeeId: 1,
      date: "2025-06-28",
      previous: 22.00,
      newRate: 24.50,
      increase: 2.50,
      reason: "Promotion to Foreman + annual review"
    },
    {
      id: 2,
      employeeId: 2,
      date: "2025-06-26",
      previous: 18.50,
      newRate: 20.00,
      increase: 1.50,
      reason: "Annual raise – strong season"
    },
    {
      id: 3,
      employeeId: 6,
      date: "2025-06-26",
      previous: 26.00,
      newRate: 28.00,
      increase: 2.00,
      reason: "Annual raise – took on payroll duties"
    },
    {
      id: 4,
      employeeId: 3,
      date: "2025-06-26",
      previous: 16.00,
      newRate: 17.00,
      increase: 1.00,
      reason: "Annual raise – 1yr milestone"
    },
    {
      id: 5,
      employeeId: 4,
      date: "2025-06-26",
      previous: 15.00,
      newRate: 16.00,
      increase: 1.00,
      reason: "Annual raise"
    },
    {
      id: 6,
      employeeId: 6,
      date: "2024-06-27",
      previous: 24.00,
      newRate: 26.00,
      increase: 2.00,
      reason: "Annual raise + expanded duties"
    },
    {
      id: 7,
      employeeId: 1,
      date: "2024-06-27",
      previous: 20.00,
      newRate: 22.00,
      increase: 2.00,
      reason: "Annual raise – crew leader recognition"
    }
  ],

  incidents: [
    {
      id: 1,
      employeeId: 3,
      date: "2026-05-13",
      description: "Backed trailer into mailbox at 221 Oak St. Mailbox destroyed.",
      cost: 185,
      status: "Closed",
      docSigned: true
    },
    {
      id: 2,
      employeeId: 7,
      date: "2026-06-01",
      description: "Mower deck struck sprinkler head at Riverside HOA. Head cracked.",
      cost: 95,
      status: "Open",
      docSigned: false
    },
    {
      id: 3,
      employeeId: 2,
      date: "2025-04-27",
      description: "Minor curb scrape on company truck #3 pulling out of the lot.",
      cost: 650,
      status: "Closed",
      docSigned: true
    }
  ],

  certifications: [
    {
      id: 1,
      employeeId: 1,
      name: "OSHA 10",
      earned: "2022-04-09",
      expires: null,
      status: "Active"
    },
    {
      id: 2,
      employeeId: 1,
      name: "Pesticide Applicator License",
      earned: "2023-02-28",
      expires: "2027-02-28",
      status: "Active"
    },
    {
      id: 3,
      employeeId: 2,
      name: "OSHA 10",
      earned: "2023-06-14",
      expires: null,
      status: "Active"
    },
    {
      id: 4,
      employeeId: 6,
      name: "QuickBooks Certified",
      earned: "2021-11-19",
      expires: "2024-11-19",
      status: "Expired"
    },
    {
      id: 5,
      employeeId: 5,
      name: "Pesticide Applicator License",
      earned: null,
      expires: null,
      status: "In Progress"
    }
  ],

  uniforms: [
    { id: 1, employeeId: 1, item: "Polo Shirt", size: "L", qty: 3, issued: "2025-03-01", status: "Good" },
    { id: 2, employeeId: 1, item: "Hat", size: "One Size", qty: 2, issued: "2025-03-01", status: "Good" },
    { id: 3, employeeId: 2, item: "Polo Shirt", size: "M", qty: 3, issued: "2025-03-01", status: "Good" },
    { id: 4, employeeId: 3, item: "Polo Shirt", size: "XL", qty: 2, issued: "2025-06-01", status: "Needs Replacement" },
    { id: 5, employeeId: 4, item: "Polo Shirt", size: "S", qty: 3, issued: "2025-06-01", status: "Good" },
    { id: 6, employeeId: 5, item: "Polo Shirt", size: "L", qty: 3, issued: "2025-06-01", status: "Good" },
    { id: 7, employeeId: 6, item: "Polo Shirt", size: "S", qty: 2, issued: "2025-01-15", status: "Good" },
    { id: 8, employeeId: 7, item: "Polo Shirt", size: "M", qty: 2, issued: "2025-05-01", status: "Good" }
  ],

  reviews: [
    {
      id: 1,
      employeeId: 1,
      date: "2025-06-28",
      rating: 5,
      punctuality: 5,
      quality: 5,
      attitude: 5,
      teamwork: 5,
      notes: "Outstanding season. Led crew through busiest month with zero complaints."
    },
    {
      id: 2,
      employeeId: 2,
      date: "2025-06-26",
      rating: 4,
      punctuality: 4,
      quality: 4,
      attitude: 5,
      teamwork: 4,
      notes: "Reliable crew leader. Could improve on route planning efficiency."
    },
    {
      id: 3,
      employeeId: 3,
      date: "2025-06-26",
      rating: 3,
      punctuality: 3,
      quality: 3,
      attitude: 4,
      teamwork: 3,
      notes: "Incident with trailer needs addressed. Work quality is average."
    },
    {
      id: 4,
      employeeId: 7,
      date: "2026-01-15",
      rating: 2,
      punctuality: 2,
      quality: 3,
      attitude: 2,
      teamwork: 2,
      notes: "Two strikes on record. Sprinkler incident unresolved. Performance plan needed."
    }
  ],

  performance: [
    { id: 1, employeeId: 1, month: "May 2026", jobsCompleted: 42, complaints: 0, rating: 5 },
    { id: 2, employeeId: 2, month: "May 2026", jobsCompleted: 38, complaints: 1, rating: 4 },
    { id: 3, employeeId: 3, month: "May 2026", jobsCompleted: 29, complaints: 2, rating: 3 },
    { id: 4, employeeId: 4, month: "May 2026", jobsCompleted: 31, complaints: 0, rating: 4 },
    { id: 5, employeeId: 5, month: "May 2026", jobsCompleted: 33, complaints: 0, rating: 4 },
    { id: 6, employeeId: 7, month: "May 2026", jobsCompleted: 22, complaints: 3, rating: 2 }
  ]
};
