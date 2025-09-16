import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  addButtonText?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  label,
  value = [],
  onChange,
  placeholder = 'Digite um item e pressione Enter',
  required = false,
  disabled = false,
  error,
  className = '',
  addButtonText = 'Adicionar'
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input and Add Button */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            focus:outline-none focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? 'border-red-500' : ''}
          `}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={disabled || !inputValue.trim()}
          className="
            px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-2
          "
        >
          <Plus className="h-4 w-4" />
          {addButtonText}
        </button>
      </div>

      {/* Tags Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md min-h-[60px]">
          {value.map((tag, index) => (
            <span
              key={index}
              className="
                inline-flex items-center gap-1 px-3 py-1 
                bg-blue-100 text-blue-800 text-sm rounded-full
                border border-blue-200
              "
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="
                    ml-1 p-0.5 hover:bg-blue-200 rounded-full
                    focus:outline-none focus:ring-1 focus:ring-blue-500
                  "
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md min-h-[60px] flex items-center justify-center">
          <span className="text-gray-500 text-sm">Nenhum item adicionado</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Helper Text */}
      <p className="mt-1 text-xs text-gray-500">
        Digite um item e pressione Enter ou clique em "{addButtonText}" para adicionar
      </p>
    </div>
  );
};

export default TagInput;