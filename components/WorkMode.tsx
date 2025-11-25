"use client";
import { useState } from 'react';
import { Icon } from '@iconify/react';

export default function WorkMode() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState({
    name: 'Creative Mode',
    description: 'Create AI audio',
    icon: 'wpf:audiowave',
    color: 'bg-[#C30101]'
  });

  const workspaces = [
    {
      name: 'Creative Mode',
      description: 'Create AI audio',
      icon: 'wpf:audiowave',
      color: 'bg-[#C30101]'
    },
    {
      name: 'Agents Mode',
      description: 'Build and manage your AI agents',
      icon: 'mdi:robot',
      color: 'bg-gray-700'
    }
  ];

  const handleSelect = (workspace: typeof workspaces[0]) => {
    setSelectedWorkspace(workspace);
    setIsOpen(false);
  };
  return (
    <div className="relative">
      {/* Selected Workspace Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-[5] bg-white border border-gray-300
         rounded-full hover:bg-gray-50 transition-colors min-w-[220px]"
      >
        {/* Icon */}
        <div className={`w-7 h-7 ${selectedWorkspace.color} rounded-lg 
        flex items-center justify-center`}>
          <Icon icon={selectedWorkspace.icon} width="20" 
          height="20" className="text-white" />
        </div>
        
        {/* Text */}
        <span className="text-sm font-amiamie font-normal text-primary flex-1 text-left">
          {selectedWorkspace.name}
        </span>
        
        {/* Arrow */}
        <Icon 
          icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"} 
          width="20" 
          height="20" 
          className="text-secondary"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Dropdown content */}
          <div className="absolute top-full left-0 mt-2 w-100 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            {workspaces.map((workspace, index) => (
              <button
                key={index}
                onClick={() => handleSelect(workspace)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  selectedWorkspace.name === workspace.name ? 'bg-blue-50' : ''
                }`}
              >
                {/* Icon */}
                <div className={`w-8 h-8 ${workspace.color} rounded-lg flex items-center justify-center`}>
                  <Icon icon={workspace.icon} width="18" height="18" className="text-white" />
                </div>
                
                {/* Text */}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-primary">{workspace.name}</p>
                  <p className="text-xs text-secondary">{workspace.description}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}