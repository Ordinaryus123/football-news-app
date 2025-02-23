"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios, { AxiosError } from "axios"; // Import axios for runtime and AxiosError for types (from @types/axios)

// Use the native Web API Response type
type Response = globalThis.Response;

// Define the types for the API responses
interface NewsResponse {
  news: string[];
  error?: string;
}

interface SubscriptionsResponse {
  leagues: string[];
  teams: string[];
  players: string[];
  tournaments: string[]; // Add tournaments to ensure they’re included in the response
  error?: string;
}

export default function Subscriptions() {
  const [leagues, setLeagues] = useState<string[]>([]); // Leagues user is following
  const [teams, setTeams] = useState<string[]>([]); // Teams user is following/subscribed
  const [players, setPlayers] = useState<string[]>([]); // Players user is subscribed to
  const [tournaments, setTournaments] = useState<string[]>([]); // Tournaments user is following
  const [news, setNews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null); // Ensure error is string | null

  // Fetch subscriptions from server on load
  useEffect(() => {
    const fetchSubscriptions = async () => {
      let response: Response | null = null; // Declare response outside try/catch for scope, using native Response
      try {
        response = await fetch("/api/subscriptions");
        if (!response.ok) throw new Error("Failed to fetch subscriptions");
        const subs: SubscriptionsResponse = await response.json();
        setLeagues(subs.leagues || []);
        setTeams(subs.teams || []);
        setPlayers(subs.players || []);
        setTournaments(subs.tournaments || []); // Ensure tournaments are set
      } catch (error: unknown) {
        console.error("Error fetching subscriptions:", {
          message: error instanceof Error ? error.message : String(error),
          status: response?.status,
          response: response?.status ? await response.json() : null,
        });
        setError("Failed to load subscriptions.");
      }
    };
    fetchSubscriptions();

    // Cleanup function returns void or undefined (satisfies EffectCallback)
    return () => {
      // No cleanup needed, return undefined implicitly
    };
  }, []);

  // Fetch news for a specific subscription
  const fetchNewsForSubscription = async (query: string) => {
    setError(null);
    try {
      const response = await axios.post<NewsResponse>(
        "/api/news",
        { q: query },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.data.news) {
        setNews((prevNews) => [...prevNews, ...response.data.news]);
      } else if (response.data.error) {
        setError(response.data.error);
        setNews((prevNews) => [...prevNews, "Couldn’t fetch news."]);
      }
    } catch (error: unknown) {
      // Use 'unknown' first, then narrow
      if (error instanceof AxiosError) {
        console.error("Error fetching news for subscription:", {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null,
          config: error.config || null,
        });
        setError(error.response?.data?.error || "Failed to fetch news.");
      } else {
        console.error("Error fetching news for subscription:", {
          message: String(error),
          response: null,
          status: null,
          config: null,
        });
        setError("Failed to fetch news.");
      }
      setNews((prevNews) => [...prevNews, "Couldn’t fetch news."]);
    }
  };

  // Clear news for this page
  const clearNews = () => {
    setNews([]);
  };

  // Handle unsubscribing (update server and state)
  const handleUnsubscribe = async (term: string, category: string) => {
    try {
      const response = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, category }),
      });
      if (!response.ok) throw new Error("Failed to unsubscribe");
      switch (category.toLowerCase()) {
        case "league":
          setLeagues(leagues.filter((item: string) => item !== term));
          break;
        case "team":
          setTeams(teams.filter((item: string) => item !== term));
          break;
        case "player":
          setPlayers(players.filter((item: string) => item !== term));
          break;
      }
    } catch (error: unknown) {
      // Use 'unknown' for caught errors
      console.error("Error unsubscribing:", {
        message: error instanceof Error ? error.message : String(error),
      });
      setError("Failed to unsubscribe.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-5 bg-gray-50">
      <h1 className="text-4xl text-gray-800 text-center mb-5 font-bold">
        All Subscriptions
      </h1>

      {/* Back Button */}
      <div className="text-center mb-5">
        <Link href="/" className="text-blue-500 hover:text-blue-700 underline">
          Back to Home
        </Link>
      </div>

      {/* Leagues */}
      <h2 className="text-2xl text-gray-800 mb-3 font-bold border-b border-gray-300 pb-2">
        Leagues
      </h2>
      {leagues.length === 0 ? (
        <p className="text-gray-500 italic text-center">No leagues followed.</p>
      ) : (
        <ul className="list-none p-0 m-0 mb-4">
          {leagues.map((league: string) => (
            <li
              key={league}
              className="bg-white p-3 mb-3 rounded-lg border border-gray-300 shadow-sm hover:bg-gray-200 transition-colors flex justify-between items-center cursor-pointer"
              onClick={() => fetchNewsForSubscription(league)}
            >
              <span className="text-gray-800">{league}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnsubscribe(league, "league");
                }}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Teams */}
      <h2 className="text-2xl text-gray-800 mb-3 font-bold border-b border-gray-300 pb-2">
        Teams
      </h2>
      {teams.length === 0 ? (
        <p className="text-gray-500 italic text-center">No teams followed.</p>
      ) : (
        <ul className="list-none p-0 m-0 mb-4">
          {teams.map((team: string) => (
            <li
              key={team}
              className="bg-white p-3 mb-3 rounded-lg border border-gray-300 shadow-sm hover:bg-gray-200 transition-colors flex justify-between items-center cursor-pointer"
              onClick={() => fetchNewsForSubscription(team)}
            >
              <span className="text-gray-800">{team}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnsubscribe(team, "team");
                }}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Players */}
      <h2 className="text-2xl text-gray-800 mb-3 font-bold border-b border-gray-300 pb-2">
        Players
      </h2>
      {players.length === 0 ? (
        <p className="text-gray-500 italic text-center">
          No players subscribed.
        </p>
      ) : (
        <ul className="list-none p-0 m-0 mb-4">
          {players.map((player: string) => (
            <li
              key={player}
              className="bg-white p-3 mb-3 rounded-lg border border-gray-300 shadow-sm hover:bg-gray-200 transition-colors flex justify-between items-center cursor-pointer"
              onClick={() => fetchNewsForSubscription(player)}
            >
              <span className="text-gray-800">{player}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnsubscribe(player, "player");
                }}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <h2 className="text-2xl text-gray-800 mb-3 font-bold border-b border-gray-300 pb-2">
        Tournaments
      </h2>
      {tournaments.length === 0 ? (
        <p className="text-gray-500 italic text-center">
          No tournaments followed.
        </p>
      ) : (
        <ul className="list-none p-0 m-0 mb-4">
          {tournaments.map((tournament: string) => (
            <li
              key={tournament}
              className="bg-white p-3 mb-3 rounded-lg border border-gray-300 shadow-sm hover:bg-gray-200 transition-colors flex justify-between items-center cursor-pointer"
              onClick={() => fetchNewsForSubscription(tournament)}
            >
              <span className="text-gray-800">{tournament}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnsubscribe(tournament, "tournament");
                }}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* News Feed for Selected Subscription */}
      {news.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl text-gray-800 mb-3 font-bold">
            News for Selected Subscription
          </h2>
          <ul className="list-none p-0 m-0">
            {news.map((item: string, index: number) => (
              <li
                key={index}
                className="bg-white p-3 mb-3 rounded-lg border border-gray-300 shadow-sm hover:scale-102 transition-transform"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="text-center mt-4">
            <button
              onClick={clearNews}
              className="p-3 px-6 bg-red-500 text-white rounded-lg text-lg cursor-pointer shadow-md hover:bg-red-600 transition-colors"
            >
              Clear News
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-lg mt-5 text-center">
          Error: {error || "An error occurred"}{" "}
          {/* Handle null/undefined explicitly */}
        </div>
      )}
    </div>
  );
}
