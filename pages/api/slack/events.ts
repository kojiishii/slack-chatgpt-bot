import type { NextApiRequest, NextApiResponse } from 'next';
import { getChatGPTResponse } from '../../../utils/openai';
import { sendSlackMessage } from '../../../utils/slack';

type SlackEvent = {
  type: string;
  text?: string;
  user?: string;
  channel?: string;
  ts?: string;
}

type SlackEventPayload = {
  token: string;
  challenge?: string;
  type: string;
  event?: SlackEvent;
}

async function logDebug(data: any) {
  try {
    await fetch('https://slack-chatgpt-bot-beta.vercel.app/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Debug log error:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await logDebug({
      type: 'request_received',
      headers: req.headers,
      method: req.method,
      body: req.body
    });

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const payload = req.body;
    await logDebug({ type: 'payload_received', payload });

    if (payload.type === 'url_verification') {
      await logDebug({ type: 'challenge_received', challenge: payload.challenge });
      return res.status(200).json({ challenge: payload.challenge });
    }

    if (payload.type === 'event_callback' && payload.event?.type === 'app_mention') {
      await logDebug({ type: 'app_mention_received', event: payload.event });
      const { event } = payload;
      
      try {
        const response = await getChatGPTResponse(event.text);
        await logDebug({ type: 'chatgpt_response', input: event.text, response });

        try {
          await sendSlackMessage(event.channel, response);
          await logDebug({ type: 'slack_message_sent', channel: event.channel });
        } catch (slackError) {
          const errorMessage = slackError instanceof Error 
            ? slackError.message 
            : 'Unknown Slack API error';

          await logDebug({ 
            type: 'slack_error', 
            error: errorMessage,
            channel: event.channel,
            response: response
          });
        }

        return res.status(200).json({ ok: true });
      } catch (error) {
        await logDebug({ type: 'error', error: error.message });
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    await logDebug({ type: 'unhandled_event', eventType: payload.type });
    return res.status(200).json({ ok: true });

  } catch (error) {
    await logDebug({ type: 'top_level_error', error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
} 