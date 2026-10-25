import Anthropic from '@anthropic-ai/sdk';
import { buildTutorSystemPrompt } from '@/lib/tutor-context';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, sectionSlug } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      sectionSlug?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages manquants', { status: 400 });
    }

    const systemPrompt = buildTutorSystemPrompt(sectionSlug);

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Return a ReadableStream that emits text chunks
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Tutor API error:', error);
    return new Response('Erreur du serveur', { status: 500 });
  }
}
