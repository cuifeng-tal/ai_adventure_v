
import React from 'react';

interface GameLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      {/* Decorative background elements */}
      <div className="fixed top-10 left-10 text-6xl opacity-30 animate-float pointer-events-none select-none">☁️</div>
      <div className="fixed top-40 right-20 text-5xl opacity-30 animate-float pointer-events-none select-none" style={{animationDelay: '1s'}}>🌟</div>
      <div className="fixed bottom-20 left-20 text-5xl opacity-30 animate-float pointer-events-none select-none" style={{animationDelay: '1.5s'}}>🌳</div>
      <div className="fixed bottom-10 right-10 text-6xl opacity-30 animate-float pointer-events-none select-none" style={{animationDelay: '0.5s'}}>🎈</div>

      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] border-[6px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 md:p-12 relative overflow-hidden">
        {/* Colorful accent strips */}
        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-pink-400 via-yellow-400 to-cyan-400"></div>
        
        {title && (
          <div className="relative mb-10">
            <h1 className="text-4xl md:text-5xl cartoon-font text-center relative z-10 py-2">
              <span className="bg-yellow-300 px-6 py-2 rounded-2xl border-4 border-black inline-block transform -rotate-2 hover:rotate-0 transition-transform cursor-default shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {title}
              </span>
            </h1>
          </div>
        )}
        
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Bottom pattern deco */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-100 rounded-full opacity-50 -z-0"></div>
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-100 rounded-full opacity-50 -z-0"></div>
      </div>
    </div>
  );
};
