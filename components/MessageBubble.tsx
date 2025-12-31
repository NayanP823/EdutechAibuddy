
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
        const safeSrc = part.src.includes(' ') ? part.src.replace(/\s/g, '%20') : part.src;
        return (
          <div key={idx} className="my-6 rounded-2xl overflow-hidden shadow-md border-4 border-white transform transition-hover hover:scale-[1.02]">
            <img 
              src={safeSrc} 
              alt={part.alt} 
              className="w-full h-auto object-cover max-h-80"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        );
      }
      return <div key={idx} className="prose prose-slate prose-indigo max-w-none">{parseTextBlocks(part.content)}</div>;
    });
  };

  const parseTextBlocks = (text: string) => {
    const blocks = text.split(/\n\n+/);
    return blocks.map((block, index) => {
      // Handle Headers
      if (block.match(/^##+\s/)) {
        const level = block.match(/^##+/)?.[0].length || 2;
        const content = block.replace(/^##+\s/, '');
        return (
          <h3 key={index} className={`font-fun font-bold text-indigo-700 mb-3 mt-6 tracking-tight ${level === 2 ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}>
            {formatInline(content)}
          </h3>
        );
      }
      
      // Handle Lists
      if (block.match(/^[*-]\s/m)) {
         const items = block.split('\n').filter(line => line.trim().match(/^[*-]\s/));
         if (items.length > 0) {
           return (
             <ul key={index} className="list-disc pl-6 space-y-2 mb-4 text-slate-700">
               {items.map((item, i) => (
                 <li key={i} className="pl-1">{formatInline(item.replace(/^[*-]\s/, ''))}</li>
               ))}
             </ul>
           );
         }
      }

      // Handle standard paragraphs
      return <p key={index} className="mb-4 leading-relaxed text-slate-800 text-[15px] md:text-[16px]">{formatInline(block)}</p>;
    });
  };

  const formatInline = (text: string) => {
    // Split by bold (**), italics (*), and maybe code (`)
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-indigo-900 bg-indigo-50 px-1 rounded-md border-b-2 border-indigo-200">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={i} className="italic text-indigo-600 font-medium">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} mb-8 animate-fade-in-up`}>
      <div className={`flex max-w-[92%] md:max-w-[85%] flex-col ${isBot ? 'items-start' : 'items-end'}`}>
        
        <div className={`flex items-end gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className="flex-shrink-0 hidden md:block mb-1">
             {isBot ? (
               <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg animate-float">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.221 69.78 69.78 0 00-2.658.814m-15.481 0A59.906 59.906 0 0112 3.493a59.906 59.906 0 0110.499 5.221M12 20.904a48.622 48.622 0 01-3.047-3.355m3.047 3.355A48.622 48.622 0 0115.047 17.549" />
                 </svg>
               </div>
             ) : (
                <div className="w-10 h-10 rounded-2xl bg-slate-200 overflow-hidden border-2 border-white shadow-md">
                  <img src={`https://picsum.photos/seed/${message.id}/80/80`} alt="User" />
                </div>
             )}
          </div>

          <div 
            className={`relative px-6 py-5 rounded-3xl shadow-sm border
              ${isBot 
                ? 'bg-gradient-to-br from-white to-indigo-50 text-slate-800 border-indigo-100 rounded-bl-none' 
                : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-500 rounded-br-none shadow-indigo-100'
              }`}
          >
            {isBot && onSpeak && !message.isThinking && (
              <button 
                onClick={() => onSpeak(message.text, message.id)}
                className={`absolute -top-3 -right-3 p-2.5 rounded-full shadow-lg transition-all z-10 
                  ${message.audioPlaying 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : message.isAudioLoading 
                      ? 'bg-white text-indigo-600 cursor-wait'
                      : 'bg-white text-indigo-600 hover:scale-110 active:scale-95 border border-indigo-100'
                  }`}
              >
                {message.isAudioLoading ? (
                  <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full"></div>
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
              <div>{renderMarkdown(message.text)}</div>
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed font-medium">{message.text}</div>
            )}

            {message.isThinking && (
               <div className="flex items-center mt-3 text-indigo-400">
                 <span className="text-xs font-bold uppercase tracking-wider mr-2 font-fun">EduBuddy is Thinking...</span>
                 <div className="flex gap-1">
                   <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                   <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                   <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
            )}
          </div>
        </div>

        {isBot && !message.isThinking && (
          <div className="flex items-center gap-2 mt-2 md:ml-12 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={() => onFeedback('up', message.id)} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
               </svg>
             </button>
             <button onClick={() => onFeedback('simplify', message.id)} className="px-4 py-1.5 text-xs font-bold text-indigo-600 bg-white hover:bg-indigo-50 rounded-full border border-indigo-100 transition-all shadow-sm font-fun">
               ✨ Make it Simpler!
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
