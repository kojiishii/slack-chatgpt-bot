import type { NextApiRequest, NextApiResponse } from 'next';
import { getChatGPTResponse } from '../../../utils/openai';
import { sendSlackMessage } from '../../../utils/slack';

const DEBUG = true;

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
  if (DEBUG) {
    console.log('Request received:', {
      method: req.method,
      body: req.body,
      headers: req.headers
    });
  }

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
      if (event.type === 'message') {
        console.log('Message event received:', event);
        
        if (event.channel_type === 'channel') {
          console.log('Channel message confirmed');
          
          if (!event.subtype) {
            console.log('Not a system message');
            
            if (!event.text.includes(`<@${payload.authorizations[0].user_id}>`)) {
              console.log('Not a mention');
              const response = await getChatGPTResponse(event.text);
              await sendSlackMessage(event.channel, response);
              return res.status(200).json({ ok: true });
            }
          }
        }
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