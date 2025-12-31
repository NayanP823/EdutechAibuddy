
import React from 'react';
import { Message, Sender } from '../types';

interface MessageBubbleProps {
  message: Message;
  onFeedback: (type: 'up' | 'down' | 'simplify', id: string) => void;
  onSpeak?: (text: string, id: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onFeedback, onSpeak }) => {
  const isBot = message.role === Sender.Bot;

  const renderMarkdown = (text: string) => {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = imageRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'image', alt: match[1], src: match[2] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts.map((part, idx) => {
      if (part.type === 'image') {
        return (
          <div key={idx} className="my-4 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50">
            <img 
              src={part.src} 
              alt={part.alt} 
              className="w-full h-auto object-cover max-h-64 animate-fade-in"
              loading="lazy"
            />
          </div>
        );
      }
      return <div key={idx}>{parseTextBlocks(part.content)}</div>;
    });
  };

  const parseTextBlocks = (text: string) => {
    const blocks = text.split(/\n\n+/);
    return blocks.map((block, index) => {
      if (block.match(/^##+\s/)) {
        const level = block.match(/^##+/)?.[0].length || 2;
        const content = block.replace(/^##+\s/, '');
        return (
          <h3 key={index} className={`font-bold text-slate-800 mb-2 mt-4 ${level === 2 ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`}>
            {formatInline(content)}
          </h3>
        );
      }
      
      if (block.match(/^[*-]\s/m)) {
         const items = block.split('\n').filter(line => line.trim().match(/^[*-]\s/));
         if (items.length > 0) {
           return (
             <ul key={index} className="list-disc pl-5 space-y-1 mb-3 text-slate-700 marker:text-indigo-400">
               {items.map((item, i) => (
                 <li key={i}>{formatInline(item.replace(/^[*-]\s/, ''))}</li>
               ))}
             </ul>
           );
         }
      }

      return <p key={index} className="mb-3 leading-relaxed text-slate-700">{formatInline(block)}</p>;
    });
  };

  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={i} className="italic text-slate-600">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const isSpeaking = message.audioPlaying || message.isAudioLoading;

  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} mb-6 animate-fade-in-up`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] flex-col ${isBot ? 'items-start' : 'items-end'}`}>
        
        <div className={`flex items-end gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className="flex-shrink-0 hidden md:block mb-2">
             {isBot ? (
               <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.221 69.78 69.78 0 00-2.658.814m-15.481 0A59.906 59.906 0 0112 3.493a59.906 59.906 0 0110.499 5.221M12 20.904a48.622 48.622 0 01-3.047-3.355m3.047 3.355A48.622 48.622 0 0115.047 17.549" />
                 </svg>
               </div>
             ) : (
                <img 
                  src={`https://picsum.photos/seed/${message.id}/32/32`} 
                  alt="User" 
                  className="w-8 h-8 rounded-xl border-2 border-white shadow-sm"
                />
             )}
          </div>

          <div 
            className={`relative px-5 py-4 text-sm md:text-base rounded-2xl shadow-sm
              ${isBot 
                ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none' 
                : 'bg-indigo-600 text-white rounded-tr-none'
              }`}
          >
            {isBot && onSpeak && !message.isThinking && (
              <button 
                onClick={() => onSpeak(message.text, message.id)}
                className={`absolute -top-3 -right-3 p-2 rounded-full shadow-md transition-all z-10 
                  ${message.audioPlaying 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : message.isAudioLoading 
                      ? 'bg-indigo-100 text-indigo-600 cursor-wait'
                      : 'bg-white text-slate-500 hover:text-indigo-600 hover:scale-110 active:scale-95'
                  }`}
                title={message.audioPlaying ? "Stop listening" : "Listen to response"}
              >
                {message.isAudioLoading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : message.audioPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            )}

            {isBot ? (
              <div className="prose prose-sm prose-indigo max-w-none">
                {renderMarkdown(message.text)}
              </div>
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
            )}

            {message.isThinking && (
               <div className="flex items-center mt-2 text-slate-400">
                 <span className="text-xs font-medium mr-2">Thinking</span>
                 <span className="inline-flex">
                   <span className="animate-bounce mx-0.5 h-1 w-1 bg-slate-400 rounded-full"></span>
                   <span className="animate-bounce mx-0.5 delay-100 h-1 w-1 bg-slate-400 rounded-full"></span>
                   <span className="animate-bounce mx-0.5 delay-200 h-1 w-1 bg-slate-400 rounded-full"></span>
                 </span>
               </div>
            )}
          </div>
        </div>

        {isBot && !message.isThinking && (
          <div className="flex items-center gap-2 mt-2 md:ml-11">
             <button onClick={() => onFeedback('up', message.id)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
               </svg>
             </button>
             <button onClick={() => onFeedback('down', message.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.92m0 0h3.583a2 2 0 011.956 1.573l.417 3.777a2 2 0 01-1.946 2.25h-1.135M14 10v10a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2" />
                </svg>
             </button>
             <button onClick={() => onFeedback('simplify', message.id)} className="px-3 py-1 text-xs font-medium text-slate-500 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-full border border-slate-200 transition-colors shadow-sm">
               ✏️ Simplify
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
