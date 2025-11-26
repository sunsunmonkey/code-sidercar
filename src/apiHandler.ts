import { OpenAI } from "openai";

export type ApiConfiguration = {
  model: string;
  apiKey: string;
  baseUrl: string;
};
export type HistoryItem = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export class ApiHandler {
  constructor(private apiConfiguration: ApiConfiguration) {}
  async *createMassage(systemPrompt: string, messages: HistoryItem[]) {
    const client = new OpenAI({
      baseURL: this.apiConfiguration.baseUrl,
      apiKey: this.apiConfiguration.apiKey,
    });

    const request: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming =
      {
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        model: this.apiConfiguration.model,
      };

    const { data: completion } = await client.chat.completions
      .create(request)
      .withResponse();

    for await (const chunk of completion) {
      if (chunk.choices[0].delta.content) {
        yield chunk.choices[0].delta.content;
      }
    }
  }
}
