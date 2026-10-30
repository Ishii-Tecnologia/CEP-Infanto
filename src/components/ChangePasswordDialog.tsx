import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { settingsService } from '@/services/settings'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { toast } = useToast()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowOld(false)
    setShowNew(false)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!oldPassword) {
      toast({
        title: 'Atenção',
        description: 'Informe a sua senha atual.',
        variant: 'destructive',
      })
      return
    }

    if (!newPassword || newPassword.length < 8) {
      toast({
        title: 'Atenção',
        description: 'A nova senha deve ter no mínimo 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Atenção',
        description: 'A nova senha e a confirmação não coincidem.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      await settingsService.changeOwnPassword(oldPassword, newPassword)

      // Regra obrigatória: NUNCA exibir a nova senha na mensagem de confirmação
      toast({
        title: 'Senha alterada com sucesso!',
        description: 'A sua senha de acesso ao CEP-Coligação Espírita Progressista foi atualizada.',
      })

      handleReset()
      onOpenChange(false)
    } catch (err: any) {
      const fieldError =
        err?.data?.data?.oldPassword?.message ||
        err?.data?.data?.password?.message ||
        err?.data?.message ||
        err?.message ||
        'Não foi possível alterar a senha. Verifique se a senha atual está correta.'

      toast({
        title: 'Erro ao alterar senha',
        description: fieldError,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleReset()
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <KeyRound className="h-5 w-5 text-indigo-600" />
            Alterar Minha Senha
          </DialogTitle>
          <DialogDescription className="text-xs">
            Informe a sua senha atual e escolha uma nova senha de no mínimo 8 caracteres.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="current-pass">Senha Atual *</Label>
            <div className="relative">
              <Input
                id="current-pass"
                type={showOld ? 'text' : 'password'}
                placeholder="Digite sua senha atual"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200"
                tabIndex={-1}
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-pass">Nova Senha (mínimo 8 caracteres) *</Label>
            <div className="relative">
              <Input
                id="new-pass"
                type={showNew ? 'text' : 'password'}
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-pass">Confirmar Nova Senha *</Label>
            <Input
              id="confirm-pass"
              type="password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                handleReset()
                onOpenChange(false)
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? 'Salvando...' : 'Atualizar Senha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
