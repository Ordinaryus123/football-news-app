import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define the path for the subscriptions file in the project root
const subscriptionsFile = path.join(process.cwd(), "subscriptions.json");

// Define the subscriptions type
interface Subscriptions {
  leagues: string[];
  teams: string[];
  players: string[];
}

// Define the response type for subscription data
interface SubscriptionsResponse {
  leagues: string[];
  teams: string[];
  players: string[];
  error?: string;
}

// Define the response type for operation results (e.g., POST, DELETE)
interface SubscriptionOperationResponse {
  success: boolean;
  error?: string;
}

function getSubscriptions(): Subscriptions {
  try {
    if (!fs.existsSync(subscriptionsFile)) {
      fs.writeFileSync(
        subscriptionsFile,
        JSON.stringify({ leagues: [], teams: [], players: [] }, null, 2)
      );
    }
    const data = fs.readFileSync(subscriptionsFile, "utf-8");
    return JSON.parse(data) || { leagues: [], teams: [], players: [] };
  } catch (error: unknown) {
    // Use 'unknown' for caught errors
    console.error("Error loading subscriptions:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      file: subscriptionsFile,
    });
    return { leagues: [], teams: [], players: [] }; // Fallback to default
  }
}

function saveSubscriptions(subscriptions: Subscriptions): void {
  try {
    fs.writeFileSync(subscriptionsFile, JSON.stringify(subscriptions, null, 2));
  } catch (error: unknown) {
    // Use 'unknown' for caught errors
    console.error("Error saving subscriptions:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      file: subscriptionsFile,
    });
    throw new Error(
      `Failed to save subscriptions: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function GET() {
  try {
    const subscriptions = getSubscriptions();
    return NextResponse.json<SubscriptionsResponse>(subscriptions, {
      status: 200,
    });
  } catch (error: unknown) {
    // Use 'unknown' for caught errors
    console.error("Error in GET /api/subscriptions:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json<SubscriptionsResponse>(
      {
        error: "Internal server error",
        leagues: [],
        teams: [],
        players: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { term, category } = await req.json();

    if (
      !term ||
      typeof term !== "string" ||
      !category ||
      typeof category !== "string"
    ) {
      return NextResponse.json<SubscriptionOperationResponse>(
        {
          error: "Invalid subscription data",
          success: false,
        },
        { status: 400 }
      );
    }

    const currentSubs = getSubscriptions();

    switch (category.toLowerCase()) {
      case "league":
        if (!currentSubs.leagues.includes(term)) {
          currentSubs.leagues.push(term);
          saveSubscriptions(currentSubs);
        }
        break;
      case "team":
        if (!currentSubs.teams.includes(term)) {
          currentSubs.teams.push(term);
          saveSubscriptions(currentSubs);
        }
        break;
      case "player":
        if (!currentSubs.players.includes(term)) {
          currentSubs.players.push(term);
          saveSubscriptions(currentSubs);
        }
        break;
      default:
        return NextResponse.json<SubscriptionOperationResponse>(
          {
            error: "Invalid category",
            success: false,
          },
          { status: 400 }
        );
    }

    return NextResponse.json<SubscriptionOperationResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Use 'unknown' for caught errors
    console.error("Error in POST /api/subscriptions:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json<SubscriptionOperationResponse>(
      {
        error: "Failed to subscribe",
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { term, category } = await req.json();

    if (
      !term ||
      typeof term !== "string" ||
      !category ||
      typeof category !== "string"
    ) {
      return NextResponse.json<SubscriptionOperationResponse>(
        {
          error: "Invalid unsubscribe data",
          success: false,
        },
        { status: 400 }
      );
    }

    const currentSubs = getSubscriptions();

    switch (category.toLowerCase()) {
      case "league":
        currentSubs.leagues = currentSubs.leagues.filter(
          (item: string) => item !== term
        );
        saveSubscriptions(currentSubs);
        break;
      case "team":
        currentSubs.teams = currentSubs.teams.filter(
          (item: string) => item !== term
        );
        saveSubscriptions(currentSubs);
        break;
      case "player":
        currentSubs.players = currentSubs.players.filter(
          (item: string) => item !== term
        );
        saveSubscriptions(currentSubs);
        break;
      default:
        return NextResponse.json<SubscriptionOperationResponse>(
          {
            error: "Invalid category",
            success: false,
          },
          { status: 400 }
        );
    }

    return NextResponse.json<SubscriptionOperationResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Use 'unknown' for caught errors
    console.error("Error in DELETE /api/subscriptions:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json<SubscriptionOperationResponse>(
      {
        error: "Failed to unsubscribe",
        success: false,
      },
      { status: 500 }
    );
  }
}
