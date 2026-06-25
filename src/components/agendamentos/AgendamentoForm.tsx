'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Search, UserPlus, X } from 'lucide-react'
import {
  TIPO_AGENDA_LABELS, STATUS_AGENDA_LABELS,
  RESULTADO_AGENDA_LABELS, CANAL_AGENDA_LABELS,
} from '@/lib/labels'
import { UF_OPTIONS } from '@/lib/labels'
import type { Agendamento, Gestor, Marca, Cliente } from '@/types/database'

interface Props {
  agendamento?: Agendamento & { clientes?: Cliente; marcas?: Marca; gestores?: Gestor }
  gestorAtual: Gestor
  isAdmin: boolean
}

const TIPO_OPTIONS = Object.entries(TIPO_AGENDA_LABELS).map(([value, label]) => ({ value, label }))
const STATUS_OPTIONS = Object.entries(STATUS_AGENDA_LABELS).map(([value, label]) => ({ value, label }))
const RESULTADO_OPTIONS = Object.entries(RESULTADO_AGENDA_LABELS).map(([value, label]) => ({ value, label }))
const CANAL_OPTIONS = Object.entries(CANAL_AGENDA_LABELS).map(([value, label]) => ({ value, label }))
const UF_SELECT = UF_OPTIONS.map(uf => ({ value: uf, label: uf }))

