'use client';

import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { UserRole, UserRoleLabels, UserRoleDescriptions, UserPermissions } from '@/types/profile';
import { useEffect, useState, Suspense } from 'react';
import UserTrips from '@/components/trips/UserTrips';
import PurchasedTrips from '@/components/trips/PurchasedTrips';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';

function DashboardContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [showError, setShowError] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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

              {/* Sicurezza Account - Disponibile per tutti */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-orange-900">
                      Sicurezza Account
                    </h3>
                    <p className="text-orange-700 mt-1">
                      Gestisci la sicurezza del tuo account
                    </p>
                  </div>
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-500"
                  >
                    Cambia password →
                  </button>
                </div>
              </div>

              {/* I tuoi viaggi - Solo per utenti che possono creare viaggi */}
              {UserPermissions.canCreateTrips(userRole) && (
                <div className="md:col-span-2 lg:col-span-3">
                  <UserTrips />
                </div>
              )}

              {/* Viaggi acquistati - Per tutti gli utenti */}
              <div className="md:col-span-2 lg:col-span-3">
                <PurchasedTrips />
              </div>
            </div>
          </div>
        </div>

        {/* Modal per Cambio Password */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 shadow-lg rounded-md bg-white">
              <ChangePasswordForm
                onSuccess={() => {
                  setTimeout(() => setShowChangePasswordModal(false), 2000);
                }}
                onCancel={() => setShowChangePasswordModal(false)}
              />
            </div>
          </div>
        )}
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
