"use server";

import { revalidatePath } from "next/cache";
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

function getSubscriptions(): Subscriptions {
  try {
    // Check if the file exists; if not, create it with default data
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

export async function subscribeAction(term: string, category: string) {
  try {
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
        throw new Error("Invalid category");
    }

    revalidatePath("/");
  } catch (error: unknown) {
    // Use 'unknown' for caught errors
    console.error("Error subscribing:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      term,
      category,
    });
    throw new Error("Failed to subscribe");
  }
}

export async function unsubscribeAction(term: string, category: string) {
  try {
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
        throw new Error("Invalid category");
    }

    revalidatePath("/subscriptions");
  } catch (error: unknown) {
    // Use 'unknown' for caught errors
    console.error("Error unsubscribing:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      term,
      category,
    });
    throw new Error("Failed to unsubscribe");
  }
}
