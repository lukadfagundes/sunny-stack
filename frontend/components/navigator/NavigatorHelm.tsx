'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import StilltideDashboard from './StilltideDashboard'

interface Equipment {
  id: string
  name: string
  type: string
  status: string
  location?: string
  metrics: Record<string, any>
}

interface NavigatorHelmProps {
  isActive: boolean
}

export default function NavigatorHelm({ isActive }: NavigatorHelmProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [activeView, setActiveView] = useState<'overview' | 'stilltide' | 'tempest' | 'firebird'>('overview')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isActive) {
      fetchEquipment()
    }
  }, [isActive])

  const fetchEquipment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/navigator-helm/equipment', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEquipment(data)
      }
    } catch (error) {
      console.error('Failed to fetch equipment:', error)
    } finally {
      setLoading(false)
    }
  }

  const evaluateEquipment = async (equipmentId: string) => {
    try {
      const response = await fetch('/api/navigator-helm/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          equipment_id: equipmentId,
          evaluation_type: 'comprehensive',
          parameters: {}
        })
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Evaluation results:', data)
        // Handle evaluation results
      }
    } catch (error) {
      console.error('Failed to evaluate equipment:', error)
    }
  }

  if (!isActive) return null

  return (
    <div className="h-full flex flex-col">
      {/* Navigator's Helm Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚓</span>
            <div>
              <h2 className="text-xl font-bold">Navigator's Helm</h2>
              <p className="text-sm opacity-90">Industrial Equipment Intelligence Platform</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-3 py-1 rounded transition-colors ${
                activeView === 'overview' ? 'bg-white text-blue-600' : 'bg-blue-500 hover:bg-blue-400'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('stilltide')}
              className={`px-3 py-1 rounded transition-colors ${
                activeView === 'stilltide' ? 'bg-white text-blue-600' : 'bg-blue-500 hover:bg-blue-400'
              }`}
            >
              Stilltide
            </button>
            <button
              onClick={() => setActiveView('tempest')}
              className={`px-3 py-1 rounded transition-colors ${
                activeView === 'tempest' ? 'bg-white text-blue-600' : 'bg-blue-500 hover:bg-blue-400'
              }`}
            >
              Tempest
            </button>
            <button
              onClick={() => setActiveView('firebird')}
              className={`px-3 py-1 rounded transition-colors ${
                activeView === 'firebird' ? 'bg-white text-blue-600' : 'bg-blue-500 hover:bg-blue-400'
              }`}
            >
              Firebird
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50 p-4 overflow-auto">
        {activeView === 'overview' && (
          <div className="space-y-4">
            {/* Equipment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading equipment data...</p>
                </div>
              ) : equipment.length > 0 ? (
                equipment.map((eq) => (
                  <motion.div
                    key={eq.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-lg shadow-md p-4 cursor-pointer"
                    onClick={() => setSelectedEquipment(eq)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800">{eq.name}</h3>
                        <p className="text-sm text-gray-600">{eq.type}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        eq.status === 'operational' ? 'bg-green-100 text-green-800' :
                        eq.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        eq.status === 'critical' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {eq.status}
                      </span>
                    </div>
                    {eq.location && (
                      <p className="text-sm text-gray-500 mb-2">📍 {eq.location}</p>
                    )}
                    <div className="space-y-1">
                      {Object.entries(eq.metrics).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        evaluateEquipment(eq.id)
                      }}
                      className="mt-3 w-full px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      🔍 Evaluate
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">No equipment data available</p>
                  <button
                    onClick={fetchEquipment}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>

            {/* Selected Equipment Details */}
            {selectedEquipment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedEquipment.name}</h2>
                    <p className="text-gray-600">{selectedEquipment.type} - {selectedEquipment.location}</p>
                  </div>
                  <button
                    onClick={() => setSelectedEquipment(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedEquipment.metrics).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded p-3">
                      <p className="text-sm text-gray-600 mb-1">{key}</p>
                      <p className="text-lg font-bold text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeView === 'stilltide' && <StilltideDashboard />}

        {activeView === 'tempest' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🌊 Tempest Predictions</h3>
            <p className="text-gray-600">Predictive analytics and forecasting system coming soon...</p>
          </div>
        )}

        {activeView === 'firebird' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔥 Firebird Critical Systems</h3>
            <p className="text-gray-600">Critical systems monitoring and alerts coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}