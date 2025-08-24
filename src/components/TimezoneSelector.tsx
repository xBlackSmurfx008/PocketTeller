
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimezone } from '@/hooks/useTimezone';
import { useToast } from '@/hooks/use-toast';
import { Clock } from 'lucide-react';

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC',
];

export function TimezoneSelector() {
  const { timezone, updateTimezone } = useTimezone();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleTimezoneChange = async (newTimezone: string) => {
    setLoading(true);
    const success = await updateTimezone(newTimezone);
    
    if (success) {
      toast({
        title: "Timezone updated",
        description: "Your timezone preference has been saved",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update timezone",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Timezone
      </Label>
      <Select
        value={timezone || ''}
        onValueChange={handleTimezoneChange}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select your timezone" />
        </SelectTrigger>
        <SelectContent>
          {COMMON_TIMEZONES.map((tz) => (
            <SelectItem key={tz} value={tz}>
              {tz.replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Current: {timezone || 'Auto-detected'}
      </p>
    </div>
  );
}
