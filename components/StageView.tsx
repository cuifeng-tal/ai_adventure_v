
import React from 'react';

interface StageViewProps {
  image: string;
  story: string;
  question: string;
  onAnswer: (ans: string) => void;
  onReadAloud?: () => void;
  isLoading?: boolean;
  isAudioPlaying?: boolean;
}

export const StageView: React.FC<StageViewProps> = ({ 
  image, 
  story, 
  question, 
  onAnswer, 
  onReadAloud,
  isLoading,
  isAudioPlaying 
}) => {
  const [input, setInput] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAnswer(input.trim());
      setInput('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cartoon Image Frame */}
      <div className="relative group rounded-[2rem] border-[6px] border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] bg-blue-50">
        <img 
          src={image} 
          alt="Adventure Scene" 
          className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        {isLoading && (
            <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center backdrop-blur-md">
                <div className="text-6xl animate-spin mb-4">🌀</div>
                <div className="cartoon-font text-3xl text-blue-600 animate-pulse">正在施展魔法...</div>
            </div>
        )}
      </div>

      {/* Story & Question Area */}
      <div className="relative">
        {/* Speech Bubble Tail */}
        <div className="absolute -top-6 left-12 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[25px] border-b-cyan-100 hidden md:block"></div>
        
        <div className="bg-cyan-50 border-[5px] border-black rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_rgba(34,211,238,1)] relative">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                <div className="flex-1">
                    <p className="text-2xl text-gray-800 leading-relaxed font-medium italic">
                       ✨ “{story}”
                    </p>
                </div>
                {onReadAloud && (
                    <button 
                        onClick={onReadAloud}
                        disabled={isAudioPlaying || isLoading}
                        className={`shrink-0 p-4 rounded-full border-4 border-black transition-all transform active:scale-95 ${
                          isAudioPlaying 
                            ? 'bg-pink-400 animate-pulse shadow-none translate-y-1' 
                            : 'bg-white hover:bg-pink-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                        title="朗读剧情"
                    >
                        <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14.075 2.225a.75.75 0 011.05.15 11.5 11.5 0 010 14.25.75.75 0 01-1.2-1.05 10 10 0 000-12.3.75.75 0 01.15-1.05zM16.5 4.5a.75.75 0 011.05.15 8.5 8.5 0 010 10.7.75.75 0 01-1.2-.9 7 7 0 000-8.9.75.75 0 01.15-1.05z"/>
                            <path d="M12 3.25c.414 0 .75.336.75.75v16a.75.75 0 01-1.28.53L6.15 15.25H4.75a2 2 0 01-2-2v-2.5a2 2 0 012-2h1.4l5.32-5.28a.75.75 0 01.53-.22z"/>
                        </svg>
                    </button>
                )}
            </div>

            <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-inner-lg">
                <p className="text-3xl cartoon-font text-blue-600 text-center drop-shadow-sm">
                    {question}
                </p>
            </div>
        </div>
      </div>

      {/* Input Section */}
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="写下你的答案..."
          className="flex-1 px-8 py-5 rounded-full border-[5px] border-black focus:bg-yellow-50 outline-none text-2xl transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-1 focus:translate-y-1"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-green-400 hover:bg-green-500 disabled:opacity-50 text-black cartoon-font text-3xl px-12 py-5 rounded-full border-[5px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2"
        >
          <span>冲呀！</span>
          <span className="text-3xl">🚀</span>
        </button>
      </form>
    </div>
  );
};
