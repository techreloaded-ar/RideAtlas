'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Camera, User } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import AvatarUploadModal from './AvatarUploadModal';
import { UserRole, UserRoleLabels, UserRoleDescriptions } from '@/types/profile';

interface ProfileStats {
  tripsCreated: number;
  totalKilometers: number;
  memberSince: string;
}

export default function ProfileHeader() {
  const { data: session, update } = useSession();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Carica le statistiche del profilo
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/profile/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Errore nel caricamento delle statistiche:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!session?.user) return null;

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

  const handleAvatarSuccess = (newAvatarUrl: string) => {
    // Aggiorna la sessione con il nuovo avatar
    update({
      ...session,
      user: {
        ...session.user,
        image: newAvatarUrl
      }
    });
    setShowAvatarModal(false);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-6">
          {/* Avatar Section */}
          <div className="relative">
            <div className="relative group">
              <UserAvatar user={session.user} size="lg" className="w-20 h-20" />
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>
            <button
              onClick={() => setShowAvatarModal(true)}
              className="absolute -bottom-2 -right-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
              title="Cambia avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {session.user.name || 'Utente'}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(userRole)}`}>
                <User className="w-3 h-3 mr-1" />
                {UserRoleLabels[userRole]}
              </span>
            </div>
            
            <p className="text-gray-600 mb-1">
              {session.user.email}
            </p>
            
            <p className="text-sm text-gray-500">
              {UserRoleDescriptions[userRole]}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : stats?.tripsCreated || 0}
              </p>
              <p className="text-sm text-gray-500">Viaggi creati</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : `${stats?.totalKilometers || 0}`}
              </p>
              <p className="text-sm text-gray-500">Km percorsi</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {loading ? '...' : stats?.memberSince ? formatMemberSince(stats.memberSince) : '--'}
              </p>
              <p className="text-sm text-gray-500">Membro dal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSuccess={handleAvatarSuccess}
        currentUser={session.user}
      />
    </>
  );
}