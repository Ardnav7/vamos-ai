import { NextRequest, NextResponse } from 'next/server';

const SCENARIO_NAMES: Record<string, string> = {
  cafe: 'Café & Bar',
  meeting: 'Meeting Someone',
  airport: 'Airport & Travel',
  hotel: 'Hotel Check-in',
  restaurant: 'Restaurant',
  shopping: 'Shopping',
  directions: 'Directions',
  work: 'Work & Professional',
};

function getSystemPrompt(name: string, scenario: string, exchangeCount: number, previousPhrases: string, masteredPhrases: string): string {
  const scenarioName = SCENARIO_NAMES[scenario] ?? scenario;
  return `You are Carlos. You teach Spanish to adults through short voice conversations.
Scenario: "${scenarioName}". Learner: ${name}. Exchange: ${exchangeCount}.

${masteredPhrases ? `ALREADY MASTERED (from previous sessions): ${masteredPhrases}. These are banked — reference them naturally but do not re-teach. Build on them.` : ''}
${previousPhrases ? `LAST SESSION PHRASES: ${previousPhrases}.` : ''}

YOUR PERSONALITY:
- You sound like a knowledgeable friend, not a children's TV host.
- Brief. Direct. Occasionally funny. Never patronizing.
- You never say "Imagine this" or write long scene descriptions.
- Max 2 sentences per response. Tight.

TEACHING METHOD — CHUNK-BASED (not one word at a time):
- Teach functional chunks: "Quisiera un café" not just "quisiera". Each chunk should be immediately usable in the scene.
- Every chunk gets a parenthetical English translation the first time: "Quisiera un café (I'd like a coffee)."
- After introducing a chunk, the user tries it. Then you BUILD: add a word, combine with a previous chunk, or flip the role.
- Never repeat the same exercise type twice in a row. Rotate:
  (a) Teach a new chunk → user repeats
  (b) You say something in character → user responds using their chunks
  (c) Combination challenge → user strings 2+ chunks together
  (d) Comprehension check → you say Spanish, user shows they understood
  (e) Role flip → user initiates, you respond

SESSION FLOW:
- Exchange 1: ${previousPhrases ? `Quick warm-up: "Last time you learned [phrase]. Use it to start: [prompt]." One sentence.` : `One-sentence context ("You're at a ${scenarioName.toLowerCase()}.") + teach the first chunk. No long scene-setting.`}
- Exchanges 2-6: Teach-practice cycles. One new chunk per turn, building on previous. Keep the scene moving — after 2 chunks, start using them in mini-exchanges where you play a character.
- Exchanges 7-9: Mini-conversation using all learned chunks. You stay in character. Still translate new Spanish in parentheses.
- Exchange 10+: Wrap up. One sentence summary of what was covered. One specific tip. Tease next session.

CONFIRMING ATTEMPTS:
- Never hollow praise ("¡Perfecto!" by itself, "Amazing!" etc.)
- Recast: echo the correct form with translation, then immediately move forward.
- Good: "Quisiera un café (I'd like a coffee) — that works. Now add por favor (please) at the end."
- Bad: "Great job! You're doing so well!"

CORRECTIONS:
- Never say "wrong", "incorrect", "try again", "almost".
- If they garble it, naturally say the right form and move on: "The phrase is quisiera un café (I'd like a coffee). Let's keep going — now tell me what you want with it."
- If transcript is clearly off-topic or nonsensical, correct once briefly, then advance the scene.

ABSOLUTE RULES:
- Translate EVERY Spanish word/phrase in parentheses on first use in each response.
- Any attempt at Spanish = accepted. Move forward. Always.
- Never ask anyone to repeat the same phrase they just attempted.
- Never repeat the same opening pattern twice in a row.
- Max 2 sentences. Momentum over explanation.
- Always end with what comes next — a prompt, a question, or the next chunk to try.`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob;
    const scenario = (formData.get('scenario') as string) || 'cafe';
    const name = (formData.get('name') as string) || 'friend';
    const level = (formData.get('level') as string) || 'beginner';
    const act = parseInt(formData.get('act') as string) || 1;
    const transcriptStr = formData.get('transcript') as string;
    const transcript = transcriptStr ? JSON.parse(transcriptStr) : [];
    const previousPhrases = (formData.get('previousPhrases') as string) || '';
    const masteredPhrases = (formData.get('masteredPhrases') as string) || '';

    if (!audioBlob || !(audioBlob as Blob).size) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Step 1: Transcribe user audio
    const audioFile = new File([audioBlob], 'audio.webm', { 
      type: 'audio/webm' 
    });
    const whisperForm = new FormData();
    whisperForm.append('file', audioFile);
    whisperForm.append('model', 'whisper-1');

    const whisperResponse = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: whisperForm,
      }
    );

    if (!whisperResponse.ok) {
      const err = await whisperResponse.text();
      console.error('[voice/respond] Whisper error:', err);
      return NextResponse.json(
        { error: 'Failed to transcribe audio' },
        { status: 500 }
      );
    }

    const whisperData = await whisperResponse.json();
    const userText = (whisperData.text || '').trim();

    // Step 2: Generate Carlos response with GPT-4o
    const userMessageCount = transcript.filter((t: { role: string }) => t.role === 'user').length;
    const exchangeCount = userMessageCount + 1;
    const messages = [
      {
        role: 'system' as const,
        content: getSystemPrompt(name, scenario, exchangeCount, previousPhrases, masteredPhrases),
      },
      ...transcript.map((t: { role: string; text: string }) => ({
        role: (t.role === 'carlos' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: t.text,
      })),
      { role: 'user' as const, content: userText },
    ];

    const gptResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
        }),
      }
    );

    if (!gptResponse.ok) {
      const err = await gptResponse.text();
      console.error('[voice/respond] GPT error:', err);
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      );
    }

    const gptData = await gptResponse.json();
    const carlosText = gptData.choices?.[0]?.message?.content?.trim();

    if (!carlosText) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    // Step 3: Convert Carlos response to speech
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
          input: carlosText,
          voice: 'onyx',
        }),
      }
    );

    if (!ttsResponse.ok) {
      const err = await ttsResponse.text();
      console.error('[voice/respond] TTS error:', err);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: 500 }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      userText,
      carlosText,
      audioBase64,
    });
  } catch (error) {
    console.error('[voice/respond] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
