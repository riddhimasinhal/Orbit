import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import {
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Image,
  Video,
  Link2,
  Loader2,
  AlertCircle,
  Sparkles,
  UploadCloud,
  FileCheck,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
];

export default function CreatorPortfolio() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal / Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [mediaSource, setMediaSource] = useState("upload"); // "upload" | "url"
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState("");

  // Upload file state
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingStep, setSavingStep] = useState("");
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef(null);

  // Delete state
  const [deletingId, setDeletingId] = useState(null);

  const refreshPortfolio = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/portfolio/mine");
      setItems(res.data.portfolioItems || []);
    } catch (err) {
      console.error("Failed to load portfolio items", err);
      setError(err.response?.data?.message || "Failed to load portfolio items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    api
      .get("/portfolio/mine")
      .then((res) => {
        if (isMounted) {
          setItems(res.data.portfolioItems || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load portfolio items", err);
          setError(err.response?.data?.message || "Failed to load portfolio items.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openCreateDialog = () => {
    setEditingItem(null);
    setMediaSource("upload");
    setTitle("");
    setDescription("");
    setMediaType("image");
    setMediaUrl("");
    setThumbnailUrl("");
    setProjectUrl("");
    setCloudinaryPublicId("");
    setSelectedFile(null);
    setFilePreview(null);
    setFormError("");
    setSavingStep("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    // If item has cloudinaryPublicId or no projectUrl, default to upload source if modifying
    setMediaSource(item.cloudinaryPublicId ? "upload" : "url");
    setTitle(item.title || "");
    setDescription(item.description || "");
    setMediaType(item.mediaType || "image");
    setMediaUrl(item.mediaUrl || "");
    setThumbnailUrl(item.thumbnailUrl || "");
    setProjectUrl(item.projectUrl || "");
    setCloudinaryPublicId(item.cloudinaryPublicId || "");
    setSelectedFile(null);
    setFilePreview(null);
    setFormError("");
    setSavingStep("");
    setIsDialogOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFormError(
        "Unsupported file type. Allowed formats: JPEG, PNG, WebP images; MP4, WebM videos."
      );
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    const isImg = file.type.startsWith("image/");
    const isVid = file.type.startsWith("video/");

    // Check size limit: 10MB for image, 100MB for video
    const maxImgSize = 10 * 1024 * 1024;
    const maxVidSize = 100 * 1024 * 1024;

    if (isImg && file.size > maxImgSize) {
      setFormError("Image size cannot exceed 10MB.");
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    if (isVid && file.size > maxVidSize) {
      setFormError("Video size cannot exceed 100MB.");
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    setFormError("");
    setSelectedFile(file);
    setMediaType(isVid ? "video" : "image");

    // Generate local preview URL
    try {
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
    } catch {
      setFilePreview(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (title.trim().length > 120) {
      setFormError("Title cannot exceed 120 characters.");
      return;
    }
    if (description.trim().length > 1000) {
      setFormError("Description cannot exceed 1000 characters.");
      return;
    }

    try {
      setSaving(true);

      let finalMediaUrl = mediaUrl.trim();
      let finalMediaType = mediaType;
      let finalCloudinaryPublicId = cloudinaryPublicId;

      // If uploading a new file via Cloudinary
      if (mediaSource === "upload" && selectedFile) {
        setSavingStep("Uploading media to Cloudinary...");
        const formData = new FormData();
        formData.append("media", selectedFile);

        const uploadRes = await api.post("/portfolio/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        finalMediaUrl = uploadRes.data.mediaUrl;
        finalCloudinaryPublicId = uploadRes.data.cloudinaryPublicId;
        finalMediaType = uploadRes.data.mediaType;
      }

      setSavingStep("Saving portfolio details...");

      const payload = {
        title: title.trim(),
        description: description.trim(),
        mediaType: finalMediaType,
        mediaUrl: finalMediaUrl,
        thumbnailUrl: thumbnailUrl.trim(),
        projectUrl: projectUrl.trim(),
        cloudinaryPublicId: finalCloudinaryPublicId,
      };

      if (editingItem) {
        const res = await api.put(`/portfolio/${editingItem._id}`, payload);
        toast.success("Portfolio item updated!");
        setItems((prev) =>
          prev.map((item) =>
            item._id === editingItem._id ? res.data.portfolioItem : item
          )
        );
      } else {
        const res = await api.post("/portfolio", payload);
        toast.success("Portfolio item created!");
        setItems((prev) => [res.data.portfolioItem, ...prev]);
      }

      setIsDialogOpen(false);
    } catch (err) {
      console.error("Failed to save portfolio item", err);
      const msg = err.response?.data?.message || "Failed to save portfolio item.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
      setSavingStep("");
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this portfolio item?")) {
      return;
    }

    try {
      setDeletingId(itemId);
      await api.delete(`/portfolio/${itemId}`);
      toast.success("Portfolio item deleted.");
      setItems((prev) => prev.filter((item) => item._id !== itemId));
    } catch (err) {
      console.error("Failed to delete portfolio item", err);
      toast.error(err.response?.data?.message || "Failed to delete portfolio item.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderOpen className="size-6 text-violet-400" />
            My Portfolio
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Showcase your best creative work, sponsored campaign case studies, and content samples to brands.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-4 rounded-xl flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          Add Portfolio Item
        </Button>
      </div>

      {/* Cloudinary Integration Badge */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 px-4 py-3 text-xs text-violet-300 flex items-start gap-2.5">
        <Cloud className="size-4 shrink-0 mt-0.5 text-violet-400" />
        <div className="space-y-0.5">
          <p className="font-medium text-white">Cloudinary-Powered Media Storage</p>
          <p className="text-zinc-400 leading-relaxed">
            Upload your high-res photos (up to 10MB) and demo reels (up to 100MB) directly to Cloudinary, or link external showcase projects.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400 text-sm">
          <Loader2 className="size-6 animate-spin mx-auto mb-2 text-violet-400" />
          Loading your portfolio...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-400 text-sm space-y-3">
          <p>{error}</p>
          <Button
            onClick={refreshPortfolio}
            variant="outline"
            className="border-white/10 text-white text-xs"
          >
            Retry
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-4">
          <div className="size-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400">
            <Sparkles className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">
              No portfolio items added yet
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Brands look at your portfolio when reviewing campaign applications and browsing creators. Add your first showcase item now.
            </p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-5 rounded-xl"
          >
            <Plus className="size-4 mr-1.5" />
            Add First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const hasMedia = Boolean(item.mediaUrl);
            const isImage = item.mediaType === "image";
            const isVideo = item.mediaType === "video";

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col hover:border-white/20 transition-all group"
              >
                {/* Media Preview Container */}
                <div className="relative aspect-video w-full bg-zinc-900 border-b border-white/10 overflow-hidden flex items-center justify-center">
                  {hasMedia && isImage ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : hasMedia && isVideo ? (
                    <video
                      src={item.mediaUrl}
                      poster={item.thumbnailUrl || undefined}
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500 space-y-1">
                      <Link2 className="size-8 text-violet-400/80" />
                      <span className="text-[11px] text-zinc-400">Project / Case Study</span>
                    </div>
                  )}

                  {/* Media Type Badge Overlay */}
                  <div className="absolute top-2.5 right-2.5 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 backdrop-blur-md text-white border border-white/10 flex items-center gap-1">
                      {isImage ? (
                        <>
                          <Image className="size-2.5 text-violet-400" />
                          Image
                        </>
                      ) : isVideo ? (
                        <>
                          <Video className="size-2.5 text-violet-400" />
                          Video
                        </>
                      ) : (
                        <>
                          <Link2 className="size-2.5 text-violet-400" />
                          Link
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-violet-300 transition-colors">
                      {item.title}
                    </h3>
                    {item.description ? (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-600 italic">No description provided</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                    <span>{formatDate(item.createdAt)}</span>

                    <div className="flex items-center gap-1.5">
                      {item.projectUrl && (
                        <a
                          href={item.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Open live project"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => openEditDialog(item)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Edit item"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete item"
                      >
                        {deletingId === item._id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border border-white/10 text-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">
              {editingItem ? "Edit Portfolio Item" : "Add Portfolio Item"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {formError && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/20 px-3.5 py-2.5 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">
                Title <span className="text-red-400">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Minimalist Keyboard Video Campaign"
                maxLength={120}
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 text-xs h-9"
              />
              <p className="text-[10px] text-zinc-500 text-right">{title.length} / 120</p>
            </div>

            {/* Media Source Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Media Source</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMediaSource("upload")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                    mediaSource === "upload"
                      ? "bg-violet-600 text-white border-violet-500"
                      : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  <UploadCloud className="size-4" />
                  Upload Image/Video
                </button>
                <button
                  type="button"
                  onClick={() => setMediaSource("url")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                    mediaSource === "url"
                      ? "bg-violet-600 text-white border-violet-500"
                      : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Link2 className="size-4" />
                  External URL
                </button>
              </div>
            </div>

            {/* Upload Area */}
            {mediaSource === "upload" ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300">Media File</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={ALLOWED_MIME_TYPES.join(",")}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.04] p-4 text-center cursor-pointer transition-colors space-y-2"
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      {filePreview && (
                        <div className="max-h-36 rounded-lg overflow-hidden flex items-center justify-center bg-black/40">
                          {selectedFile.type.startsWith("image/") ? (
                            <img
                              src={filePreview}
                              alt="Preview"
                              className="max-h-36 object-contain"
                            />
                          ) : (
                            <video
                              src={filePreview}
                              className="max-h-36 object-contain"
                              muted
                              autoPlay
                              loop
                            />
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
                        <FileCheck className="size-4 shrink-0" />
                        <span className="font-medium truncate max-w-[200px]">
                          {selectedFile.name}
                        </span>
                        <span className="text-zinc-500">
                          ({formatFileSize(selectedFile.size)})
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">Click to change file</p>
                    </div>
                  ) : editingItem && mediaUrl ? (
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-300">Existing media uploaded</p>
                      <p className="text-[11px] text-zinc-500">Click to replace file</p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      <UploadCloud className="size-6 text-violet-400 mx-auto" />
                      <p className="text-xs text-zinc-200 font-medium">
                        Click to select image or video
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Images (JPG, PNG, WebP ≤ 10MB) • Videos (MP4, WebM ≤ 100MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* External URL Mode */
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "image", label: "Image", icon: Image },
                      { value: "video", label: "Video", icon: Video },
                      { value: "link", label: "Link", icon: Link2 },
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = mediaType === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setMediaType(t.value)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors ${
                            isSelected
                              ? "bg-violet-600 text-white border-violet-500"
                              : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <Icon className="size-3" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Media URL</label>
                  <Input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 text-xs h-9"
                  />
                </div>
              </div>
            )}

            {/* Thumbnail URL (for Video) */}
            {mediaType === "video" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Thumbnail / Poster URL (Optional)
                </label>
                <Input
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 text-xs h-9"
                />
              </div>
            )}

            {/* Project / External URL */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">
                External Project URL (Optional)
              </label>
              <Input
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://instagram.com/reel/... or https://youtube.com/..."
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 text-xs h-9"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">
                Description (Optional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your role, engagement metrics, and production tools..."
                rows={3}
                maxLength={1000}
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 text-xs"
              />
              <p className="text-[10px] text-zinc-500 text-right">{description.length} / 1000</p>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-4"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    {savingStep || "Saving..."}
                  </>
                ) : (
                  "Save Item"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
