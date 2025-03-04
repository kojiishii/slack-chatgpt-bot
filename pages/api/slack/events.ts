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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const payload = req.body;

    if (payload.type === 'url_verification') {
      if (payload.challenge) {
        return res.status(200).json({ challenge: payload.challenge });
      }
    }

    if (payload.type === 'event_callback') {
      const { event } = payload;
      
      // メッセージイベントの処理
      if (event.type === 'message' && 
          event.channel_type === 'channel' && 
          !event.subtype && // botやシステムメッセージを除外
          !event.text.includes(`<@${payload.authorizations[0].user_id}>`) // メンションを除外
      ) {
        console.log('Message event:', {
          type: 'message_received',
          event_type: event.type,
          channel_type: event.channel_type,
          subtype: event.subtype,
          text: event.text,
          user_id: payload.authorizations[0]?.user_id
        });
        
        const response = await getChatGPTResponse(event.text);
        await sendSlackMessage(event.channel, response);
        return res.status(200).json({ ok: true });
      }
      
      // メンションイベントの処理
      if (event.type === 'app_mention') {
        console.log('Received mention:', event);
        
        const response = await getChatGPTResponse(event.text);
        await sendSlackMessage(event.channel, response);
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error';

    console.error('Top level error:', errorMessage);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 