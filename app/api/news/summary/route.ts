import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Define the type for the summary response
interface SummaryResponse {
  summary: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { newsId, title } = await req.json();

    if (
      !newsId ||
      typeof newsId !== "string" ||
      !title ||
      typeof title !== "string"
    ) {
      return NextResponse.json<SummaryResponse>(
        {
          error: "Invalid news ID or title",
          summary: "",
        },
        { status: 400 }
      );
    }

    // Initialize the OpenAI client with xAI’s API
    const openai = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });

    // Construct the prompt for a detailed summary using the title
    const prompt = `Provide a detailed but concise summary (about 100-150 words) of the football news item titled "${title}". Include key details, context, and any relevant updates. Do not include any additional formatting or text beyond the summary itself.`;

    // Call xAI’s /v1/chat/completions endpoint
    const completion = await openai.chat.completions.create({
      model: "grok-beta",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant specializing in football (soccer) news summaries.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
    });

    const summary = completion.choices[0]?.message?.content || "";
    if (!summary) {
      throw new Error("No summary returned from xAI API");
    }

    return NextResponse.json<SummaryResponse>({ summary }, { status: 200 });
} catch (error: unknown) {
    console.error("Error fetching summary from xAI:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json<SummaryResponse>(
      {
          error: "Failed to fetch the summary",
          summary: ""
      },
      { status: 500 }
    );
  }
}
