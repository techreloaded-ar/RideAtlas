'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileSettings from '@/components/profile/ProfileSettings';
import { Loader2 } from 'lucide-react';

function ProfileContent() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Il Mio Profilo</h1>
          <p className="text-gray-600">
            Gestisci le informazioni del tuo account e le preferenze personali
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Profile Header - Avatar and Basic Info */}
          <ProfileHeader />

          {/* Profile Settings - Collapsible Sections */}
          <ProfileSettings />
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Hai bisogno di aiuto? {' '}
            <a href="mailto:support@rideatlas.com" className="text-primary-600 hover:text-primary-700">
              Contatta il supporto
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}