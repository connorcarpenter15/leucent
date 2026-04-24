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
    body: 'Code and sketches stay in sync so everyone sees the same moment in the interview.',
    badge: 'Live workspace',
  },
  {
    title: 'AI help that stays on topic',
    body: 'The assistant can reflect what the candidate is actually doing, and you choose how much help is fair.',
    badge: 'Guided assistance',
  },
  {
    title: 'A fresh workspace every time',
    body: 'Each interview gets its own private workspace that is removed when the session ends.',
    badge: 'Privacy by design',
  },
  {
    title: 'Playback after the interview',
    body: 'Replay typing, drawings, assistant messages, and run output afterward at your own pace.',
    badge: 'Review and replay',
  },
  {
    title: 'One screen for interviewers',
    body: 'Follow the candidate, scan what changed, and adjust the exercise from a single interviewer view.',
    badge: 'Interviewer console',
  },
  {
    title: 'Built for hiring teams',
    body: 'Share one team workspace, send simple join links, and keep every interview cleanly separated.',
    badge: 'Teams',
  },
];

export const FEATURES_PAGE_INTRO = {
  eyebrow: 'Platform',
  title: 'What Leucent gives you',
  subtitle:
    'Leucent helps you run live technical interviews where you can watch candidates think in real time.',
};

/** Short blurb for the home page “features” anchor section. */
export const HOME_FEATURES_SUMMARY = {
  eyebrow: 'Platform',
  title: 'What Leucent gives you',
  lead: 'A live workspace, one interviewer view, and playback when the interview is over—without gluing tools together yourself.',
  bullets: [
    'Everyone sees the same live code and drawings.',
    'Optional assistant that follows the real task.',
    'Each session is private and ends with the interview.',
  ],
};
