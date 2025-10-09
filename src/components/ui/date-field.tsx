import React, { useState } from 'react';
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateFieldProps {
  label?: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  success?: boolean;
  className?: string;
}

export const DateField: React.FC<DateFieldProps> = ({
  label,
  id,
  value,
  onChange,
  placeholder = "Selecione uma data",
  required,
  error,
  success,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Convert string value to Date for calendar
  const dateValue = value ? new Date(value) : undefined;

  // Format date input (xx/xx/xxxx)
  const formatDateInput = (input: string) => {
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, '');
    
    // Limit to maximum 8 digits (ddmmyyyy)
    const limitedNumbers = numbers.slice(0, 8);
    
    // Add slashes as user types
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 4) {
      return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2)}`;
    } else {
      // Limit year to 4 digits maximum
      const day = limitedNumbers.slice(0, 2);
      const month = limitedNumbers.slice(2, 4);
      const year = limitedNumbers.slice(4, 8); // Maximum 4 digits for year
      return `${day}/${month}/${year}`;
    }
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD format for input value
  const convertToInputFormat = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 10) return '';
    const [day, month, year] = dateStr.split('/');
    if (day && month && year && year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  // Convert YYYY-MM-DD to DD/MM/YYYY format for display
  const convertToDisplayFormat = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return format(date, 'dd/MM/yyyy');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatDateInput(input);
    
    // Update the input value immediately for visual feedback
    e.target.value = formatted;
    
    // Only update the actual state value if it's a complete date (DD/MM/YYYY)
    if (formatted.length === 10) {
      const converted = convertToInputFormat(formatted);
      if (converted) {
        onChange(converted);
      }
    }
  };

  const handleInputFocus = () => {
    setIsTyping(true);
    setIsOpen(false); // Close calendar when starting to type
  };

  const handleInputBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTyping(false);
    // Validate the date when user finishes typing
    const input = e.target.value;
    if (input.length === 10) {
      const converted = convertToInputFormat(input);
      if (converted) {
        onChange(converted);
      }
    }
  };

  const handleButtonClick = () => {
    if (!isTyping) {
      setIsOpen(true);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd');
      onChange(formatted);
      setIsOpen(false); // Close calendar immediately after selection
    }
  };

  const displayValue = value ? convertToDisplayFormat(value) : '';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <Label 
          htmlFor={id} 
          className={`
            text-xs font-medium transition-colors flex items-center gap-1.5 h-4
            ${error ? 'text-destructive' : success ? 'text-success' : 'text-foreground'}
          `}
        >
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="relative">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                id={id}
                type="text"
                placeholder={isTyping ? "DD/MM/AAAA" : placeholder}
                value={isTyping ? undefined : (value ? displayValue : "")}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onClick={handleButtonClick}
                maxLength={10}
                className={cn(
                  "w-full h-9 bg-background pr-10",
                  error ? 'border-destructive focus:ring-destructive/20' : '',
                  success ? 'border-success focus:ring-success/20' : '',
                  !error && !success ? 'hover:border-primary/50 focus:ring-primary/20' : ''
                )}
              />
              <CalendarIcon 
                className={cn(
                  "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
                  "pointer-events-none",
                  isTyping && "opacity-50"
                )} 
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto z-50" align="start">
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleCalendarSelect}
              initialFocus
              className="pointer-events-auto"
              showOutsideDays={false}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="h-4">
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};