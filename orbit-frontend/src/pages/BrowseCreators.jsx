import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Search, MapPin, AtSign, Play, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const nicheOptions = [
  "Tech",
  "Education",
  "Fitness",
  "Fashion",
  "Beauty",
  "Gaming",
  "Travel",
  "Food",
  "Lifestyle",
];

const formatNum = (num) => {
  if (!num) return "—";
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
};

const BrowseCreators = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [error, setError] = useState("");
  const reqSeq = useRef(0);

  const fetchCreators = async (targetPage = page, searchVal = searchText, nicheVal = selectedNiche) => {
    const currentSeq = ++reqSeq.current;
    setLoading(true);
    setError("");

    try {
      let endpoint = `/creator/all?page=${targetPage}&limit=12`;
      if (searchVal.trim()) {
        endpoint += "&search=" + encodeURIComponent(searchVal.trim());
      }
      if (nicheVal) {
        endpoint += "&niche=" + encodeURIComponent(nicheVal);
      }
      console.log("Fetching creators:", endpoint);
      const res = await api.get(endpoint);

      if (currentSeq !== reqSeq.current) return;

      setCreators(res.data.creators || res.data.data || []);
      if (res.data.pagination) {
        setPage(res.data.pagination.page);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      if (currentSeq !== reqSeq.current) return;
      console.log("Failed to fetch creators", err);
      setError(err.response?.data?.message || "Failed to load creators. Please try again.");
    } finally {
      if (currentSeq === reqSeq.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCreators(1, searchText, selectedNiche);
  }, [selectedNiche]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCreators(1, searchText, selectedNiche);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setSelectedNiche("");
    setPage(1);
    fetchCreators(1, "", "");
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page || loading) return;
    setPage(newPage);
    fetchCreators(newPage, searchText, selectedNiche);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Browse Creators</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Find creators that match your brand's needs.
        </p>
      </div>

      {/* search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            placeholder="Search by name, username, or location..."
            className="bg-white/5 border-white/10 text-white pl-10 placeholder:text-zinc-500"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Search
        </button>
      </form>

      {/* niche filters */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded-full border px-3 py-1 text-xs transition-all ${selectedNiche === "" ? "border-violet-500 bg-violet-500/20 text-violet-300" : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"}`}
          onClick={() => setSelectedNiche("")}
        >
          All
        </button>
        {nicheOptions.map((niche) => (
          <button
            key={niche}
            className={`rounded-full border px-3 py-1 text-xs transition-all ${selectedNiche === niche ? "border-violet-500 bg-violet-500/20 text-violet-300" : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"}`}
            onClick={() =>
              setSelectedNiche(niche === selectedNiche ? "" : niche)
            }
          >
            {niche}
          </button>
        ))}
      </div>

      {/* results */}
      {loading ? (
        <p className="text-zinc-400">Loading creators...</p>
      ) : error ? (
        <div className="text-center py-16 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-red-400">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCreators(page, searchText, selectedNiche)}
            className="mt-4 bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            Retry
          </Button>
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-400">No creators found.</p>
          <p className="text-xs text-zinc-500 mt-1">
            Try adjusting your search query or niche filters.
          </p>
          {(searchText || selectedNiche) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="mt-4 bg-white/5 border-white/10 text-violet-400 hover:text-violet-300 hover:bg-white/10"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <div
              key={creator._id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition-all cursor-pointer"
              onClick={() => navigate("/brand/creator/" + creator._id)}
            >
              {/* top section - avatar and name */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300">
                  {creator.fullName?.slice(0, 2).toUpperCase() || "CR"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {creator.fullName || "Creator"}
                  </h3>
                  {creator.username && (
                    <p className="text-xs text-violet-400 truncate">
                      @{creator.username}
                    </p>
                  )}
                  {creator.location && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-zinc-500">
                      <MapPin className="size-3" />
                      <span className="truncate">{creator.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* niche badges */}
              {creator.niche && creator.niche.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {creator.niche.map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}

              {/* bio */}
              {creator.bio && (
                <p className="text-xs text-zinc-400 mb-3 line-clamp-2">
                  {creator.bio}
                </p>
              )}

              {/* stats row */}
              <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <AtSign className="size-3 text-zinc-500" />
                  <span className="text-xs text-zinc-300">
                    {formatNum(creator.instagramFollowers)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Play className="size-3 text-zinc-500" />
                  <span className="text-xs text-zinc-300">
                    {formatNum(creator.youtubeSubscribers)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="size-3 text-zinc-500" />
                  <span className="text-xs text-zinc-300">
                    {formatNum(creator.averageViews)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* pagination controls */}
      {!loading && creators.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-40"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              if (
                p === 1 ||
                p === totalPages ||
                (p >= page - 1 && p <= page + 1)
              ) {
                return (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(p)}
                    className={
                      p === page
                        ? "bg-violet-600 text-white hover:bg-violet-500"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                    }
                  >
                    {p}
                  </Button>
                );
              }
              if (p === page - 2 || p === page + 2) {
                return (
                  <span key={p} className="px-1 text-zinc-500 text-xs">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-40"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default BrowseCreators;
