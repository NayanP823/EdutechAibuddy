import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { Button } from './components/Button';
import { Message, Sender, UserPreferences, AgeGroup, UserLanguage } from './types';
import { DEFAULT_PREFERENCES, INITIAL_GREETING } from './constants';
import { startChatSession, sendMessageStream, updateSessionContext } from './services/geminiService';

export default function App() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: Sender.Bot, text: INITIAL_GREETING, timestamp: Date.now() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat on mount
  useEffect(() => {
    try {
        startChatSession(preferences);
    } catch (e) {
        console.error("Failed to start chat session. Check API Key.");
        setMessages(prev => [...prev, {
            id: 'err-init',
            role: Sender.Bot,
            text: "Error: API Key missing. Please set process.env.API_KEY.",
            timestamp: Date.now()
        }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Sender.User,
      text: inputText.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Add placeholder bot message
    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: botMsgId,
      role: Sender.Bot,
      text: '',
      timestamp: Date.now(),
      isThinking: true
    }]);

    try {
      const stream = sendMessageStream(userMsg.text);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, text: fullResponse, isThinking: false } 
            : msg
        ));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    // Restart session with new context
    updateSessionContext(newPrefs);
    
    // Add system notification in chat
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: Sender.Bot,
      text: `*Updating profile to: ${newPrefs.ageGroup}, ${newPrefs.language}.*`,
      timestamp: Date.now(),
      isThinking: false
    }]);
  };

  const handleFeedback = (type: 'up' | 'down' | 'simplify', id: string) => {
    console.log(`Feedback: ${type} on message ${id}`);
    
    if (type === 'simplify') {
        setInputText("That was too hard. Can you explain it simpler?");
        // Optionally auto-send:
        // handleSendMessage(); 
        // (But usually better to let user confirm or edit)
    }
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Sidebar */}
      <Sidebar 
        preferences={preferences} 
        onPreferenceChange={handlePreferenceChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white lg:bg-slate-50 relative">
        
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
               </svg>
             </div>
             <span className="font-bold text-slate-800">EduBuddy</span>
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
             </svg>
           </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
           <div className="max-w-3xl mx-auto">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onFeedback={handleFeedback} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
           </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-20">
           <div className="max-w-3xl mx-auto relative">
              <div className="relative flex items-center gap-2 bg-white rounded-2xl border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent px-2 py-2 transition-all">
                 <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask about math, history, stories..."
                    className="flex-1 max-h-32 min-h-[48px] py-3 px-3 bg-transparent resize-none focus:outline-none text-slate-800 placeholder-slate-400"
                    rows={1}
                 />
                 <Button 
                   onClick={handleSendMessage} 
                   disabled={isLoading || !inputText.trim()}
                   className="rounded-xl !p-3 self-end mb-0.5"
                 >
                   {isLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                   ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                   )}
                 </Button>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-2">
                EduBuddy can make mistakes. Check important info.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}