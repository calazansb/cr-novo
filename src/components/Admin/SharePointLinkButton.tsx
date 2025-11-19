import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SharePointLinkButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGetSharePointLink = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-sharepoint-link');

      if (error) throw error;

      if (data.success) {
        // Abrir o link da pasta Decisoes_Judiciais no navegador
        window.open(data.decisoesFolderUrl, '_blank');
        
        toast({
          title: "Link do SharePoint",
          description: `Drive: ${data.driveName}`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erro ao obter link do SharePoint:', error);
      toast({
        title: "Erro",
        description: "Não foi possível obter o link do SharePoint",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGetSharePointLink}
      disabled={loading}
      variant="outline"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4" />
      )}
      Abrir SharePoint
    </Button>
  );
};
