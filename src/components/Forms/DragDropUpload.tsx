import { useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DragDropUploadProps {
  onFileSelect: (file: File) => void;
  onUploadProgress?: (progress: number) => void;
  accept?: string;
  maxSize?: number; // em MB
  currentFile?: File | null;
  onRemoveFile?: () => void;
}

export const DragDropUpload = ({
  onFileSelect,
  onUploadProgress,
  accept = '.pdf,.docx,.html',
  maxSize = 20,
  currentFile,
  onRemoveFile
}: DragDropUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSize}MB`;
    }

    const allowedTypes = accept.split(',').map(t => t.trim());
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${accept}`;
    }

    return null;
  };

  const processFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setUploadProgress(0);

    // Simular progresso de upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    onFileSelect(file);
    
    // Completar progresso após um pequeno delay
    setTimeout(() => {
      setUploadProgress(100);
      if (onUploadProgress) onUploadProgress(100);
    }, 2000);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {currentFile ? (
        <Card className="border-2 border-primary/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{currentFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(currentFile.size)}
                  </p>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <Progress value={uploadProgress} className="mt-2 h-2" />
                  )}
                  {uploadProgress === 100 && (
                    <p className="text-sm text-green-600 mt-1">✓ Upload concluído</p>
                  )}
                </div>
              </div>
              {onRemoveFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveFile}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            error && "border-destructive"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="pt-6">
            <label className="cursor-pointer">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center mb-4",
                  isDragging ? "bg-primary/20" : "bg-muted"
                )}>
                  <Upload className={cn(
                    "h-8 w-8",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <p className="text-lg font-medium mb-2">
                  {isDragging ? "Solte o arquivo aqui" : "Arraste e solte seu arquivo"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Tipos aceitos: {accept} • Tamanho máx: {maxSize}MB
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleFileInput}
              />
            </label>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
