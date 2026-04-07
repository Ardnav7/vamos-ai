import { NextRequest, NextResponse } from 'next/server';

const SCRIPTS: Record<string, Record<string, string>> = {
  cafe: {
    survival: "You're at a café. The first chunk you need: quisiera un café (I'd like a coffee). Say that back to me.",
    comfortable: "Back at the café. You know how to order — now let's handle the whole visit. Start by greeting the waiter: Hola, quisiera un café, por favor (Hello, I'd like a coffee, please).",
    confident: "Café time. Today you're running the full conversation — ordering, asking questions, paying. Start however you want.",
  },
  meeting: {
    survival: "You're about to meet someone new. The chunk that starts every introduction: Me llamo... (My name is...). Add your name and say it.",
    comfortable: "Time to go deeper than names. Introduce yourself and ask how they're doing: Me llamo [name], ¿cómo estás? (My name is [name], how are you?).",
    confident: "You're at a gathering. Full introductions, small talk, the works. Open the conversation however feels natural.",
  },
  airport: {
    survival: "You just landed. You need your gate. The chunk: ¿Dónde está la puerta? (Where is the gate?). Try it.",
    comfortable: "Airport again, but now you're handling more: checking in, asking about delays, finding things. Start with: Tengo un vuelo a... (I have a flight to...).",
    confident: "Full airport run. Check-in, security questions, finding your gate. Handle it.",
  },
  hotel: {
    survival: "Hotel lobby. The one phrase you need: Tengo una reserva (I have a reservation). Say it to the front desk.",
    comfortable: "You're checking in and you have requests. Start with your reservation, then ask about wifi or breakfast: ¿Tienen wifi? (Do you have wifi?).",
    confident: "Full check-in experience. Reservation, room requests, asking about the area. Go.",
  },
  restaurant: {
    survival: "Restaurant. You need a table. Say: Una mesa para dos, por favor (A table for two, please).",
    comfortable: "You've got your table. Now order a full meal: starter, main, drinks. Start with: Quisiera ver el menú (I'd like to see the menu).",
    confident: "Full restaurant experience. From getting seated to paying the bill. Handle the whole thing.",
  },
  shopping: {
    survival: "You found something you like. The key question: ¿Cuánto cuesta? (How much does it cost?). Ask me.",
    comfortable: "You're shopping and you want to try things, ask about sizes, and negotiate. Start with: ¿Tienen esto en otro color? (Do you have this in another color?).",
    confident: "Full shopping trip. Browse, ask questions, negotiate, pay. You lead.",
  },
  directions: {
    survival: "You're lost. The phrase that saves you: ¿Dónde está...? (Where is...?). Pick a place and ask.",
    comfortable: "You need detailed directions now — not just 'where is it' but understanding the answer. Ask: ¿Cómo llego a...? (How do I get to...?).",
    confident: "Navigate a city. Ask for directions, understand them, ask follow-ups. Full conversation.",
  },
  work: {
    survival: "Business meeting. The opener that earns respect: Encantado de conocerle (Pleased to meet you). Say it.",
    comfortable: "Beyond introductions — talk about what you do. Say: Trabajo en... (I work in...) and add your field.",
    confident: "Full professional conversation. Introductions, discussing work, making plans. Lead the meeting.",
  },
};

export async function POST(request: NextRequest) {
  try {
    const { scenario, name, tier } = await request.json();

    const scenarioScripts = SCRIPTS[scenario] || SCRIPTS.cafe;
    const selectedTier = tier || 'survival';
    const scriptTemplate = scenarioScripts[selectedTier] || scenarioScripts.survival;
    const script = scriptTemplate.replace('[name]', name || 'friend');

    const ttsResponse = await fetch(
      'https://api.openai.com/v1/audio/speech',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: script,
          voice: 'onyx',
        }),
      }
    );

    if (!ttsResponse.ok) {
      const err = await ttsResponse.text();
      console.error('[voice/start] TTS error:', err);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: 500 }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      audioBase64,
      carlosText: script
    });

  } catch (error) {
    console.error('[voice/start] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
