import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder, className = '' }) {
  const [inputValue, setInputValue] = useState(value ?? '');

  // Sync if parent clears or changes value externally
  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  // Debounce: call onChange 300ms after last keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, onChange]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-md ps-9 pe-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      />
    </div>
  );
}
