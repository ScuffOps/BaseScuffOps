
import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ChevronsUpDown } from 'lucide-react';

export function MultiSelect({ options, selected, onChange, placeholder = "Select..." }) {
  const [open, setOpen] = useState(false);
  
  const handleSelect = (value) => {
    onChange([...selected, value]);
  };
  
  const handleDeselect = (value) => {
    onChange(selected.filter((s) => s !== value));
  };

  const selectedObjects = selected.map(s => options.find(o => o.value === s)).filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto"
        >
          <div className="flex flex-wrap gap-1">
            {selectedObjects.length > 0 ? (
              selectedObjects.map((item) => (
                <Badge
                  key={item.value}
                  variant="secondary"
                  onClick={(e) => { e.stopPropagation(); handleDeselect(item.value); }}
                  className="cursor-pointer"
                >
                  {item.label}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 menu-surface">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter(option => !selected.includes(option.value))
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    {option.label}
                  </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
