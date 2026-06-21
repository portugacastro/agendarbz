'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Gestor } from '@/types/database'

interface Props {
  gestor?: Gestor
}

export function GestorForm({ gestor }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    nome: gestor?.nome || '',
    login: gestor?.login || '',
    telefone: gestor?.telefone || '',
    perfil: gestor?.perfil || 'gestor',
    status: gestor?.status || 'ativo',
    senha: '',
  })

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (gestor) {
        const payload: any = {
          nome: form.nome,
          telefone: form.telefone || null,
          perfil: form.perfil as 'admin' | 'gestor',
          status: form.status as 'ativo' | 'inativo',
        }
        const { error } = await supabase.from('gestores').update(payload).eq('id', gestor.id)
        if (error) throw error
        toast('Gestor atualizado!')
      } else {
        // Create auth user via admin (requires service role key - this is a simplified flow)
        // In production, use Supabase Admin API or Edge Function to create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.login,
          password: form.senha || Math.random().toString(36).slice(2) + '!A1',
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })

        if (authError) throw authError

        const { error: gestorError } = await supabase.from('gestores').insert({
          auth_user_id: authData.user?.id,
          nome: form.nome,
          login: form.login,
          telefone: form.telefone || null,
          perfil: form.perfil as 'admin' | 'gestor',
          status: form.status as 'ativo' | 'inativo',
        })
        if (gestorError) throw gestorError
        toast('Gestor criado! Um e-mail de confirmação foi enviado.')
      }

      router.push('/gestores')
      router.refresh()
    } catch (err: any) {
      toast(err.message || 'Erro ao salvar gestor.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Dados do Gestor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome completo *"
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
            required
            className="md:col-span-2"
          />
          <Input
            label="E-mail (login) *"
            type="email"
            value={form.login}
            onChange={(e) => set('login', e.target.value)}
            required
            disabled={!!gestor}
            hint={gestor ? 'O e-mail não pode ser alterado' : undefined}
            className="md:col-span-2"
          />
          {!gestor && (
            <Input
              label="Senha inicial"
              type="password"
              value={form.senha}
              onChange={(e) => set('senha', e.target.value)}
              hint="Deixe em branco para enviar link por e-mail"
              className="md:col-span-2"
            />
          )}
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => set('telefone', e.target.value)}
            placeholder="(00) 00000-0000"
          />
          <Select
            label="Perfil *"
            value={form.perfil}
            onChange={(e) => set('perfil', e.target.value)}
            options={[
              { value: 'gestor', label: 'Gestor' },
              { value: 'admin', label: 'Administrador' },
            ]}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            options={[
              { value: 'ativo', label: 'Ativo' },
              { value: 'inativo', label: 'Inativo' },
            ]}
          />
        </div>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {gestor ? 'Salvar Alterações' : 'Criar Gestor'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
