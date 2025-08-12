
import { Session } from 'next-auth'
import Image from 'next/image'
import { getUserInitials, getUserAvatarBgColor } from '@/lib/ui/avatar-utils'

interface UserAvatarProps {
  user?: Session['user']
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  if (!user) return null

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm', 
    lg: 'h-10 w-10 text-base'
  }

  const avatarSize = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 }
  }

  // Se c'è un'immagine profilo, mostrala
  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={user.name || 'User'}
        width={avatarSize[size].width}
        height={avatarSize[size].height}
        className={`rounded-full ${className}`}
      />
    )
  }

  // Altrimenti mostra le iniziali su sfondo colorato
  const initials = getUserInitials(user)
  const bgColor = getUserAvatarBgColor(user)

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold shadow-sm ${className}`}
      title={user.name || user.email || 'User'}
      style={{ 
        backgroundColor: bgColor,
        minWidth: avatarSize[size].width + 'px', 
        minHeight: avatarSize[size].height + 'px'
      }}
    >
      {initials}
    </div>
  )
}
