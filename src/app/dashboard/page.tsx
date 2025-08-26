'use client';

import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import Image from 'next/image';
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

            {/* Main Content Sections */}
            <div className="space-y-6">

              {/* I tuoi viaggi - Solo per utenti che possono creare viaggi */}
              {UserPermissions.canCreateTrips(userRole) && (
                <UserTrips />
              )}

              {/* Viaggi acquistati - Per tutti gli utenti */}
              <PurchasedTrips />
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
