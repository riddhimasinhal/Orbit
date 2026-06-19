import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { toast } from "sonner";

const BrandSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    companySize: "",
    website: "",
    location: "",
    description: "",
    targetAudience: "",
    marketingGoals: "",
    preferredNiche: [],
    instagramPage: "",
    linkedInPage: "",
    contactEmail: "",
    contactPerson: "",
    budgetRange: "",
    preferredPlatform: "",
    campaignFrequency: "",
    targetCountry: "",
  });

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
        const b = res.data.brand;
        setFormData({
          companyName: b.companyName || "",
          industry: b.industry || "",
          companySize: b.companySize || "",
          website: b.website || "",
          location: b.location || "",
          description: b.description || "",
          targetAudience: b.targetAudience || "",
          marketingGoals: b.marketingGoals || "",
          preferredNiche: b.preferredNiche || [],
          instagramPage: b.instagramPage || "",
          linkedInPage: b.linkedInPage || "",
          contactEmail: b.contactEmail || "",
          contactPerson: b.contactPerson || "",
          budgetRange: b.budgetRange || "",
          preferredPlatform: b.preferredPlatform || "",
          campaignFrequency: b.campaignFrequency || "",
          targetCountry: b.targetCountry || "",
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
        "http://13.239.47.56:5001/api/brand/onboarding",
        formData,
        {
          headers: { Authorization: token },
        },
      );
      console.log("Brand settings saved");
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
          Update your brand profile information.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Company Info</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Company Name
            </label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Industry</label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              value={formData.industry}
              onChange={(e) =>
                setFormData({ ...formData, industry: e.target.value })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Company Size
            </label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              value={formData.companySize}
              onChange={(e) =>
                setFormData({ ...formData, companySize: e.target.value })
              }
            />
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
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Website</label>
          <Input
            className="bg-white/5 border-white/10 text-white"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            Brand Description
          </label>
          <Textarea
            className="bg-white/5 border-white/10 text-white"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Marketing</h2>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            Target Audience
          </label>
          <Textarea
            className="bg-white/5 border-white/10 text-white"
            value={formData.targetAudience}
            onChange={(e) =>
              setFormData({ ...formData, targetAudience: e.target.value })
            }
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            Marketing Goals
          </label>
          <Textarea
            className="bg-white/5 border-white/10 text-white"
            value={formData.marketingGoals}
            onChange={(e) =>
              setFormData({ ...formData, marketingGoals: e.target.value })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 mb-1.5 block">
              Preferred Niche
            </label>
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
                  className={`rounded-lg border px-3 py-2 text-sm transition-all ${formData.preferredNiche.includes(cat) ? "border-violet-500 bg-violet-500/20 text-violet-300" : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"}`}
                  onClick={() => {
                    if (formData.preferredNiche.includes(cat)) {
                      setFormData({
                        ...formData,
                        preferredNiche: formData.preferredNiche.filter(
                          (n) => n !== cat,
                        ),
                      });
                    } else {
                      setFormData({
                        ...formData,
                        preferredNiche: [...formData.preferredNiche, cat],
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
            <label className="text-xs text-zinc-500 mb-1 block">
              Preferred Platform
            </label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              value={formData.preferredPlatform}
              onChange={(e) =>
                setFormData({ ...formData, preferredPlatform: e.target.value })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Budget Range
            </label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              value={formData.budgetRange}
              onChange={(e) =>
                setFormData({ ...formData, budgetRange: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Campaign Frequency
            </label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              value={formData.campaignFrequency}
              onChange={(e) =>
                setFormData({ ...formData, campaignFrequency: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            Target Country
          </label>
          <Input
            className="bg-white/5 border-white/10 text-white"
            value={formData.targetCountry}
            onChange={(e) =>
              setFormData({ ...formData, targetCountry: e.target.value })
            }
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Contact & Social</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Contact Person
            </label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              value={formData.contactPerson}
              onChange={(e) =>
                setFormData({ ...formData, contactPerson: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Contact Email
            </label>
            <Input
              className="bg-white/5 border-white/10 text-white"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            Instagram Page
          </label>
          <Input
            className="bg-white/5 border-white/10 text-white"
            value={formData.instagramPage}
            onChange={(e) =>
              setFormData({ ...formData, instagramPage: e.target.value })
            }
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            LinkedIn Page
          </label>
          <Input
            className="bg-white/5 border-white/10 text-white"
            value={formData.linkedInPage}
            onChange={(e) =>
              setFormData({ ...formData, linkedInPage: e.target.value })
            }
          />
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

export default BrandSettings;
