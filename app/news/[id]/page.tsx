"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";

// Define the type for the detailed summary response
interface SummaryResponse {
  summary: string;
  error?: string;
}

export default function NewsDetail() {
  const { id } = useParams(); // Get the news ID from the URL
  const searchParams = useSearchParams(); // Get query parameters
  const title = searchParams.get("title"); // Get the title from query parameters
  const [summary, setSummary] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch a detailed summary from the xAI API, passing both ID and title
        const response = await axios.post<SummaryResponse>(
          "/api/news/summary",
          { newsId: id, title },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.data.summary) {
          setSummary(response.data.summary);
        } else if (response.data.error) {
          setError(response.data.error);
        }
      } catch (error: unknown) {
        console.error("Error fetching summary:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        setError("Failed to fetch the summary.");
      } finally {
        setLoading(false);
      }
    };

    if (id && title) {
      fetchSummary();
    } else {
      setError("Missing news ID or title.");
      setLoading(false);
    }
  }, [id, title]);

  return (
    <div className="max-w-3xl mx-auto p-5 bg-gray-50 min-h-screen">
      <h1 className="text-4xl text-gray-800 text-center mb-5 font-bold">
        News Summary
      </h1>

      {/* Display the News Title */}
      <h2 className="text-2xl text-gray-800 mb-3 font-semibold text-center">
        {title || "News Item"}
      </h2>

      {/* Back to Home Button */}
      <div className="text-center mb-5">
        <Link href="/" className="text-blue-500 hover:text-blue-700 underline">
          Back to Home
        </Link>
      </div>

      {/* Summary Display */}
      {loading ? (
        <p className="text-gray-500 italic text-center">Loading summary...</p>
      ) : error ? (
        <div className="text-red-600 bg-red-50 p-3 rounded-lg text-center">
          Error: {error}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
          <h3 className="text-xl text-gray-800 mb-3 font-semibold">
            Brief Summary
          </h3>
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}
    </div>
  );
}
