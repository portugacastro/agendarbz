'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { UF_OPTIONS } from '@/lib/labels'
import type { Cliente } from '@/types/database'

interface Props {
  cliente?: Cliente
  marcasSelecionadas?: string[]
  isAdmin: boolean
}

const UF_SELECT = UF_OPTIONS.map(uf => ({ value: uf, label: uf }))

export function ClienteForm({ cliente, marcasSelecionadas: initialMarcas = [], isAdmin }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [marcas, setMarcas] = useState<{ id: string; nome: string }[]>([])
  const [marcasSelecionadas, setMarcasSelecionadas] = useState<string[]>(initialMarcas)

  const [form, setForm] = useState({
    nome: cliente?.nome || '',
    cnpj: cliente?.cnpj || '',
    fantasia: cliente?.fantasia || '',
    cidade: cliente?.cidade || '',
    uf: cliente?.uf || '',
    telefone: cliente?.telefone || '',
    instagram: cliente?.instagram || '',
    tipo_cliente: cliente?.tipo_cliente || '',
    observacoes: cliente?.observacoes || '',
    status: cliente?.status || 'ativo',
  })

  useEffect(() => {
    supabase.from('marcas').select('id, nome').eq('status', 'ativo').order('nome')
      .then(({ data }) => setMarcas(data || []))
  }, [])

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  function toggleMarca(id: string) {
    setMarcasSelecionadas(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        cnpj: form.cnpj || null,
        fantasia: form.fantasia || null,
        cidade: form.cidade || null,
        uf: form.uf || null,
        telefone: form.telefone || null,
        instagram: form.instagram || null,
        tipo_cliente: form.tipo_cliente || null,
        observacoes: form.observacoes || null,
        marca_id: marcasSelecionadas[0] || null,
      }

      let clienteId = cliente?.id

      if (cliente) {
        const { error } = await supabase.from('clientes').update(payload).eq('id', cliente.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('clientes').insert(payload).select('id').single()
        if (error) throw error
        clienteId = data.id
      }

      if (clienteId) {
        await supabase.from('cliente_marcas').delete().eq('cliente_id', clienteId)
        if (marcasSelecionadas.length > 0) {
          const { error } = await supabase.from('cliente_marcas').insert(
            marcasSelecionadas.map(marca_id => ({ cliente_id: clienteId!, marca_id }))
          )
          if (error) throw error
        }
      }

      toast(cliente ? 'Cliente atualizado!' : 'Cliente criado!')
      router.push('/clientes')
      router.refresh()
    } catch (err: any) {
      toast(err.message || 'Erro ao salvar cliente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Dados do Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
            required
            className="md:col-span-2"
          />
          <Input
            label="Nome Fantasia"
            value={form.fantasia}
            onChange={(e) => set('fantasia', e.target.value)}
          />
          <Input
            label="CNPJ"
            value={form.cnpj}
            onChange={(e) => set('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
          />
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => set('telefone', e.target.value)}
            placeholder="(00) 00000-0000"
          />
          <Input
            label="Instagram"
            value={form.instagram}
            onChange={(e) => set('instagram', e.target.value)}
            placeholder="@usuario"
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Localização</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Cidade"
            value={form.cidade}
            onChange={(e) => set('cidade', e.target.value)}
          />
          <Select
            label="UF"
            value={form.uf}
            onChange={(e) => set('uf', e.target.value)}
            options={UF_SELECT}
            placeholder="Selecione"
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Comercial</h2>
        <div className="mb-4">
          <label className="text-sm font-medium text-slate-700 block mb-2">Marcas</label>
          <div className="flex flex-wrap gap-2">
            {marcas.map(m => (
              <label
                key={m.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors select-none ${
                  marcasSelecionadas.includes(m.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-300 hover:border-slate-400 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcasSelecionadas.includes(m.id)}
                  onChange={() => toggleMarca(m.id)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{m.nome}</span>
              </label>
            ))}
          </div>
          {marcasSelecionadas.length === 0 && (
            <p className="text-xs text-slate-400 mt-2">Nenhuma marca selecionada</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tipo de Cliente"
            value={form.tipo_cliente}
            onChange={(e) => set('tipo_cliente', e.target.value)}
            placeholder="ex.: lojista, multimarca..."
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            options={[{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }]}
          />
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700 block mb-1">Observações</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {cliente ? 'Salvar Alterações' : 'Criar Cliente'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
