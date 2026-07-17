import { z } from "zod";

export const ticketUpdateSchema = z.object({
  eventName: z.string().min(1).max(200).optional(),
  venue: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  eventDate: z.union([z.string(), z.null()]).optional().nullable(),
  organizer: z.string().max(200).optional().nullable(),
  platform: z.string().min(1).max(100).optional(),
  orderNumber: z.string().max(100).optional().nullable(),
  seat: z.string().max(50).optional().nullable(),
  row: z.string().max(50).optional().nullable(),
  block: z.string().max(50).optional().nullable(),
  ticketCategory: z.string().max(100).optional().nullable(),
  purchaserName: z.string().max(200).optional().nullable(),
  purchasePrice: z
    .union([z.number().nonnegative(), z.string(), z.null()])
    .optional()
    .nullable(),
  purchaseDate: z.union([z.string(), z.null()]).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  category: z
    .enum([
      "CONCERT",
      "FESTIVAL",
      "SPORT",
      "THEATER",
      "CINEMA",
      "TRAIN",
      "FLIGHT",
      "OLYMPICS",
      "OTHER",
    ])
    .optional(),
});
