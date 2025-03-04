import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Define the type for the API response
// Define the type for the API response
// Define the type for the API response
interface NewsResponse {
  news: { id: string; title: string; date: string; url: string }[];
  error?: string;
}
// Define the type for the xAI API response (compatible with OpenAI’s ChatCompletion)
interface XaiChatCompletionResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
    param: string;
    code: string;
  };
}

// Define the OpenAI client type (simplified for our use case)
interface OpenAIClient {
  chat: {
    completions: {
      create: (params: {
        model: string;
        messages: Array<{ role: string; content: string }>;
        max_tokens?: number;
      }) => Promise<XaiChatCompletionResponse>;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const { q } = await req.json(); // Get the search query (e.g., team/player name, latest news, upcoming games)

    if (!q || typeof q !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid query" },
        { status: 400 }
      );
    }

    // Initialize the OpenAI client with xAI’s API
    const openai = new OpenAI({
      apiKey: process.env.XAI_API_KEY, // Use environment variable for xAI API key
      baseURL: "https://api.x.ai/v1", // xAI’s API base URL (compatible with OpenAI SDK)
    }) as OpenAIClient;

    // Construct the prompt for Grok based on the query
    let prompt: string;
    if (q.toLowerCase().includes("latest football news")) {
      prompt = `Provide a concise summary of the latest football (soccer) news. Return only the news items, one per line, in a simple list format. Include the date of each news item in the format YYYY-MM-DD, and a URL to a relevant article, separated by "|". For example: "News item 1 | 2025-03-01 | https://example.com/news1". Do not include any additional text or formatting. If no URL is available, use "https://example.com/placeholder".`;
    } else if (
      q.toLowerCase().includes("upcoming important football matches in europe")
    ) {
      prompt = `List upcoming important football matches in Europe for the next 7 days, one per line, include dates and teams in the format "Match details | YYYY-MM-DD | https://example.com/match", no extra text or formatting. If no URL is available, use "https://example.com/placeholder".`;
    } else {
      prompt = `Provide a concise summary of the latest football (soccer) news for ${q}. Return only the news items, one per line, in a simple list format. Include the date of each news item in the format YYYY-MM-DD, and a URL to a relevant article, separated by "|". For example: "News item 1 | 2025-03-01 | https://example.com/news1". Do not include any additional text or formatting. If no URL is available, use "https://example.com/placeholder".`;
    }

    // Call xAI’s /v1/chat/completions endpoint using OpenAI SDK
    const completion = await openai.chat.completions.create({
      model: "grok-beta", // Use grok-beta (or grok-3 if preferred, based on xAI’s availability)
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant specializing in football (soccer) news and schedules.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 150, // Limit the response length to keep it concise
    });

    // Extract news summaries from the response
    // Extract news summaries from the response
    const newsContent = completion.choices[0]?.message?.content || "";
    const newsSummaries = newsContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, index) => {
        const [title, date, url] = line.split("|").map((part) => part.trim());
        return {
          id: `${index}-${Date.now()}`, // Simple unique ID based on index and timestamp
          title,
          date: date || new Date().toISOString().split("T")[0],
          url: url || "https://example.com/placeholder",
        };
      });

    if (newsSummaries.length === 0) {
      throw new Error("No news or game data returned from xAI API");
    }

    // Return the news summaries as JSON
    // Return the news summaries as JSON
    return NextResponse.json<NewsResponse>(
      { news: newsSummaries },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching news from xAI:", {
      message: error.message,
      stack: error.stack,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
      request: error.request
        ? {
            method: error.request.method,
            url: error.request.url,
          }
        : null,
    });

    // Check if the error is from xAI (e.g., 401, 403, 429, etc.)
    if (error.response) {
      const status = error.response.status;
      const errorMessage =
        error.response.data?.error?.message || "Failed to fetch news from xAI";

      if (status === 401) {
        return NextResponse.json(
          { error: "Invalid or missing xAI API key" },
          { status: 401 }
        );
      } else if (status === 403) {
        return NextResponse.json(
          { error: "Access forbidden to xAI API" },
          { status: 403 }
        );
      } else if (status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded for xAI API" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: status || 500 }
      );
    }

    // Generic error for non-xAI-related issues (e.g., network errors)
    return NextResponse.json(
      { error: "Failed to fetch news from xAI" },
      { status: 500 }
    );
  }
}
