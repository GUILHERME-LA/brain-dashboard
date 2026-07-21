'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase, Memory } from '@/lib/supabase'
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  Settings,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Activity,
  RefreshCw,
  Zap,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import Markdown from 'react-markdown'

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  error: { icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30', label: 'Erro' },
  solution: { icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/30', label: 'Solução' },
  decision: { icon: <Lightbulb className="w-5 h-5" />, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30', label: 'Decisão' },
  insight: { icon: <Brain className="w-5 h-5" />, color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/30', label: 'Insight' },
  context: { icon: <Settings className="w-5 h-5" />, color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30', label: 'Contexto' },
  interaction: { icon: <Activity className="w-5 h-5" />, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20 border-cyan-500/30', label: 'Interação' },
  test: { icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30', label: 'Teste' },
  web_memory: { icon: <Brain className="w-5 h-5" />, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20 border-indigo-500/30', label: 'Web' },
}

const TYPE_COLORS: Record<string, string> = {
  decision: '#eab308',
  error: '#ef4444',
  context: '#3b82f6',
  interaction: '#06b6d4',
  test: '#10b981',
  web_memory: '#6366f1',
  test_learning: '#8b5cf6',
}

function timeAgo(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  
  if (seconds < 60) return 'agora'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return then.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function Dashboard() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    solutions: 0,
    avgSuccessRate: 0,
    totalUsage: 0,
  })
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const fetchMemories = useCallback(async () => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('memory')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setMemories(data)
      calculateStats(data)
      setLastUpdate(new Date())
    }
    setLoading(false)
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchMemories()
    setNewCount(0)
    setTimeout(() => setIsRefreshing(false), 500)
  }, [fetchMemories])

  useEffect(() => {
    fetchMemories()

    const supabase = getSupabase()
    const channel = supabase
      .channel('memory-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memory' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNewCount(prev => prev + 1)
          }
          fetchMemories()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMemories])

  function calculateStats(data: Memory[]) {
    const errors = data.filter(m => m.type === 'error').length
    const solutions = data.filter(m => m.type === 'solution').length
    const avgSuccessRate = data.reduce((acc, m) => acc + (m.success_rate || 0), 0) / data.length
    const totalUsage = data.reduce((acc, m) => acc + (m.usage_count || 0), 0)

    setStats({
      total: data.length,
      errors,
      solutions,
      avgSuccessRate: avgSuccessRate * 100,
      totalUsage,
    })
  }

  const filteredMemories = memories.filter(m => {
    const matchesFilter = filter === 'all' || m.type === filter
    const matchesSearch = search === '' || 
      m.content.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const typeDistribution = Object.entries(
    memories.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ 
      name: typeConfig[name]?.label || name,
      rawName: name,
      value,
      percent: ((value / memories.length) * 100).toFixed(0)
    }))
    .sort((a, b) => b.value - a.value)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Brain className="w-8 h-8 animate-pulse text-purple-400" />
          <span className="text-xl">Carregando Brain...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg shadow-purple-500/20">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Brain</h1>
              <p className="text-gray-400">Memórias, erros e soluções</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {newCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-full animate-pulse">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">+{newCount}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 border border-gray-700 rounded-lg text-white transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{lastUpdate.toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* KPI Cards — Hierarquia */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card Principal — Taxa de Sucesso */}
          <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-gray-800/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${stats.avgSuccessRate >= 90 ? 'bg-green-500/20' : stats.avgSuccessRate >= 70 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                  <TrendingUp className={`w-6 h-6 ${stats.avgSuccessRate >= 90 ? 'text-green-400' : stats.avgSuccessRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Taxa de Sucesso</p>
                  <p className="text-4xl font-bold text-white">{stats.avgSuccessRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Média de</p>
                <p className="text-sm text-gray-400">{stats.total} memórias</p>
              </div>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${stats.avgSuccessRate >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : stats.avgSuccessRate >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`}
                style={{ width: `${stats.avgSuccessRate}%` }}
              />
            </div>
          </div>

          {/* Erros */}
          <div className={`bg-gradient-to-br from-gray-800/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border ${stats.errors > 0 ? 'border-red-500/30' : 'border-gray-700/50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-sm text-gray-400">Erros</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.errors}</p>
            {stats.errors > 0 && (
              <p className="text-xs text-red-400 mt-1">Requer atenção</p>
            )}
          </div>

          {/* Soluções */}
          <div className={`bg-gradient-to-br from-gray-800/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border ${stats.solutions > 0 ? 'border-green-500/30' : 'border-gray-700/50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${stats.solutions > 0 ? 'bg-green-500/20' : 'bg-gray-700/50'}`}>
                <CheckCircle className={`w-5 h-5 ${stats.solutions > 0 ? 'text-green-400' : 'text-gray-500'}`} />
              </div>
              <p className="text-sm text-gray-400">Soluções</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.solutions}</p>
            {stats.solutions === 0 && (
              <p className="text-xs text-gray-500 mt-1">Nenhuma validada</p>
            )}
          </div>

          {/* Total e Usos — Menores */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <p className="text-xs text-gray-400">Usos</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalUsage}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Barras Horizontais — Distribuição */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <h2 className="text-lg font-semibold text-white mb-6">Distribuição por Tipo</h2>
            <div className="space-y-4">
              {typeDistribution.map((item) => (
                <div key={item.rawName} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[item.rawName] || '#6b7280' }}
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{item.value}</span>
                      <span className="text-xs text-gray-500">({item.percent}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700/30 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${(item.value / typeDistribution[0].value) * 100}%`,
                        backgroundColor: TYPE_COLORS[item.rawName] || '#6b7280'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Barras Verticais */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <h2 className="text-lg font-semibold text-white mb-6">Contagem por Tipo</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeDistribution} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280" 
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {typeDistribution.map((entry) => (
                    <Cell 
                      key={`cell-${entry.rawName}`} 
                      fill={TYPE_COLORS[entry.rawName] || '#6b7280'}
                      fillOpacity={0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-gray-700/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar memórias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all cursor-pointer"
              >
                <option value="all">Todos os tipos</option>
                <option value="error">Erros</option>
                <option value="solution">Soluções</option>
                <option value="decision">Decisões</option>
                <option value="insight">Insights</option>
                <option value="context">Contexto</option>
                <option value="interaction">Interações</option>
                <option value="test">Testes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Memory List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              Memórias
            </h2>
            <span className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
              {filteredMemories.length}
            </span>
          </div>
          <div className="space-y-3">
            {filteredMemories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                isExpanded={expandedIds.has(memory.id)}
                onToggle={() => toggleExpand(memory.id)}
              />
            ))}
            {filteredMemories.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma memória encontrada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MemoryCard({ memory, isExpanded, onToggle }: { memory: Memory; isExpanded: boolean; onToggle: () => void }) {
  const config = typeConfig[memory.type] || { icon: <Brain className="w-5 h-5" />, color: 'text-gray-400', bgColor: 'bg-gray-500/20 border-gray-500/30', label: memory.type }
  const hasMetadata = memory.metadata && Object.keys(memory.metadata).length > 0

  return (
    <div className={`group rounded-xl p-4 transition-all duration-200 border ${isExpanded ? 'bg-gray-700/50 border-gray-600/50' : 'bg-gray-700/30 hover:bg-gray-700/50 border-transparent hover:border-gray-600/50'}`}>
      <div className="flex items-start gap-4">
        <div className={`mt-1 p-2 rounded-lg ${config.bgColor} border`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-sm font-medium px-2 py-0.5 rounded-md ${config.bgColor} ${config.color} border`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">
              {timeAgo(memory.created_at)}
            </span>
          </div>
          <div className={`text-gray-200 text-sm leading-relaxed transition-all duration-300 memory-content ${isExpanded ? 'memory-expanded' : 'memory-collapsed'}`}>
            <Markdown>{memory.content}</Markdown>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-3 border-t border-gray-600/30 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block mb-0.5">Criado em</span>
                  <span className="text-gray-300">
                    {new Date(memory.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Importância</span>
                  <span className="text-gray-300">{memory.importance}/5</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Usos</span>
                  <span className="text-gray-300">{memory.usage_count}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Taxa de Sucesso</span>
                  <span className="text-gray-300">{(memory.success_rate * 100).toFixed(0)}%</span>
                </div>
              </div>
              {hasMetadata && (
                <div>
                  <span className="text-gray-500 text-xs block mb-1">Metadata</span>
                  <pre className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                    {JSON.stringify(memory.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < memory.importance ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                />
              ))}
            </div>
            {memory.usage_count > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {memory.usage_count}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-600/50 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${memory.success_rate >= 0.9 ? 'bg-green-400' : memory.success_rate >= 0.7 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${memory.success_rate * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{(memory.success_rate * 100).toFixed(0)}%</span>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-400 transition-colors px-3 py-1.5 mt-2 rounded-lg hover:bg-gray-600/30 w-fit"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Recolher</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Expandir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
