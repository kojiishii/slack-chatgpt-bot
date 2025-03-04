import type { NextApiRequest, NextApiResponse } from 'next';
import { getChatGPTResponse } from '../../../utils/openai';
import { sendSlackMessage } from '../../../utils/slack';
import { logDebug } from './debug';

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
  team_id?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 認証トークンの確認
  await logDebug({
    type: 'token_check',
    token_exists: !!process.env.SLACK_BOT_TOKEN,
    token_length: process.env.SLACK_BOT_TOKEN?.length
  });

  await logDebug({
    type: 'incoming_request',
    method: req.method,
    headers: {
      'content-type': req.headers['content-type'],
      'x-slack-signature': req.headers['x-slack-signature'],
      'x-slack-request-timestamp': req.headers['x-slack-request-timestamp']
    },
    body: req.body
  });

  const payload = req.body;

  // ペイロードの種類をログ出力
  console.log('Payload type:', payload.type);

  // チャレンジレスポンスの処理
  if (payload.type === 'url_verification') {
    await logDebug({
      type: 'url_verification',
      challenge: payload.challenge
    });
    return res.status(200).json({ challenge: payload.challenge });
  }

  if (payload.type === 'event_callback') {
    await logDebug({
      type: 'event_callback',
      event: payload.event,
      team: payload.team_id,
      timestamp: new Date()
    });

    const { event } = payload;
    if (event.type === 'message') {
      await logDebug({
        type: 'message_event',
        text: event.text,
        channel: event.channel,
        user: event.user
      });
    }

    // イベント処理の前後でログ
    try {
      const response = await getChatGPTResponse(event.text);
      console.log('ChatGPT response:', response);
      await sendSlackMessage(event.channel, response);
      console.log('Message sent to Slack');
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  console.log('=== END REQUEST ===');
  return res.status(200).json({ ok: true });
} 