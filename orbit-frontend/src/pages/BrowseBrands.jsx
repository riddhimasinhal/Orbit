import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Search, MapPin, Building, Globe } from "lucide-react";
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

const BrowseBrands = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBrands = async (targetPage = page) => {
    try {
      setLoading(true);
      let endpoint = `/brand/all?page=${targetPage}&limit=12`;
      if (searchText.trim()) {
        endpoint += "&search=" + encodeURIComponent(searchText.trim());
      }
      if (selectedNiche) {
        endpoint += "&niche=" + encodeURIComponent(selectedNiche);
      }
      console.log("Fetching brands:", endpoint);
      const res = await api.get(endpoint);
      setBrands(res.data.brands || res.data.data || []);
      if (res.data.pagination) {
        setPage(res.data.pagination.page);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (error) {
      console.log("Failed to fetch brands", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchBrands(1);
  }, [selectedNiche]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBrands(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchBrands(newPage);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Browse Brands</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Discover brands looking for creators like you.
        </p>
      </div>

      {/* search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            placeholder="Search by company name, industry, or location..."
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

      {/* niche filter buttons */}
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

      {/* brand cards */}
      {loading ? (
        <p className="text-zinc-400">Loading brands...</p>
      ) : brands.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500">No brands found.</p>
          <p className="text-xs text-zinc-600 mt-1">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <div
              key={brand._id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition-all cursor-pointer"
              onClick={() => navigate("/creator/brand/" + brand._id)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300">
                  {brand.companyName?.slice(0, 2).toUpperCase() || "BR"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {brand.companyName || "Brand"}
                  </h3>
                  {brand.industry && (
                    <p className="text-xs text-violet-400 truncate">
                      {brand.industry}
                    </p>
                  )}
                  {brand.location && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-zinc-500">
                      <MapPin className="size-3" />
                      <span className="truncate">{brand.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* niche badges */}
              {brand.preferredNiche && brand.preferredNiche.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {brand.preferredNiche.map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}

              {/* description */}
              {brand.description && (
                <p className="text-xs text-zinc-400 mb-3 line-clamp-2">
                  {brand.description}
                </p>
              )}

              {/* bottom info */}
              <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                {brand.companySize && (
                  <div className="flex items-center gap-1.5">
                    <Building className="size-3 text-zinc-500" />
                    <span className="text-xs text-zinc-300">
                      {brand.companySize}
                    </span>
                  </div>
                )}
                {brand.website && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="size-3 text-zinc-500" />
                    <span className="text-xs text-violet-400 truncate">
                      {brand.website}
                    </span>
                  </div>
                )}
                {brand.budgetRange && (
                  <span className="text-xs text-zinc-300">
                    {brand.budgetRange}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* pagination controls */}
      {!loading && brands.length > 0 && totalPages > 1 && (
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

export default BrowseBrands;
