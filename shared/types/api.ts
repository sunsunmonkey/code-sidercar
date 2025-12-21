export interface ApiConfiguration {
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}
