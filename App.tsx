import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, AurumAnalysis, JournalEntry, Message } from './types';
import { analyzeJournalEntry } from './services/geminiService';
import { askDeepseek } from './services/deepseekService';
import { saveJournalEntryToSupabase, getJournalEntriesFromSupabase } from './services/journalService';
import { BreathingPresence } from './components/BreathingPresence';
import { FeatherIcon, SparklesIcon, ArrowRightIcon, RefreshCwIcon, MicIcon, StopIcon, HistoryIcon, XIcon, HandHeartIcon, MicOffIcon, PhoneHangUpIcon, KeyboardIcon, SendIcon } from './components/Icons';
import { useLiveAurum } from './hooks/useLiveAurum';
import { trackBetaSession } from './services/betaTrackingService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INTRO);
  
  // Replaced single journalText with chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [analysis, setAnalysis] = useState<AurumAnalysis | null>(null);
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { connect, disconnect, isConnected, isError, volume, transcript, isMuted, toggleMute } = useLiveAurum();

  useEffect(() => {
    trackBetaSession();
  }, []);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('aurum_history');
    if (saved) {
      try {
        const parsedHistory = JSON.parse(saved);
        setHistory(parsedHistory);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    (async () => {
      try {
        const supabaseHistory = await getJournalEntriesFromSupabase();
        if (supabaseHistory.length > 0) {
          setHistory(supabaseHistory);
          localStorage.setItem('aurum_history', JSON.stringify(supabaseHistory));
        }
      } catch (e) {
        console.error("Failed to load history from Supabase", e);
      }
    })();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (appState === AppState.JOURNALING) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, appState, isTyping]);

  // Auto-resize input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const saveEntry = (entry: JournalEntry) => {
    setHistory(prev => {
      const updatedHistory = [entry, ...prev];
      localStorage.setItem('aurum_history', JSON.stringify(updatedHistory));
      return updatedHistory;
    });

    saveJournalEntryToSupabase(entry).catch((error) => {
      console.error('Failed to persist journal entry to Supabase', error);
    });
  };

  const handleStart = () => {
    setMessages([]);
    setAppState(AppState.JOURNALING);
  };

  const handleStartVoice = () => {
    setAppState(AppState.VOICE_SESSION);
    connect();
  };

  const handleStopVoice = () => {
    disconnect();
    setAppState(AppState.INTRO);
  };

  const switchToKeyboard = () => {
    disconnect(); // End call when switching to text
    setAppState(AppState.JOURNALING);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: inputValue.trim()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
        const responseText = await askDeepseek(newUserMsg.text);
        
        const newAurumMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText
        };
        
        setMessages(prev => [...prev, newAurumMsg]);
    } catch (error) {
        console.error("Chat error", error);
    } finally {
        setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  }

  const handleAnalyze = async () => {
    // Concatenate conversation for analysis
    const fullText = messages.map(m => `${m.role === 'user' ? 'Moi' : 'Aurum'}: ${m.text}`).join('\n\n');
    
    if (!fullText.trim()) return;
    
    setAppState(AppState.ANALYZING);
    try {
      const result = await analyzeJournalEntry(fullText);
      setAnalysis(result);
      
      // Save to history
      saveEntry({
        id: Date.now().toString(),
        text: fullText,
        timestamp: Date.now(),
        analysis: result
      });

      setAppState(AppState.INSIGHT);
    } catch (error) {
      console.error("Analysis failed", error);
      setAppState(AppState.JOURNALING);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInputValue('');
    setAnalysis(null);
    setAppState(AppState.JOURNALING);
  };

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
  };

  const loadEntryFromHistory = (entry: JournalEntry) => {
    setAnalysis(entry.analysis);
    // For viewing old entries, we just show the analysis screen.
    // If we wanted to load the chat log, we'd need to store the message structure in history too.
    // For now, JournalEntry stores 'text' which is the flattened chat log.
    setAppState(AppState.INSIGHT);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-[#E5D0A8] selection:text-[#5C554B]">
      
      {/* Ambient Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F2EFE9]" />
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />

      {/* Header / Nav - HIDDEN IN VOICE MODE */}
      {appState !== AppState.VOICE_SESSION && (
        <div className="fixed top-6 right-6 z-50">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="relative p-3 bg-[#FDFBF7] bg-opacity-90 rounded-full shadow-md hover:shadow-lg transition-all text-[#8A8175] border border-[#E5D0A8]/30"
            aria-label="Historique"
          >
            {showHistory ? <XIcon className="w-5 h-5"/> : <HistoryIcon className="w-5 h-5"/>}
            
            {!showHistory && history.length > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-[#C5A059] rounded-full border-2 border-[#FDFBF7] animate-pulse"></span>
            )}
          </button>
        </div>
      )}

      {/* History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-[#5C554B] z-30"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 w-full md:w-96 h-full bg-[#FDFBF7] shadow-2xl z-40 p-8 overflow-y-auto border-l border-[#E5D0A8]"
            >
              <h2 className="serif text-2xl text-[#5C554B] mb-8 mt-12 flex items-center gap-3">
                <HistoryIcon className="w-6 h-6 text-[#C5A059]"/>
                Le Fil d'Or
              </h2>
              
              <div className="space-y-6">
                {history.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-[#E5D0A8] rounded-xl">
                    <p className="text-[#8A8175] italic text-lg mb-2">Votre histoire commence ici.</p>
                    <p className="text-sm text-[#A89F91]">Prenez un moment pour écrire votre première entrée.</p>
                  </div>
                ) : (
                  history.map((entry) => (
                    <div 
                      key={entry.id} 
                      onClick={() => loadEntryFromHistory(entry)}
                      className="p-5 rounded-xl bg-[#FAF6EE] border border-transparent hover:border-[#E5D0A8] hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#A89F91]">{formatDate(entry.timestamp)}</span>
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.analysis.dominantEmotionColor || '#E5D0A8' }} />
                      </div>
                      <p className="serif text-[#5C554B] text-lg mb-2 group-hover:text-[#C5A059] transition-colors font-medium">
                        {entry.analysis.emotionalTone || "Réflexion"}
                      </p>
                      <p className="text-sm text-[#8A8175] line-clamp-2 font-light italic leading-relaxed">
                        "{entry.text.substring(0, 100)}..."
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* INTRO VIEW */}
        {appState === AppState.INTRO && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center text-center max-w-lg z-10"
          >
            <div className="mb-8 transform hover:scale-105 transition-transform duration-1000">
              <BreathingPresence state="breathing" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-light tracking-wide text-[#5C554B] mb-6 serif italic">
              Aurum
            </h1>
            <p className="text-lg md:text-xl text-[#8A8175] font-light leading-relaxed mb-12 max-w-sm">
              Déposez vos pensées.<br/>
              Laissez la présence dorée vous comprendre.
            </p>

            <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
              <button 
                onClick={handleStart}
                className="group flex items-center justify-center space-x-3 px-8 py-4 bg-[#E5D0A8] bg-opacity-20 hover:bg-opacity-30 border border-[#D4C5A9] rounded-full transition-all duration-700 ease-out backdrop-blur-sm"
              >
                <span className="text-[#5C554B] tracking-widest text-sm uppercase font-medium">Écrire</span>
                <ArrowRightIcon className="w-4 h-4 text-[#8A8175] group-hover:translate-x-1 transition-transform duration-500" />
              </button>
              
              <button 
                onClick={handleStartVoice}
                className="group flex items-center justify-center space-x-3 px-8 py-4 bg-white bg-opacity-50 hover:bg-opacity-80 border border-[#E5D0A8] rounded-full transition-all duration-700 ease-out shadow-sm hover:shadow-md"
              >
                <span className="text-[#5C554B] tracking-widest text-sm uppercase font-medium">Parler</span>
                <MicIcon className="w-4 h-4 text-[#8A8175]" />
              </button>
            </div>
          </motion.div>
        )}

        {/* VOICE SESSION VIEW - IMMERSIVE OVERLAY */}
        {appState === AppState.VOICE_SESSION && (
          <motion.div 
            key="voice"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#FDFBF7] overflow-hidden"
          >
            {/* Background Texture for immersion */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />
            
            {/* Top Status */}
            <div className="mt-12 z-10 flex flex-col items-center">
                <AnimatePresence>
                   {!isConnected && (
                     <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <span className="serif italic text-[#8A8175] text-lg animate-pulse">Connexion à Aurum...</span>
                     </motion.div>
                   )}
                </AnimatePresence>
                {isError && <span className="text-red-400 text-sm bg-red-50 px-3 py-1 rounded-full">Erreur de connexion</span>}
            </div>

            {/* Central Liquid Orb */}
            <div className="flex-grow flex items-center justify-center relative z-0">
               <BreathingPresence 
                  state="voice" 
                  customColor="#E5D0A8" 
                  volume={isMuted ? 0 : volume}
               />
            </div>

            {/* Minimal Transcription */}
             <div className="w-full text-center h-24 px-8 flex items-center justify-center z-10 pointer-events-none mb-4">
                 <AnimatePresence>
                   {transcript.model && (
                     <motion.p
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 0.7, y: 0 }}
                       exit={{ opacity: 0 }}
                       className="text-[#5C554B] font-serif text-lg italic max-w-lg leading-relaxed"
                     >
                        "{transcript.model}"
                     </motion.p>
                   )}
                 </AnimatePresence>
             </div>

            {/* Bottom Control Dock */}
            <div className="mb-12 z-20 w-full flex justify-center items-center gap-8">
                {/* Keyboard / Text Mode */}
                <button 
                  onClick={switchToKeyboard}
                  className="p-4 rounded-full bg-white/50 hover:bg-white/80 border border-[#E5D0A8]/30 text-[#5C554B] transition-all shadow-sm hover:scale-105 active:scale-95"
                  title="Clavier"
                >
                    <KeyboardIcon className="w-6 h-6" />
                </button>

                {/* Hang Up - Main Action */}
                <button 
                  onClick={handleStopVoice}
                  className="p-6 rounded-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white shadow-xl shadow-red-200 transition-all hover:scale-110 active:scale-95"
                  title="Raccrocher"
                >
                    <PhoneHangUpIcon className="w-8 h-8" />
                </button>

                {/* Mute */}
                <button 
                  onClick={toggleMute}
                  className={`p-4 rounded-full border transition-all shadow-sm hover:scale-105 active:scale-95 ${
                    isMuted 
                      ? 'bg-[#5C554B] text-white border-transparent' 
                      : 'bg-white/50 hover:bg-white/80 border-[#E5D0A8]/30 text-[#5C554B]'
                  }`}
                  title={isMuted ? "Activer le micro" : "Couper le micro"}
                >
                    {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
                </button>
            </div>
          </motion.div>
        )}

        {/* CHAT/JOURNALING VIEW */}
        {appState === AppState.JOURNALING && (
          <motion.div 
            key="journaling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-3xl flex flex-col h-[85vh] z-10 relative"
          >
             {/* Header */}
            <div className="flex items-center justify-between mb-4 px-4 flex-shrink-0">
              <span className="serif italic text-2xl text-[#C5A059]">Un espace rien que pour toi</span>
               <div className="flex gap-2">
                 <button 
                  onClick={handleStartVoice}
                  className="p-2 rounded-full text-[#8A8175] hover:bg-[#E5D0A8]/20 transition-all"
                  title="Discuter avec Aurum"
                 >
                   <MicIcon className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={handleAnalyze}
                   disabled={messages.length === 0}
                   className={`p-2 rounded-full transition-all ${messages.length > 0 ? 'text-[#C5A059] hover:bg-[#E5D0A8]/20' : 'text-[#8A8175]/30 cursor-not-allowed'}`}
                   title="Terminer et Refléter"
                 >
                   <SparklesIcon className="w-5 h-5" />
                 </button>
               </div>
            </div>

            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto px-4 pb-4 space-y-6 scrollbar-thin scrollbar-thumb-amber-100 scrollbar-track-transparent">
               {messages.length === 0 && (
                   <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
                      <FeatherIcon className="w-8 h-8 text-[#E5D0A8]" />
                      <p className="serif text-[#8A8175] italic">Commencez à écrire...</p>
                   </div>
               )}
               
               {messages.map((msg) => (
                 <motion.div 
                   key={msg.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                 >
                    <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-[#E5D0A8] bg-opacity-20 text-[#5C554B] rounded-tr-sm' 
                          : 'bg-[#FDFBF7] border border-[#E5D0A8]/30 shadow-sm text-[#5C554B] font-serif italic rounded-tl-sm'
                    }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    </div>
                 </motion.div>
               ))}

               {isTyping && (
                 <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }}
                   className="flex justify-start w-full"
                 >
                   <div className="flex items-center space-x-2 pl-2">
                      <div className="w-2 h-2 bg-[#E5D0A8] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-2 h-2 bg-[#E5D0A8] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-[#E5D0A8] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                   </div>
                 </motion.div>
               )}
               <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="mt-2 p-2 flex-shrink-0">
               <div className="relative flex items-end gap-2 bg-[#FDFBF7] border border-[#E5D0A8] rounded-3xl p-2 shadow-sm focus-within:shadow-md transition-shadow">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrivez à Aurum..."
                    className="flex-grow max-h-32 bg-transparent border-none outline-none resize-none py-3 px-4 text-[#5C554B] placeholder-[#B0A89B] scrollbar-hide"
                    rows={1}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="p-3 bg-[#E5D0A8] hover:bg-[#D4C5A9] text-[#5C554B] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-1"
                  >
                     <SendIcon className="w-5 h-5" />
                  </button>
               </div>
            </div>
          </motion.div>
        )}

        {/* ANALYZING VIEW */}
        {appState === AppState.ANALYZING && (
          <motion.div 
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center z-10"
          >
            <BreathingPresence state="analyzing" />
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mt-12 text-[#8A8175] serif italic text-2xl"
            >
              Aurum médite sur vos mots...
            </motion.p>
          </motion.div>
        )}

        {/* INSIGHT VIEW */}
        {appState === AppState.INSIGHT && analysis && (
          <motion.div 
            key="insight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-full max-w-4xl pb-12 z-10"
          >
            <div className="flex flex-col md:flex-row gap-16">
              
              {/* Left Column: Visual & Patterns */}
              <div className="md:w-1/3 flex flex-col items-center md:items-start space-y-10">
                <div className="relative group">
                   <div className="transform group-hover:scale-105 transition-transform duration-1000">
                     <BreathingPresence state="breathing" customColor={analysis.dominantEmotionColor} />
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="serif italic text-xl text-[#5C554B] bg-[#FDFBF7]/90 px-6 py-2 rounded-full backdrop-blur-sm shadow-sm border border-[#E5D0A8]/20">
                       {analysis.emotionalTone}
                     </span>
                   </div>
                </div>

                <div className="w-full space-y-8">
                  <div>
                    <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#A89F91] mb-4 pl-1">Patterns Détectés</h3>
                    <div className="flex flex-wrap gap-3">
                      {analysis.patterns.map((pattern, i) => (
                        <span key={i} className="px-4 py-2 bg-[#E5D0A8] bg-opacity-20 rounded-lg text-[#5C554B] text-sm font-light border border-[#E5D0A8]/30">
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Micro Ritual Block */}
                  <div className="bg-[#FAF6EE] p-6 rounded-2xl border border-[#E5D0A8] shadow-md relative overflow-hidden group hover:shadow-lg transition-shadow duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                      <HandHeartIcon className="w-12 h-12 text-[#C5A059]" />
                    </div>
                    <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#C5A059] mb-4 flex items-center gap-2">
                      <HandHeartIcon className="w-4 h-4" />
                      Micro-Rituel
                    </h3>
                    <p className="text-[#5C554B] text-lg font-serif italic leading-relaxed relative z-10">
                      "{analysis.microRitual || "Prenez une grande inspiration et expirez lentement, en relâchant vos épaules."}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Reflection */}
              <div className="md:w-2/3 flex flex-col space-y-12 pt-8">
                <div>
                  <h3 className="serif text-3xl md:text-5xl text-[#5C554B] leading-tight mb-8">
                    {analysis.reflection}
                  </h3>
                </div>

                <div className="border-l-4 border-[#E5D0A8]/50 pl-8 py-2">
                  <p className="text-[#8A8175] text-xl md:text-2xl font-light italic leading-relaxed">
                    {analysis.gentleInquiry}
                  </p>
                </div>

                <div className="pt-12 flex justify-end">
                   <button 
                    onClick={handleReset}
                    className="group flex items-center space-x-3 text-[#8A8175] hover:text-[#5C554B] transition-colors px-6 py-3 rounded-full hover:bg-[#E5D0A8]/20"
                   >
                     <RefreshCwIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                     <span className="text-sm tracking-wide uppercase font-medium">Nouvelle entrée</span>
                   </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default App;
