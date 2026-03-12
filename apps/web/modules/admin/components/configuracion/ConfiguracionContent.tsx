'use client'

import { useState } from 'react'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Globe, CreditCard, Loader2, Share2 } from 'lucide-react'
import { SiteConfig } from '@/modules/admin/types'
import { updateGeneralConfigAction, updateSocialConfigAction, updatePaymentConfigAction } from '@/modules/admin/actions/siteConfigActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'

interface ConfiguracionContentProps {
  initialData: { data: SiteConfig | null; error: string | null }
}

export function ConfiguracionContent({ initialData }: ConfiguracionContentProps) {
  const config = initialData.data

  const [generalForm, setGeneralForm] = useState({
    siteName: config?.siteName ?? '',
    siteDescription: config?.siteDescription ?? '',
    logoUrl: config?.logoUrl ?? '',
    primaryColor: config?.primaryColor ?? '',
    secondaryColor: config?.secondaryColor ?? '',
    contactEmail: config?.contactEmail ?? '',
    contactPhone: config?.contactPhone ?? '',
  })

  const [socialForm, setSocialForm] = useState({
    instagram: config?.socialMedia?.instagram ?? '',
    facebook: config?.socialMedia?.facebook ?? '',
    twitter: config?.socialMedia?.twitter ?? '',
    youtube: config?.socialMedia?.youtube ?? '',
  })

  const [paymentForm, setPaymentForm] = useState({
    mercadoPagoEnabled: config?.paymentConfig?.mercadoPagoEnabled ?? false,
    mercadoPagoPublicKey: config?.paymentConfig?.mercadoPagoPublicKey ?? '',
    bankTransferEnabled: config?.paymentConfig?.bankTransferEnabled ?? true,
    bankTransferDetails: config?.paymentConfig?.bankTransferDetails ?? '',
    cashEnabled: config?.paymentConfig?.cashEnabled ?? true,
  })

  const generalAction = useServerAction(updateGeneralConfigAction, { successMessage: 'Configuración general guardada' })
  const socialAction = useServerAction(updateSocialConfigAction, { successMessage: 'Redes sociales guardadas' })
  const paymentAction = useServerAction(updatePaymentConfigAction, { successMessage: 'Configuración de pagos guardada' })

  if (initialData.error) {
    return (
      <div>
        <PageHeader title="Configuración del sitio" description="Personaliza la apariencia, datos de contacto y métodos de pago" />
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar la configuración</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Configuración del sitio" description="Personaliza la apariencia, datos de contacto y métodos de pago" />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-1"><Globe className="h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-1"><Share2 className="h-4 w-4" />Redes sociales</TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-1"><CreditCard className="h-4 w-4" />Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información general</CardTitle>
                <CardDescription>Nombre, descripción y aspecto del sitio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Nombre del sitio</Label><Input value={generalForm.siteName} onChange={(e) => setGeneralForm({ ...generalForm, siteName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Descripción</Label><Textarea value={generalForm.siteDescription} onChange={(e) => setGeneralForm({ ...generalForm, siteDescription: e.target.value })} /></div>
                <div className="space-y-2"><Label>URL del logo</Label><Input value={generalForm.logoUrl} onChange={(e) => setGeneralForm({ ...generalForm, logoUrl: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color primario</Label>
                    <div className="flex gap-2">
                      <Input type="color" className="h-10 w-14 p-1" value={generalForm.primaryColor || '#ff3b2f'} onChange={(e) => setGeneralForm({ ...generalForm, primaryColor: e.target.value })} />
                      <Input value={generalForm.primaryColor} onChange={(e) => setGeneralForm({ ...generalForm, primaryColor: e.target.value })} placeholder="#ff3b2f" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Color secundario</Label>
                    <div className="flex gap-2">
                      <Input type="color" className="h-10 w-14 p-1" value={generalForm.secondaryColor || '#292548'} onChange={(e) => setGeneralForm({ ...generalForm, secondaryColor: e.target.value })} />
                      <Input value={generalForm.secondaryColor} onChange={(e) => setGeneralForm({ ...generalForm, secondaryColor: e.target.value })} placeholder="#292548" />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Email de contacto</Label><Input type="email" value={generalForm.contactEmail} onChange={(e) => setGeneralForm({ ...generalForm, contactEmail: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Teléfono de contacto</Label><Input value={generalForm.contactPhone} onChange={(e) => setGeneralForm({ ...generalForm, contactPhone: e.target.value })} /></div>
                </div>
              </CardContent>
            </Card>
            <Button onClick={() => generalAction.execute(generalForm)} disabled={generalAction.isPending}>
              {generalAction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar configuración general
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="social">
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader><CardTitle>Redes sociales</CardTitle><CardDescription>Links a las redes sociales que se muestran en el sitio</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Instagram</Label><Input placeholder="https://instagram.com/..." value={socialForm.instagram} onChange={(e) => setSocialForm({ ...socialForm, instagram: e.target.value })} /></div>
                <div className="space-y-2"><Label>Facebook</Label><Input placeholder="https://facebook.com/..." value={socialForm.facebook} onChange={(e) => setSocialForm({ ...socialForm, facebook: e.target.value })} /></div>
                <div className="space-y-2"><Label>Twitter / X</Label><Input placeholder="https://twitter.com/..." value={socialForm.twitter} onChange={(e) => setSocialForm({ ...socialForm, twitter: e.target.value })} /></div>
                <div className="space-y-2"><Label>YouTube</Label><Input placeholder="https://youtube.com/..." value={socialForm.youtube} onChange={(e) => setSocialForm({ ...socialForm, youtube: e.target.value })} /></div>
              </CardContent>
            </Card>
            <Button onClick={() => socialAction.execute({ socialMedia: socialForm })} disabled={socialAction.isPending}>
              {socialAction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar redes sociales
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="payment">
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Métodos de pago</CardTitle>
                <CardDescription>Configura los métodos de pago disponibles para las inscripciones. Los precios se configuran por torneo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div><Label className="text-base">Efectivo</Label><p className="text-sm text-muted-foreground">Pago en persona</p></div>
                    <Switch checked={paymentForm.cashEnabled} onCheckedChange={(checked) => setPaymentForm({ ...paymentForm, cashEnabled: checked })} />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div><Label className="text-base">Transferencia bancaria</Label><p className="text-sm text-muted-foreground">Transferencia o depósito</p></div>
                      <Switch checked={paymentForm.bankTransferEnabled} onCheckedChange={(checked) => setPaymentForm({ ...paymentForm, bankTransferEnabled: checked })} />
                    </div>
                    {paymentForm.bankTransferEnabled && (
                      <div className="space-y-2"><Label>Datos bancarios</Label><Textarea placeholder="CBU, alias, titular..." value={paymentForm.bankTransferDetails} onChange={(e) => setPaymentForm({ ...paymentForm, bankTransferDetails: e.target.value })} /></div>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div><Label className="text-base">Mercado Pago</Label><p className="text-sm text-muted-foreground">Pago online integrado</p></div>
                      <Switch checked={paymentForm.mercadoPagoEnabled} onCheckedChange={(checked) => setPaymentForm({ ...paymentForm, mercadoPagoEnabled: checked })} />
                    </div>
                    {paymentForm.mercadoPagoEnabled && (
                      <div className="space-y-2"><Label>Public Key de Mercado Pago</Label><Input placeholder="APP_USR-..." value={paymentForm.mercadoPagoPublicKey} onChange={(e) => setPaymentForm({ ...paymentForm, mercadoPagoPublicKey: e.target.value })} /></div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button onClick={() => paymentAction.execute({ paymentConfig: paymentForm })} disabled={paymentAction.isPending}>
              {paymentAction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar configuración de pagos
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
