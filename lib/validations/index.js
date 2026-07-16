import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Nom d'utilisateur trop court")
    .max(32, "Nom d'utilisateur trop long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Caractères autorisés : lettres, chiffres, _ et -"),
  email: z.string().email("Email invalide").max(255),
  password: z
    .string()
    .min(8, "Mot de passe : 8 caractères minimum")
    .max(128)
    .regex(/[A-Za-z]/, "Doit contenir une lettre")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Mot de passe : 8 caractères minimum")
    .max(128)
    .regex(/[A-Za-z]/, "Doit contenir une lettre")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
});

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
});

const passwordRules = z
  .string()
  .min(8, "Mot de passe : 8 caractères minimum")
  .max(128)
  .regex(/[A-Za-z]/, "Doit contenir une lettre")
  .regex(/[0-9]/, "Doit contenir un chiffre");

export const changeEmailSchema = z.object({
  newEmail: z.string().email("Email invalide").max(255),
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

const barcodeTypeEnum = z.enum(["QR", "DATAMATRIX", "BARCODE"]);
const ticketCategoryEnum = z.enum([
  "CONCERT",
  "FESTIVAL",
  "SPORT",
  "THEATER",
  "CINEMA",
  "TRAIN",
  "FLIGHT",
  "OLYMPICS",
  "OTHER",
]);

const optionalDateString = z
  .union([z.string(), z.null(), z.undefined()])
  .optional()
  .nullable();

export const ticketCreateSchema = z.object({
  category: ticketCategoryEnum.default("CONCERT"),
  eventName: z.string().min(1, "Nom de l'événement requis").max(200),
  venue: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  eventDate: optionalDateString,
  organizer: z.string().max(200).optional().nullable(),
  platform: z.string().min(1, "Plateforme requise").max(100),
  orderNumber: z.string().max(100).optional().nullable(),
  seat: z.string().max(50).optional().nullable(),
  row: z.string().max(50).optional().nullable(),
  block: z.string().max(50).optional().nullable(),
  ticketCategory: z.string().max(100).optional().nullable(),
  purchaserName: z.string().max(200).optional().nullable(),
  purchasePrice: z.union([z.number().nonnegative(), z.string()]).optional().nullable(),
  purchaseDate: optionalDateString,
  barcodeType: barcodeTypeEnum,
  barcodeValue: z.string().min(4, "Code trop court").max(4096),
  externalEventId: z.string().max(100).optional().nullable(),
});

const eventPayloadSchema = z.object({
  id: z.string().optional(),
  name: z.string().max(300).optional(),
  attraction: z.string().max(200).optional(),
  venue: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  dateLabel: z.string().max(50).optional(),
  date: z.string().optional().nullable(),
});

export const publicCheckSchema = z
  .object({
    mode: z.enum(["full", "last4"]).default("full"),
    barcodeValue: z.string().min(1).max(4096),
    captchaToken: z.string().optional(),
    event: eventPayloadSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.event?.id && !data.event?.name && !data.event?.attraction) {
      ctx.addIssue({
        code: "custom",
        path: ["event"],
        message: "Un événement est requis",
      });
    }
    if (data.mode === "last4") {
      const v = String(data.barcodeValue).trim();
      if (v.length !== 4) {
        ctx.addIssue({
          code: "custom",
          path: ["barcodeValue"],
          message: "Indiquez exactement les 4 derniers caractères",
        });
      }
    } else if (String(data.barcodeValue).trim().length < 4) {
      ctx.addIssue({
        code: "custom",
        path: ["barcodeValue"],
        message: "Code trop court",
      });
    }
  });

export function formatZodError(error) {
  const issues = error.issues || error.errors || [];
  return issues.map((i) => ({
    path: i.path?.join(".") || "",
    message: i.message,
  }));
}
