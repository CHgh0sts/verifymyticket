"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import {
  changeEmailSchema,
  changePasswordSchema,
} from "@/lib/validations";

const usernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/, "Lettres, chiffres, _ et -"),
});

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [usernameMsg, setUsernameMsg] = useState({ error: "", success: "" });
  const [emailMsg, setEmailMsg] = useState({ error: "", success: "" });
  const [passwordMsg, setPasswordMsg] = useState({ error: "", success: "" });

  const [usernameLoading, setUsernameLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const usernameForm = useForm({ resolver: zodResolver(usernameSchema) });
  const emailForm = useForm({ resolver: zodResolver(changeEmailSchema) });
  const passwordForm = useForm({ resolver: zodResolver(changePasswordSchema) });

  const refreshProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Chargement impossible");
    setProfile(data);
    usernameForm.reset({ username: data.username });
    return data;
  }, [usernameForm]);

  useEffect(() => {
    refreshProfile().catch((e) => setLoadError(e.message));
  }, [refreshProfile]);

  async function onUsernameSubmit(values) {
    setUsernameLoading(true);
    setUsernameMsg({ error: "", success: "" });
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameMsg({ error: data.error || "Mise à jour impossible", success: "" });
        return;
      }
      setProfile((p) => ({ ...p, ...data.user }));
      setUsernameMsg({ error: "", success: "Nom d'utilisateur mis à jour" });
    } catch {
      setUsernameMsg({ error: "Erreur réseau", success: "" });
    } finally {
      setUsernameLoading(false);
    }
  }

  async function onEmailSubmit(values) {
    setEmailLoading(true);
    setEmailMsg({ error: "", success: "" });
    try {
      const res = await fetch("/api/profile/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailMsg({ error: data.error || "Demande impossible", success: "" });
        return;
      }
      emailForm.reset();
      await refreshProfile();
      setEmailMsg({ error: "", success: data.message });
    } catch {
      setEmailMsg({ error: "Erreur réseau", success: "" });
    } finally {
      setEmailLoading(false);
    }
  }

  async function onPasswordSubmit(values) {
    setPasswordLoading(true);
    setPasswordMsg({ error: "", success: "" });
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMsg({ error: data.error || "Demande impossible", success: "" });
        return;
      }
      passwordForm.reset();
      await refreshProfile();
      setPasswordMsg({ error: "", success: data.message });
    } catch {
      setPasswordMsg({ error: "Erreur réseau", success: "" });
    } finally {
      setPasswordLoading(false);
    }
  }

  if (!profile && !loadError) {
    return <p className="text-[var(--text-muted)]">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profil</h1>
        <p className="mt-1 text-[var(--text-muted)]">
          Gérez vos informations de compte. Les changements d&apos;email et de mot de
          passe nécessitent une confirmation par email.
        </p>
      </div>

      {loadError && <Alert type="error">{loadError}</Alert>}

      {profile && (
        <div className="card space-y-2 p-5 text-sm text-[var(--text-muted)]">
          <p>
            Email actuel : <span className="text-[var(--text)]">{profile.email}</span>
          </p>
          {profile.emailChangePending && profile.pendingEmail && (
            <p className="text-[var(--warning)]">
              Confirmation en attente pour : {profile.pendingEmail}
            </p>
          )}
          {profile.passwordChangePending && (
            <p className="text-[var(--warning)]">
              Changement de mot de passe en attente de confirmation email.
            </p>
          )}
          <p>
            Membre depuis :{" "}
            <span className="text-[var(--text)]">
              {new Date(profile.createdAt).toLocaleDateString("fr-FR")}
            </span>
          </p>
          <p>
            Billets :{" "}
            <span className="text-[var(--text)]">{profile.ticketCount ?? "—"}</span>
          </p>
        </div>
      )}

      <form
        onSubmit={usernameForm.handleSubmit(onUsernameSubmit)}
        className="card space-y-4 p-6"
      >
        <h2 className="text-lg font-medium">Nom d&apos;utilisateur</h2>
        <div>
          <label className="label" htmlFor="username">
            Nom d&apos;utilisateur
          </label>
          <input
            id="username"
            className="input"
            {...usernameForm.register("username")}
          />
          {usernameForm.formState.errors.username && (
            <p className="mt-1 text-sm text-[var(--danger)]">
              {usernameForm.formState.errors.username.message}
            </p>
          )}
        </div>
        {usernameMsg.error && <Alert type="error">{usernameMsg.error}</Alert>}
        {usernameMsg.success && <Alert type="success">{usernameMsg.success}</Alert>}
        <button type="submit" className="btn btn-primary" disabled={usernameLoading}>
          {usernameLoading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <form
        onSubmit={emailForm.handleSubmit(onEmailSubmit)}
        className="card space-y-4 p-6"
      >
        <h2 className="text-lg font-medium">Changer l&apos;email</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Un lien de confirmation sera envoyé à la nouvelle adresse. Un avis sera aussi
          envoyé à l&apos;adresse actuelle.
        </p>
        <div>
          <label className="label" htmlFor="newEmail">
            Nouvel email
          </label>
          <input
            id="newEmail"
            type="email"
            autoComplete="email"
            className="input"
            {...emailForm.register("newEmail")}
          />
          {emailForm.formState.errors.newEmail && (
            <p className="mt-1 text-sm text-[var(--danger)]">
              {emailForm.formState.errors.newEmail.message}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="emailCurrentPassword">
            Mot de passe actuel
          </label>
          <PasswordInput
            id="emailCurrentPassword"
            autoComplete="current-password"
            {...emailForm.register("currentPassword")}
          />
          {emailForm.formState.errors.currentPassword && (
            <p className="mt-1 text-sm text-[var(--danger)]">
              {emailForm.formState.errors.currentPassword.message}
            </p>
          )}
        </div>
        {emailMsg.error && <Alert type="error">{emailMsg.error}</Alert>}
        {emailMsg.success && <Alert type="success">{emailMsg.success}</Alert>}
        <button type="submit" className="btn btn-primary" disabled={emailLoading}>
          {emailLoading ? "Envoi…" : "Demander le changement"}
        </button>
      </form>

      <form
        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
        className="card space-y-4 p-6"
      >
        <h2 className="text-lg font-medium">Changer le mot de passe</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Un lien de confirmation sera envoyé à votre email actuel. Le mot de passe ne
          change qu&apos;après validation du lien.
        </p>
        <div>
          <label className="label" htmlFor="currentPassword">
            Mot de passe actuel
          </label>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            {...passwordForm.register("currentPassword")}
          />
          {passwordForm.formState.errors.currentPassword && (
            <p className="mt-1 text-sm text-[var(--danger)]">
              {passwordForm.formState.errors.currentPassword.message}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="newPassword">
            Nouveau mot de passe
          </label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            {...passwordForm.register("newPassword")}
          />
          {passwordForm.formState.errors.newPassword && (
            <p className="mt-1 text-sm text-[var(--danger)]">
              {passwordForm.formState.errors.newPassword.message}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="confirmPassword">
            Confirmer le nouveau mot de passe
          </label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            {...passwordForm.register("confirmPassword")}
          />
          {passwordForm.formState.errors.confirmPassword && (
            <p className="mt-1 text-sm text-[var(--danger)]">
              {passwordForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
        {passwordMsg.error && <Alert type="error">{passwordMsg.error}</Alert>}
        {passwordMsg.success && <Alert type="success">{passwordMsg.success}</Alert>}
        <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
          {passwordLoading ? "Envoi…" : "Demander le changement"}
        </button>
      </form>
    </div>
  );
}
