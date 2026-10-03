import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  Search,
  Megaphone,
  DollarSign,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
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

export default function BrowseCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const reqSeq = useRef(0);

  const fetchCampaigns = async (
    targetPage = 1,
    searchVal = searchText,
    nicheVal = selectedNiche
  ) => {
    const currentSeq = ++reqSeq.current;
    setLoading(true);
    setError("");

    try {
      let endpoint = `/campaigns?page=${targetPage}&limit=12`;
      if (searchVal.trim()) {
        endpoint += "&search=" + encodeURIComponent(searchVal.trim());
      }
      if (nicheVal) {
        endpoint += "&niche=" + encodeURIComponent(nicheVal);
      }

      const res = await api.get(endpoint);
      if (currentSeq !== reqSeq.current) return;

      setCampaigns(res.data.campaigns || res.data.data || []);
      if (res.data.pagination) {
        setPage(res.data.pagination.page);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      if (currentSeq !== reqSeq.current) return;
      console.error("Failed to fetch campaigns", err);
      setError(
        err.response?.data?.message || "Failed to load campaigns. Please try again."
      );
    } finally {
      if (currentSeq === reqSeq.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        let endpoint = `/campaigns?page=1&limit=12`;
        if (selectedNiche) {
          endpoint += `&niche=${encodeURIComponent(selectedNiche)}`;
        }
        const res = await api.get(endpoint);
        if (!isMounted) return;
        setCampaigns(res.data.campaigns || res.data.data || []);
        if (res.data.pagination) {
          setPage(res.data.pagination.page);
          setTotalPages(res.data.pagination.totalPages);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch campaigns", err);
        setError(
          err.response?.data?.message || "Failed to load campaigns. Please try again."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedNiche]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCampaigns(1, searchText, selectedNiche);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setSelectedNiche("");
    fetchCampaigns(1, "", "");
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchCampaigns(newPage, searchText, selectedNiche);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const formatBudget = (min, max) => {
    if (!min && !max) return "Negotiable";
    if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return `From $${min.toLocaleString()}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2.5">
          <Megaphone className="size-6 text-violet-400" />
          Explore Brand Campaigns
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Discover paid collaboration briefs and sponsorship opportunities from verified brands.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search campaigns by title, keywords, or requirements..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder-zinc-500 focus:border-violet-500"
          />
        </div>
        <Button
          type="submit"
          className="bg-violet-600 text-white hover:bg-violet-500 shrink-0"
        >
          Search
        </Button>
      </form>

      {/* Niche Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedNiche("")}
          className={`rounded-full px-3.5 py-1 text-xs font-medium border transition-all ${
            selectedNiche === ""
              ? "border-violet-500 bg-violet-600 text-white shadow-sm"
              : "border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:border-white/20"
          }`}
        >
          All Niches
        </button>
        {nicheOptions.map((n) => (
          <button
            key={n}
            onClick={() => setSelectedNiche(selectedNiche === n ? "" : n)}
            className={`rounded-full px-3.5 py-1 text-xs font-medium border transition-all ${
              selectedNiche === n
                ? "border-violet-500 bg-violet-600 text-white shadow-sm"
                : "border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:border-white/20"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Campaign Grid */}
      {loading ? (
        <div className="text-center py-20 text-zinc-400 text-sm">
          Loading campaigns...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <Button
            onClick={() => fetchCampaigns(page, searchText, selectedNiche)}
            className="mt-4 bg-white/5 border-white/10 text-white hover:bg-white/10"
            size="sm"
          >
            Retry
          </Button>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <p className="text-zinc-300 font-medium text-base">No campaigns found</p>
          <p className="text-xs text-zinc-500 mt-1">
            Try adjusting your search keywords or removing niche filters.
          </p>
          {(searchText || selectedNiche) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="mt-4 bg-white/5 border-white/10 text-violet-400 hover:text-violet-300 hover:bg-white/10 text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((camp) => (
            <div
              key={camp._id}
              onClick={() => navigate(`/creator/campaigns/${camp._id}`)}
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-violet-500/40 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <div>
                {/* Brand info header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-300">
                    {camp.brand?.companyName?.slice(0, 2).toUpperCase() || "BR"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-300 truncate">
                      {camp.brand?.companyName || "Brand"}
                    </p>
                    {camp.brand?.industry && (
                      <p className="text-[11px] text-zinc-500 truncate">
                        {camp.brand.industry}
                      </p>
                    )}
                  </div>
                </div>

                {/* Campaign Title */}
                <h3 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                  {camp.title}
                </h3>

                {/* Description snippet */}
                <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {camp.description}
                </p>

                {/* Niches */}
                {camp.niche && camp.niche.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {camp.niche.slice(0, 3).map((n) => (
                      <span
                        key={n}
                        className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300"
                      >
                        {n}
                      </span>
                    ))}
                    {camp.niche.length > 3 && (
                      <span className="text-[10px] text-zinc-500 self-center">
                        +{camp.niche.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom metadata */}
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <DollarSign className="size-3.5 text-zinc-500" />
                    Budget
                  </span>
                  <span className="font-semibold text-white">
                    {formatBudget(camp.budgetMin, camp.budgetMax)}
                  </span>
                </div>

                {camp.applicationDeadline && (
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Clock className="size-3.5 text-zinc-500" />
                      Apply By
                    </span>
                    <span className="text-zinc-300">
                      {formatDate(camp.applicationDeadline)}
                    </span>
                  </div>
                )}

                {camp.deliverables && camp.deliverables.length > 0 && (
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Layers className="size-3.5 text-zinc-500" />
                      Deliverables
                    </span>
                    <span className="text-zinc-300">
                      {camp.deliverables.length}{" "}
                      {camp.deliverables.length === 1 ? "deliverable" : "deliverables"}
                    </span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end text-violet-400 text-xs font-medium gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Brief <ChevronRight className="size-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && campaigns.length > 0 && totalPages > 1 && (
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
}
