import { useState } from 'react';
import { Settings } from 'lucide-react';
import { OptionAdminModal } from './OptionAdminModal';
import { useOptionItems } from '@/hooks/useOptionItems';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';

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
    onValueChange?.(newValue);
  };

  // Converter items para formato ComboboxOption
  const comboboxOptions: ComboboxOption[] = items.map((item) => ({
    value: item.value,
    label: item.label,
  }));

  return (
    <div className="space-y-2">
      <Combobox
        options={comboboxOptions}
        value={value}
        onValueChange={handleValueChange}
        placeholder={isLoading ? 'Carregando...' : placeholder}
        searchPlaceholder="Buscar..."
        emptyMessage="Nenhuma opção encontrada."
        className={className}
      />

      {isAdmin && items.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="w-full text-primary"
        >
          <Settings className="h-4 w-4 mr-2" />
          Criar e Editar Opções
        </Button>
      )}

      {isAdmin && (
        <OptionAdminModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          optionSetKey={optionSetKey}
        />
      )}
    </div>
  );
}
