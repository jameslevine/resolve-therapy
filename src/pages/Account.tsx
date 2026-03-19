import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Lock, Trash2, Loader2, Check, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useCreditsStore } from "@/store/credits";

export default function Account() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { updateName, changePassword, deleteAccount, signOut } = useAuthStore();
  const { balance } = useCreditsStore();

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    setNameSaving(true);
    setNameError(null);
    setNameSuccess(false);
    try {
      await updateName(name.trim());
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : t("account.updateFailed"));
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError(null);
    setPwSuccess(false);
    if (newPassword !== confirmPassword) {
      setPwError(t("auth.passwordMismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setPwError(t("auth.passwordRequirements"));
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPwSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : t("account.passwordFailed"));
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAccount();
      signOut();
      navigate("/");
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : t("account.deleteFailed"));
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="bg-white border-b border-stone-200 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-stone-900">{t("account.title")}</h1>
          <p className="mt-2 text-stone-600">{t("account.subtitle")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Section */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
              <User className="h-5 w-5 text-rose-500" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">{t("account.profile")}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">{t("auth.email")}</label>
              <p className="mt-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-500">
                {user?.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700">{t("auth.name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-900 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700">
                {t("credits.balanceLabel")}
              </label>
              <p className="mt-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700">
                <span className="font-bold text-rose-600">{balance}</span> {t("credits.credits")}
              </p>
            </div>

            {nameError && <p className="text-sm text-red-600">{nameError}</p>}
            {nameSuccess && (
              <p className="flex items-center gap-1 text-sm text-emerald-600">
                <Check className="h-4 w-4" /> {t("account.nameUpdated")}
              </p>
            )}

            <button
              type="button"
              onClick={handleUpdateName}
              disabled={nameSaving || name.trim() === user?.name}
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {nameSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("account.saveName")}
            </button>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">{t("account.changePassword")}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">
                {t("account.currentPassword")}
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-900 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                {t("auth.newPassword")}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-900 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
              <p className="mt-1 text-xs text-stone-400">{t("auth.passwordRequirements")}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                {t("auth.confirmPassword")}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-900 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
            </div>

            {pwError && <p className="text-sm text-red-600">{pwError}</p>}
            {pwSuccess && (
              <p className="flex items-center gap-1 text-sm text-emerald-600">
                <Check className="h-4 w-4" /> {t("account.passwordUpdated")}
              </p>
            )}

            <button
              type="button"
              onClick={handleChangePassword}
              disabled={pwSaving || !oldPassword || !newPassword || !confirmPassword}
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pwSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("account.updatePassword")}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-red-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-700">{t("account.dangerZone")}</h2>
              <p className="text-sm text-stone-500">{t("account.dangerDesc")}</p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              {t("account.deleteAccount")}
            </button>
          ) : (
            <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">{t("account.deleteWarning")}</p>
                  <p className="mt-1 text-sm text-red-600">{t("account.deleteConfirmPrompt")}</p>
                </div>
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
              {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("account.confirmDelete")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  className="rounded-full border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
