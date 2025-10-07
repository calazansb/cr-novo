import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface BaseFieldProps {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
  success?: boolean;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type: 'input';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputType?: string;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

export const FormField: React.FC<FormFieldProps> = (props) => {
  const { label, id, required, error, success, className = '' } = props;

  const renderField = () => {
    switch (props.type) {
      case 'input':
        return (
          <Input
            id={id}
            type={props.inputType || 'text'}
            placeholder={props.placeholder}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            className={`
              h-9 bg-background transition-all duration-300
              ${error ? 'border-destructive focus:ring-destructive/20' : ''}
              ${success ? 'border-success focus:ring-success/20' : ''}
              ${!error && !success ? 'hover:border-primary/50 focus:ring-primary/20' : ''}
            `}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={id}
            placeholder={props.placeholder}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            rows={props.rows || 3}
            className={`
              bg-background transition-all resize-none
              ${error ? 'border-destructive focus:ring-destructive/20' : ''}
              ${success ? 'border-success focus:ring-success/20' : ''}
              ${!error && !success ? 'hover:border-primary/50 focus:ring-primary/20' : ''}
            `}
          />
        );

      case 'select':
        return (
          <Select value={props.value} onValueChange={props.onChange}>
            <SelectTrigger 
              className={`
                h-9 bg-background transition-all duration-300
                ${error ? 'border-destructive focus:ring-destructive/20' : ''}
                ${success ? 'border-success focus:ring-success/20' : ''}
                ${!error && !success ? 'hover:border-primary/50 focus:ring-primary/20' : ''}
              `}
            >
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background max-h-60 overflow-y-auto">
              {props.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label 
        htmlFor={id} 
        className={`
          text-xs font-medium transition-colors flex items-center gap-1.5 h-4
          ${error ? 'text-destructive' : success ? 'text-success' : 'text-foreground'}
        `}
      >
        {label}
        {required && <span className="text-destructive">*</span>}
        {success && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
      </Label>
      
      {renderField()}

      <div className="h-4">
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};