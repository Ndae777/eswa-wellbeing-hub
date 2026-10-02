export const ESWA = {
  name: "Educator Support and Wellness Alliance",
  short: "ESWA",
  tagline: "Wellness for Teachers. Success for Learners.",
  email: "zongwana.sesethu@gmail.com",
  phone: "067 085 8707",
  location: "Johannesburg, South Africa",
  founder: "Ms. Sesethu Zongwana",
};

export const programmes = [
  {
    slug: "teacher-wellness",
    title: "Teacher Wellness Programme",
    summary:
      "A structured programme focusing on stress management, resilience, emotional wellbeing and professional sustainability.",
  },
  {
    slug: "school-wellbeing-workshops",
    title: "School Wellbeing Workshops",
    summary:
      "Interactive workshops on burnout prevention, work-life balance, emotional intelligence, communication and positive workplace culture.",
  },
  {
    slug: "leadership-wellbeing",
    title: "Leadership Wellbeing Support",
    summary:
      "Capacity-building sessions for School Management Teams on creating psychologically healthy school environments.",
  },
  {
    slug: "professional-learning-communities",
    title: "Professional Learning Communities",
    summary:
      "Facilitated peer support networks that encourage collaboration, shared learning and reflective practice.",
  },
  {
    slug: "research-and-evaluation",
    title: "Research and Evaluation",
    summary:
      "Research on educator wellbeing that informs evidence-based practice and contributes to education policy.",
  },
];

export const pillars = [
  { title: "Support", text: "Practical tools that strengthen educator wellbeing and resilience." },
  { title: "Training", text: "Evidence-informed skills and strategies for educators and leaders." },
  { title: "Research", text: "Knowledge that informs policy and improves educational practice." },
  { title: "Advocacy", text: "Championing educator wellbeing as a national education priority." },
];

export const values = [
  { title: "Compassion", text: "We place the wellbeing of educators at the centre of everything we do." },
  { title: "Integrity", text: "We operate with transparency, professionalism, accountability and ethical leadership." },
  { title: "Excellence", text: "We strive for the highest standards in delivery, research and governance." },
  { title: "Collaboration", text: "Lasting impact is achieved through partnership with schools and communities." },
  { title: "Innovation", text: "We embrace evidence-based approaches that respond to educators' evolving needs." },
];

export const outcomes = [
  "Improved educator wellbeing",
  "Increased staff morale",
  "Stronger professional collaboration",
  "Reduced workplace stress",
  "Improved organisational culture",
  "Enhanced educator engagement",
  "Greater resilience among teaching staff",
  "Positive contributions to learner success",
];

export type Helpline = {
  name: string;
  detail: string;
  numbers: { label: string; value: string }[];
  urgent?: boolean;
  website?: string;
};

/** South African mental health organisations and crisis lines. */
export const helplines: Helpline[] = [
  {
    name: "SADAG — South African Depression and Anxiety Group",
    detail: "24-hour counselling, referrals and support groups for depression, anxiety and trauma.",
    numbers: [
      { label: "24hr helpline", value: "0800 456 789" },
      { label: "Suicide crisis line", value: "0800 567 567" },
      { label: "WhatsApp chat", value: "076 882 2775" },
    ],
    urgent: true,
    website: "https://www.sadag.org",
  },
  {
    name: "Lifeline South Africa",
    detail: "Free telephone counselling, trauma support and gender-based violence assistance.",
    numbers: [
      { label: "National counselling line", value: "0861 322 322" },
      { label: "GBV command centre", value: "0800 428 428" },
    ],
    urgent: true,
    website: "https://lifelinesa.co.za",
  },
  {
    name: "Emergency services",
    detail: "For immediate medical or safety emergencies anywhere in South Africa.",
    numbers: [
      { label: "Ambulance / fire", value: "10177" },
      { label: "Police", value: "10111" },
      { label: "From a cellphone", value: "112" },
    ],
    urgent: true,
  },
  {
    name: "Childline South Africa",
    detail: "Support for learners and for educators worried about a child's safety or wellbeing.",
    numbers: [{ label: "24hr line", value: "116" }],
    website: "https://www.childlinesa.org.za",
  },
  {
    name: "Akeso Psychiatric Response Unit",
    detail: "24-hour psychiatric crisis response and admission guidance.",
    numbers: [{ label: "24hr crisis line", value: "0861 435 787" }],
    website: "https://www.netcare.co.za/akeso",
  },
  {
    name: "South African Federation for Mental Health",
    detail: "Advocacy and referrals to member organisations and community mental health services.",
    numbers: [{ label: "Office", value: "011 781 1852" }],
    website: "https://www.safmh.org",
  },
  {
    name: "Employee Health and Wellness Programme (public schools)",
    detail:
      "Provincial Departments of Education provide free confidential counselling for educators through EHWP. Ask your district office or union for your province's line.",
    numbers: [{ label: "GEMS Emotional Wellbeing (members)", value: "0860 004 367" }],
  },
  {
    name: "Substance abuse helpline",
    detail: "Confidential help with alcohol and drug dependency, for you or someone you support.",
    numbers: [{ label: "SANCA / 24hr line", value: "0800 121 314" }],
  },
];

