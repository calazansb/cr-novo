import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  files: File[];
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  files,
  maxFiles = 10,
  maxSize = 10,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const validateFile = (file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const fileSizeMB = file.size / (1024 * 1024);

    if (!acceptedTypes.includes(fileExtension)) {
      return `Tipo de arquivo não suportado: ${fileExtension}`;
    }

    if (fileSizeMB > maxSize) {
      return `Arquivo muito grande: ${fileSizeMB.toFixed(1)}MB (máx: ${maxSize}MB)`;
    }

    return null;
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Máximo de ${maxFiles} arquivos permitido`);
        break;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      // Simular upload com progresso
      validFiles.forEach((file) => {
        const fileId = file.name + file.lastModified;
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setUploadProgress(prev => {
                const { [fileId]: _, ...rest } = prev;
                return rest;
              });
            }, 500);
          }
        }, 200);
      });

      onFilesChange([...files, ...validFiles]);
    }

    // Mostrar erros se houver
    if (errors.length > 0) {
      console.error('Erros no upload:', errors);
    }
  }, [files, maxFiles, onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
          ${isDragOver 
            ? 'border-primary bg-primary/5 shadow-glow' 
            : 'border-border hover:border-primary/50 hover:bg-muted/20'
          }
          ${files.length >= maxFiles ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (files.length < maxFiles) {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = acceptedTypes.join(',');
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              if (target.files) handleFiles(target.files);
            };
            input.click();
          }
        }}
      >
        <div className={`transition-transform duration-300 ${isDragOver ? 'scale-110' : ''}`}>
          <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors duration-300 ${
            isDragOver ? 'text-primary' : 'text-muted-foreground'
          }`} />
        </div>
        
        <div className="space-y-2">
          <p className={`font-medium transition-colors duration-300 ${
            isDragOver ? 'text-primary' : 'text-foreground'
          }`}>
            {isDragOver ? 'Solte os arquivos aqui' : 'Clique ou arraste arquivos'}
          </p>
          <p className="text-sm text-muted-foreground">
            {acceptedTypes.join(', ').toUpperCase()} • Máx: {maxSize}MB cada • {maxFiles} arquivos máximo
          </p>
          <p className="text-xs text-muted-foreground">
            {files.length}/{maxFiles} arquivos selecionados
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Arquivos Anexados:</p>
          <div className="space-y-2">
            {files.map((file, index) => {
              const fileId = file.name + file.lastModified;
              const progress = uploadProgress[fileId];
              const isUploading = progress !== undefined && progress < 100;
              const isUploaded = progress === 100 || progress === undefined;

              return (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-card rounded-lg border shadow-card hover-lift"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg transition-colors duration-300 ${
                      isUploaded ? 'bg-success/10' : 'bg-muted'
                    }`}>
                      {isUploaded ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                        {isUploading && (
                          <span className="text-xs text-primary">
                            Enviando... {progress}%
                          </span>
                        )}
                        {isUploaded && progress === 100 && (
                          <span className="text-xs text-success">
                            Concluído
                          </span>
                        )}
                      </div>
                      
                      {isUploading && (
                        <Progress value={progress} className="h-1 mt-2" />
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};