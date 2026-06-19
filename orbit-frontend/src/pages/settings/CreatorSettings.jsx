import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { toast } from "sonner";

const CreatorSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    location: "",
    niche: [],
    bio: "",
    instagramUsername: "",
    youtubeUrl: "",
    linkedInUrl: "",
    portfolioUrl: "",
    instagramFollowers: "",
    youtubeSubscribers: "",
    averageViews: "",
    audienceCountry: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://13.239.47.56:5001/api/creator/profile",
          {
            headers: { Authorization: token },
          },
        );
        const c = res.data.creator;
        setFormData({
          fullName: c.fullName || "",
          username: c.username || "",
          location: c.location || "",
          niche: c.niche || [],
          bio: c.bio || "",
          instagramUsername: c.instagramUsername || "",
          youtubeUrl: c.youtubeUrl || "",
          linkedInUrl: c.linkedInUrl || "",
          portfolioUrl: c.portfolioUrl || "",
          instagramFollowers: c.instagramFollowers ?? "",
          youtubeSubscribers: c.youtubeSubscribers ?? "",
          averageViews: c.averageViews ?? "",
          audienceCountry: c.audienceCountry || "",
        });
      } catch (error) {
        console.log("Failed to load settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://13.239.47.56:5001/api/creator/onboarding",
        formData,
        {
          headers: { Authorization: token },
        },
      );
      console.log("Settings saved");
      toast.success("Profile updated");
    } catch (error) {
      console.log("Save failed", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-zinc-400">Loading settings...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Account Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Update your creator profile information.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Basic Info</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Full Name
            </label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Username</label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Location</label>
          <Input
            className="bg-white/5 border-white/10 text-white"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Niche</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              "Tech",
              "Education",
              "Fitness",
              "Fashion",
              "Beauty",
              "Gaming",
              "Travel",
              "Food",
              "Lifestyle",
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm transition-all ${formData.niche.includes(cat) ? "border-violet-500 bg-violet-500/20 text-violet-300" : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"}`}
                onClick={() => {
                  if (formData.niche.includes(cat)) {
                    setFormData({
                      ...formData,
                      niche: formData.niche.filter((n) => n !== cat),
                    });
                  } else {
                    setFormData({
                      ...formData,
                      niche: [...formData.niche, cat],
                    });
                  }
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Bio</label>
          <Textarea
            className="bg-white/5 border-white/10 text-white"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Social Links</h2>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            Instagram Username
          </label>
          <Input
            className="bg-white/5 border-white/10 text-white"
            value={formData.instagramUsername}
            onChange={(e) =>
              setFormData({ ...formData, instagramUsername: e.target.value })
            }
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            YouTube URL
          </label>
          <Input
            className="bg-white/5 border-white/10 text-white"
            value={formData.youtubeUrl}
            onChange={(e) =>
              setFormData({ ...formData, youtubeUrl: e.target.value })
            }
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            LinkedIn URL
          </label>
          <Input
            className="bg-white/5 border-white/10 text-white"
            value={formData.linkedInUrl}
            onChange={(e) =>
              setFormData({ ...formData, linkedInUrl: e.target.value })
            }
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            Portfolio URL
          </label>
          <Input
            className="bg-white/5 border-white/10 text-white"
            value={formData.portfolioUrl}
            onChange={(e) =>
              setFormData({ ...formData, portfolioUrl: e.target.value })
            }
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Audience Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Instagram Followers
            </label>
            <Input
              type="number"
              className="bg-white/5 border-white/10 text-white"
              value={formData.instagramFollowers}
              onChange={(e) =>
                setFormData({ ...formData, instagramFollowers: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              YouTube Subscribers
            </label>
            <Input
              type="number"
              className="bg-white/5 border-white/10 text-white"
              value={formData.youtubeSubscribers}
              onChange={(e) =>
                setFormData({ ...formData, youtubeSubscribers: e.target.value })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Avg Views Per Post
            </label>
            <Input
              type="number"
              className="bg-white/5 border-white/10 text-white"
              value={formData.averageViews}
              onChange={(e) =>
                setFormData({ ...formData, averageViews: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Audience Country
            </label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              value={formData.audienceCountry}
              onChange={(e) =>
                setFormData({ ...formData, audienceCountry: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <Button
        className="bg-violet-600 text-white hover:bg-violet-500"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};

export default CreatorSettings;
