'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getVoices, createAgent, Voices, getAgentLimits, AgentLimits } from '@/lib/api';
import { ChevronDown, Loader2, Sparkles, Check } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Icon } from '@iconify/react';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
}

const templates: Template[] = [
  {
    id: '1',
    title: 'Customer Support',
    description: 'A friendly AI assistant that helps customers with their questions and provides excellent service.',
    icon:<Icon icon="streamline-freehand:help-headphones-customer-support-human" width="48" height="48"
      className="text-black" />
  },
  {
    id: '2',
    title: 'Personal Tutor',
    description: 'An educational AI that explains concepts clearly and helps with learning in a patient, encouraging way.',
    icon: <Icon icon="fluent-emoji-high-contrast:teacher" width="48" height="48"  className="text-black" />
  },
  {
    id: '3',
    title: 'Creative Partner',
    description: 'A creative AI companion that helps brainstorm ideas, write stories, and explore imaginative concepts.',
    icon:<Icon icon="ph:sparkle-duotone" width="38" height="38"  className="text-[#fdc10a]" />
  },
  {
    id: '4',
    title: 'Business Coach',
    description: 'A professional AI advisor that provides business insights, strategy tips, and productivity advice.',
    icon: <Icon icon="material-symbols-light:business-center" width="44" height="44"  className="text-black" />
  }
];

