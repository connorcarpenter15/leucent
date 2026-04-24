/**
 * Plain-language feature descriptions for the marketing site and /features page.
 */
export type MarketingFeature = {
  title: string;
  body: string;
  badge: string;
};

export const MARKETING_FEATURES: MarketingFeature[] = [
  {
    title: 'Live coding and diagramming together',
    body: 'Candidates use a real code editor and a simple diagram board that stay in sync with what you see. Everyone is looking at the same moment in the interview—no “which version of the file are we on?” confusion.',
    badge: 'Live workspace',
  },
  {
    title: 'AI help that stays on topic',
    body: 'When you turn on the assistant, it can see the same work the candidate is doing, so hints and questions match the task—not generic advice from the internet. You stay in control of how much help is fair for your loop.',
    badge: 'Guided assistance',
  },
  {
    title: 'A fresh workspace every time',
    body: 'Each interview runs in its own private environment that is thrown away when the session ends. Candidates do not inherit someone else’s files, settings, or half-finished work from an earlier session.',
    badge: 'Privacy by design',
  },
  {
    title: 'Playback after the interview',
    body: 'When the interview is over, you can walk back through what happened—typing, diagrams, assistant messages, and run output—at your own pace. Useful for debriefs, calibration, and hiring decisions.',
    badge: 'Review and replay',
  },
  {
    title: 'One screen for interviewers',
    body: 'Follow the candidate’s work, read a clear timeline of what changed, chat with the assistant, and adjust the rules of the exercise—all from a single interviewer view instead of juggling five browser tabs.',
    badge: 'Interviewer console',
  },
  {
    title: 'Built for hiring teams',
    body: 'Share a workspace with your colleagues, send candidates a simple join link, and keep each interview separated so mistakes in one session never spill into another. Roles help you decide who can schedule and who can run sessions.',
    badge: 'Teams',
  },
];

export const FEATURES_PAGE_INTRO = {
  eyebrow: 'Platform',
  title: 'What Leucent gives you',
  subtitle:
    'Leucent is built for technical interviews where you want to watch real problem-solving—not slides or take-home trivia. Here is what that looks like in practice.',
};

/** Short blurb for the home page “features” anchor section. */
export const HOME_FEATURES_SUMMARY = {
  eyebrow: 'Platform',
  title: 'What Leucent gives you',
  lead: 'Give candidates a real editor and drawing space, follow along in one interviewer view, and replay the session when you are done—all without wiring up your own tools.',
  bullets: [
    'Live workspace that stays in sync for everyone in the room',
    'Optional assistant that nudges based on the actual task',
    'Private session that ends when the interview ends',
  ],
};
