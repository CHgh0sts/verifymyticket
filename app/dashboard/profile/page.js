"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert } from "@/components/ui";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/, "Lettres, chiffres, _ et -"),
});

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProfile(data);
        reset({ username: data.username });
      })
      .catch((e) => setError(e.message));
  }, [reset]);

  async function onSubmit(values) {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Mise à jour impossible");
        return;
      }
      setProfile((p) => ({ ...p, ...data.user }));
      setSuccess("Profil mis à jour");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  if (!profile && !error) {
    return <p className="text-[var(--text-muted)]">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profil</h1>
        <p className="mt-1 text-[var(--text-muted)]">Gérez vos informations de compte.</p>
      </div>

      {profile && (
        <div className="card space-y-2 p-5 text-sm text-[var(--text-muted)]">
          <p>
            Email : <span className="text-[var(--text)]">{profile.email}</span>
          </p>
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

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="username">
            Nom d&apos;utilisateur
          </label>
          <input id="username" className="input" {...register("username")} />
          {errors.username && (
            <p className="mt-1 text-sm text-[var(--danger)]">{errors.username.message}</p>
          )}
        </div>
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
