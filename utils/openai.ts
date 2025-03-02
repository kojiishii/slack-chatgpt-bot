import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getChatGPTResponse(message: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content || '申し訳ありません。応答を生成できませんでした。';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return 'エラーが発生しました。しばらく待ってから再度お試しください。';
  }
} 