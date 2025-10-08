import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { OptionAdminModal } from './OptionAdminModal';
import { useOptionItems } from '@/hooks/useOptionItems';

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
  const { items, isLoading } = useOptionItems(optionSetKey, { activeOnly: true });

  const handleValueChange = (newValue: string) => {
    // Se clicar em "Criar e Editar...", abrir modal ao invés de selecionar
    if (newValue === '__ADMIN_EDIT__') {
      setModalOpen(true);
      return;
    }

    onValueChange?.(newValue);
  };

  return (
    <>
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className={className} aria-label={label}>
          <SelectValue placeholder={isLoading ? 'Carregando...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {label && <SelectLabel>{label}</SelectLabel>}
            
            {items.map((item) => (
              <SelectItem key={item.id} value={item.value}>
                {item.label}
              </SelectItem>
            ))}

            {items.length === 0 && !isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma opção disponível
              </div>
            )}
          </SelectGroup>

          {isAdmin && items.length > 0 && (
            <>
              <SelectSeparator />
              <SelectItem 
                value="__ADMIN_EDIT__"
                className="text-primary font-medium"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Criar e Editar...
                </div>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

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
