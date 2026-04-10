export type Act1Script = {
  script: string;
  phrases: [string, string, string];
};

const ACT1_SCRIPTS: Record<string, (name: string) => Act1Script> = {
  cafe: (name) => ({
    script: `${name} — picture this. You've just landed in Madrid. First morning. You walk into a café, the smell of coffee hits you, the barista looks up and waits. You've got 3 seconds. Let's make sure you're ready. First phrase: quisiera. Qui-sie-ra. It means I would like. Say it with me — qui, sie, ra. Now the full word: quisiera. Go ahead, tap the mic. Second phrase: un café. Un ca-fé. A coffee. Say it: un, ca, fé. Now together: un café. Your turn. Third phrase: la cuenta por favor. La cuen-ta por fa-vor. The bill please. Syllables: la, cuen, ta, por, fa, vor. Full phrase: la cuenta por favor. Give it a shot. Perfect. Now let's use these for real.`,
    phrases: ["quisiera", "un café", "la cuenta por favor"],
  }),
  meeting: (name) => ({
    script: `${name} — imagine. You're at a party in Barcelona. Someone reaches out their hand. You've got one moment to make a great first impression. Let's nail it. First phrase: mucho gusto. Mu-cho gus-to. Nice to meet you. Say it: mu, cho, gus, to. Full phrase: mucho gusto. Your turn. Second phrase: ¿cómo te llamas? Có-mo te lla-mas. What's your name. Syllables: có, mo, te, lla, mas. Now together: ¿cómo te llamas? Go ahead. Third phrase: encantado. En-can-ta-do. Nice to meet you, masculine. En, can, ta, do. Full: encantado. Try it. Perfect. Now let's use these for real.`,
    phrases: ["mucho gusto", "¿cómo te llamas?", "encantado"],
  }),
  airport: (name) => ({
    script: `${name} — picture this. You've just landed. Luggage in hand. You need to find your gate and you've got 20 minutes. Let's get you there. First phrase: dónde está. Dón-de es-tá. Where is. Say it: dón, de, es, tá. Full: dónde está. Your turn. Second phrase: la puerta. La puer-ta. The gate. La, puer, ta. Together: la puerta. Go ahead. Third phrase: por favor. Por fa-vor. Please. Por, fa, vor. Full phrase: por favor. Try it. Perfect. Now let's use these for real.`,
    phrases: ["dónde está", "la puerta", "por favor"],
  }),
  hotel: (name) => ({
    script: `${name} — imagine. You've been travelling all day. You walk into the hotel lobby. The receptionist smiles. You need to check in. Let's do this. First phrase: tengo una reserva. Ten-go u-na re-ser-va. I have a reservation. Say it: ten, go, u, na, re, ser, va. Full: tengo una reserva. Your turn. Second phrase: una habitación. U-na ha-bi-ta-ción. A room. U, na, ha, bi, ta, ción. Together: una habitación. Go ahead. Third phrase: la llave por favor. La lla-ve por fa-vor. The key please. La, lla, ve, por, fa, vor. Try it. Perfect. Now let's use these for real.`,
    phrases: ["tengo una reserva", "una habitación", "la llave por favor"],
  }),
  restaurant: (name) => ({
    script: `${name} — picture this. You're in a tapas bar in Seville. The waiter is heading over. You need to order and ask for the bill. Let's get you ready. First phrase: quisiera. Qui-sie-ra. I would like. Say it: qui, sie, ra. Full: quisiera. Your turn. Second phrase: la cuenta por favor. La cuen-ta por fa-vor. The bill please. La, cuen, ta, por, fa, vor. Together: la cuenta por favor. Go ahead. Third phrase: ¿tiene wifi? Tie-ne wi-fi. Do you have wifi. Tie, ne, wi, fi. Try it. Perfect. Now let's use these for real.`,
    phrases: ["quisiera", "la cuenta por favor", "¿tiene wifi?"],
  }),
  shopping: (name) => ({
    script: `${name} — imagine. You're in a market in Valencia. You see something you love. The vendor is waiting. Let's make sure you can buy it. First phrase: cuánto cuesta. Cuán-to cues-ta. How much does it cost. Say it: cuán, to, cues, ta. Full: cuánto cuesta. Your turn. Second phrase: muy caro. Muy ca-ro. Too expensive. Muy, ca, ro. Together: muy caro. Go ahead. Third phrase: ¿tiene otro? Tie-ne o-tro. Do you have another. Tie, ne, o, tro. Try it. Perfect. Now let's use these for real.`,
    phrases: ["cuánto cuesta", "muy caro", "¿tiene otro?"],
  }),
  directions: (name) => ({
    script: `${name} — picture this. You're lost in a beautiful old town. A local walks by. You've got one chance to ask. Let's nail it. First phrase: cómo llego a. Có-mo lle-go a. How do I get to. Say it: có, mo, lle, go, a. Full: cómo llego a. Your turn. Second phrase: por favor. Por fa-vor. Please. Por, fa, vor. Together: por favor. Go ahead. Third phrase: a la derecha. A la de-re-cha. To the right. A, la, de, re, cha. Try it. Perfect. Now let's use these for real.`,
    phrases: ["cómo llego a", "por favor", "a la derecha"],
  }),
  work: (name) => ({
    script: `${name} — imagine. You're in a meeting. Your new colleague extends their hand. First impression time. Let's make it count. First phrase: encantado. En-can-ta-do. Nice to meet you. Say it: en, can, ta, do. Full: encantado. Your turn. Second phrase: mucho gusto. Mu-cho gus-to. Nice to meet you. Mu, cho, gus, to. Together: mucho gusto. Go ahead. Third phrase: ¿en qué trabajas? En qué tra-ba-jas. What do you do. En, qué, tra, ba, jas. Try it. Perfect. Now let's use these for real.`,
    phrases: ["encantado", "mucho gusto", "¿en qué trabajas?"],
  }),
};

