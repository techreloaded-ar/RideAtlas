'use client';

import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { UserRole, UserRoleLabels, UserRoleDescriptions, UserPermissions } from '@/types/profile';
import { useEffect, useState, Suspense } from 'react';
import UserTrips from '@/components/UserTrips';

function DashboardContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'insufficient-permissions') {
      setShowError(true);
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  const userRole = session.user.role as UserRole;

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.Explorer:
        return 'bg-green-100 text-green-800';
      case UserRole.Ranger:
        return 'bg-blue-100 text-blue-800';
      case UserRole.Sentinel:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Errore permessi insufficienti */}
        {showError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Permessi insufficienti
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  Non hai i permessi necessari per accedere a quella sezione.
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setShowError(false)}
                    className="text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4 mb-6">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Benvenuto, {session.user?.name || session.user?.email}!
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
                    {UserRoleLabels[userRole]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {UserRoleDescriptions[userRole]}
                </p>
              </div>
            </div>

            {/* Informazioni sui permessi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className={`p-4 rounded-lg border ${UserPermissions.canCreateTrips(userRole) ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center">
                  <svg className={`w-6 h-6 mr-2 ${UserPermissions.canCreateTrips(userRole) ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className={`text-sm font-medium ${UserPermissions.canCreateTrips(userRole) ? 'text-green-800' : 'text-gray-600'}`}>
                    Creazione Viaggi
                  </span>
                </div>
                <p className={`text-xs mt-1 ${UserPermissions.canCreateTrips(userRole) ? 'text-green-600' : 'text-gray-500'}`}>
                  {UserPermissions.canCreateTrips(userRole) ? 'Abilitato' : 'Non disponibile'}
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${UserPermissions.canManageUsers(userRole) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center">
                  <svg className={`w-6 h-6 mr-2 ${UserPermissions.canManageUsers(userRole) ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span className={`text-sm font-medium ${UserPermissions.canManageUsers(userRole) ? 'text-blue-800' : 'text-gray-600'}`}>
                    Gestione Utenti
                  </span>
                </div>
                <p className={`text-xs mt-1 ${UserPermissions.canManageUsers(userRole) ? 'text-blue-600' : 'text-gray-500'}`}>
                  {UserPermissions.canManageUsers(userRole) ? 'Abilitato' : 'Non disponibile'}
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${UserPermissions.canAccessAdminPanel(userRole) ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center">
                  <svg className={`w-6 h-6 mr-2 ${UserPermissions.canAccessAdminPanel(userRole) ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className={`text-sm font-medium ${UserPermissions.canAccessAdminPanel(userRole) ? 'text-purple-800' : 'text-gray-600'}`}>
                    Pannello Admin
                  </span>
                </div>
                <p className={`text-xs mt-1 ${UserPermissions.canAccessAdminPanel(userRole) ? 'text-purple-600' : 'text-gray-500'}`}>
                  {UserPermissions.canAccessAdminPanel(userRole) ? 'Abilitato' : 'Non disponibile'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Esplora Viaggi - Disponibile per tutti */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-green-900">
                      Esplora Viaggi
                    </h3>
                    <p className="text-green-700 mt-1">
                      Scopri i viaggi disponibili
                    </p>
                  </div>
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
                  </svg>
                </div>
                <div className="mt-4">
                  <Link
                    href="/trips"
                    className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-500"
                  >
                    Vedi tutti i viaggi →
                  </Link>
                </div>
              </div>

              {/* Crea Viaggio - Solo Ranger e Sentinel */}
              {UserPermissions.canCreateTrips(userRole) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-blue-900">
                        Crea Viaggio
                      </h3>
                      <p className="text-blue-700 mt-1">
                        Organizza un nuovo viaggio
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/create-trip"
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Inizia a creare →
                    </Link>
                  </div>
                </div>
              )}

              {/* Gestione Utenti - Solo Sentinel */}
              {UserPermissions.canAccessAdminPanel(userRole) && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-purple-900">
                        Amministrazione
                      </h3>
                      <p className="text-purple-700 mt-1">
                        Gestisci utenti e sistema
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/admin"
                      className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-500"
                    >
                      Vai al pannello →
                    </Link>
                  </div>
                </div>
              )}

              {/* I tuoi viaggi - Solo per utenti che possono creare viaggi */}
              {UserPermissions.canCreateTrips(userRole) && (
                <div className="md:col-span-2 lg:col-span-3">
                  <UserTrips />
                </div>
              )}

              {/* Placeholder per Explorer */}
              {!UserPermissions.canCreateTrips(userRole) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        I Tuoi Viaggi
                      </h3>
                      <p className="text-gray-600">
                        Traccia i tuoi viaggi e le tue avventure
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Solo gli utenti Ranger e Sentinel possono creare viaggi
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Sistema di Ruoli Attivo!
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    Il sistema di gestione ruoli è ora attivo. I tuoi permessi sono visualizzati sopra e determinano le funzioni disponibili.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
