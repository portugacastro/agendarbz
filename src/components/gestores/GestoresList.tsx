'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit2, UserCog } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { Gestor } from '@/types/database'

interface Props {
  gestores: Gestor[]
}

export function GestoresList({ gestores }: Props) {
  const [busca, setBusca] = useState('')

  const filtered = gestores.filter(g =>
    g.nome.toLowerCase().includes(busca.toLowerCase()) ||
    g.login.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <input
          type="text"
          placeholder="Buscar gestor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Login (e-mail)</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">Telefone</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Perfil</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">Nenhum gestor encontrado</td>
              </tr>
            ) : (
              filtered.map(g => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                        {g.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{g.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600">{g.login}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-600">{g.telefone || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={g.perfil === 'admin' ? 'info' : 'default'}>
                      {g.perfil === 'admin' ? 'Admin' : 'Gestor'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={g.status === 'ativo' ? 'success' : 'gray'}>
                      {g.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/gestores/${g.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
