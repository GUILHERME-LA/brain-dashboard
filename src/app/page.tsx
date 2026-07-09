'use client'

import { useEffect, useState } from 'react'
import { supabase, Memory } from '@/lib/supabase'
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
  Activity
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  error: { icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-400', label: 'Erro' },
  solution: { icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400', label: 'Solução' },
  decision: { icon: <Lightbulb className="w-5 h-5" />, color: 'text-yellow-400', label: 'Decisão' },
  insight: { icon: <Brain className="w-5 h-5" />, color: 'text-purple-400', label: 'Insight' },
  context: { icon: <Settings className="w-5 h-5" />, color: 'text-blue-400', label: 'Contexto' },
  interaction: { icon: <Activity className="w-5 h-5" />, color: 'text-cyan-400', label: 'Interação' },
  test: { icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-400', label: 'Teste' },
  web_memory: { icon: <Brain className="w-5 h-5" />, color: 'text-indigo-400', label: 'Web Memory' },
}

const COLORS = ['#ef4444', '#22c55e', '#eab308', '#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#6366f1']

export default function Dashboard() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    solutions: 0,
    avgSuccessRate: 0,
    totalUsage: 0,
  })

  useEffect(() => {
    fetchMemories()
  }, [])

  async function fetchMemories() {
    const { data, error } = await supabase
      .from('memory')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setMemories(data)
      calculateStats(data)
    }
    setLoading(false)
  }

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
  ).map(([name, value]) => ({ name, value }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Brain className="w-8 h-8 animate-pulse" />
          <span className="text-xl">Carregando Brain...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Brain Dashboard</h1>
              <p className="text-gray-400">Visualize memórias, erros e soluções</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total de Memórias"
            value={stats.total}
            icon={<Brain className="w-6 h-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatCard
            title="Erros Registrados"
            value={stats.errors}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="from-red-500 to-red-600"
          />
          <StatCard
            title="Soluções Validadas"
            value={stats.solutions}
            icon={<CheckCircle className="w-6 h-6" />}
            color="from-green-500 to-green-600"
          />
          <StatCard
            title="Taxa de Sucesso"
            value={`${stats.avgSuccessRate.toFixed(1)}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Total de Usos"
            value={stats.totalUsage}
            icon={<Activity className="w-6 h-6" />}
            color="from-cyan-500 to-cyan-600"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Distribuição por Tipo</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Uso por Tipo</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar memórias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">
            Memórias ({filteredMemories.length})
          </h2>
          <div className="space-y-3">
            {filteredMemories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: {
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 bg-gradient-to-br ${color} rounded-lg`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400">{title}</p>
    </div>
  )
}

function MemoryCard({ memory }: { memory: Memory }) {
  const config = typeConfig[memory.type] || { icon: <Brain className="w-5 h-5" />, color: 'text-gray-400', label: memory.type }
  
  return (
    <div className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-colors border border-gray-600/50">
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${config.color}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${config.color}`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(memory.created_at).toLocaleString('pt-BR')}
            </span>
          </div>
          <p className="text-gray-200 text-sm line-clamp-3">{memory.content}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>Importância: {memory.importance}/5</span>
            <span>Usos: {memory.usage_count}</span>
            <span>Sucesso: {(memory.success_rate * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
