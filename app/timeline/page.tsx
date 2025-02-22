"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

// Define the type for the API response
interface NewsResponse {
  news: string[]; // Array of news items (strings)
  error?: string; // Optional error message for failed requests
}

export default function Timeline() {
  const [timelineNews, setTimelineNews] = useState<string[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch timeline news and upcoming games
  useEffect(() => {
    fetchTimelineData();
  }, []);

  const fetchTimelineData = async () => {
    setError(null); // Reset error state before new request
    try {
      // Fetch latest football news
      const newsResponse = await axios.post<NewsResponse>(
        "/api/news",
        { q: "latest football news" },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (newsResponse.data.news) {
        setTimelineNews(newsResponse.data.news);
      } else if (newsResponse.data.error) {
        setError(newsResponse.data.error);
        setTimelineNews(["Couldn’t fetch timeline news."]);
      }

      // Fetch upcoming important European games (simulated with a prompt to xAI)
      const gamesResponse = await axios.post<NewsResponse>(
        "/api/news",
        {
          q: "list upcoming important football matches in Europe for the next 7 days, one per line, include dates and teams, no extra text or formatting",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (gamesResponse.data.news) {
        setUpcomingGames(gamesResponse.data.news);
      } else if (gamesResponse.data.error) {
        setError((prev) =>
          prev
            ? `${prev}\nCouldn’t fetch upcoming games.`
            : "Couldn’t fetch upcoming games."
        );
        setUpcomingGames(["Couldn’t fetch upcoming games."]);
      }
    } catch (error: any) {
      console.error("Error fetching timeline data:", error);
      setError("Failed to fetch timeline data.");
      setTimelineNews(["Couldn’t fetch timeline news."]);
      setUpcomingGames(["Couldn’t fetch upcoming games."]);
    }
  };

  // Reset the timeline (fetch new data)
  const resetTimeline = () => {
    setTimelineNews([]);
    setUpcomingGames([]);
    fetchTimelineData();
  };

  return (
    <div className="max-w-3xl mx-auto p-5 bg-gray-50">
      <h1 className="text-4xl text-gray-800 text-center mb-5 font-bold">
        Football Timeline
      </h1>

      {/* Back Button */}
      <div className="text-center mb-5">
        <Link href="/" className="text-blue-500 hover:text-blue-700 underline">
          Back to Home
        </Link>
      </div>

      {/* Timeline News */}
      <div>
        <h2 className="text-2xl text-gray-800 mb-3 font-bold">Latest News</h2>
        {timelineNews.length === 0 ? (
          <p className="text-gray-500 italic">Loading news...</p>
        ) : (
          <ul className="list-none p-0 m-0">
            {timelineNews.map((item, index) => (
              <li
                key={index}
                className="bg-white p-3 mb-3 rounded-lg border border-gray-300 shadow-sm hover:scale-102 transition-transform"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Upcoming Games */}
      <div className="mt-8">
        <h2 className="text-2xl text-gray-800 mb-3 font-bold">
          Upcoming Important European Games
        </h2>
        {upcomingGames.length === 0 ? (
          <p className="text-gray-500 italic">Loading games...</p>
        ) : (
          <ul className="list-none p-0 m-0">
            {upcomingGames.map((game, index) => (
              <li
                key={index}
                className="bg-white p-3 mb-3 rounded-lg border border-gray-300 shadow-sm hover:scale-102 transition-transform"
              >
                {game}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reset Timeline Button */}
      <div className="text-center mt-8">
        <button
          onClick={resetTimeline}
          className="p-3 px-6 bg-gray-500 text-white rounded-lg text-lg cursor-pointer shadow-md hover:bg-gray-600 transition-colors"
        >
          Reset Timeline
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-lg mt-5 text-center">
          Error: {error}
        </div>
      )}
    </div>
  );
}
