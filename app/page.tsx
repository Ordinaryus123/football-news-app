"use client";

import { useState, useEffect, useTransition } from "react";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { subscribeAction, unsubscribeAction } from "./actions"; // Import both subscribeAction and unsubscribeAction

// Define the type for the API response
// Define the type for the API response
// Define the type for the API response
// Define the type for the API response
interface NewsResponse {
  news: { id: string; title: string; date: string; url: string }[];
  error?: string;
}
interface SubscriptionsResponse {
  leagues: string[];
  teams: string[];
  players: string[];
  tournaments: string[]; // Ensure tournaments are included
}

export default function Home() {
  // State for search input, categorized subscriptions, news, timeline news, and category selection
  const [tournaments, setTournaments] = useState<string[]>([]); // Tournaments user is following
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [leagues, setLeagues] = useState<string[]>([]); // Leagues user is following
  const [teams, setTeams] = useState<string[]>([]); // Teams user is following/subscribed
  const [players, setPlayers] = useState<string[]>([]); // Players user is subscribed to
  const [news, setNews] = useState<
    { id: string; title: string; date: string; url: string }[]
  >([]); // News from search/subscribe
  const [timelineNews, setTimelineNews] = useState<
    { id: string; title: string; date: string; url: string }[]
  >([]); // Latest football news from timeline
  const [error, setError] = useState<string | null>(null); // State for error messages
  const [category, setCategory] = useState<string>("Team"); // Default category for subscription
  const [customCategory, setCustomCategory] = useState<string>(""); // State for custom category
  const [isCustom, setIsCustom] = useState<boolean>(false); // Track if custom category is selected
  const [isPending, startTransition] = useTransition(); // For optimistic UI updates with Server Actions
  const [isFollowingOpen, setIsFollowingOpen] = useState<boolean>(false); //isFollowingOpen tracks whether the "Following" dropdown is expanded (true) or collapsed (false). //Initialized to false so the dropdown is closed by default.
  const [isLeaguesOpen, setIsLeaguesOpen] = useState<boolean>(false);
  const [isTeamsOpen, setIsTeamsOpen] = useState<boolean>(false);
  const [isPlayersOpen, setIsPlayersOpen] = useState<boolean>(false);
  const [isTournamentsOpen, setIsTournamentsOpen] = useState<boolean>(false);

  // Fetch subscriptions on load
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        const subs = await getSubscriptionsFromServer();
        setLeagues(subs.leagues || []);
        setTeams(subs.teams || []);
        setPlayers(subs.players || []);
        setTournaments(subs.tournaments || []); // Add tournaments to state
      } catch (error: unknown) {
        console.error("Error loading subscriptions:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        setError("Failed to load subscriptions.");
      }
    };
    loadSubscriptions();

    // Cleanup function returns void or undefined (satisfies EffectCallback)
    return () => {
      // No cleanup needed, return undefined implicitly
    };
  }, []);

  // Helper function to fetch subscriptions (simplified, assumes server actions or API)
  async function getSubscriptionsFromServer(): Promise<SubscriptionsResponse> {
    const response = await fetch("/api/subscriptions", { method: "GET" });
    if (!response.ok) throw new Error("Failed to fetch subscriptions");
    const subs = await response.json();
    return subs || { leagues: [], teams: [], players: [], tournaments: [] };
  }

  // Handle searching (fetch news without subscribing)
  const handleSearch = () => {
    if (searchTerm) {
      fetchNews(searchTerm); // Fetch news for the search term
      setSearchTerm(""); // Clear input
    }
  };

  // Handle subscribing (optional, adds to appropriate category with validation and custom option)
  const handleSubscribe = async () => {
    if (!searchTerm || searchTerm.trim() === "") {
      setError("Please enter a valid team, league, or player name.");
      return;
    }

    // Simple validation for valid names
    const isValidName = /^[a-zA-Z0-9\s-]+$/.test(searchTerm.trim());
    if (!isValidName) {
      setError(
        "Please enter a valid name (letters, numbers, spaces, or hyphens only)."
      );
      return;
    }

    // Confirmation dialog
    if (
      !confirm(
        `Subscribe to ${searchTerm} as a ${
          isCustom ? customCategory : category.toLowerCase()
        }?`
      )
    ) {
      return;
    }

    const term = searchTerm.trim();
    const finalCategory = isCustom
      ? customCategory.toLowerCase()
      : category.toLowerCase();

    try {
      startTransition(() => {
        subscribeAction(term, finalCategory).catch((error: unknown) => {
          setError(
            error instanceof Error ? error.message : "Failed to subscribe."
          );
        });
      });
      // Optimistically update UI
      switch (finalCategory) {
        case "league":
          setLeagues([...leagues, term]);
          break;
        case "team":
          setTeams([...teams, term]);
          break;
        case "player":
          setPlayers([...players, term]);
          break;
        case "tournament":
          setTournaments([...tournaments, term]); // Update tournaments state for "Tournament" category
          break;
        default:
          // Fallback for custom categories (only if not "Tournament")
          if (finalCategory !== "tournament") {
            setPlayers([...players, term]); // Default to players for unrecognized custom categories
          } else {
            setTournaments([...tournaments, term]); // Ensure custom "Tournament" goes to tournaments
          }
          break;
      }
      fetchNews(term);
    } catch (error: unknown) {
      setError("Failed to subscribe due to an error.");
      console.error("Subscription error:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    setSearchTerm(""); // Clear input
    setCustomCategory(""); // Clear custom category input
    setIsCustom(false); // Reset custom category selection
  };

  // Handle unsubscribing
  const handleUnsubscribe = (term: string, category: string) => {
    startTransition(() => {
      unsubscribeAction(term, category).catch((error: unknown) => {
        setError(
          error instanceof Error ? error.message : "Failed to unsubscribe"
        );
      });
      // Optimistically update UI
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
        case "tournament":
          setTournaments(tournaments.filter((item: string) => item !== term));
          break;
      }
    });
  };

  // Fetch news from our API route (using POST for App Router route.ts)
  const fetchNews = async (query: string) => {
    setError(null); // Reset error state before new request
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
        setNews((prevNews) => [
          ...prevNews,
          {
            id: `${Date.now()}`,
            title: "Couldn’t fetch news.",
            date: new Date().toISOString().split("T")[0],
            url: "https://example.com/placeholder",
          },
        ]);
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error("Error fetching news:", {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null,
          config: error.config || null,
        });
        setError(error.response?.data?.error || "Failed to fetch news.");
      } else {
        console.error("Error fetching news:", {
          message: String(error),
          response: null,
          status: null,
          config: null,
        });
        setError("Failed to fetch news.");
      }
      setNews((prevNews) => [
        ...prevNews,
        {
          id: `${Date.now()}`,
          title: "Couldn’t fetch news.",
          date: new Date().toISOString().split("T")[0],
          url: "https://example.com/placeholder",
        },
      ]);
    }
  };

  const fetchTimelineNews = async () => {
    setError(null); // Reset error state before new request
    try {
      const response = await axios.post<NewsResponse>(
        "/api/news",
        { q: "latest football news" },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.data.news) {
        setTimelineNews(response.data.news);
      } else if (response.data.error) {
        setError(response.data.error);
        setTimelineNews([
          {
            id: `${Date.now()}`,
            title: "Couldn’t fetch timeline news.",
            date: new Date().toISOString().split("T")[0],
            url: "https://example.com/placeholder",
          },
        ]);
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error("Error fetching timeline news:", {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null,
          config: error.config || null,
        });
        setError("Failed to fetch timeline news.");
      } else {
        console.error("Error fetching timeline news:", {
          message: String(error),
          response: null,
          status: null,
          config: null,
        });
        setError("Failed to fetch timeline news.");
      }
      setTimelineNews([
        {
          id: `${Date.now()}`,
          title: "Couldn’t fetch timeline news.",
          date: new Date().toISOString().split("T")[0],
          url: "https://example.com/placeholder",
        },
      ]);
    }
  };

  // Clear the news feed
  const clearNewsFeed = () => {
    setNews([]); // Clear search/subscribe news
  };

  // Reset the timeline (fetch new latest news)
  const resetTimeline = () => {
    setTimelineNews([]); // Clear current timeline news
    fetchTimelineNews(); // Fetch new timeline news
  };

  // Handle search on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(); // Default to search on Enter
    }
  };

  // Get visible subscriptions for each category (up to 3 per category if not showing all) REMOVED
  //const getVisibleItems = (items: string[]) =>
  //showAll ? items : items.slice(0, 3);
  //BURDAN YAPIŞTIRDIK

  // ... (previous imports, interfaces, and function definitions remain the same)

  return (
    <div className="flex h-screen">
      {/* Sidebar for Subscriptions and Timeline (Left Side) */}
      <aside className="w-72 bg-gradient-to-b from-gray-100 to-gray-200 p-6 shadow-lg rounded-r-lg border-r border-gray-300">
        {/* Timeline button at the top */}
        <Link
          href="/timeline"
          className="block w-full p-3 mb-4 bg-blue-500 text-white rounded-lg text-lg text-center cursor-pointer shadow-md hover:bg-blue-600 transition-colors"
        >
          Timeline
        </Link>

        {/* Following Dropdown */}
        <div className="mb-4">
          <button
            onClick={() => setIsFollowingOpen(!isFollowingOpen)}
            className="w-full p-3 bg-gray-300 text-gray-800 rounded-lg text-lg font-bold text-left flex justify-between items-center shadow-md hover:bg-gray-400 transition-colors"
          >
            Following
            <span>{isFollowingOpen ? "▲" : "▼"}</span>
          </button>
          {isFollowingOpen && (
            <div className="mt-2 space-y-2">
              {/* All Subscriptions Field */}
              <div>
                <Link
                  href="/subscriptions"
                  className="block w-full p-2 bg-gray-200 text-gray-800 rounded-lg text-md font-semibold text-left hover:bg-gray-300 transition-colors"
                >
                  All Subscriptions
                </Link>
              </div>

              {/* Leagues Dropdown */}
              <div>
                <button
                  onClick={() => setIsLeaguesOpen(!isLeaguesOpen)}
                  className="w-full p-2 bg-gray-200 text-gray-800 rounded-lg text-md font-semibold text-left flex justify-between items-center hover:bg-gray-300 transition-colors"
                >
                  Leagues
                  <span>{isLeaguesOpen ? "▲" : "▼"}</span>
                </button>
                {isLeaguesOpen && (
                  <div className="mt-1 pl-4 max-h-40 overflow-y-auto">
                    {leagues.length === 0 ? (
                      <p className="text-gray-500 italic">
                        No leagues followed.
                      </p>
                    ) : (
                      <ul className="list-none p-0 m-0">
                        {leagues.map((league: string) => (
                          <li
                            key={league}
                            className="bg-white p-2 mb-1 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors flex justify-between items-center cursor-pointer"
                            onClick={() => fetchNews(league)}
                          >
                            <span className="text-gray-800">{league}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnsubscribe(league, "league");
                              }}
                              disabled={isPending}
                              className={`text-red-500 hover:text-red-700 ml-2 ${
                                isPending ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Teams Dropdown */}
              <div>
                <button
                  onClick={() => setIsTeamsOpen(!isTeamsOpen)}
                  className="w-full p-2 bg-gray-200 text-gray-800 rounded-lg text-md font-semibold text-left flex justify-between items-center hover:bg-gray-300 transition-colors"
                >
                  Teams
                  <span>{isTeamsOpen ? "▲" : "▼"}</span>
                </button>
                {isTeamsOpen && (
                  <div className="mt-1 pl-4 max-h-40 overflow-y-auto">
                    {teams.length === 0 ? (
                      <p className="text-gray-500 italic">No teams followed.</p>
                    ) : (
                      <ul className="list-none p-0 m-0">
                        {teams.map((team: string) => (
                          <li
                            key={team}
                            className="bg-white p-2 mb-1 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors flex justify-between items-center cursor-pointer"
                            onClick={() => fetchNews(team)}
                          >
                            <span className="text-gray-800">{team}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnsubscribe(team, "team");
                              }}
                              disabled={isPending}
                              className={`text-red-500 hover:text-red-700 ml-2 ${
                                isPending ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Players Dropdown */}
              <div>
                <button
                  onClick={() => setIsPlayersOpen(!isPlayersOpen)}
                  className="w-full p-2 bg-gray-200 text-gray-800 rounded-lg text-md font-semibold text-left flex justify-between items-center hover:bg-gray-300 transition-colors"
                >
                  Players
                  <span>{isPlayersOpen ? "▲" : "▼"}</span>
                </button>
                {isPlayersOpen && (
                  <div className="mt-1 pl-4 max-h-40 overflow-y-auto">
                    {players.length === 0 ? (
                      <p className="text-gray-500 italic">
                        No players subscribed.
                      </p>
                    ) : (
                      <ul className="list-none p-0 m-0">
                        {players.map((player: string) => (
                          <li
                            key={player}
                            className="bg-white p-2 mb-1 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors flex justify-between items-center cursor-pointer"
                            onClick={() => fetchNews(player)}
                          >
                            <span className="text-gray-800">{player}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnsubscribe(player, "player");
                              }}
                              disabled={isPending}
                              className={`text-red-500 hover:text-red-700 ml-2 ${
                                isPending ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Tournaments Dropdown */}
              <div>
                <button
                  onClick={() => setIsTournamentsOpen(!isTournamentsOpen)}
                  className="w-full p-2 bg-gray-200 text-gray-800 rounded-lg text-md font-semibold text-left flex justify-between items-center hover:bg-gray-300 transition-colors"
                >
                  Tournaments
                  <span>{isTournamentsOpen ? "▲" : "▼"}</span>
                </button>
                {isTournamentsOpen && (
                  <div className="mt-1 pl-4 max-h-40 overflow-y-auto">
                    {tournaments.length === 0 ? (
                      <p className="text-gray-500 italic">
                        No tournaments followed.
                      </p>
                    ) : (
                      <ul className="list-none p-0 m-0">
                        {tournaments.map((tournament: string) => (
                          <li
                            key={tournament}
                            className="bg-white p-2 mb-1 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors flex justify-between items-center cursor-pointer"
                            onClick={() => fetchNews(tournament)}
                          >
                            <span className="text-gray-800">{tournament}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnsubscribe(tournament, "tournament");
                              }}
                              disabled={isPending}
                              className={`text-red-500 hover:text-red-700 ml-2 ${
                                isPending ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reset Timeline Button (only visible if timeline news exists on home page) */}
        {timelineNews.length > 0 && (
          <button
            onClick={resetTimeline}
            className="w-full p-3 bg-gray-500 text-white rounded-lg text-lg cursor-pointer shadow-md hover:bg-gray-600 transition-colors"
            disabled={isPending}
          >
            Reset Timeline
          </button>
        )}
      </aside>

      {/* Main Content (Right Side) */}
      <main className="flex-1 p-5 bg-gray-50">
        <h1 className="text-4xl text-gray-800 text-center mb-5 font-bold">
          Football News App
        </h1>

        {/* Search and Subscribe Inputs with Category Dropdown and Custom Input */}
        <div className="flex gap-4 mb-5 justify-center items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for a team, league, or player..."
            className="p-3 w-80 border border-gray-300 rounded-lg text-lg outline-none shadow-sm"
          />
          <select
            value={isCustom ? "Other" : category}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "Other") {
                setIsCustom(true);
                setCategory(""); // Reset default category
              } else {
                setIsCustom(false);
                setCategory(value);
              }
            }}
            className="p-3 border border-gray-300 rounded-lg text-lg shadow-sm"
          >
            <option value="League">League</option>
            <option value="Team">Team</option>
            <option value="Player">Player</option>
            <option value="Tournament">Tournament</option> {/* New option */}
            <option value="Other">Other (Custom)</option>
          </select>
          {isCustom && (
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Enter custom category..."
              className="p-3 border border-gray-300 rounded-lg text-lg shadow-sm w-48"
            />
          )}
          <button
            onClick={handleSearch}
            className="p-3 px-6 bg-blue-500 text-white rounded-lg text-lg cursor-pointer shadow-md hover:bg-blue-600 transition-colors"
            disabled={isPending}
          >
            Search
          </button>
          <button
            onClick={handleSubscribe}
            className="p-3 px-6 bg-green-500 text-white rounded-lg text-lg cursor-pointer shadow-md hover:bg-green-600 transition-colors"
            disabled={isPending}
          >
            Subscribe
          </button>
        </div>

        {/* Clear News Feed Button */}
        <div className="text-center mb-5">
          <button
            onClick={clearNewsFeed}
            className="p-3 px-6 bg-red-500 text-white rounded-lg text-lg cursor-pointer shadow-md hover:bg-red-600 transition-colors"
            disabled={isPending}
          >
            Clear News Feed
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded-lg mb-5 text-center">
            Error: {error || "An error occurred"}{" "}
            {/* Handle null/undefined explicitly */}
          </div>
        )}

        {/* News Feed (Search/Subscribe News) */}
        <div>
          <h2 className="text-2xl text-gray-800 mb-3 font-bold">Latest News</h2>
          {news.length === 0 ? (
            <p className="text-gray-500 italic">
              No news yet. Search or subscribe to a team, league, or player!
            </p>
          ) : (
            <ul className="list-none p-0 m-0">
              {news.map(
                (
                  item: {
                    id: string;
                    title: string;
                    date: string;
                    url: string;
                  },
                  index: number
                ) => (
                  <li
                    key={index}
                    className="bg-white p-4 mb-4 rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col gap-2"
                  >
                    <div className="text-gray-800 font-semibold">
                      {item.title}
                    </div>
                    <div className="text-sm text-gray-500 italic">
                      {item.date}
                    </div>
                    <div className="flex justify-between items-center">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Explore More
                      </a>
                      <Link
                        href={{
                          pathname: `/news/${item.id}`,
                          query: { title: item.title },
                        }}
                        className="text-green-500 hover:underline text-sm"
                      >
                        Brief Summary
                      </Link>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        {/* Timeline News Feed (on home page, if any) */}
        {timelineNews.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl text-gray-800 mb-3 font-bold">
              Timeline News
            </h2>
            <ul className="list-none p-0 m-0">
              {timelineNews.map(
                (
                  item: {
                    id: string;
                    title: string;
                    date: string;
                    url: string;
                  },
                  index: number
                ) => (
                  <li
                    key={index}
                    className="bg-white p-4 mb-4 rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col gap-2"
                  >
                    <div className="text-gray-800 font-semibold">
                      {item.title}
                    </div>
                    <div className="text-sm text-gray-500 italic">
                      {item.date}
                    </div>
                    <div className="flex justify-between items-center">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Explore More
                      </a>
                      <Link
                        href={{
                          pathname: `/news/${item.id}`,
                          query: { title: item.title },
                        }}
                        className="text-green-500 hover:underline text-sm"
                      >
                        Brief Summary
                      </Link>
                    </div>
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
