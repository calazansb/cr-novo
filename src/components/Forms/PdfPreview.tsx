import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl as unknown as string;

interface PdfPreviewProps {
  file: File | null;
  url?: string;
}

export const PdfPreview = ({ file, url }: PdfPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [canvasData, setCanvasData] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file && !url) return;
    
    const loadPdf = async () => {
      setLoading(true);
      try {
        let data: ArrayBuffer;
        
        if (file) {
          data = await file.arrayBuffer();
        } else if (url) {
          const response = await fetch(url);
          data = await response.arrayBuffer();
        } else {
          return;
        }

        const pdf = await getDocument({ data }).promise;
        setTotalPages(pdf.numPages);
        renderPage(pdf, currentPage, scale);
      } catch (error) {
        console.error('Erro ao carregar PDF:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [file, url, currentPage, scale]);

  const renderPage = async (pdf: any, pageNumber: number, scale: number) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      setCanvasData(canvas.toDataURL());
    } catch (error) {
      console.error('Erro ao renderizar página:', error);
    }
  };

  if (!file && !url) return null;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Preview do Documento
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-mono">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-auto max-h-[600px] bg-muted/30">
              {canvasData && (
                <img 
                  src={canvasData} 
                  alt={`Página ${currentPage}`}
                  className="w-full"
                />
              )}
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
