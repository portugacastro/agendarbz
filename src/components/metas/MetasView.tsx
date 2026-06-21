'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash2, Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import type { Meta } from '@/types/database'

interface Props {
  metas: (Meta & { gestores?: { nome: string } | null; marcas?: { nome: string } | null })[]
  gestores: { id: string; nome: string }[]
  marcas: { id: string; nome: string }[]
  isAdmin: boolean
  gestorAtualId?: string
}

export function MetasView({ metas: init, gestores, marcas, isAdmin, gestorAtualId }: Props) {
  const { toast } = useToast()
  const supabase = createClient()
  const [metas, setMetas] = useState(init)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    gestor_id: gestorAtualId || '',
    marca_id: '',
    periodo_inicio: '',
    periodo_fim: '',
    meta_quantidade: '0',
  })

  const setField = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('metas')
        .insert({
          gestor_id: form.gestor_id || null,
          marca_id: form.marca_id || null,
          periodo_inicio: form.periodo_inicio,
          periodo_fim: form.periodo_fim,
          meta_quantidade: parseInt(form.meta_quantidade),
        })
        .select('*, gestores(nome), marcas(nome)')
        .single()
      if (error) throw error
      setMetas(prev => [data as any, ...prev])
      toast('Meta criada!')
      setShowModal(false)
      setForm({ gestor_id: gestorAtualId || '', marca_id: '', periodo_inicio: '', periodo_fim: '', meta_quantidade: '0' })
    } catch (err: any) {
      toast(err.message || 'Erro ao criar meta.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta meta?')) return
    setDeletingId(id)
    try {
      const { error } = await supabase.from('metas').delete().eq('id', id)
      if (error) throw error
      setMetas(prev => prev.filter(m => m.id !== id))
      toast('Meta excluída.')
    } catch {
      toast('Erro ao excluir meta.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {metas.length === 0 ? (
        <Card className="text-center py-12">
          <Target className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">Nenhuma meta cadastrada</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metas.map(m => (
            <MetaCard
              key={m.id}
              meta={m}
              onDelete={() => handleDelete(m.id)}
              deleting={deletingId === m.id}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Meta">
        <form onSubmit={handleCreate} className="space-y-4">
          {isAdmin && (
            <Select
              label="Gestor"
              value={form.gestor_id}
              onChange={(e) => setField('gestor_id', e.target.value)}
              options={gestores.map(g => ({ value: g.id, label: g.nome }))}
              placeholder="Todos os gestores"
            />
          )}
          <Select
            label="Marca"
            value={form.marca_id}
            onChange={(e) => setField('marca_id', e.target.value)}
            options={marcas.map(m => ({ value: m.id, label: m.nome }))}
            placeholder="Todas as marcas"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Início *"
              type="date"
              value={form.periodo_inicio}
              onChange={(e) => setField('periodo_inicio', e.target.value)}
              required
            />
            <Input
              label="Fim *"
              type="date"
              value={form.periodo_fim}
              onChange={(e) => setField('periodo_fim', e.target.value)}
              required
            />
          </div>
          <Input
            label="Quantidade de Agendamentos *"
            type="number"
            min="1"
            value={form.meta_quantidade}
            onChange={(e) => setField('meta_quantidade', e.target.value)}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Criar Meta</Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function MetaCard({
  meta,
  onDelete,
  deleting,
  isAdmin,
}: {
  meta: Meta & { gestores?: { nome: string } | null; marcas?: { nome: string } | null }
  onDelete: () => void
  deleting: boolean
  isAdmin: boolean
}) {
  const inicio = new Date(meta.periodo_inicio + 'T00:00:00')
  const fim = new Date(meta.periodo_fim + 'T00:00:00')

  return (
    <Card className="flex items-start gap-4">
      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
        <Target className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-900">
              {meta.meta_quantidade} agendamentos
            </p>
            <p className="text-sm text-slate-500">
              {format(inicio, 'dd/MM/yyyy')} — {format(fim, 'dd/MM/yyyy')}
            </p>
          </div>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 space-y-0.5 text-sm text-slate-500">
          {meta.gestores?.nome && <p>Gestor: {meta.gestores.nome}</p>}
          {meta.marcas?.nome && <p>Marca: {meta.marcas.nome}</p>}
          {!meta.gestores?.nome && !meta.marcas?.nome && <p>Global</p>}
        </div>
      </div>
    </Card>
  )
}
