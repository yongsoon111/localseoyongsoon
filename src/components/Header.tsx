'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onReset?: () => void;
  showReset?: boolean;
  showBackLink?: boolean;
}

export function Header({ onReset, showReset, showBackLink }: HeaderProps) {
  const { user, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const themeIcons = {
    light: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    dark: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    gray: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'gray'> = ['light', 'dark', 'gray'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-2 max-w-7xl">
        <div className="flex items-center justify-between">
          {showBackLink ? (
            <Link href="/dashboard" className="text-primary hover:underline text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              대시보드로 돌아가기
            </Link>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-4">
            {showReset && onReset && (
              <button
                onClick={onReset}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                새로운 분석
              </button>
            )}

            {/* 테마 전환 버튼 */}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title={`현재: ${theme === 'light' ? '라이트' : theme === 'dark' ? '다크' : '그레이'}`}
            >
              {themeIcons[theme]}
            </button>

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                    <Button variant="outline" size="sm" onClick={signOut}>
                      로그아웃
                    </Button>
                  </div>
                ) : (
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      로그인
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
