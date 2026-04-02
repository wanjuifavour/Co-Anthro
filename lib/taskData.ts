// lib/taskData.ts
// Static task plan — the source of truth for all 10 days.
// This never changes; only the "checked" state lives in Xata.

export type Who = 'A' | 'B' | 'C' | 'ALL'
export type Phase = 'plan' | 'spec' | 'build' | 'polish' | 'pitch'

export interface Task {
  who: Who
  title: string
  detail: string
}

export interface Day {
  date: string
  label: string
  phase: Phase
  tasks: Task[]
}

export const DAYS: Day[] = [
  {
    date: 'Apr 2 (Thu)', label: 'Brainstorm', phase: 'plan',
    tasks: [
      { who: 'ALL', title: 'Kickoff call — align on hackathon rules', detail: 'Re-read the brief together. Confirm what\'s in/out of scope. Note the 11 AM Apr 11 hard stop.' },
      { who: 'ALL', title: 'Brainstorm product ideas (60 min timebox)', detail: 'Each person brings 2 ideas. Use the document shared earlier as a springboard. No criticism yet.' },
      { who: 'ALL', title: 'Vote and lock ONE idea', detail: 'Use a simple 1–3 score per idea on: impact, feasibility in 8 days, demo-ability, relevance to theme. Highest score wins.' },
      { who: 'A',   title: 'Write a one-paragraph problem statement', detail: 'Who is the user? What is their pain? Why does it matter in the Kenyan/African early-career context?' },
      { who: 'ALL', title: 'Confirm team roles', detail: 'Person A = Product lead + presenter. Person B = Lead builder (AI/backend). Person C = Design + user research + deck support.' },
    ]
  },
  {
    date: 'Apr 3 (Fri)', label: 'Decide', phase: 'plan',
    tasks: [
      { who: 'A',   title: 'Write user persona (1–2 real people)', detail: 'Name, age, situation, goal, pain point. Make it vivid. This drives everything else.' },
      { who: 'A',   title: 'Draft the core user journey (3–5 steps)', detail: 'What does the user do from landing on the product to getting value? Map it in plain language.' },
      { who: 'B',   title: 'Spike the core AI interaction', detail: 'Spend 2 hrs confirming the AI call works. E.g. prompt → Claude API → structured output. Just prove it\'s possible.' },
      { who: 'C',   title: 'Competitive scan (1 hr)', detail: 'Find 3 existing tools. Note what they lack. This feeds the \'why us\' slide later.' },
      { who: 'ALL', title: 'End-of-day sync — confirm idea is still valid', detail: 'Does the spike work? Is the problem real? If something is broken, pivot now while it\'s cheap.' },
      { who: 'ALL', title: 'MILESTONE: Idea fully locked by EOD', detail: 'No more pivoting after today. Write it in one sentence and paste it in your group chat.' },
    ]
  },
  {
    date: 'Apr 4 (Sat)', label: 'Spec', phase: 'spec',
    tasks: [
      { who: 'A', title: 'Write the Product Requirements Doc (PRD)', detail: 'Sections: problem, user, core features (MVP only), out of scope, success metrics. Keep it to 1 page.' },
      { who: 'A', title: 'Define the 3 core screens/flows', detail: 'What are the minimum screens to show a compelling demo? Onboarding, core action, result/output.' },
      { who: 'B', title: 'Choose and document the tech stack', detail: 'Frontend (React/Next?), AI (Claude API), backend if needed. Write it down so everyone knows.' },
      { who: 'B', title: 'Set up shared repo and project structure', detail: 'Create GitHub repo. Agree on branching. Set up .env for API keys. Don\'t skip this — it saves hours later.' },
      { who: 'C', title: 'Create lo-fi wireframes for 3 core screens', detail: 'Paper or Figma. Just boxes and labels. Get A to approve before B starts building.' },
      { who: 'C', title: 'Define the AI prompt structure', detail: 'What does the system prompt look like? What does the user input? What should Claude return? Document it.' },
    ]
  },
  {
    date: 'Apr 5 (Sun)', label: 'Spec done', phase: 'spec',
    tasks: [
      { who: 'A',   title: 'Review and sign off on wireframes + PRD', detail: 'Make sure the spec matches the demo you want to show judges. Adjust now, not during build.' },
      { who: 'B',   title: 'Build scaffolding — app skeleton running', detail: 'Blank screens with routing, API connected, dummy data flowing. The app loads and navigates.' },
      { who: 'C',   title: 'Refine wireframes into hi-fi mockups (core screens)', detail: 'Use Figma or similar. Agree on color palette, font, component style. This is the visual bible for B.' },
      { who: 'C',   title: 'Draft pitch narrative outline (slide titles only)', detail: 'Agree on the story arc now: hook → problem → solution → demo → impact → ask. 10 slides max.' },
      { who: 'ALL', title: 'MILESTONE: Spec complete, stack confirmed, repo live', detail: 'B should be able to build solo from here. A and C shift to supporting roles during build.' },
    ]
  },
  {
    date: 'Apr 6 (Mon)', label: 'Build 1', phase: 'build',
    tasks: [
      { who: 'B', title: 'Build screen 1: onboarding/input flow', detail: 'The user enters their info (skills, role, goal etc.). Basic validation. Connects to AI call.' },
      { who: 'B', title: 'Implement core AI call + parse response', detail: 'The real Claude API call with the agreed prompt. Parse and display raw output even if ugly.' },
      { who: 'A', title: 'Test AI output quality — iterate prompts', detail: 'Run 10+ test inputs. Is the output useful and accurate? Refine the prompt. Log what works.' },
      { who: 'C', title: 'Build screen 2: results/output display (UI)', detail: 'Take B\'s raw output and style it. This is the hero screen judges will see.' },
      { who: 'C', title: 'Start building the pitch deck (slides 1–5)', detail: 'Hook, problem, persona, solution overview, how it works. Use real screenshots as they come.' },
    ]
  },
  {
    date: 'Apr 7 (Tue)', label: 'Build 1 done', phase: 'build',
    tasks: [
      { who: 'B',   title: 'Build screen 3: progression/history or dashboard', detail: 'Show the user\'s journey over time, or a second use case flow. Makes it feel like a real product.' },
      { who: 'B',   title: 'End-to-end flow working — no crashes', detail: 'A user can go from screen 1 to screen 3 without breaking. Even if rough, the flow is complete.' },
      { who: 'A',   title: 'User test with 1–2 real people', detail: 'Find one early-career person. Give them the app. Watch them use it. Note where they get confused.' },
      { who: 'C',   title: 'Apply visual design to all 3 screens', detail: 'Consistent colors, typography, spacing. The app looks intentional, not default.' },
      { who: 'ALL', title: 'MILESTONE: Working demo exists by EOD', detail: 'Film a 60-second screen recording as backup. If live demo breaks on Apr 11, you have this.' },
    ]
  },
  {
    date: 'Apr 8 (Wed)', label: 'Build 2', phase: 'build',
    tasks: [
      { who: 'B', title: 'Fix all bugs from user test', detail: 'Prioritize anything that would crash or embarrass during a live demo. Cosmetic bugs last.' },
      { who: 'B', title: 'Add loading states and error handling', detail: 'AI calls take time. Show a spinner. Handle empty/bad responses gracefully. Judges notice this.' },
      { who: 'A', title: 'Write in-app copy and microcopy', detail: 'Button labels, placeholder text, empty states, headings. Good copy makes the product feel real.' },
      { who: 'C', title: 'Finish pitch deck (slides 6–10)', detail: 'Demo slide, impact/why it matters, market context (Kenya/Africa angle), team, closing ask.' },
      { who: 'C', title: 'Add real screenshots to deck', detail: 'Replace wireframe placeholders with actual app screenshots. The deck should look like the product.' },
    ]
  },
  {
    date: 'Apr 9 (Thu)', label: 'Build 2 done', phase: 'build',
    tasks: [
      { who: 'B',   title: 'Performance and mobile responsiveness check', detail: 'Does it work on a phone? Is the AI response fast enough? Optimize if needed.' },
      { who: 'A',   title: 'Full end-to-end demo rehearsal (solo)', detail: 'A runs the full 15-minute presentation alone. Time it. Find the gaps.' },
      { who: 'ALL', title: 'Full team run-through — first time together', detail: 'Simulate the real thing. A presents, B manages the demo, C watches as a judge. Give brutal feedback.' },
      { who: 'C',   title: 'Finalize deck design and animations', detail: 'Clean transitions, consistent fonts, no placeholder text. Export as PDF backup.' },
      { who: 'ALL', title: 'MILESTONE: Product and deck both complete by EOD', detail: 'Nothing new gets added after today. Tomorrow is refinement only.' },
    ]
  },
  {
    date: 'Apr 10 (Fri)', label: 'Final polish', phase: 'polish',
    tasks: [
      { who: 'B',   title: 'Final bug sweep — freeze the codebase', detail: 'Fix only critical bugs. No new features. Tag a release commit as \'demo-final\'.' },
      { who: 'A',   title: 'Prepare demo script', detail: 'Write out every click and sentence for the live demo segment. Rehearse it until it\'s smooth.' },
      { who: 'A',   title: 'Anticipate judge questions — prep answers', detail: 'What will they ask? How does it scale? Why not use X instead? What\'s the business model? Write answers.' },
      { who: 'C',   title: 'Final deck review — print backup copies', detail: 'Proofread every slide. Check all images load. Export to PDF. Bring a USB drive as backup.' },
      { who: 'ALL', title: 'Full dress rehearsal x2', detail: 'Run the full 15-min presentation twice. Once in the morning, once in the afternoon. Time both runs.' },
      { who: 'ALL', title: 'MILESTONE: Everything frozen, rehearsed, and backed up', detail: 'Deck PDF saved. Screen recording saved. Demo-final git tag pushed. Presentation deck on USB.' },
    ]
  },
  {
    date: 'Apr 11 (Sat)', label: 'Pitch day', phase: 'pitch',
    tasks: [
      { who: 'ALL', title: 'Morning: final calm run-through (no changes)', detail: 'One last full rehearsal. This is confidence-building, not editing. Nothing changes today.' },
      { who: 'B',   title: 'Set up demo environment 1 hr before presentations', detail: 'Laptop charged, browser tabs open, app running, API keys loaded, internet confirmed. Have a hotspot backup.' },
      { who: 'A',   title: 'HARD STOP: all building ceases at 11:00 AM', detail: 'Do not touch the codebase after 11 AM. Trust the work. Any change now is a risk.' },
      { who: 'ALL', title: '2:00 PM — Presentation', detail: 'A leads the talk. B runs the live demo when cued. C manages the deck and is ready to answer technical Qs.' },
      { who: 'ALL', title: 'Q&A — all three engage', detail: 'A handles product/impact Qs. B handles technical Qs. C handles design/research Qs. Don\'t leave one person solo.' },
    ]
  },
]

