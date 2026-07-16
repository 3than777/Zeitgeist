import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { CFO_SYSTEM_PROMPT } from '@/lib/cfo-prompt';
import { uiMessageText } from '@/types/cfo';

export const maxDuration = 60;

/** Per-user daily message cap to keep API costs sane. */
const DAILY_MESSAGE_LIMIT = 50;

interface ChatRequestBody {
  messages: UIMessage[];
  conversationId?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json(
      { error: 'Accounts are not configured on the server yet.' },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json(
      { error: 'Sign in to chat with the CFO.' },
      { status: 401 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { messages, conversationId } = body;
  if (!Array.isArray(messages) || messages.length === 0 || !conversationId) {
    return Response.json(
      { error: 'messages and conversationId are required.' },
      { status: 400 }
    );
  }

  // Daily cap: count today's user messages across the user's conversations.
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('messages')
    .select('id, conversations!inner(user_id)', { count: 'exact', head: true })
    .eq('conversations.user_id', user.id)
    .eq('role', 'user')
    .gte('created_at', dayStart.toISOString());

  if ((count ?? 0) >= DAILY_MESSAGE_LIMIT) {
    return Response.json(
      {
        error:
          "You've hit today's message limit. The CFO will be back tomorrow.",
      },
      { status: 429 }
    );
  }

  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user');
  const lastUserText = uiMessageText(lastUserMessage).trim();
  if (!lastUserText) {
    return Response.json({ error: 'Message is empty.' }, { status: 400 });
  }

  // Create the conversation on first message (id is generated client-side).
  // ignoreDuplicates makes this a no-op for existing conversations.
  const title =
    lastUserText.length > 48 ? `${lastUserText.slice(0, 48)}…` : lastUserText;
  await supabase
    .from('conversations')
    .upsert(
      { id: conversationId, user_id: user.id, title },
      { onConflict: 'id', ignoreDuplicates: true }
    );

  // RLS-gated ownership check: returns a row only if this user owns it.
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .maybeSingle();
  if (!conversation) {
    return Response.json(
      { error: 'Conversation not found.' },
      { status: 403 }
    );
  }

  // Persist the user's message before streaming the reply.
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: lastUserText,
  });

  const result = streamText({
    model: anthropic('claude-sonnet-5'),
    system: CFO_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      if (!text) return;
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: text,
      });
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    },
  });

  return result.toUIMessageStreamResponse();
}
