'use server'

import { revalidatePath } from 'next/cache'
import siteConfigService from '@/modules/site-config/SiteConfigService'
import { ErrorCode, actionFailure } from '@/modules/common/errors'
import {
  updateGeneralConfigSchema,
  updateSocialConfigSchema,
  updatePaymentConfigSchema,
} from '../schemas/siteConfigSchemas'
import type { ActionResult } from './types'

export async function updateGeneralConfigAction(input: unknown): Promise<ActionResult> {
  const parsed = updateGeneralConfigSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    const dto = {
      siteName: parsed.data.siteName,
      siteDescription: parsed.data.siteDescription || undefined,
      logoUrl: parsed.data.logoUrl || undefined,
      primaryColor: parsed.data.primaryColor || undefined,
      secondaryColor: parsed.data.secondaryColor || undefined,
      contactEmail: parsed.data.contactEmail || undefined,
      contactPhone: parsed.data.contactPhone || undefined,
    }
    await siteConfigService.updateConfig(dto)
    revalidatePath('/admin/configuracion')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.SITE_CONFIG_GENERAL_FAILED)
  }
}

export async function updateSocialConfigAction(input: unknown): Promise<ActionResult> {
  const parsed = updateSocialConfigSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    const sm = parsed.data.socialMedia
    await siteConfigService.updateConfig({
      socialMedia: {
        instagram: sm.instagram || undefined,
        facebook: sm.facebook || undefined,
        twitter: sm.twitter || undefined,
        youtube: sm.youtube || undefined,
      },
    })
    revalidatePath('/admin/configuracion')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.SITE_CONFIG_SOCIAL_FAILED)
  }
}

export async function updatePaymentConfigAction(input: unknown): Promise<ActionResult> {
  const parsed = updatePaymentConfigSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    const pc = parsed.data.paymentConfig
    await siteConfigService.updateConfig({
      paymentConfig: {
        mercadoPagoEnabled: pc.mercadoPagoEnabled,
        mercadoPagoPublicKey: pc.mercadoPagoPublicKey || undefined,
        bankTransferEnabled: pc.bankTransferEnabled,
        bankTransferDetails: pc.bankTransferDetails || undefined,
        cashEnabled: pc.cashEnabled,
      },
    })
    revalidatePath('/admin/configuracion')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.SITE_CONFIG_PAYMENT_FAILED)
  }
}
