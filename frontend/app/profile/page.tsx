"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { getErrorMessage } from "@/lib/api/client";
import { userApi } from "@/lib/api/services";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function ProfilePage() {
  const auth = useRequireAuth();
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    avatar: ""
  });
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.user) {
      return;
    }
    setProfileForm({
      fullName: auth.user.fullName ?? "",
      phone: auth.user.phone ?? "",
      avatar: auth.user.avatar ?? ""
    });
    setAvatarPreviewError(false);
  }, [auth.user]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth.accessToken) {
      return;
    }
    setError(null);
    setNotice(null);
    setIsSavingProfile(true);
    try {
      await userApi.updateMe(auth.accessToken, {
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
        avatar: profileForm.avatar.trim()
      });
      await auth.refreshProfile();
      setNotice("Profile updated.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not update profile"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth.accessToken) {
      return;
    }
    setError(null);
    setNotice(null);
    setIsSavingPassword(true);

    try {
      await userApi.changePassword(auth.accessToken, passwordForm);
      setNotice("Password changed.");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not change password"));
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!auth.isReady) {
    return <Card className="py-14 text-center text-sm text-slate">Loading profile...</Card>;
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Account"
        title="Profile Settings"
        description="Update your user information and password."
      />

      {error ? <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{error}</Card> : null}
      {notice ? <Card className="border-emerald-200 bg-emerald-50 py-3 text-sm text-emerald-700">{notice}</Card> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate">Profile</p>
          <form className="space-y-3" onSubmit={saveProfile}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Full name</label>
              <Input
                required
                value={profileForm.fullName}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Phone</label>
              <Input
                value={profileForm.phone}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Avatar URL</label>
              <Input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={profileForm.avatar}
                onChange={(event) => {
                  setAvatarPreviewError(false);
                  setProfileForm((prev) => ({ ...prev, avatar: event.target.value }));
                }}
              />
            </div>
            {profileForm.avatar.trim() ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate/20 bg-mist p-3">
                <div className="h-14 w-14 overflow-hidden rounded-full border border-slate/20 bg-cloud">
                  {!avatarPreviewError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileForm.avatar.trim()}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                      onError={() => setAvatarPreviewError(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase text-slate">
                      Invalid
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate">
                  Avatar preview {avatarPreviewError ? "(URL could not be loaded)" : "(live)"}
                </p>
              </div>
            ) : null}
            <Button type="submit" loading={isSavingProfile}>
              Save profile
            </Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate">Security</p>
          <form className="space-y-3" onSubmit={savePassword}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Current password</label>
              <Input
                type="password"
                required
                value={passwordForm.oldPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">New password</label>
              <Input
                type="password"
                required
                minLength={6}
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                Confirm password
              </label>
              <Input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
              />
            </div>
            <Button type="submit" variant="secondary" loading={isSavingPassword}>
              Change password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
