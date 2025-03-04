import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function getChatGPTResponse(text: string): Promise<string> {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: text }],
    });

    return completion.data.choices[0].message?.content || '応答を生成できませんでした。';
  } catch (error) {
    console.error('ChatGPT API error:', error);
    return 'エラーが発生しました。しばらく待ってから再度お試しください。';
  }
} 