export default function AgentCreationPage() {
  const router = useRouter();
  const [voices, setVoices] = useState<Voices[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state
  const [agentName, setAgentName] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [agentLimits, setAgentLimits] = useState<AgentLimits | null>(null);

  useEffect(() => {
    loadVoices();
    loadAgentLimits();
  }, []);

  const loadVoices = async () => {
    try {
      setLoadingVoices(true);
      const voicesData = await getVoices();
      setVoices(voicesData);
      // Set first voice as default
      if (voicesData.length > 0) {
        setSelectedVoiceId(voicesData[0].id);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
    } finally {
      setLoadingVoices(false);
    }
  };

  const loadAgentLimits = async () => {
    try {
      const limits = await getAgentLimits();
      setAgentLimits(limits);
    } catch (error) {
      console.error('Error loading agent limits:', error);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template.id);
    setAgentDescription(template.description);
    setAgentName(template.title);
  };

  const handleCreateAgent = async () => {
    // Check limits first
    if (agentLimits && !agentLimits.can_create_more) {
      alert(`You've reached your agent limit (${agentLimits.max_agents_allowed} max). Upgrade to create more agents!`);
      return;
    }

    if (!agentName.trim() || !selectedVoiceId || !agentDescription.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setCreating(true);
      const agent = await createAgent({
        agent_name: agentName,
        character_prompt: agentDescription,
        voice_id: selectedVoiceId
      });

      // Show success popup
      setShowSuccess(true);
      
      // Redirect after 2 seconds to agents page
      setTimeout(() => {
        router.push(`/dashboard/agents/${agent.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Failed to create agent. Please try again.');
      setCreating(false);
    }
  };

  const selectedVoice = voices.find(v => v.id === selectedVoiceId);

  const playVoiceSample = (voiceId: string, sampleUrl?: string | null) => {
    if (!sampleUrl) return;
    
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      // Stop audio
    } else {
      setPlayingVoice(voiceId);
      const audio = new Audio(sampleUrl);
      audio.play();
      audio.onended = () => setPlayingVoice(null);
    }
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-background">
      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-2xl border border-emerald-500/30 max-w-md mx-4 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Agent Created Successfully!</h3>
              <p className="text-slate-400">Redirecting to your agents...</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-9xl mx-auto ">
        {/* Hero Section with Spline Robot Placeholder */}
        <div className="text-center mb-16">
          <div className="w-full h-80 flex border rounded-4xl items-center justify-center mb-20
          overflow-hidden relative">
            {/* Spline Robot would go here */}
            <div className=" absolute  w-full h-full bottom-50">
                <img src="\images\2ladies.jpg" alt='Ai image' className='w-screen h-screen'/>
            </div>
            <div className="absolute inset-0 pointer-events-none" />
          </div>
          
          <h2 className="text-4xl md:text-7xl mt-10 font-amiamie font-bold text-primary mb-8">
            Build Your <span className='font-serif italic inline-block bg-clip-text text-transparent
             bg-gradient-to-b from-[#191654]  hover:to-purple-
             font-normal'>Personalize</span> Ai agent
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-4">
            Create a custom AI agent with a unique voice and personality in minutes
          </p>

        </div>

        {/* Steps Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-background p-6 text-center">
            <div className="w-15 h-15 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-400">
              <Icon icon="healthicons:construction-worker" width="48" height="48"  className="text-blue-700" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Choose Template</h3>
            <p className="text-sm text-secondary">Select a pre-made template or start from scratch</p>
          </div>
          
          <div className="bg-background p-6 text-center">
            <div className="w-15 h-15 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-400">
              <Icon icon="el:mic" width="30" height="30"  className="text-purple-700" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Select Voice</h3>
            <p className="text-sm text-secondary">Pick the perfect voice for your agent</p>
          </div>
          
          <div className="bg-background p-6 text-center">
            <div className="w-15 h-15 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-emerald-400">
              <Icon icon="mdi:account-success" width="35" height="35"  className="text-emerald-700" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Customize & Create</h3>
            <p className="text-sm text-secondary">Add details and bring your agent to life</p>
          </div>
        </div>

        {/* Templates Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-primary font-amiamie mb-6">Choose from an existing Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`bg-gray-200 backdrop-blur-sm border rounded-xl p-6 text-left transition-all hover:scale-105 ${
                  selectedTemplate === template.id
                    ? 'border-green-300/50 bg-gray-100'
                    : 'border-gray-50 hover:border-gray-100'
                }`}
              >
                <div className="text-4xl mb-3">{template.icon}</div>
                <h4 className="font-semibold text-primary font-amiamie mb-2">{template.title}</h4>
                <p className="text-sm text-primary line-clamp-3">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

                  {/* Agent Limits Display */}
          {agentLimits && (
            <div className="inline-flex flex-row items-center  mb-3 gap-2 bg-gray-300/50 border
             border-slate-200 rounded-full px-6 py-2 mt-4">
              <span className="text-primary font-amiamie-round">
                {agentLimits.agents_created} / {agentLimits.max_agents_allowed} agents created
              </span>
              {!agentLimits.can_create_more && (
                
                <span className="text-yellow-600 text-sm font-serif">"Limit reached - Upgrade needed"</span>
              )}
              {agentLimits.is_admin && (
                <span className="text-green-400 text-sm ml-2">✓ Admin (Unlimited)</span>
              )}
            </div>
          )}


        {/* Creation Form */}
        <div className="bg-white backdrop-blur-sm border border-gray-300 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-primary font-amiamie mb-3">Agent Details</h3>
          
          <div className="space-y-6">
            {/* Agent Name */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Agent Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g., My Customer Support Agent"
                className="w-full bg-white border-2 border-gray-300 rounded-lg 
                px-4 py-3 text-primary placeholder-slate-500 focus:outline-none focus:border-blue-500
                 transition-colors"
              />
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Select Voice <span className="text-red-400">*</span>
              </label>
              
              {loadingVoices ? (
                <div className="w-full bg-gray-100 border border-slate-800 
                rounded-lg px-4 py-3 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  <span className="ml-2 text-slate-400">Loading voices...</span>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-700
                     font-medium flex items-center justify-between hover:border-gray-100  transition-colors"
                  >
                    <span>{selectedVoice?.display_name || selectedVoice?.name || 'Select a voice'}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white
                     border-2 border-gray-100 rounded-lg shadow-2xl max-h-80 overflow-y-auto z-10">
                      {voices.map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => {
                            setSelectedVoiceId(voice.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-100 
                            transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedVoiceId === voice.id ? 'bg-gray-100' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-primary">
                                {voice.display_name || voice.name}
                              </div>
                              {voice.description && (
                                <div className="text-sm text-slate-400 mt-1">{voice.description}</div>
                              )}
                            </div>
                            {voice.sample_audio_url && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playVoiceSample(voice.id, voice.sample_audio_url);
                                }}
                                className="ml-4 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg transition-colors"
                              >
                                {playingVoice === voice.id ? 'Stop' : 'Preview'}
                              </button>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Agent Description */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Agent Personality & Instructions <span className="text-red-400">*</span>
              </label>
              <textarea
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                placeholder="Describe your agent's personality, tone, and how it should respond..."
                rows={5}
                className="w-full bg-white border-2 border-gray-300 
                rounded-lg px-4 py-3 text-primary placeholder-slate-500
                 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
              <p className="text-sm text-slate-500 mt-2">
                This character prompt defines how your agent will respond and interact
              </p>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateAgent}
              disabled={creating || !agentName.trim() || !selectedVoiceId || 
                !agentDescription.trim() || Boolean(agentLimits && !agentLimits.can_create_more)}
              className="w-full bg-gradient-to-r from-[#43C6AC] to-[#191654] 
              hover:from-[#191654]  hover:to-purple-700 disabled:from-slate-700 
              disabled:to-slate-700 disabled:cursor-not-allowed text-white 
              font-semibold py-4 rounded-xl transition-all transform 
              hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Your Agent...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create AI Agent
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}