import { useState, MouseEvent, useEffect } from 'react';
import { Career, Skill, Question, RoadmapItem } from '../types';
import { CAREERS_PRESETS, SKILLS_POOL } from '../data/careers';
import { Compass, Sparkles, BookOpen, Layers, Check, Plus, Trash2, Brain, Loader, X } from 'lucide-react';
import { motion } from 'motion/react';
import { getDomainIconName, getDomainIconComponent } from '../lib/utils';

interface OnboardingProps {
  onSelectCareer: (careerId: string, customCareers?: Career[]) => void;
  customCareers: Career[];
  onUpdateCustomCareers: (careers: Career[]) => void;
  onGenerateAICareer?: (career: Career, skills: Skill[], questions: Question[], roadmaps: RoadmapItem[]) => void;
  customSkills?: Skill[];
}

export default function Onboarding({ 
  onSelectCareer, 
  customCareers, 
  onUpdateCustomCareers, 
  onGenerateAICareer,
  customSkills 
}: OnboardingProps) {
  const [showCreator, setShowCreator] = useState(false);
  const [creatorMode, setCreatorMode] = useState<'ai' | 'manual'>('ai');
  const [newCareerName, setNewCareerName] = useState('');
  const [newCareerDesc, setNewCareerDesc] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // AI generation states
  const [aiRoleName, setAiRoleName] = useState('');
  const [aiRoleDesc, setAiRoleDesc] = useState('');
  const [aiTechStack, setAiTechStack] = useState('');
  const [customStackInput, setCustomStackInput] = useState('');
  const [aiRoleType, setAiRoleType] = useState<'job' | 'internship'>('job');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState('Initializing career architect...');
  
  const allCareers = [...CAREERS_PRESETS, ...customCareers];

  const handleCreateCustomCareer = () => {
    if (!newCareerName || !newCareerDesc || selectedSkills.length === 0) return;
    
    // Equal weights for custom career skills that sum to 1.0
    const weights: Record<string, number> = {};
    const equalWeight = parseFloat((1 / selectedSkills.length).toFixed(2));
    selectedSkills.forEach((skillId, index) => {
      // Adjust last item to ensure exact sum of 1.0
      if (index === selectedSkills.length - 1) {
        let sum = 0;
        selectedSkills.slice(0, -1).forEach(id => sum += weights[id]);
        weights[skillId] = parseFloat((1.0 - sum).toFixed(2));
      } else {
        weights[skillId] = equalWeight;
      }
    });

    const newCareer: Career = {
      id: `custom_${Date.now()}`,
      name: newCareerName,
      description: newCareerDesc,
      skillIds: selectedSkills,
      weights,
      domainIcon: getDomainIconName(newCareerName)
    };

    const updated = [...customCareers, newCareer];
    onUpdateCustomCareers(updated);
    
    // Reset form
    setNewCareerName('');
    setNewCareerDesc('');
    setSelectedSkills([]);
    setShowCreator(false);
    
    // Auto-select the newly created career
    onSelectCareer(newCareer.id, updated);
  };

  const handleTriggerAIGeneration = async () => {
    if (!aiRoleName.trim()) {
      setAiError('Please enter a role name.');
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    setGenerationStep('Initiating competency mapping blueprint...');

    const stepTimer = setTimeout(() => {
      setGenerationStep('Assembling 3 domain-independent skills...');
    }, 2500);

    const stepTimer2 = setTimeout(() => {
      setGenerationStep('Drafting 30 customized multi-tier assessment items...');
    }, 5500);

    const stepTimer3 = setTimeout(() => {
      setGenerationStep('Formulating progressive checklist milestones...');
    }, 9000);

    try {
      const finalTechStack = aiTechStack === 'custom' ? customStackInput.trim() : aiTechStack;
      const response = await fetch('/api/role/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: aiRoleName.trim(),
          roleDescription: aiRoleDesc.trim(),
          roleType: aiRoleType,
          techStack: finalTechStack
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate competency profile.');
      }

      const data = await response.json();
      
      if (onGenerateAICareer) {
        const cleanId = `custom_ai_${Date.now()}`;
        const rawSkills = Array.isArray(data?.skills) ? data.skills : [];
        const rawQuestions = Array.isArray(data?.questions) ? data.questions : [];
        const rawRoadmaps = Array.isArray(data?.roadmaps) ? data.roadmaps : [];
        const rawCareer = data?.career || {};

        // Ensure career.id is mapped to cleanId, and also replace in questions & roadmaps
        const mappedSkills = rawSkills.map((s: any) => ({
          ...s,
          id: s?.id ? (s.id.startsWith('custom_') ? s.id : `custom_${s.id}`) : `custom_skill_${Math.random().toString(36).substr(2, 9)}`
        }));

        const skillIdMap = rawSkills.reduce((acc: Record<string, string>, s: any, idx: number) => {
          if (s?.id && mappedSkills[idx]) {
            acc[s.id] = mappedSkills[idx].id;
          }
          return acc;
        }, {});

        const rawSkillIds = Array.isArray(rawCareer.skillIds) ? rawCareer.skillIds : mappedSkills.map(m => m.id);
        const cleanSkillIds = rawSkillIds.map((sid: string) => skillIdMap[sid] || sid);

        // Calculate clean non-zero weights for each skill ID
        const rawWeights = rawCareer.weights || {};
        const computedWeights: Record<string, number> = {};
        let totalW = 0;

        cleanSkillIds.forEach((sid: string, idx: number) => {
          let w = Number(rawWeights[sid]);
          if (isNaN(w) || w <= 0) {
            const originalSid = rawSkillIds[idx];
            w = Number(rawWeights[originalSid]);
          }
          if (isNaN(w) || w <= 0) {
            w = 1 / (cleanSkillIds.length || 1);
          }
          computedWeights[sid] = w;
          totalW += w;
        });

        if (totalW > 0) {
          cleanSkillIds.forEach((sid: string) => {
            computedWeights[sid] = parseFloat((computedWeights[sid] / totalW).toFixed(2));
          });
        }

        const cleanCareer: Career = {
          id: cleanId,
          name: rawCareer.name || aiRoleName.trim() || 'Custom AI Role',
          description: rawCareer.description || aiRoleDesc.trim() || 'Custom generated profile.',
          skillIds: cleanSkillIds,
          weights: computedWeights,
          domainIcon: getDomainIconName(rawCareer.name || aiRoleName.trim()),
          roleType: aiRoleType
        };

        const cleanQuestions = rawQuestions.map((q: any) => ({
          ...q,
          id: q?.id || `q_${Date.now()}_${Math.random()}`,
          skillId: skillIdMap[q?.skillId] || q?.skillId
        }));

        const cleanRoadmaps = rawRoadmaps.map((r: any) => ({
          ...r,
          skillId: skillIdMap[r?.skillId] || r?.skillId
        }));

        onGenerateAICareer(cleanCareer, mappedSkills, cleanQuestions, cleanRoadmaps);
      }

      setAiRoleName('');
      setAiRoleDesc('');
      setShowCreator(false);
    } catch (err: any) {
      setAiError(err.message || 'Unable to connect to AI server. Please check your config.');
    } finally {
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsGenerating(false);
    }
  };

  const toggleSkillSelection = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter(id => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const handleDeleteCustomCareer = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const updated = customCareers.filter(c => c.id !== id);
    onUpdateCustomCareers(updated);
  };

  return (
    <div className="max-w-7xl w-full mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-emerald-500/20"
        >
          <Sparkles className="w-4.5 h-4.5" />
          ADAPTIVE SKILLS ASSESSMENT
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
        >
          KRÜSt <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-light">Career Readiness</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Evaluate your specific technical skills, identify gaps based on targeted role configurations, and generate professional milestone roadmaps. KRÜSt assesses readiness—you drive the learning.
        </motion.p>
      </div>

      {/* Main Grid: Selector or Creator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 columns: Career Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
              Choose Your Target Career Path
            </h2>
            
            <button
              id="toggle-custom-career-btn"
              onClick={() => setShowCreator(!showCreator)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-lg border border-slate-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Custom Path
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allCareers.map((career, idx) => {
              const isCustom = career.id.startsWith('custom_');
              const IconComponent = getDomainIconComponent(career.domainIcon || getDomainIconName(career.name));
              return (
                <motion.div
                  key={career.id}
                  id={`career-card-${career.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  onClick={() => onSelectCareer(career.id)}
                  className="group bg-slate-900/60 hover:bg-slate-800/80 p-5 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-emerald-400 shrink-0" />
                        {career.name}
                      </h3>
                      {isCustom ? (
                        <div className="flex items-center gap-1">
                          <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-medium border border-amber-500/20">Custom</span>
                          <button
                            id={`delete-career-${career.id}`}
                            onClick={(e) => handleDeleteCustomCareer(career.id, e)}
                            className="p-1 hover:text-red-400 text-slate-500 rounded transition-colors"
                            title="Delete custom career"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-medium">Preset</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
                      {career.description}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-500 block mb-1.5 uppercase tracking-wider">Required Core Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {career.skillIds.map(sid => {
                        const s = [...SKILLS_POOL, ...(customSkills || [])].find(sk => sk.id === sid);
                        return (
                          <span key={sid} className="bg-slate-900 text-slate-300 text-[10px] px-2 py-1 rounded-md border border-slate-800">
                            {s?.name || sid}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right 1 column: Side Info Panel */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-800/80 sticky top-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              KRÜSt Architecture
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              KRÜSt acts as a strict evaluation sandbox, mapping career definitions directly to custom skill subsets. Each career calculates its overall index via weighted scores of these independent skills.
            </p>

            <button
              id="open-custom-career-modal-btn"
              onClick={() => setShowCreator(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Custom Career Path</span>
            </button>
            
            <div className="space-y-3.5 pt-2">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <p className="text-[11px] text-slate-300">Choose a career, configuring which specific competencies are critical for your growth.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <p className="text-[11px] text-slate-300">Attempt individual, 10-question adaptive assessments tailored to adjust difficulty dynamically.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <p className="text-[11px] text-slate-300">Identify gap profiles (Strong, Weak, or Missing skills) and deploy high-level growth roadmaps.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP MODAL: Custom Career Path / Role Designer */}
      {showCreator && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isGenerating) {
              setShowCreator(false);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-950 p-6 sm:p-7 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto my-auto"
          >
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  Custom Role Designer
                </h3>
              </div>
              <button
                id="close-custom-career-modal-btn"
                onClick={() => setShowCreator(false)}
                disabled={isGenerating}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer disabled:opacity-40"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle creator mode tabs */}
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg mb-5 border border-slate-800">
              <button
                id="tab-ai-mode"
                type="button"
                onClick={() => { setCreatorMode('ai'); setAiError(null); }}
                className={`py-1.5 text-[10px] uppercase font-bold font-mono rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  creatorMode === 'ai'
                    ? 'bg-emerald-500 text-slate-950 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                AI Architect
              </button>
              <button
                id="tab-manual-mode"
                type="button"
                onClick={() => { setCreatorMode('manual'); setAiError(null); }}
                className={`py-1.5 text-[10px] uppercase font-bold font-mono rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  creatorMode === 'manual'
                    ? 'bg-emerald-500 text-slate-950 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Manual Spec
              </button>
            </div>

            {aiError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-start gap-1.5 font-mono">
                <span>⚠️</span>
                <span>{aiError}</span>
              </div>
            )}

            {creatorMode === 'ai' ? (
              // AI Builder Form
              <div className="space-y-4">
                {isGenerating ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 font-mono">
                    <Loader className="w-8 h-8 text-emerald-400 animate-spin" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white tracking-tight animate-pulse">GENERATING ASSESSMENT...</p>
                      <p className="text-[10px] text-slate-400">{generationStep}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Role/Career Title</label>
                      <input
                        id="ai-career-name-input"
                        type="text"
                        required
                        value={aiRoleName}
                        onChange={(e) => setAiRoleName(e.target.value)}
                        placeholder="e.g. Sales Specialist, Head Chef, or AI Engineer"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Target Path Type</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
                        <button
                          id="ai-role-type-job"
                          type="button"
                          onClick={() => setAiRoleType('job')}
                          className={`py-1.5 rounded text-[10px] uppercase font-mono border transition-all cursor-pointer ${
                            aiRoleType === 'job'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold'
                              : 'border-transparent text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Full-time Job
                        </button>
                        <button
                          id="ai-role-type-internship"
                          type="button"
                          onClick={() => setAiRoleType('internship')}
                          className={`py-1.5 rounded text-[10px] uppercase font-mono border transition-all cursor-pointer ${
                            aiRoleType === 'internship'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold'
                              : 'border-transparent text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Internship
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Technology Stack / Focus (Optional)</label>
                      <select
                        id="ai-tech-stack-select"
                        value={aiTechStack}
                        onChange={(e) => setAiTechStack(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-mono mb-2 cursor-pointer"
                      >
                        <option value="">Auto-Detect Industry Standard Competencies</option>
                        <option value="MERN">MERN Stack (MongoDB, Express, React, Node.js)</option>
                        <option value="Python">Python Stack (Python, FastAPI / Django / Flask, SQL)</option>
                        <option value="Java">Java Stack (Java, Spring Boot, Microservices, SQL)</option>
                        <option value=".NET">.NET Stack (C#, .NET Core, SQL Server)</option>
                        <option value="Frontend">Frontend Focus (HTML5, CSS3, JS ES6+, React, Web Vitals)</option>
                        <option value="Backend">Backend Focus (Node/Python, REST APIs, SQL, System Design)</option>
                        <option value="UI/UX">Design Focus (Figma, User Research, Wireframing, Accessibility)</option>
                        <option value="Data">Data & Analytics (Python, SQL, Pandas, Tableau/PowerBI)</option>
                        <option value="DevOps">DevOps & Cloud (Linux, Docker, Kubernetes, CI/CD, Terraform)</option>
                        <option value="custom">Other / Custom Stack...</option>
                      </select>
                      {aiTechStack === 'custom' && (
                        <input
                          id="ai-tech-stack-custom-input"
                          type="text"
                          value={customStackInput}
                          onChange={(e) => setCustomStackInput(e.target.value)}
                          placeholder="e.g. Vue.js, Laravel, MySQL, Docker"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono mt-1"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Context & Focus (Optional)</label>
                      <textarea
                        id="ai-career-desc-input"
                        value={aiRoleDesc}
                        onChange={(e) => setAiRoleDesc(e.target.value)}
                        placeholder="Focus on pipeline control, CRM software, leadership, or custom preparation standards..."
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none font-mono"
                      />
                    </div>

                    <button
                      id="generate-ai-career-btn"
                      type="button"
                      onClick={handleTriggerAIGeneration}
                      className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Brain className="w-4 h-4" />
                      AI-Generate Assessment Suite
                    </button>
                  </>
                )}
              </div>
            ) : (
              // Manual Setup Form
              <>
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Career/Role Name</label>
                    <input
                      id="custom-career-name-input"
                      type="text"
                      value={newCareerName}
                      onChange={(e) => setNewCareerName(e.target.value)}
                      placeholder="e.g. Fullstack Engineer"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Brief Description</label>
                    <textarea
                      id="custom-career-desc-input"
                      value={newCareerDesc}
                      onChange={(e) => setNewCareerDesc(e.target.value)}
                      placeholder="What does this position entail..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Select Required Skills (Min 1)</label>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar">
                    {SKILLS_POOL.map(skill => {
                      const selected = selectedSkills.includes(skill.id);
                      return (
                        <div
                          key={skill.id}
                          id={`skill-toggle-${skill.id}`}
                          onClick={() => toggleSkillSelection(skill.id)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                            selected 
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold">{skill.name}</p>
                            <p className="text-[9px] opacity-75">{skill.category}</p>
                          </div>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            selected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                          }`}>
                            {selected && <Check className="w-3 h-3 stroke-[3px]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  id="create-custom-career-btn"
                  disabled={!newCareerName || !newCareerDesc || selectedSkills.length === 0}
                  onClick={handleCreateCustomCareer}
                  className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  Create and Select
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