export const TOTAL_TASKS = DAYS.reduce((sum, d) => sum + d.tasks.length, 0)

export const PHASE_META: Record<string, { label: string; bg: string; border: string; text: string }> = {
  plan:   { label: 'Planning', bg: '#EEEDFE', border: '#AFA9EC', text: '#3C3489' },
  spec:   { label: 'Spec',     bg: '#E1F5EE', border: '#5DCAA5', text: '#085041' },
  build:  { label: 'Build',    bg: '#FAEEDA', border: '#EF9F27', text: '#633806' },
  polish: { label: 'Polish',   bg: '#FAECE7', border: '#F0997B', text: '#712B13' },
  pitch:  { label: 'Pitch',    bg: '#FCEBEB', border: '#F09595', text: '#791F1F' },
}

export const WHO_META: Record<string, { label: string; sub: string; bg: string; border: string; text: string }> = {
  A:   { label: 'Person A', sub: 'Product + Presenter', bg: '#EEEDFE', border: '#AFA9EC', text: '#3C3489' },
  B:   { label: 'Person B', sub: 'Lead Builder',        bg: '#E1F5EE', border: '#5DCAA5', text: '#085041' },
  C:   { label: 'Person C', sub: 'Design + Research',   bg: '#FAECE7', border: '#F0997B', text: '#712B13' },
  ALL: { label: 'All',      sub: 'Full team',           bg: '#F1EFE8', border: '#B4B2A9', text: '#444441' },
}
