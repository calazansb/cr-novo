import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useOptionItems, OptionItem } from '@/hooks/useOptionItems';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Save, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OptionAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optionSetKey: string;
}

export function OptionAdminModal({ open, onOpenChange, optionSetKey }: OptionAdminModalProps) {
  const {
    optionSet,
    items,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
    toggleActive,
    isCreating,
    isUpdating,
  } = useOptionItems(optionSetKey, { activeOnly: false, includeDeleted: false });

  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<OptionItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    label: '',
    value: '',
    order: 0,
    is_active: true,
    is_default: false,
  });

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartCreate = () => {
    setFormData({
      label: '',
      value: '',
      order: items.length,
      is_active: true,
      is_default: false,
    });
    setEditingItem(null);
    setIsCreatingNew(true);
  };

  const handleStartEdit = (item: OptionItem) => {
    setFormData({
      label: item.label,
      value: item.value,
      order: item.order,
      is_active: item.is_active,
      is_default: item.is_default,
    });
    setEditingItem(item);
    setIsCreatingNew(false);
  };

  const handleSave = () => {
    // Gerar slug do value se estiver vazio
    const valueToSave = formData.value || slugify(formData.label);

    if (editingItem) {
      updateItem({
        id: editingItem.id,
        updates: {
          ...formData,
          value: valueToSave,
        },
      });
    } else {
      createItem({
        ...formData,
        value: valueToSave,
      });
    }

    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setIsCreatingNew(false);
    setFormData({
      label: '',
      value: '',
      order: 0,
      is_active: true,
      is_default: false,
    });
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteItem(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gerenciar Opções - {optionSet?.label}</DialogTitle>
            <DialogDescription>
              {optionSet?.description || 'Crie, edite ou remova opções deste conjunto'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar opções..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleStartCreate} disabled={isCreatingNew || !!editingItem}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Opção
            </Button>
          </div>

          {(isCreatingNew || editingItem) && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {editingItem ? 'Editar Opção' : 'Nova Opção'}
                </h3>
                <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Rótulo *</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Ex: Documentação"
                    maxLength={120}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Valor Interno (slug)</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: slugify(e.target.value) })}
                    placeholder="documentacao"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para gerar automaticamente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Ordem de Exibição</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    Ativo
                  </Label>
                  <Label className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_default}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_default: checked })
                      }
                    />
                    Padrão
                  </Label>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.label.trim() || isCreating || isUpdating}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {editingItem ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          )}

          <Separator />

          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'Nenhuma opção encontrada' : 'Nenhuma opção cadastrada'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rótulo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-center">Ordem</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.label}
                        {item.is_default && (
                          <Badge variant="secondary" className="ml-2">
                            Padrão
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.value}
                      </TableCell>
                      <TableCell className="text-center">{item.order}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleActive({ id: item.id, isActive: !item.is_active })}
                            title={item.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {item.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(item)}
                            disabled={isCreatingNew || !!editingItem}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            disabled={isCreatingNew || !!editingItem}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta opção será desativada e ocultada dos usuários. Esta ação pode ser revertida
              posteriormente. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
