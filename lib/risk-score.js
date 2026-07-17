/**
 * Score de confiance / niveau de risque pour une vérification publique.
 * Niveaux : low | medium | high
 */

function hoursBetween(a, b) {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60);
}

/**
 * @param {object} input
 * @param {boolean} input.found
 * @param {number} input.matchCount
 * @param {boolean} input.hasRegisteredTicket
 * @param {string|null} input.priorStatus
 * @param {string} input.checkType
 * @param {string} [input.mode]
 * @param {Array<{createdAt: Date|string}>} [input.tickets]
 * @param {Array<{createdAt: Date|string, checkCount?: number, purchaseStatus?: string}>} [input.sightings]
 */
export function computeRiskScore(input) {
  const {
    found,
    matchCount = 0,
    hasRegisteredTicket = false,
    priorStatus = null,
    checkType,
    mode,
    tickets = [],
    sightings = [],
  } = input;

  if (!found || matchCount === 0) {
    return {
      level: "low",
      score: 0,
      label: "Risque faible",
      summary: "Aucune trace trouvée pour cet événement.",
      factors: [],
    };
  }

  let score = 0;
  const factors = [];

  if (hasRegisteredTicket) {
    score += 45;
    factors.push({
      id: "registered",
      weight: 45,
      text: "Billet déjà enregistré dans un compte VerifyMyTicket",
    });
  }

  if (priorStatus === "claimed" || priorStatus === "owned") {
    score += 30;
    factors.push({
      id: "owned_or_claimed",
      weight: 30,
      text:
        priorStatus === "claimed"
          ? "Quelqu’un a confirmé l’achat de ce billet"
          : "Signalé comme déjà acheté",
    });
  } else if (priorStatus === "watching") {
    score += 15;
    factors.push({
      id: "watching",
      weight: 15,
      text: "Déjà vérifié avant achat par quelqu’un d’autre",
    });
  }

  if (checkType === "barcode" && mode === "full") {
    score += 20;
    factors.push({
      id: "full_match",
      weight: 20,
      text: "Correspondance sur le code complet (forte confiance)",
    });
  } else if (checkType === "barcode" && mode === "last4") {
    score += 8;
    factors.push({
      id: "last4",
      weight: 8,
      text: "Correspondance sur 4 caractères (moins précise)",
    });
  } else if (checkType === "seat") {
    score += 12;
    factors.push({
      id: "seat",
      weight: 12,
      text: "Même emplacement (bloc / rang / siège)",
    });
  } else if (checkType === "name") {
    score += 10;
    factors.push({
      id: "name",
      weight: 10,
      text: "Même nom sur le billet",
    });
  }

  if (matchCount >= 3) {
    score += 15;
    factors.push({
      id: "multi",
      weight: 15,
      text: `${matchCount} occurrences détectées`,
    });
  } else if (matchCount === 2) {
    score += 8;
    factors.push({
      id: "double",
      weight: 8,
      text: "Deux occurrences détectées",
    });
  }

  const dates = [
    ...tickets.map((t) => t.createdAt),
    ...sightings.map((s) => s.createdAt),
  ].filter(Boolean);
  if (dates.length >= 2) {
    const sorted = dates.map((d) => new Date(d)).sort((a, b) => a - b);
    const spanHours = hoursBetween(sorted[0], sorted[sorted.length - 1]);
    if (spanHours < 24) {
      score += 10;
      factors.push({
        id: "rapid",
        weight: 10,
        text: "Plusieurs vérifications en moins de 24 h",
      });
    } else if (spanHours > 24 * 7) {
      score += 5;
      factors.push({
        id: "span",
        weight: 5,
        text: "Activité étalée dans le temps (possible revente)",
      });
    }
  }

  const claimedCount = sightings.filter(
    (s) => s.purchaseStatus === "claimed" || s.purchaseStatus === "owned"
  ).length;
  if (claimedCount >= 2) {
    score += 15;
    factors.push({
      id: "multi_claim",
      weight: 15,
      text: "Plusieurs confirmations d’achat contradictoires",
    });
  }

  score = Math.min(100, score);

  let level = "medium";
  let label = "Prudence";
  let summary = "Des indices suggèrent que ce billet a déjà circulé.";

  if (score >= 55) {
    level = "high";
    label = "Risque élevé";
    summary =
      "Fortes chances que ce billet circule déjà. Évitez d’acheter sans vérification approfondie.";
  } else if (score < 25) {
    level = "low";
    label = "Risque faible";
    summary = "Trace légère — restez vigilant mais le signal est limité.";
  }

  return { level, score, label, summary, factors };
}
