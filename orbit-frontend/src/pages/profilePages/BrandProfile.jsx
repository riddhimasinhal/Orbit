import { useEffect, useState } from "react";
import axios from "axios";
import { MapPin, Building, Globe, Mail, User } from "lucide-react";

const BrandProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://13.239.47.56:5001/api/brand/profile",
          {
            headers: { Authorization: token },
          },
        );
        console.log("Brand profile:", res.data);
        setProfile(res.data.brand);
      } catch (error) {
        console.log("Error loading profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <p className="text-zinc-400">Loading profile...</p>;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xl font-semibold text-violet-300">
            {profile?.companyName?.slice(0, 2).toUpperCase() || "BR"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">
              {profile?.companyName || "Brand"}
            </h1>
            {profile?.industry && (
              <p className="text-sm text-zinc-400 mt-0.5">{profile.industry}</p>
            )}
            {profile?.location && (
              <div className="flex items-center gap-1 mt-1 text-sm text-zinc-500">
                <MapPin className="size-3.5" />
                {profile.location}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {profile?.preferredNiche?.length > 0 &&
                profile.preferredNiche.map((n) => (
                  <span
                    key={n}
                    className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300"
                  >
                    {n}
                  </span>
                ))}
              {profile?.companySize && (
                <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                  {profile.companySize}
                </span>
              )}
            </div>
          </div>
        </div>
        {profile?.description && (
          <p className="mt-4 text-sm text-zinc-400 border-t border-white/5 pt-4">
            {profile.description}
          </p>
        )}
      </div>

      {/* details grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">
            Marketing Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Target Audience</span>
              <span className="text-sm text-white max-w-[200px] text-right">
                {profile?.targetAudience || "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Marketing Goals</span>
              <span className="text-sm text-white max-w-[200px] text-right">
                {profile?.marketingGoals || "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Budget Range</span>
              <span className="text-sm text-white">
                {profile?.budgetRange || "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Preferred Platform</span>
              <span className="text-sm text-white">
                {profile?.preferredPlatform || "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Campaign Frequency</span>
              <span className="text-sm text-white">
                {profile?.campaignFrequency || "Not set"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">
            Contact & Social
          </h2>
          <div className="space-y-3">
            {profile?.contactPerson && (
              <div className="flex items-center gap-3">
                <User className="size-4 text-zinc-500" />
                <span className="text-sm text-white">
                  {profile.contactPerson}
                </span>
              </div>
            )}
            {profile?.contactEmail && (
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-zinc-500" />
                <span className="text-sm text-violet-400">
                  {profile.contactEmail}
                </span>
              </div>
            )}
            {profile?.website && (
              <div className="flex items-center gap-3">
                <Globe className="size-4 text-zinc-500" />
                <span className="text-sm text-violet-400">
                  {profile.website}
                </span>
              </div>
            )}
            {profile?.instagramPage && (
              <div className="flex items-center gap-3">
                <Building className="size-4 text-zinc-500" />
                <span className="text-sm text-violet-400">
                  {profile.instagramPage}
                </span>
              </div>
            )}
            {profile?.linkedInPage && (
              <div className="flex items-center gap-3">
                <Building className="size-4 text-zinc-500" />
                <span className="text-sm text-violet-400">
                  {profile.linkedInPage}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandProfile;
