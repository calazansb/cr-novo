import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DecisoesFolderButton = () => {
  const { toast } = useToast();

  const handleOpenFolder = () => {
    toast({
      title: "Arquivos de Decisões",
      description: "Os arquivos estão armazenados no Lovable Cloud Storage no bucket 'decisoes-judiciais'",
    });
  };

  return (
    <Button
      onClick={handleOpenFolder}
      variant="outline"
      className="gap-2"
    >
      <FolderOpen className="h-4 w-4" />
      Ver Arquivos
    </Button>
  );
};
