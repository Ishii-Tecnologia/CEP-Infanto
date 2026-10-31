import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

interface RestrictedAccessProps {
  title?: string
  description?: string
  requiredRolesDescription?: string
}

export const RestrictedAccess: React.FC<RestrictedAccessProps> = ({
  title = 'Acesso restrito',
  description = 'Você não possui permissão de acesso para visualizar esta seção do Sistema Infanto-CEP com o seu papel cadastrado.',
  requiredRolesDescription,
}) => {
  const navigate = useNavigate()
  const { originalUser, user } = useAuth()

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-rose-200 dark:border-rose-900/60 shadow-lg bg-white dark:bg-slate-900">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto h-14 w-14 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-2">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operador logado:</span>
              <span className="font-semibold">
                {originalUser?.name || user?.name || 'Operador'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Papel no cadastro:</span>
              <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">
                {originalUser?.role || 'Não definido'}
              </span>
            </div>
            {requiredRolesDescription && (
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                <span className="text-muted-foreground">Papéis permitidos:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {requiredRolesDescription}
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-center text-muted-foreground">
            Caso necessite acessar esta funcionalidade, solicite a alteração de papel à
            Administração do <strong>CEP-Coligação Espírita Progressista</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 text-xs h-9">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Voltar
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="flex-1 text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Home className="h-3.5 w-3.5 mr-1.5" />
              Ir para o Painel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default RestrictedAccess
