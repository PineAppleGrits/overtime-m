'use server'

import { revalidatePath } from 'next/cache'
import RegistrationService from './RegistrationService'

interface CreateRegistrationInput {
  teamId: string
  tournamentId: string
  categoryId: string
}

export async function createRegistrationAction(input: CreateRegistrationInput): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const data = await RegistrationService.createRegistration(input)
    revalidatePath('/torneos')
    return { success: true, data }
  } catch (error: any) {
    console.error('Error creating registration:', error)
    const errMessage = error?.response?.data?.message || 'Error al procesar la inscripción'
    return { success: false, error: errMessage }
  }
}
