import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  loading = false,
  loadingText,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <Button
      disabled={loading || disabled}
      className={`transition-all duration-300 ${loading ? 'animate-pulse-glow' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      )}
      {loading ? (loadingText || 'Carregando...') : children}
    </Button>
  );
};