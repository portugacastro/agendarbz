'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Marca } from '@/types/database'

interface Props {
  marca?: Marca
  gestores: { id: string; nome: string }[]
  gestoresSelecionados?: string[]
}

export function MarcaForm({ marca, gestores, gestoresSelecionados: initial = [] }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [gestoresSelecionados, setGestoresSelecionados] = useState<string[]>(initial)

  const [form, setForm] = useState({
    nome: marca?.nome || '',
    status: marca?.status || 'ativo',
  })

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  function toggleGestor(id: string) {
    setGestoresSelecionados(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        nome: form.nome,
        status: form.status,
        gestor_id: gestoresSelecionados[0] || null,
      }

      let marcaId = marca?.id

      if (marca) {
        const { error } = await supabase.from('marcas').update(payload).eq('id', marca.id)
        if (error) throw error
        toast('Marca atualizada!')
      } else {
        const { data, error } = await supabase.from('marcas').insert(payload).select('id').single()
        if (error) throw error
        marcaId = data.id
        toast('Marca criada!')
      }

      // Atualiza gestor_marcas
      if (marcaId) {
        await supabase.from('gestor_marcas').delete().eq('marca_id', marcaId)
        if (gestoresSelecionados.length > 0) {
          const { error } = await supabase.from('gestor_marcas').insert(
            gestoresSelecionados.map(gestor_id => ({ marca_id: marcaId!, gestor_id }))
          )
          if (error) throw error
        }
      }

      router.push('/marcas')
      router.refresh()
    } catch (err: any) {
      toast(err.message || 'Erro ao salvar marca.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Dados da Marca</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
            required
            className="md:col-span-2"
          />

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700 block mb-2">Gestores</label>
            <div className="flex flex-wrap gap-2">
              {gestores.map(g => (
                <label
                  key={g.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors select-none ${
                    gestoresSelecionados.includes(g.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-300 hover:border-slate-400 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={gestoresSelecionados.includes(g.id)}
                    onChange={() => toggleGestor(g.id)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{g.nome}</span>
                </label>
              ))}
            </div>
            {gestoresSelecionados.length === 0 && (
              <p className="text-xs text-slate-400 mt-2">Nenhum gestor selecionado</p>
            )}
          </div>

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            options={[{ value: 'ativo', label: 'Ativa' }, { value: 'inativo', label: 'Inativa' }]}
          />
        </div>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {marca ? 'Salvar Alterações' : 'Criar Marca'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
