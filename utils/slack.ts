import { WebClient } from '@slack/web-api';

// Slackクライアントの初期化
const client = new WebClient(process.env.SLACK_BOT_TOKEN);

// メッセージ送信関数
export async function sendSlackMessage(channel: string, text: string): Promise<void> {
  try {
    await client.chat.postMessage({
      channel: channel,
      text: text,
    });
  } catch (error) {
    console.error('Slack API error:', error);
    throw error;
  }
} 