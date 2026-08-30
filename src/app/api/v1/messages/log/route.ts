import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import { resolveConversationByPhone } from '@/lib/whatsapp/resolve-conversation';

export async function POST(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'messages:send');

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const to = typeof body.to === 'string' ? body.to.trim() : '';

    const type =
      typeof body.type === 'string'
        ? body.type.trim()
        : 'document';

    const whatsappMessageId =
      typeof body.whatsapp_message_id === 'string'
        ? body.whatsapp_message_id.trim()
        : '';

    const text =
      typeof body.text === 'string'
        ? body.text.trim()
        : null;

    const mediaUrl =
      typeof body.media_url === 'string'
        ? body.media_url.trim()
        : null;

    if (!to) {
      return fail('bad_request', "'to' is required", 400);
    }

    if (!whatsappMessageId) {
      return fail(
        'bad_request',
        "'whatsapp_message_id' is required",
        400
      );
    }

    // Find/create same contact + conversation used by WACRM
    const resolved = await resolveConversationByPhone(
      ctx.supabase,
      ctx.accountId,
      to,
      typeof body.name === 'string' ? body.name : null
    );

    // Prevent duplicate CRM entries if n8n retries
    const { data: existing } = await ctx.supabase
      .from('messages')
      .select('id')
      .eq('message_id', whatsappMessageId)
      .maybeSingle();

    if (existing) {
      return ok({
        message_id: existing.id,
        conversation_id: resolved.conversationId,
        duplicate: true,
      });
    }

    // Log the already-sent WhatsApp message in WACRM
    const { data: messageRecord, error: messageError } =
      await ctx.supabase
        .from('messages')
        .insert({
          conversation_id: resolved.conversationId,
          sender_type: 'agent',
          content_type: type,
          content_text: text,
          media_url: mediaUrl,
          template_name: null,
          interactive_payload: null,
          message_id: whatsappMessageId,
          status: 'sent',
          reply_to_message_id: null,
        })
        .select()
        .single();

    if (messageError) {
      throw new Error(
        `Failed to save message: ${messageError.message}`
      );
    }

    const lastMessageText =
      text || `[${type}]`;

    const { error: conversationError } = await ctx.supabase
      .from('conversations')
      .update({
        last_message_text: lastMessageText,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', resolved.conversationId);

    if (conversationError) {
      console.error(
        '[messages/log] conversation update failed:',
        conversationError.message
      );
    }

    return ok(
      {
        message_id: messageRecord.id,
        whatsapp_message_id: whatsappMessageId,
        conversation_id: resolved.conversationId,
        contact_id: resolved.contactId,
        contact_created: resolved.contactCreated,
      },
      201
    );
  } catch (err) {
    return toApiErrorResponse(err);
  }
}