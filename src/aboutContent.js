// Starting text for the About page and FAQ. Shown until the admin saves
// their own version from the Admin panel (stored in Firestore: site/about, faqs).

export const DEFAULT_ABOUT = {
  title: 'Why The Stillroom exists',
  body: `Most of us spend our best hours working — and somewhere along the way, work started deciding everything else.

We chase the next number, the next title, the next appraisal. We check layoff news at midnight. We compare ourselves to people we've never met. We're surrounded by colleagues and contacts, and still feel like we're doing it alone.

## A quieter room
In old houses, the stillroom was the calm room where things were made slowly and with care. That's the idea here: a quieter space, away from the noise, for people who work.

## What it's for
- Meeting real people in your city — not followers, not leads
- Honest conversations about work and life, without performing
- Small events: coffee, coworking, walks, talks
- Clarity: a private check-in on what you actually want, and one step toward it

## What it isn't
No endless feed. No follower counts. No pressure to look successful. Just people trying to work well and live well.

You're more than your job title. Welcome in.`,
};

export const DEFAULT_FAQS = [
  { q: 'What is The Stillroom?',
    a: 'A community for working professionals: meet people in your city, talk honestly about work and life, join small events, and figure out what you actually want.' },
  { q: 'Is it free?',
    a: 'Yes.' },
  { q: 'How do I meet people near me?',
    a: 'Set your home city in Edit profile. Then browse Members and Events for your city, or say hello in the city Chat.' },
  { q: 'Can I message anyone?',
    a: "You can message people you're connected with. Open someone's profile and tap Connect — once they accept, you can message each other." },
  { q: 'Who can see my profile?',
    a: 'Other signed-in members can see your profile. Your direct messages and your Clarity plan are private — nobody else can read them.' },
  { q: 'What is Clarity?',
    a: 'A private, one-minute check-in. Choose what you want right now, put it in order, and pick one small step for your top priority. Tick it off when it\'s done.' },
  { q: 'Someone is bothering me. What can I do?',
    a: "Block them from their profile. They won't be able to message you, and you won't see them in Members." },
];

export const ADMIN_EMAIL = 'suyash101997@gmail.com';
