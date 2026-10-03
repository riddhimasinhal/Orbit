import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Megaphone,
  Check,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AVAILABLE_NICHES = [
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

export default function CreateCampaign() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    niche: [],
    budgetMin: "",
    budgetMax: "",
    applicationDeadline: "",
    startDate: "",
    endDate: "",
  });

  const [deliverables, setDeliverables] = useState(["1x Instagram Reel"]);
  const [newDeliverableInput, setNewDeliverableInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [publishAfterSave, setPublishAfterSave] = useState(false);

  const toggleNiche = (n) => {
    setFormData((prev) => {
      const exists = prev.niche.includes(n);
      return {
        ...prev,
        niche: exists ? prev.niche.filter((item) => item !== n) : [...prev.niche, n],
      };
    });
  };

  const handleAddDeliverable = () => {
    if (!newDeliverableInput.trim()) return;
    setDeliverables((prev) => [...prev, newDeliverableInput.trim()]);
    setNewDeliverableInput("");
  };

  const handleRemoveDeliverable = (index) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a campaign title");
      return false;
    }
    if (!formData.description.trim()) {
      toast.error("Please provide a campaign description");
      return false;
    }

    const min = Number(formData.budgetMin) || 0;
    const max = Number(formData.budgetMax) || 0;

    if (min < 0 || max < 0) {
      toast.error("Budget amounts cannot be negative");
      return false;
    }
    if (max > 0 && min > max) {
      toast.error("Minimum budget cannot be higher than maximum budget");
      return false;
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        toast.error("Campaign end date cannot be earlier than start date");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (publish = false) => {
    if (!validate()) return;

    if (publish) {
      const max = Number(formData.budgetMax) || 0;
      if (max <= 0) {
        toast.error("A maximum budget greater than $0 is required to publish");
        return;
      }
      if (deliverables.length === 0) {
        toast.error("At least one deliverable is required to publish");
        return;
      }
      if (!formData.applicationDeadline) {
        toast.error("An application deadline is required to publish");
        return;
      }
    }

    setSubmitting(true);
    setPublishAfterSave(publish);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        niche: formData.niche,
        budgetMin: Number(formData.budgetMin) || 0,
        budgetMax: Number(formData.budgetMax) || 0,
        deliverables,
        applicationDeadline: formData.applicationDeadline || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      const res = await api.post("/campaigns", payload);
      const campaignId = res.data.campaign?._id;

      if (publish && campaignId) {
        await api.patch(`/campaigns/${campaignId}/publish`);
        toast.success("Campaign created and published to marketplace!");
      } else {
        toast.success("Campaign saved as draft");
      }

      navigate("/brand/campaigns");
    } catch (err) {
      console.error("Create campaign error:", err);
      toast.error(err.response?.data?.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
      setPublishAfterSave(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate("/brand/campaigns")}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Campaigns
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2.5">
          <Megaphone className="size-6 text-violet-400" />
          Create New Campaign
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Draft a campaign brief to attract and collaborate with creators.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Campaign Title <span className="text-violet-400">*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. Summer Fitness App Launch Promo"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-violet-500"
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Campaign Description & Objectives <span className="text-violet-400">*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Describe the campaign background, brand guidelines, talking points, and expectations..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Niches */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Relevant Niches / Categories
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {AVAILABLE_NICHES.map((n) => {
              const selected = formData.niche.includes(n);
              return (
                <button
                  type="button"
                  key={n}
                  onClick={() => toggleNiche(n)}
                  className={`rounded-full px-3.5 py-1 text-xs font-medium border transition-all ${
                    selected
                      ? "border-violet-500 bg-violet-600 text-white shadow-sm"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Range */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Min Budget ($ USD)
            </label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={formData.budgetMin}
              onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
              className="border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-violet-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Max Budget ($ USD)
            </label>
            <Input
              type="number"
              min="0"
              placeholder="1000"
              value={formData.budgetMax}
              onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
              className="border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-violet-500"
            />
          </div>
        </div>

        {/* Deliverables */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Deliverables Expected
          </label>

          {deliverables.length > 0 && (
            <div className="space-y-2">
              {deliverables.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-white"
                >
                  <span className="flex items-center gap-2">
                    <Check className="size-3.5 text-violet-400 shrink-0" />
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliverable(index)}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. 1x Dedicated YouTube Video, 2x TikToks"
              value={newDeliverableInput}
              onChange={(e) => setNewDeliverableInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddDeliverable();
                }
              }}
              className="border-white/10 bg-white/5 text-white placeholder-zinc-500 text-xs focus:border-violet-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddDeliverable}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 shrink-0 text-xs"
            >
              <Plus className="size-3.5 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Timeline Dates */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Application Deadline
            </label>
            <Input
              type="date"
              value={formData.applicationDeadline}
              onChange={(e) =>
                setFormData({ ...formData, applicationDeadline: e.target.value })
              }
              className="border-white/10 bg-white/5 text-white focus:border-violet-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Start Date
            </label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="border-white/10 bg-white/5 text-white focus:border-violet-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              End Date
            </label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="border-white/10 bg-white/5 text-white focus:border-violet-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/brand/campaigns")}
            disabled={submitting}
            className="w-full sm:w-auto bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto bg-white/5 border-violet-500/30 text-violet-300 hover:bg-violet-600/20"
          >
            {submitting && !publishAfterSave && <Loader2 className="size-4 animate-spin mr-2" />}
            Save as Draft
          </Button>

          <Button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="w-full sm:w-auto bg-violet-600 text-white hover:bg-violet-500 font-medium"
          >
            {submitting && publishAfterSave ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Send className="size-4 mr-2" />
            )}
            Publish Campaign
          </Button>
        </div>
      </div>
    </div>
  );
}
