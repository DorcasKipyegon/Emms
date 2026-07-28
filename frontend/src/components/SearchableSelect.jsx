import React, { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({ options, value, onChange, placeholder = "Select...", disabled = false, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value == value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className={`w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg flex justify-between items-center transition-all focus-within:ring-2 focus-within:ring-teal-500 focus-within:outline-none ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'cursor-pointer text-gray-900'}`}
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
      >
        <span className={selectedOption ? "text-gray-900 truncate" : "text-gray-500 truncate"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`px-3 py-2 rounded-md cursor-pointer text-sm transition-colors truncate ${
                    value == opt.value 
                      ? "bg-teal-50 text-teal-700 font-medium" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
