import { sessionTypes } from "./programSessions";

const information = [
  {
    number: 1,
    slug: "the-beginning",
    description:
      "Fatherhood starts before your baby arrives. An opportunity to connect with other dads, explore expectations and start preparing for the changes ahead.",
    purpose:
      "Becoming a father can bring excitement, uncertainty and questions you have not had space to explore. This session gives you a place to start talking about the change ahead and what support might look like for you.",
    topics: [
      "Expectations about becoming a father.",
      "Identity and the changes you anticipate.",
      "Talking with your partner about the transition.",
      "Building connections and recognising your support network.",
    ],
  },
  {
    number: 2,
    slug: "getting-ready",
    description:
      "Birth is getting closer. We explore supporting your partner, preparing for the early days and what it means to become a dad.",
    purpose:
      "As the due date approaches, it can be easy to focus on getting everything ready while overlooking how you are feeling. This session makes room for the emotional transition, communication and realistic expectations.",
    topics: [
      "How you are feeling as fatherhood gets closer.",
      "Communicating needs and expectations with your partner.",
      "Recognising stress and making space for support.",
      "Thinking realistically about relationships, routines and adjustment.",
    ],
  },
  {
    number: 3,
    slug: "finding-your-feet",
    description:
      "You've made it through the newborn stage. Let's talk about what's changed, what's been harder than expected and how you're finding your feet.",
    purpose:
      "Early fatherhood can feel very different from what you imagined. This session offers a chance to reconnect with other dads, reflect honestly and consider what would help you feel more supported.",
    topics: [
      "The difference between expectations and everyday experience.",
      "Your wellbeing, energy and changing sense of identity.",
      "Relationships, communication and sharing the load.",
      "Staying connected and asking for help.",
    ],
  },
  {
    number: 4,
    slug: "adjusting",
    description:
      "A year of fatherhood. We explore relationships, identity, wellbeing and how life has changed since becoming a dad.",
    purpose:
      "Reaching the first year does not mean everything suddenly feels settled. This session explores the ongoing adjustment and gives you space to consider how fatherhood fits alongside your relationships, work and sense of self.",
    topics: [
      "How your identity has changed over the first year.",
      "Your wellbeing and the pressures you are carrying.",
      "Relationships, work and time for yourself.",
      "What connection and support look like now.",
    ],
  },
  {
    number: 5,
    slug: "the-next-chapter",
    description:
      "Two years in, and the journey is only beginning. A chance to reflect, reconnect and look ahead to the next stage of fatherhood.",
    purpose:
      "Fatherhood keeps changing, and so do your needs. This session brings the journey together, celebrates what you have learned and helps you think about the connections and support you want to carry forward.",
    topics: [
      "Reflecting on your journey and what has changed.",
      "Relationships, identity and wellbeing two years in.",
      "Keeping supportive connections beyond the program.",
      "Looking ahead and finding ways to stay involved.",
    ],
  },
];

export const sessionInformation = information.map((session) => {
  const shared = sessionTypes.find(
    (item) => item.number === session.number,
  );

  if (!shared) {
    throw new Error("Session information has no matching session type.");
  }

  return {
    ...session,
    title: shared.title,
    timing: shared.timing,
  };
});

export function getSessionInformation(slug: string) {
  return sessionInformation.find((session) => session.slug === slug);
}