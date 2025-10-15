import { useState } from 'react';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useConnectedAccounts, ConnectedBank } from '@/hooks/useConnectedAccounts';
import { Badge } from './ui/badge';
import { getAccountDisplayName } from '@/utils/accountDisplay';

interface AccountSelectorProps {
  value?: string; // plaidAccountId or 'all'
  onChange: (accountId: string | null) => void; // null = all accounts
  className?: string;
}

export function AccountSelector({ value = 'all', onChange, className }: AccountSelectorProps) {
  const [open, setOpen] = useState(false);
  const { connectedBanks, loading } = useConnectedAccounts();

  // Flatten all accounts from all banks
  const allAccounts = connectedBanks.flatMap(bank => 
    bank.accounts.map(account => ({
      ...account,
      institutionName: bank.institutionName,
    }))
  );

  const selectedAccount = value === 'all' 
    ? null 
    : allAccounts.find(acc => acc.plaidAccountId === value);

  const formatBalance = (balance: number | null) => {
    if (balance === null || balance === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(balance);
  };

  if (loading) {
    return (
      <div className={cn("w-full sm:w-[280px]", className)}>
        <Button variant="outline" className="w-full justify-between" disabled>
          <span>Loading accounts...</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>
    );
  }

  if (connectedBanks.length === 0) {
    return null; // Don't show selector if no banks connected
  }

  return (
    <div className={cn("w-full sm:w-[320px]", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {selectedAccount 
                  ? getAccountDisplayName({
                      type: selectedAccount.type,
                      subtype: selectedAccount.subtype,
                      officialName: selectedAccount.officialName,
                      name: selectedAccount.name,
                      mask: selectedAccount.mask,
                    })
                  : 'All Accounts'}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0">
          <Command>
            <CommandInput placeholder="Search accounts..." />
            <CommandEmpty>No accounts found.</CommandEmpty>
            
            {/* All Accounts Option */}
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === 'all' ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">All Accounts</div>
                  <div className="text-xs text-muted-foreground">
                    Combined view of all {allAccounts.length} accounts
                  </div>
                </div>
              </CommandItem>
            </CommandGroup>

            {/* Individual Accounts by Bank */}
            {connectedBanks.map((bank) => (
              <CommandGroup key={bank.itemId} heading={bank.institutionName}>
                {bank.accounts.map((account) => (
                  <CommandItem
                    key={account.plaidAccountId}
                    value={account.plaidAccountId}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? null : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === account.plaidAccountId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {getAccountDisplayName({
                            type: account.type,
                            subtype: account.subtype,
                            officialName: account.officialName,
                            name: account.name,
                            mask: account.mask,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {account.type} {account.mask && `• ••${account.mask}`}
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {account.balanceCurrent != null
                          ? formatBalance(account.balanceCurrent)
                          : formatBalance(account.balanceAvailable)}
                        {account.balanceAvailable != null && account.balanceCurrent != null && account.balanceAvailable !== account.balanceCurrent && (
                          <span className="ml-1 opacity-80 text-[10px]">avail {formatBalance(account.balanceAvailable)}</span>
                        )}
                      </Badge>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

