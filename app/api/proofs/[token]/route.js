import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(_request, { params }) {
  const { token } = await params;
  if (!token) return jsonError("Token manquant", 400);

  const proof = await prisma.checkProof.findUnique({
    where: { token },
  });

  if (!proof) return jsonError("Preuve introuvable", 404);
  if (new Date(proof.expiresAt) < new Date()) {
    return jsonError("Ce lien de preuve a expiré", 410);
  }

  return jsonOk({
    payload: proof.payload,
    expiresAt: proof.expiresAt,
    createdAt: proof.createdAt,
  });
}
