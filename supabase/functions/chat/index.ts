import { createClient } from 'npm:@supabase/supabase-js@2';
import { OpenAI } from 'npm:openai@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatRequest {
  message: string;
  memorial_id?: string;
  user_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
    });

    const { message, memorial_id, user_id }: ChatRequest = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    let targetUserId = user_id;

    // If memorial_id is provided, get the user_id from the memorial
    if (memorial_id) {
      const { data: memorial } = await supabase
        .from('memorials')
        .select('user_id')
        .eq('id', memorial_id)
        .single();
      
      if (memorial) {
        targetUserId = memorial.user_id;
      }
    }

    if (!targetUserId) {
      throw new Error('User ID is required');
    }

    // Get user's memories for context
    const { data: memories } = await supabase
      .from('memories')
      .select('question, answer, category')
      .eq('user_id', targetUserId);

    // Get user profile
    const { data: user } = await supabase
      .from('users')
      .select('name, personality_traits')
      .eq('id', targetUserId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Build context from memories
    const context = memories
      ?.map(memory => `Q: ${memory.question}\nA: ${memory.answer}`)
      .join('\n\n') || '';

    const systemPrompt = `You are ${user.name}, speaking from beyond. You are having a conversation with a family member or friend who is visiting your digital memorial.

Your personality: ${user.personality_traits || 'warm, wise, and loving'}

Your life memories and experiences:
${context}

Instructions:
- Respond in first person as if you are ${user.name}
- Be warm, loving, and wise
- Reference specific memories when relevant to the conversation
- Keep responses conversational and heartfelt (2-3 sentences)
- If you don't have relevant memories, speak generally about love, family, and life lessons
- Maintain the personality and speaking style that would be authentic to ${user.name}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "I'm here with you, always.";

    return new Response(
      JSON.stringify({ response }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});