const ACT2_SCRIPTS: Record<string, (name: string) => string> = {
  cafe: (name) =>
    `Perfect ${name}. Now let's use these for real. I'm your barista. Order from me — start with quisiera.`,
  meeting: (name) =>
    `Perfect ${name}. Now let's use these for real. I'm someone you've just met. Greet me and ask my name.`,
  airport: (name) =>
    `Perfect ${name}. Now let's use these for real. I'm airport staff. Ask me where your gate is.`,
  hotel: (name) =>
    `Perfect ${name}. Now let's use these for real. I'm the receptionist. Check in with me.`,
  restaurant: (name) =>
    `Perfect ${name}. Now let's use these for real. I'm your waiter. Order and ask for the bill.`,
  shopping: (name) =>
    `Perfect ${name}. Now let's use these for real. I'm the vendor. Ask about prices.`,
  directions: (name) =>
    `Perfect ${name}. Now let's use these for real. I'm a local. Ask me for directions.`,
  work: (name) =>
    `Perfect ${name}. Now let's use these for real. I'm your new colleague. Introduce yourself.`,
};

const ACT3_SCRIPTS: Record<string, (name: string) => string> = {
  cafe: (name) =>
    `Okay ${name} — no hints now. Full scenario. Just you and the barista. Show me what you've got.`,
  meeting: (name) =>
    `Okay ${name} — no hints now. Full scenario. Just you and someone new. Show me what you've got.`,
  airport: (name) =>
    `Okay ${name} — no hints now. Full scenario. Just you and airport staff. Show me what you've got.`,
  hotel: (name) =>
    `Okay ${name} — no hints now. Full scenario. Just you and the receptionist. Show me what you've got.`,
  restaurant: (name) =>
    `Okay ${name} — no hints now. Full scenario. Just you and the waiter. Show me what you've got.`,
  shopping: (name) =>
    `Okay ${name} — no hints now. Full scenario. Just you and the vendor. Show me what you've got.`,
  directions: (name) =>
    `Okay ${name} — no hints now. Full scenario. Just you and a local. Show me what you've got.`,
  work: (name) =>
    `Okay ${name} — no hints now. Full scenario. Just you and your colleague. Show me what you've got.`,
};

export function getAct1Script(scriptId: string, name: string): Act1Script {
  return ACT1_SCRIPTS[scriptId]?.(name || "there") ?? ACT1_SCRIPTS.cafe(name || "there");
}

export function getAct2Script(scriptId: string, name: string): string {
  return ACT2_SCRIPTS[scriptId]?.(name || "there") ?? ACT2_SCRIPTS.cafe(name || "there");
}

export function getAct3Script(scriptId: string, name: string): string {
  return ACT3_SCRIPTS[scriptId]?.(name || "there") ?? ACT3_SCRIPTS.cafe(name || "there");
}

export function getScenarioScript(scriptId: string, name: string): string {
  return getAct1Script(scriptId, name).script;
}

export const SCENARIO_NAMES: Record<string, string> = {
  cafe: "Café & Bar",
  meeting: "Meeting Someone",
  airport: "Airport & Travel",
  hotel: "Hotel Check-in",
  restaurant: "Restaurant",
  shopping: "Shopping",
  directions: "Directions",
  work: "Work & Professional",
};
