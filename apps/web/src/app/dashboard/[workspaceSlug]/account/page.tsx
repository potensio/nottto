"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";

export default function AccountSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateUser({ name: name.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const { url } = await apiClient.uploadProfilePicture(file);
      await updateUser({ profilePicture: url });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || "Failed to upload profile picture");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveProfilePicture = async () => {
    setIsUploading(true);
    setError(null);

    try {
      await updateUser({ profilePicture: null });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || "Failed to remove profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;

    setIsDeleting(true);
    setError(null);

    try {
      await apiClient.deleteAccount();
      logout();
      router.push("/");
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || "Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/${workspaceSlug}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
          >
            <iconify-icon icon="lucide:arrow-left"></iconify-icon>
            Back to workspace
          </Link>
          <h1 className="text-3xl font-instrument-serif font-normal text-neutral-900">
            Account Settings
          </h1>
          <p className="text-neutral-500 mt-2">
            Manage your profile and account preferences
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <iconify-icon
              icon="lucide:check-circle"
              className="text-green-600 text-xl"
            ></iconify-icon>
            <span className="text-green-800">Changes saved successfully!</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <iconify-icon
              icon="lucide:alert-circle"
              className="text-red-600 text-xl"
            ></iconify-icon>
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Profile Picture */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name || user.email}
                  className="w-20 h-20 rounded-full object-cover border-2 border-neutral-200"
                />
              ) : (
                <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center text-white text-2xl font-medium">
                  {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <iconify-icon
                    icon="lucide:loader-2"
                    className="text-white text-xl animate-spin"
                  ></iconify-icon>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleProfilePictureClick}
                  disabled={isUploading}
                  className="px-3 py-1.5 text-sm bg-white rounded-lg border-neutral-300 border hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <iconify-icon
                    icon="ph:upload-simple"
                    height={16}
                  ></iconify-icon>
                  Upload
                </button>
                {user?.profilePicture && (
                  <button
                    onClick={handleRemoveProfilePicture}
                    disabled={isUploading}
                    className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                JPG, PNG, GIF or WebP. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-500 cursor-not-allowed"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Email address cannot be changed
            </p>
          </div>

          {/* Submit button */}
          <div className="">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2.5 bg-neutral-900 text-white rounded-lg text-base hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <iconify-icon
                    icon="lucide:loader-2"
                    className="animate-spin"
                  ></iconify-icon>
                  Saving...
                </>
              ) : (
                <>
                  <iconify-icon icon="lucide:save"></iconify-icon>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <h2 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h2>
          <p className="text-neutral-500 text-sm mb-4">
            Once you delete your account, there is no going back. All your data
            will be permanently removed.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-white text-red-500 border border-red-500 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <iconify-icon icon="ph:trash" height={16}></iconify-icon>
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <iconify-icon
                    icon="lucide:alert-triangle"
                    className="text-red-600 text-xl"
                  ></iconify-icon>
                </div>
                <h3 className="text-xl font-instrument-serif text-neutral-900">
                  Delete Account
                </h3>
              </div>
              <p className="text-sm text-neutral-500">
                This action cannot be undone. All your workspaces, projects, and
                annotations will be permanently deleted.
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Type <span className="font-mono text-red-600">DELETE</span> to
                confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
              />
            </div>
            <div className="p-6 pt-0 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE" || isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <iconify-icon
                      icon="lucide:loader-2"
                      className="animate-spin"
                    ></iconify-icon>
                    Deleting...
                  </>
                ) : (
                  <>
                    <iconify-icon icon="lucide:trash-2"></iconify-icon>
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
