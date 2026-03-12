import { z } from 'zod'

export const updateGeneralConfigSchema = z.object({
  siteName: z.string().min(1, 'El nombre del sitio es obligatorio'),
  siteDescription: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
})

export const updateSocialConfigSchema = z.object({
  socialMedia: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
  }),
})

export const updatePaymentConfigSchema = z.object({
  paymentConfig: z.object({
    mercadoPagoEnabled: z.boolean(),
    mercadoPagoPublicKey: z.string().optional(),
    bankTransferEnabled: z.boolean(),
    bankTransferDetails: z.string().optional(),
    cashEnabled: z.boolean(),
  }),
})
