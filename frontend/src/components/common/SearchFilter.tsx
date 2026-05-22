// src/components/common/SearchFilter.tsx
import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchFilterProps {
  onSearch: (term: string) => void;
  placeholder?: string;
  delay?: number;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  placeholder = 'Search...',
  delay = 500,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder={placeholder}
      />
      {searchTerm && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
};