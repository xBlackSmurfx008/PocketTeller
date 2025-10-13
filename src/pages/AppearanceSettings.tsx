import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, Palette, Monitor, Smartphone } from 'lucide-react';
import { useLayoutPreference } from '@/hooks/useLayoutPreference';
import { useAccent, type AccentColor } from '@/contexts/AccentProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AppearanceSettings() {
  const navigate = useNavigate();
  const { layoutMode, setLayoutMode } = useLayoutPreference();
  const { accentColor, setAccentColor } = useAccent();

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto pt-perfect px-4 pb-4 space-y-6 content-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palette className="h-6 w-6" />
              Appearance
            </h1>
            <p className="text-muted-foreground">Customize how PocketTeller looks and feels</p>
          </div>
        </div>

        {/* Layout & Display */}
        <Card>
          <CardHeader>
            <CardTitle>Layout & Display</CardTitle>
            <CardDescription>Customize how PocketTeller looks and feels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <ThemeToggle />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {layoutMode === 'desktop' ? (
                    <Monitor className="h-4 w-4 text-primary" />
                  ) : (
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Force Desktop Layout</p>
                  <p className="text-sm text-muted-foreground">
                    Use desktop layout on mobile devices
                  </p>
                </div>
              </div>
              <Switch
                checked={layoutMode === 'desktop'}
                onCheckedChange={(checked) => setLayoutMode(checked ? 'desktop' : 'auto')}
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-medium">Accent Color</p>
                <p className="text-sm text-muted-foreground">Choose your preferred accent color</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {(['violet', 'blue', 'emerald', 'amber', 'rose'] as AccentColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      accentColor === color
                        ? 'border-primary shadow-md scale-110'
                        : 'border-border hover:border-primary/50'
                    }`}
                    style={{
                      backgroundColor: `hsl(${
                        color === 'violet' ? '262 83% 58%' :
                        color === 'blue' ? '221 83% 53%' :
                        color === 'emerald' ? '142 76% 36%' :
                        color === 'amber' ? '45 93% 47%' :
                        '330 81% 60%'
                      })`
                    }}
                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
