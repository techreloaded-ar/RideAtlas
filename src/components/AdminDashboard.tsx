'use client'

import { useState } from 'react'
import { Users, Navigation, Settings, CreditCard } from 'lucide-react'
import UserManagement from '@/components/UserManagement'
import TripManagement from '@/components/TripManagement'
import PurchaseManagement from '@/components/PurchaseManagement'

type AdminTab = 'users' | 'trips' | 'purchases' | 'settings'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users')

  const tabs = [
    {
      id: 'users' as AdminTab,
      name: 'Gestione Utenti',
      icon: Users,
      description: 'Gestisci ruoli e permessi degli utenti'
    },
    {
      id: 'trips' as AdminTab,
      name: 'Gestione Viaggi',
      icon: Navigation,
      description: 'Approva e gestisci i viaggi del sistema'
    },
    {
      id: 'purchases' as AdminTab,
      name: 'Gestione Acquisti',
      icon: CreditCard,
      description: 'Gestisci acquisti, rimborsi e regali'
    },
    {
      id: 'settings' as AdminTab,
      name: 'Impostazioni',
      icon: Settings,
      description: 'Configurazioni del sistema'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />
      case 'trips':
        return <TripManagement />
      case 'purchases':
        return <PurchaseManagement />
      case 'settings':
        return (
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Impostazioni
                </h3>
                <p className="text-gray-500">
                  Le impostazioni del sistema saranno disponibili presto.
                </p>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Pannello di Amministrazione</h1>
            <p className="mt-2 text-gray-600">
              Gestisci utenti, viaggi e impostazioni del sistema RideAtlas
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab descriptions */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab content */}
      <div className="relative">
        {renderTabContent()}
      </div>
    </div>
  )
}
