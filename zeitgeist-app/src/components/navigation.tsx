"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Menu, X, BarChart3, Home, Sparkles, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

/** Sign-in link when logged out; avatar + sign-out menu when logged in. */
function AuthControls() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user.email?.[0] ?? '?').toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((open) => !open)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0071e3] text-sm font-semibold text-white transition-transform hover:scale-105"
        aria-label="Account menu"
      >
        {initial}
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-white/10 bg-[#1d1d1f] p-2 shadow-xl">
          <p className="truncate px-3 py-2 text-xs text-neutral-400">
            {user.email}
          </p>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase?.auth.signOut();
              window.location.assign('/');
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

interface NavigationProps {
  variant?: 'default' | 'transparent';
  className?: string;
}

const navigationItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    description: 'Welcome to Zeitgeist'
  },
  {
    name: 'Stock Analysis',
    href: '/stock-analysis',
    icon: BarChart3,
    description: 'AI-powered stock insights'
  }
];

export function Navigation({ variant = 'default', className }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll events for transparent variant
  useEffect(() => {
    if (variant !== 'transparent') return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [variant]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const isTransparent = variant === 'transparent';
  const shouldShowBackground = !isTransparent || scrolled;

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        shouldShowBackground 
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm" 
          : "bg-transparent",
        className
      )}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-2 group"
              onClick={() => setIsOpen(false)}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110",
                "bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 shadow-lg"
              )}>
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className={cn(
                "font-bold text-xl transition-colors duration-200",
                isTransparent && !scrolled 
                  ? "text-white group-hover:text-gray-200" 
                  : "text-foreground group-hover:text-primary"
              )}>
                Zeitgeist
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "hover:scale-105 hover:shadow-sm",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : isTransparent && !scrolled
                          ? "text-white/80 hover:text-white hover:bg-white/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* CTA Button */}
              <Link
                href="/stock-analysis"
                className={cn(
                  "inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                  "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white",
                  "hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 hover:scale-105 hover:shadow-lg",
                  "border border-transparent"
                )}
              >
                <Sparkles className="h-4 w-4" />
                <span>Try AI Analysis</span>
              </Link>

              <AuthControls />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "md:hidden p-2 rounded-lg transition-colors duration-200",
                isTransparent && !scrolled
                  ? "text-white/80 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={cn(
          "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
          isOpen 
            ? "max-h-96 opacity-100" 
            : "max-h-0 opacity-0"
        )}>
          <div className={cn(
            "px-4 py-4 space-y-2 border-t",
            shouldShowBackground
              ? "bg-background/95 backdrop-blur-md border-border"
              : "bg-black/90 backdrop-blur-md border-white/10"
          )}>
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : isTransparent && !scrolled
                        ? "text-white/90 hover:text-white hover:bg-white/10"
                        : "text-foreground hover:bg-accent",
                  )}
                >
                  <IconComponent className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className={cn(
                      "text-xs",
                      isActive
                        ? "text-primary/70"
                        : isTransparent && !scrolled
                          ? "text-white/60"
                          : "text-muted-foreground"
                    )}>
                      {item.description}
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* Mobile CTA Button */}
            <div className="pt-4 mt-4 border-t border-current opacity-20">
              <Link
                href="/stock-analysis"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-medium text-base bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 transition-all duration-200"
              >
                <Sparkles className="h-5 w-5" />
                <span>Try AI Analysis</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Spacer to prevent content from hiding under fixed nav */}
      <div className={cn(
        "h-16",
        isTransparent ? "bg-transparent" : "bg-background"
      )} />
    </>
  );
}

export default Navigation;