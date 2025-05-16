'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, SignUpButton, useUser } from '@clerk/nextjs';

// Previene la duplicazione della navbar
let navbarMounted = false;

export default function Navbar() {
  const { isSignedIn, isLoaded, user } = useUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Assicuriamoci che il componente sia montato lato client
  useEffect(() => {
    setMounted(true);
    
    // Verifica se la navbar è già stata montata
    if (navbarMounted) {
      setIsDuplicate(true);
    } else {
      navbarMounted = true;
    }
    
    // Pulizia quando il componente viene smontato
    return () => {
      if (!isDuplicate) {
        navbarMounted = false;
      }
    };
  }, []);

  // Se è un duplicato, non renderizzare nulla
  if (isDuplicate) {
    return null;
  }

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Pacchetti', href: '/pacchetti' },
    { name: 'Trip Builder', href: '/trip-builder' },
    { name: 'Community', href: '/community' },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-2xl font-display font-bold text-primary-700">
                RideAtlas
              </Link>
            </div>
            <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {mounted && isLoaded && isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/create-trip"
                  className={`px-3 py-2 text-sm font-medium ${pathname === '/create-trip'
                      ? 'text-primary-700 font-semibold'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Crea Viaggio
                </Link>
                <div className="ml-3">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              <div className="flex space-x-4">
                <SignInButton mode="modal">
                  <button className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                    Accedi
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn-primary">
                    Registrati
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Apri menu principale</span>
              {mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="space-y-1 pt-2 pb-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${isActive
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="border-t border-gray-200 pt-4 pb-3">
            {mounted && isLoaded && isSignedIn ? (
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <UserButton afterSignOutUrl="/" />
                </div>
                <div className="ml-3">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-1">
                <SignInButton mode="modal">
                  <button className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800">
                    Accedi
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="block w-full px-4 py-2 text-left text-base font-medium text-primary-600 hover:bg-gray-100 hover:text-primary-800">
                    Registrati
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}