import { useState } from "react";
import API from "../utils/api.js";

export default function UserDiscovery({ onStartChat, currentUserTag }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedContacts, setSavedContacts] = useState(() => {
    const saved = localStorage.getItem("pryv_saved_contacts");
    return saved ? JSON.parse(saved) : [];
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await API.get("/auth/users");
      const query = searchQuery.toLowerCase();
      const filtered = res.data.filter(
        (user) =>
          user.tag !== currentUserTag &&
          (user.tag?.toLowerCase().includes(query) ||
            user.name?.toLowerCase().includes(query))
      );

      setSearchResults(filtered);
      if (filtered.length === 0) {
        setError("No users found matching your search.");
      }
    } catch (err) {
      setError("Failed to search users.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveContact = (userTag) => {
    setSavedContacts((prev) => {
      const isAlreadySaved = prev.includes(userTag);
      const updated = isAlreadySaved
        ? prev.filter((tag) => tag !== userTag)
        : [...prev, userTag];
      localStorage.setItem("pryv_saved_contacts", JSON.stringify(updated));
      return updated;
    });
  };

  const isSaved = (userTag) => savedContacts.includes(userTag);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      <div className="px-4 py-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Search users</p>
            <h2 className="text-lg font-semibold text-slate-950">Discover People</h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by tag or name (e.g., @pryv1234)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="rounded-3xl bg-indigo-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-900 disabled:opacity-60"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4">
        {searchResults.length === 0 && !error && !searchQuery && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            <p className="font-semibold">Start discovering people</p>
            <p className="mt-1">Search for users by their tag or name to begin chatting.</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((user) => (
              <div
                key={user.tag}
                className="flex items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-3xl bg-indigo-950 text-white font-semibold">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{user.name || "Unknown"}</p>
                    <p className="truncate text-xs text-slate-500">{user.tag}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleSaveContact(user.tag)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      isSaved(user.tag)
                        ? "bg-slate-950 text-white hover:bg-slate-800"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {isSaved(user.tag) ? "✓ Added" : "Add"}
                  </button>
                  <button
                    onClick={() => onStartChat(user.tag)}
                    className="rounded-full bg-indigo-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-900"
                  >
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
