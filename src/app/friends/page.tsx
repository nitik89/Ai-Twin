"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Friend = {
  friendshipId: string;
  id: string;
  name: string;
  username: string;
  image: string;
  twinScore: number;
  readinessScore: number;
  twinPrivacy: string;
};

type FriendRequest = {
  id: string;
  requester: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
  createdAt: string;
};

type SearchUser = {
  id: string;
  name: string;
  username: string;
  image: string;
  twinScore: number;
};

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => searchUsers(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      setFriends(data.friends ?? []);
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/friends/requests");
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  const searchUsers = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/users/search?query=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      setSearchResults(data.users ?? []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const sendRequest = async (receiverId: string) => {
    try {
      await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      setSentRequests((prev) => new Set([...prev, receiverId]));
    } catch (err) {
      console.error("Failed to send request:", err);
    }
  };

  const respondToRequest = async (
    friendshipId: string,
    action: "ACCEPT" | "REJECT",
  ) => {
    try {
      await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
      if (action === "ACCEPT") fetchFriends();
    } catch (err) {
      console.error("Failed to respond to request:", err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return "text-emerald-400";
    if (score >= 30) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 60) return "Twin ready";
    if (score >= 30) return "Training...";
    return "Just started";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-gray-800 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-white">Friends</h1>
          <p className="text-xs text-gray-400">Connect and chat with twins</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Search */}
        <div>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-gray-800 border border-gray-700 pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Search results */}
          {searchQuery.length >= 2 && (
            <div className="mt-2 rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No users found
                </div>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-4 border-b border-gray-800 last:border-0"
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-purple-600 flex items-center justify-center text-xs font-semibold">
                        {user.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    </div>
                    <button
                      onClick={() => sendRequest(user.id)}
                      disabled={sentRequests.has(user.id)}
                      className="rounded-full bg-purple-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sentRequests.has(user.id) ? "Sent" : "Add"}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-gray-900 p-1">
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "friends"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Friends {friends.length > 0 && `(${friends.length})`}
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "requests"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Requests {requests.length > 0 && `(${requests.length})`}
          </button>
        </div>

        {/* Friends list */}
        {activeTab === "friends" && (
          <div>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-gray-900 animate-pulse"
                  />
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
                <p className="text-gray-400 text-sm">No friends yet</p>
                <p className="text-gray-600 text-xs mt-1">
                  Search for people to connect with
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div
                    key={friend.friendshipId}
                    className="rounded-2xl border border-gray-800 bg-gray-900 p-4 flex items-center gap-3"
                  >
                    {friend.image ? (
                      <Image
                        src={friend.image}
                        alt={friend.name}
                        width={44}
                        height={44}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-purple-600 flex items-center justify-center text-sm font-semibold">
                        {friend.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {friend.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        @{friend.username}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className={`text-xs font-medium ${getScoreColor(friend.readinessScore)}`}
                        >
                          {friend.readinessScore}%
                        </span>
                        <span className="text-xs text-gray-600">·</span>
                        <span
                          className={`text-xs ${getScoreColor(friend.readinessScore)}`}
                        >
                          {getScoreLabel(friend.readinessScore)}
                        </span>
                      </div>
                    </div>
                    {friend.readinessScore >= 60 &&
                    friend.twinPrivacy !== "NOBODY" ? (
                      <Link
                        href={`/twin/${friend.id}`}
                        className="rounded-full bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-500 transition-colors"
                      >
                        Chat Twin
                      </Link>
                    ) : (
                      <span className="rounded-full bg-gray-800 px-4 py-2 text-xs font-medium text-gray-500">
                        {friend.twinPrivacy === "NOBODY"
                          ? "Private"
                          : "Training..."}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friend requests */}
        {activeTab === "requests" && (
          <div>
            {requests.length === 0 ? (
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
                <p className="text-gray-400 text-sm">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-gray-800 bg-gray-900 p-4 flex items-center gap-3"
                  >
                    {request.requester.image ? (
                      <Image
                        src={request.requester.image}
                        alt={request.requester.name}
                        width={44}
                        height={44}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-purple-600 flex items-center justify-center text-sm font-semibold">
                        {request.requester.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {request.requester.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        @{request.requester.username}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToRequest(request.id, "ACCEPT")}
                        className="rounded-full bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-500 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToRequest(request.id, "REJECT")}
                        className="rounded-full border border-gray-700 px-4 py-2 text-xs font-medium text-gray-400 hover:bg-gray-800 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
