import { WebClient } from '@slack/web-api';

// Slackクライアントの初期化
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// メッセージ送信関数
export async function sendSlackMessage(channel: string, text: string) {
  try {
    console.log('Sending message to Slack:', { channel, text });
    const result = await slack.chat.postMessage({
      channel: channel,
      text: text,
    });
    console.log('Slack API response:', result);
    return result;
  } catch (error) {
    console.error('Slack API Error:', error);
    throw error; // エラーを再スローして上位で処理
  }
} 