export function AgendamentoForm({ agendamento, gestorAtual, isAdmin }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
  const [todasMarcas, setTodasMarcas] = useState<Marca[]>([])
  const [marcasFiltradas, setMarcasFiltradas] = useState<Marca[]>([])
  const [gestores, setGestores] = useState<Gestor[]>([])
  const [buscaCliente, setBuscaCliente] = useState(agendamento?.clientes?.nome || '')
  const [clientesResultado, setClientesResultado] = useState<Cliente[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [clientesDaSelecao, setClientesDaSelecao] = useState<Cliente[]>([])

  // Modal de novo lead
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [savingLead, setSavingLead] = useState(false)
  const [lead, setLead] = useState({
    nome: '', fantasia: '', cnpj: '', telefone: '',
    instagram: '', cidade: '', uf: '', tipo_cliente: '',
  })

  const [form, setForm] = useState({
    data: agendamento?.data || '',
    horario: agendamento?.horario || '',
    marca_id: agendamento?.marca_id || '',
    gestor_id: agendamento?.gestor_id || gestorAtual.id,
    cliente_id: agendamento?.cliente_id || '',
    cidade: agendamento?.cidade || '',
    tipo: agendamento?.tipo || 'ligacao',
    canal: agendamento?.canal || '',
    objetivo: agendamento?.objetivo || '',
    assunto: agendamento?.assunto || '',
    status: agendamento?.status || 'agendada',
    resultado: agendamento?.resultado || '',
    observacoes: agendamento?.observacoes || '',
  })

  useEffect(() => {
    async function load() {
      const [{ data: m }, { data: g }] = await Promise.all([
        supabase.from('marcas').select('*').eq('status', 'ativo').order('nome'),
        isAdmin
          ? supabase.from('gestores').select('*').eq('status', 'ativo').order('nome')
          : { data: [gestorAtual] },
      ])
      setTodasMarcas(m || [])
      setMarcasFiltradas(m || [])
      setGestores(g || [])
    }
    load()
  }, [isAdmin])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowClienteDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Pré-carrega clientes da marca ou do gestor selecionado em ordem alfabética
  useEffect(() => {
    if (form.cliente_id) return // já tem cliente selecionado, não recarrega

    async function preCarregarClientes() {
      if (form.marca_id) {
        const { data: cm } = await supabase
          .from('cliente_marcas')
          .select('cliente_id')
          .eq('marca_id', form.marca_id)
        const ids = (cm || []).map(r => r.cliente_id)
        if (ids.length === 0) { setClientesDaSelecao([]); return }

        const { data } = await supabase
          .from('clientes')
          .select('id, nome, fantasia, cidade, uf')
          .eq('status', 'ativo')
          .in('id', ids)
          .order('nome')
        setClientesDaSelecao((data as Cliente[]) || [])
        return
      }

      if (form.gestor_id) {
        const marcasDoGestor = todasMarcas
          .filter(m => m.gestor_id === form.gestor_id)
          .map(m => m.id)
        if (marcasDoGestor.length === 0) { setClientesDaSelecao([]); return }

        const { data: cm } = await supabase
          .from('cliente_marcas')
          .select('cliente_id')
          .in('marca_id', marcasDoGestor)
        const ids = [...new Set((cm || []).map(r => r.cliente_id))]
        if (ids.length === 0) { setClientesDaSelecao([]); return }

        const { data } = await supabase
          .from('clientes')
          .select('id, nome, fantasia, cidade, uf')
          .eq('status', 'ativo')
          .in('id', ids)
          .order('nome')
        setClientesDaSelecao((data as Cliente[]) || [])
        return
      }

      setClientesDaSelecao([])
    }

    preCarregarClientes()
  }, [form.marca_id, form.gestor_id, todasMarcas])

  function filtrarLocalmente(q: string) {
    const qLow = q.toLowerCase()
    const result = q
      ? clientesDaSelecao.filter(c =>
          c.nome.toLowerCase().includes(qLow) ||
          (c.fantasia || '').toLowerCase().includes(qLow)
        )
      : clientesDaSelecao
    setClientesResultado(result.slice(0, 60))
  }

  async function buscarClientes(q: string) {
    if (clientesDaSelecao.length > 0) {
      filtrarLocalmente(q)
      return
    }
    if (q.length < 2) { setClientesResultado([]); return }
    const { data } = await supabase
      .from('clientes')
      .select('id, nome, fantasia, cidade, uf')
      .eq('status', 'ativo')
      .or(`nome.ilike.%${q}%,fantasia.ilike.%${q}%`)
      .order('nome')
      .limit(20)
    setClientesResultado((data as Cliente[]) || [])
  }

  async function selectCliente(c: Cliente) {
    // Busca as marcas vinculadas ao cliente
    const { data: cm } = await supabase
      .from('cliente_marcas')
      .select('marca_id')
      .eq('cliente_id', c.id)

    const marcaIds = cm?.map(r => r.marca_id) || []
    const marcasDoCliente = marcaIds.length > 0
      ? todasMarcas.filter(m => marcaIds.includes(m.id))
      : todasMarcas

    setMarcasFiltradas(marcasDoCliente)

    // Se a marca atual não pertence ao cliente, limpa
    const marcaAtualValida = marcaIds.length === 0 || marcaIds.includes(form.marca_id)
    setForm(f => ({
      ...f,
      cliente_id: c.id,
      cidade: c.cidade || f.cidade,
      marca_id: marcaAtualValida ? f.marca_id : (marcasDoCliente.length === 1 ? marcasDoCliente[0].id : ''),
    }))

    setBuscaCliente(c.nome)
    setClientesResultado([])
    setShowClienteDropdown(false)
  }

  function clearCliente() {
    setForm(f => ({ ...f, cliente_id: '', marca_id: '' }))
    setBuscaCliente('')
    setClientesResultado([])
    setClientesDaSelecao([])
    setMarcasFiltradas(todasMarcas)
  }

  function handleMarcaChange(marcaId: string) {
    setForm(f => ({ ...f, marca_id: marcaId, cliente_id: '' }))
    setBuscaCliente('')
    setClientesResultado([])
    setClientesDaSelecao([])
  }

  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault()
    if (!lead.nome.trim()) { toast('Informe o nome do lead.', 'error'); return }
    setSavingLead(true)
    try {
      const marcaId = form.marca_id || null
      const { data: novoCliente, error } = await supabase
        .from('clientes')
        .insert({
          nome: lead.nome.trim(),
          fantasia: lead.fantasia || null,
          cnpj: lead.cnpj || null,
          telefone: lead.telefone || null,
          instagram: lead.instagram || null,
          cidade: lead.cidade || null,
          uf: lead.uf || null,
          tipo_cliente: lead.tipo_cliente || null,
          marca_id: marcaId,
          status: 'ativo',
        })
        .select('id, nome, cidade, uf')
        .single()

      if (error) throw error

      // Vincula à marca na tabela cliente_marcas
      if (marcaId && novoCliente) {
        await supabase.from('cliente_marcas').insert({
          cliente_id: novoCliente.id,
          marca_id: marcaId,
        })
      }

      toast('Lead cadastrado!')
      selectCliente(novoCliente as any)
      setShowLeadModal(false)
      setLead({ nome: '', fantasia: '', cnpj: '', telefone: '', instagram: '', cidade: '', uf: '', tipo_cliente: '' })
    } catch (err: any) {
      toast(err.message || 'Erro ao cadastrar lead.', 'error')
    } finally {
      setSavingLead(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cliente_id) { toast('Selecione um cliente.', 'error'); return }
    if (!form.marca_id) { toast('Selecione uma marca.', 'error'); return }
    if (!form.data) { toast('Informe a data.', 'error'); return }

    setLoading(true)
    try {
      const payload = {
        ...form,
        horario: form.horario || null,
        canal: form.canal || null,
        objetivo: form.objetivo || null,
        assunto: form.assunto || null,
        resultado: form.resultado || null,
        observacoes: form.observacoes || null,
        cidade: form.cidade || null,
        created_by: gestorAtual.id,
      }

      if (agendamento) {
        const { error } = await supabase.from('agendamentos').update(payload).eq('id', agendamento.id)
        if (error) throw error
        toast('Agendamento atualizado!')
      } else {
        const { error } = await supabase.from('agendamentos').insert(payload)
        if (error) throw error
        toast('Agendamento criado!')
      }

      router.push('/agendamentos')
      router.refresh()
    } catch (err: any) {
      toast(err.message || 'Erro ao salvar agendamento.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))
  const setLeadField = (field: string, value: string) => setLead(f => ({ ...f, [field]: value }))

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Identificação */}
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4">Identificação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Busca de cliente */}
            <div className="md:col-span-2" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Cliente *</label>
                <button
                  type="button"
                  onClick={() => setShowLeadModal(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Cadastrar novo lead
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={buscaCliente}
                  onChange={(e) => {
                    setBuscaCliente(e.target.value)
                    setShowClienteDropdown(true)
                    if (form.cliente_id) clearCliente()
                    buscarClientes(e.target.value)
                  }}
                  onFocus={() => {
                    setShowClienteDropdown(true)
                    if (!form.cliente_id) {
                      if (clientesDaSelecao.length > 0) filtrarLocalmente(buscaCliente)
                      else if (buscaCliente.length >= 2) buscarClientes(buscaCliente)
                    }
                  }}
                  placeholder={
                    form.marca_id
                      ? `Buscar cliente da marca ${todasMarcas.find(m => m.id === form.marca_id)?.nome || ''}...`
                      : form.gestor_id && clientesDaSelecao.length > 0
                        ? `Buscar entre ${clientesDaSelecao.length} clientes do gestor...`
                        : 'Selecione a marca ou busque qualquer cliente...'
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />

                {/* Dropdown de resultados */}
                {showClienteDropdown && !form.cliente_id && clientesResultado.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {clientesResultado.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); selectCliente(c) }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors group"
                        >
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">{c.nome}</p>
                          {(c.fantasia || c.cidade) && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {[c.fantasia, c.cidade && c.uf ? `${c.cidade}/${c.uf}` : c.cidade].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nenhum resultado */}
                {showClienteDropdown && buscaCliente.length >= 2 && clientesResultado.length === 0 && !form.cliente_id && clientesDaSelecao.length === 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl px-4 py-3">
                    <p className="text-sm text-slate-500">
                      Nenhum cliente encontrado.{' '}
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setShowLeadModal(true); setShowClienteDropdown(false) }}
                        className="text-blue-600 font-medium hover:underline"
                      >
                        Cadastrar como lead?
                      </button>
                    </p>
                  </div>
                )}
              </div>

              {form.cliente_id && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-green-500 text-white text-center leading-3.5 text-[9px]">✓</span>
                  Cliente selecionado
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Marca *</label>
              <select
                value={form.marca_id}
                onChange={(e) => handleMarcaChange(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Selecione a marca</option>
                {marcasFiltradas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>

            {isAdmin ? (
              <Select
                label="Gestor *"
                value={form.gestor_id}
                onChange={(e) => set('gestor_id', e.target.value)}
                options={gestores.map(g => ({ value: g.id, label: g.nome }))}
                placeholder="Selecione o gestor"
                required
              />
            ) : (
              <Input label="Gestor" value={gestorAtual.nome} disabled />
            )}
          </div>
        </Card>

        {/* Data e Tipo */}
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4">Data e Tipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Data *" type="date" value={form.data} onChange={(e) => set('data', e.target.value)} required />
            <Input label="Horário" type="time" value={form.horario} onChange={(e) => set('horario', e.target.value)} />
            <Input label="Cidade" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} placeholder="Cidade do encontro" />
            <Select label="Tipo *" value={form.tipo} onChange={(e) => set('tipo', e.target.value)} options={TIPO_OPTIONS} required />
            <Select label="Canal" value={form.canal} onChange={(e) => set('canal', e.target.value)} options={CANAL_OPTIONS} placeholder="Selecione o canal" />
            <Input label="Objetivo" value={form.objetivo} onChange={(e) => set('objetivo', e.target.value)} placeholder="Objetivo do contato" />
            <div className="lg:col-span-3">
              <label className="text-sm font-medium text-slate-700 block mb-1">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                rows={3}
                placeholder="Observações sobre o agendamento..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Status e Resultado — só na edição */}
        {agendamento && (
          <Card>
            <h2 className="font-semibold text-slate-900 mb-4">Status e Resultado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Status *" value={form.status} onChange={(e) => set('status', e.target.value)} options={STATUS_OPTIONS} required />
              <Select label="Resultado" value={form.resultado} onChange={(e) => set('resultado', e.target.value)} options={RESULTADO_OPTIONS} placeholder="Selecione o resultado" />
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            {agendamento ? 'Salvar Alterações' : 'Criar Agendamento'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>

      {/* Modal cadastro rápido de lead */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLeadModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Cadastrar Lead</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {form.marca_id
                    ? `Será vinculado à marca: ${todasMarcas.find(m => m.id === form.marca_id)?.nome}`
                    : 'Preencha os dados do novo cliente'}
                </p>
              </div>
              <button
                onClick={() => setShowLeadModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome *"
                  value={lead.nome}
                  onChange={(e) => setLeadField('nome', e.target.value)}
                  required
                  className="md:col-span-2"
                />
                <Input
                  label="Nome Fantasia"
                  value={lead.fantasia}
                  onChange={(e) => setLeadField('fantasia', e.target.value)}
                />
                <Input
                  label="CNPJ"
                  value={lead.cnpj}
                  onChange={(e) => setLeadField('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
                <Input
                  label="Telefone"
                  value={lead.telefone}
                  onChange={(e) => setLeadField('telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
                <Input
                  label="Instagram"
                  value={lead.instagram}
                  onChange={(e) => setLeadField('instagram', e.target.value)}
                  placeholder="@usuario"
                />
                <Input
                  label="Cidade"
                  value={lead.cidade}
                  onChange={(e) => setLeadField('cidade', e.target.value)}
                />
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">UF</label>
                  <select
                    value={lead.uf}
                    onChange={(e) => setLeadField('uf', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Selecione</option>
                    {UF_SELECT.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
                <Input
                  label="Tipo de Cliente"
                  value={lead.tipo_cliente}
                  onChange={(e) => setLeadField('tipo_cliente', e.target.value)}
                  placeholder="ex.: lojista, multimarca..."
                  className="md:col-span-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={savingLead}>
                  Salvar e Selecionar
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowLeadModal(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