export type Guide = {
  title: string;
  minutes: number;
  summary: string;
  steps: string[];
};

/** ESWA self-help guides — short practices educators can use at school. */
export const selfHelpGuides: Guide[] = [
  {
    title: "Box breathing before your first lesson",
    minutes: 3,
    summary: "A quick nervous-system reset you can do at your desk before learners walk in.",
    steps: [
      "Sit tall, feet flat, shoulders loose.",
      "Breathe in through the nose for 4 counts.",
      "Hold for 4 counts.",
      "Breathe out slowly for 4 counts, then hold for 4.",
      "Repeat 6 rounds and notice your jaw and shoulders soften.",
    ],
  },
  {
    title: "The 5-minute end-of-day download",
    minutes: 5,
    summary: "Leave the classroom's emotional load at school instead of carrying it home.",
    steps: [
      "Write down the three hardest moments of the day, unfiltered.",
      "Next to each, write one thing that was within your control.",
      "Write one thing you handled well, however small.",
      "Close the book — that is the signal that the workday has ended.",
    ],
  },
  {
    title: "Grounding for an overwhelming moment",
    minutes: 2,
    summary: "Use this when a class, a parent meeting or a deadline tips you into panic.",
    steps: [
      "Name 5 things you can see.",
      "Name 4 things you can feel.",
      "Name 3 things you can hear.",
      "Name 2 things you can smell, and 1 slow breath you can take.",
    ],
  },
  {
    title: "Boundary scripts for teachers",
    minutes: 4,
    summary: "Kind, professional wording for protecting your time and energy.",
    steps: [
      "\"I can help with that on Thursday — today is full.\"",
      "\"I want to give this proper attention, so may we book 15 minutes tomorrow?\"",
      "\"I do not take work calls after 18:00, but I will reply first thing.\"",
      "Practise one script out loud before you need it.",
    ],
  },
  {
    title: "Movement snack between periods",
    minutes: 3,
    summary: "Short movement lowers stress hormones and sharpens focus for the next lesson.",
    steps: [
      "Stand and roll the shoulders back 10 times.",
      "Walk one corridor length at a brisk pace.",
      "Reach overhead, then fold forward gently twice.",
      "Drink a full glass of water before the bell.",
    ],
  },
  {
    title: "Weekly wellbeing check-in",
    minutes: 6,
    summary: "A Sunday ritual that catches burnout early instead of at breaking point.",
    steps: [
      "Rate sleep, energy, mood and connection out of 10.",
      "Circle the lowest score — that is this week's focus.",
      "Choose one small, specific action for it.",
      "Tell one colleague or friend what you chose.",
      "If two or more scores stay below 4 for three weeks, speak to a professional.",
    ],
  },
];

export const warningSigns = [
  "Exhaustion that sleep does not fix",
  "Dreading the classroom you used to enjoy",
  "Irritability with learners or colleagues",
  "Frequent headaches, stomach trouble or illness",
  "Withdrawing from staff and family",
  "Using alcohol or medication to cope",
  "Feeling numb, hopeless or trapped",
  "Thoughts of harming yourself",
];
