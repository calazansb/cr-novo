import { useState } from 'react';
import { Settings } from 'lucide-react';
import { OptionAdminModal } from './OptionAdminModal';
import { useOptionItems } from '@/hooks/useOptionItems';
import { ComboboxOption } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectWithAdminEditProps {
  optionSetKey: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isAdmin?: boolean;
  label?: string;
  className?: string;
}

export function SelectWithAdminEdit({
  optionSetKey,
  value,
  onValueChange,
  placeholder = 'Selecione...',
  disabled = false,
  isAdmin = false,
  label,
  className,
}: SelectWithAdminEditProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const { items, isLoading } = useOptionItems(optionSetKey, { activeOnly: true });

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("w-full justify-between h-10 font-normal", className)}
          >
            <span className={cn(
              "truncate",
              !value && "text-muted-foreground"
            )}>
              {value
                ? (items.find((item) => item.value === value)?.label ?? value)
                : isLoading ? 'Carregando...' : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 pointer-events-auto z-50 bg-popover" align="start" sideOffset={4}>
          <Command className="bg-popover">
            <CommandInput placeholder="Buscar..." className="h-12 px-3 py-3.5" />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={() => handleValueChange(item.value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {isAdmin && items.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        setModalOpen(true);
                      }}
                      className="cursor-pointer text-primary font-medium"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Criar e Editar Opções
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isAdmin && (
        <OptionAdminModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          optionSetKey={optionSetKey}
        />
      )}
    </>
  );
}
