import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, MapPin, AtSign, Play, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  const fetchCreators = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = "http://13.239.47.56:5001/api/creator/all";
      const params = [];
      if (searchText.trim()) {
        params.push("search=" + searchText.trim());
      }
      if (selectedNiche) {
        params.push("niche=" + selectedNiche);
      }
      if (params.length > 0) {
        url = url + "?" + params.join("&");
      }
      console.log("Fetching creators:", url);
      const res = await axios.get(url, {
        headers: { Authorization: token },
      });
      setCreators(res.data.creators);
    } catch (error) {
      console.log("Failed to fetch creators", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [selectedNiche]);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchCreators();
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
      ) : creators.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500">No creators found.</p>
          <p className="text-xs text-zinc-600 mt-1">
            Try changing your search or filters.
          </p>
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
    </div>
  );
};

export default BrowseCreators;
