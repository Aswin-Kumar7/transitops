import { useState, useRef, useEffect } from 'react';
import { ArrowDown01Icon } from 'hugeicons-react';

interface DropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Dropdown({ value, onChange, options, placeholder = 'Select…', className = '', disabled = false }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div 
        className={`w-full h-full flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ArrowDown01Icon size={16} strokeWidth={2.5} className="text-current ml-2 shrink-0 pointer-events-none" />
      </div>
      
      {open && !disabled && (
        <div className="absolute z-50 top-full mt-2 left-0 w-full min-w-[120px] bg-white rounded-2xl shadow-xl border border-gray-50 py-2 max-h-60 overflow-y-auto font-poppins">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`px-4 py-2.5 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors ${value === opt.value ? 'text-[#1B5E47] bg-[#E5F5EF]' : 'text-black'}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
