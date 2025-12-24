
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GameState, GameContext, Difficulty, AbilityModel } from './types';
import { 
    generateGameContent, 
    generateCartoonImage, 
    generateSpeech, 
    decodeAudioData,
    decode,
    level1Schema, 
    level2Schema,
    certificateSchema 
} from './services/geminiService';
import { GameLayout } from './components/GameLayout';
import { StageView } from './components/StageView';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.INITIAL);
  const [context, setContext] = useState<GameContext>({
    initialQuestion: '',
    l1Story: '',
    l1Question: '',
    l1Answer: '',
    l1Image: '',
    l1FailCount: 0,
    difficulty: Difficulty.MEDIUM,
    l2Story: '',
    l2Question: '',
    l2Answer: '',
    l2Image: '',
    isAudioPlaying: false
  });
  const [ability, setAbility] = useState<AbilityModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    setContext(prev => ({ ...prev, isAudioPlaying: false }));
  }, []);

  const playSpeech = async (text: string) => {
    if (context.isAudioPlaying) stopAudio();
    
    const audioData = await generateSpeech(text);
    if (audioData) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const buffer = await decodeAudioData(
            decode(audioData), 
            audioContextRef.current, 
            24000, 
            1
        );
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setContext(prev => ({ ...prev, isAudioPlaying: false }));
        audioSourceRef.current = source;
        setContext(prev => ({ ...prev, isAudioPlaying: true }));
        source.start();
      } catch (e) {
        console.error("Audio playback error:", e);
        setToastMsg('播放语音时遇到一点小麻烦');
        setContext(prev => ({ ...prev, isAudioPlaying: false }));
      }
    } else {
      setToastMsg('语音服务暂时不可用');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleStart = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const levelContent = await generateGameContent(
        `将这个小学数学题融入一段充满想象力的卡通冒险故事的第一关中：${q}。
        请用 3-5 句简洁的中文叙述剧情，总字数控制在 80-120 字左右，适合幼儿阅读`,
        level1Schema
      );
      const img = await generateCartoonImage(levelContent.story);
      
      setContext(prev => ({
        ...prev,
        initialQuestion: q,
        l1Story: levelContent.story,
        l1Question: levelContent.question,
        l1Answer: levelContent.answer,
        l1Image: img
      }));
      setGameState(GameState.LEVEL_1);
      playSpeech(levelContent.story);
    } catch (e) {
      setErrorMsg('哦豁！魔法失败了，可能是输入太复杂。');
    } finally {
      setLoading(false);
    }
  };

  const checkAnswerL1 = (ans: string) => {
    stopAudio();
    if (ans.trim().toLowerCase() === context.l1Answer.trim().toLowerCase()) {
      setGameState(GameState.LEVEL_1_FEEDBACK);
    } else {
      setContext(prev => ({ ...prev, l1FailCount: prev.l1FailCount + 1 }));
      setErrorMsg(context.l1FailCount === 0 ? '差一点点！勇敢的探险家，再试一次！' : '哎呀，似乎还是不对。仔细想想题目给的线索。');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const startLevel2 = async (difficulty: Difficulty) => {
    setLoading(true);
    try {
      const level2Content = await generateGameContent(
        `在第一关剧情“${context.l1Story}”和知识点“${context.l1Question}”的基础上，
        根据选定的难度级别：${difficulty}，设计第二关。
        故事要更紧张，数学题要从更深层面或新角度出发。
        请用 3-5 句简洁的中文叙述这一关的剧情，总字数控制在 80-120 字左右，适合幼儿阅读。`,
        level2Schema
      );
      const img = await generateCartoonImage(level2Content.story);

      setContext(prev => ({
        ...prev,
        difficulty,
        l2Story: level2Content.story,
        l2Question: level2Content.question,
        l2Answer: level2Content.answer,
        l2Image: img
      }));
      setGameState(GameState.LEVEL_2);
      playSpeech(level2Content.story);
    } catch (e) {
      setErrorMsg('剧情升级失败，请重试！');
    } finally {
      setLoading(false);
    }
  };

  const checkAnswerL2 = async (ans: string) => {
    stopAudio();
    if (ans.trim().toLowerCase() === context.l2Answer.trim().toLowerCase()) {
      setLoading(true);
      try {
        const abilityData = await generateGameContent(
          `根据探险家的表现：初始问题为${context.initialQuestion}，第一关尝试了${context.l1FailCount + 1}次成功，
          第二关难度为${context.difficulty}，一次成功。给出评价。`,
          certificateSchema
        );
        setAbility(abilityData);
        setGameState(GameState.FINAL_REWARD);
      } catch (e) {
          setGameState(GameState.FINAL_REWARD);
      } finally {
        setLoading(false);
      }
    } else {
      setErrorMsg(`给你个小线索：仔细观察题目哦！`);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  return (
    <GameLayout title={gameState === GameState.INITIAL ? "知识探险家" : "数学大冒险"}>
      {errorMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-10 py-4 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cartoon-font text-xl animate-bounce">
          ❌ {errorMsg}
        </div>
      )}
      
      {toastMsg && (
        <div className="fixed bottom-10 right-10 z-50 bg-black text-white px-8 py-3 rounded-full shadow-2xl text-lg cartoon-font border-2 border-white animate-in slide-in-from-right duration-300">
          📢 {toastMsg}
        </div>
      )}

      {gameState === GameState.INITIAL && (
        <div className="text-center space-y-12 py-8 animate-in fade-in zoom-in duration-700">
          {/* Hero Section */}
          <div className="relative inline-block">
             <div className="w-64 h-64 bg-gradient-to-tr from-yellow-400 to-orange-300 rounded-full flex items-center justify-center border-[8px] border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <span className="text-9xl group-hover:scale-110 transition-transform duration-500 relative z-10">🗺️</span>
                {/* Decorative rotating aura */}
                <div className="absolute inset-0 border-[4px] border-dashed border-black/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
             </div>
             {/* Dynamic badges */}
             <div className="absolute -top-6 -right-6 w-20 h-20 bg-pink-400 rounded-2xl border-4 border-black flex items-center justify-center text-4xl shadow-lg rotate-12 animate-bounce">✨</div>
             <div className="absolute -bottom-4 -left-8 w-16 h-16 bg-blue-400 rounded-full border-4 border-black flex items-center justify-center text-3xl shadow-lg -rotate-12 animate-float">🎒</div>
          </div>
          
          {/* Character Dialogue */}
          <div className="relative max-w-lg mx-auto">
             <div className="bg-white border-[5px] border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                <div className="absolute -top-4 left-10 w-8 h-8 bg-white border-t-[5px] border-l-[5px] border-black rotate-45"></div>
                <p className="text-2xl text-gray-800 cartoon-font leading-relaxed">
                   "嘿！我是你的探险向导。告诉我一个数学难题，我能把它变成一场惊心动魄的冒险！你准备好挑战了吗？"
                </p>
             </div>
          </div>

          {/* Input Scroll Section */}
          <div className="max-w-xl mx-auto space-y-8">
            <div className="relative group">
              {/* Paper Texture Effect */}
              <div className="absolute -inset-1 bg-yellow-600 rounded-[2.5rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  className="w-full px-10 py-6 text-3xl border-[5px] border-black rounded-[2.5rem] outline-none bg-orange-50 focus:bg-white transition-all shadow-[10px_10px_0px_0px_rgba(124,58,237,1)] group-focus-within:shadow-none group-focus-within:translate-x-1 group-focus-within:translate-y-1 cartoon-font placeholder:text-orange-200"
                  placeholder="输入一个数学钥匙..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleStart((e.target as HTMLInputElement).value);
                  }}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-4xl opacity-50 group-hover:scale-125 transition-transform">🔑</div>
              </div>
            </div>

            {/* Quick Inspiration Buttons */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-500 font-bold tracking-widest uppercase text-sm">不知道玩什么？试试这些灵感火花：</p>
              <div className="flex flex-wrap justify-center gap-3">
                {['15 x 8', '120 ÷ 4', '56 + 78', '99 - 45'].map((example) => (
                  <button 
                    key={example}
                    onClick={() => handleStart(example)}
                    className="px-6 py-2 bg-white border-4 border-black rounded-xl cartoon-font text-lg hover:bg-yellow-200 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
                  >
                    💡 {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-t-8 border-r-8 border-yellow-500 border-solid rounded-full animate-spin"></div>
              <div className="text-yellow-600 cartoon-font text-3xl animate-pulse">正在编织冒险故事的丝线...</div>
            </div>
          )}
        </div>
      )}

      {gameState === GameState.LEVEL_1 && (
        <StageView 
          image={context.l1Image}
          story={context.l1Story}
          question={context.l1Question}
          onAnswer={checkAnswerL1}
          onReadAloud={() => playSpeech(context.l1Story)}
          isLoading={loading}
          isAudioPlaying={context.isAudioPlaying}
        />
      )}

      {gameState === GameState.LEVEL_1_FEEDBACK && (
        <div className="text-center space-y-12 py-16 animate-in zoom-in duration-500 bg-green-50 rounded-[3rem] border-[6px] border-black shadow-[10px_10px_0px_0px_rgba(34,197,94,1)]">
          <div className="relative inline-block">
            <div className="text-9xl animate-bounce">🥇</div>
            <div className="absolute -top-10 -left-10 text-6xl animate-pulse">✨</div>
            <div className="absolute -bottom-10 -right-10 text-6xl animate-pulse" style={{animationDelay: '0.5s'}}>✨</div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-5xl cartoon-font text-green-700">挑战成功！</h2>
            <p className="text-2xl text-gray-700 font-medium">不愧是顶级的探险家。前面的路更危险了，你准备好了吗？</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 px-6">
            {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((d, i) => (
              <button
                key={d}
                onClick={() => startLevel2(d)}
                className={`border-[5px] border-black p-6 rounded-[2rem] cartoon-font text-2xl transition-all transform hover:scale-110 active:scale-95 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${
                    i === 0 ? 'bg-blue-300' : i === 1 ? 'bg-yellow-300' : 'bg-red-400'
                }`}
              >
                {d === Difficulty.EASY ? '🏞 轻松' : d === Difficulty.MEDIUM ? '🌋 普通' : '🔥 炼狱'}
              </button>
            ))}
          </div>
          {loading && <div className="text-blue-600 cartoon-font text-2xl animate-pulse">🛠 正在构建新的试炼之地...</div>}
        </div>
      )}

      {gameState === GameState.LEVEL_2 && (
        <StageView 
          image={context.l2Image}
          story={context.l2Story}
          question={context.l2Question}
          onAnswer={checkAnswerL2}
          onReadAloud={() => playSpeech(context.l2Story)}
          isLoading={loading}
          isAudioPlaying={context.isAudioPlaying}
        />
      )}

      {gameState === GameState.FINAL_REWARD && (
        <div className="space-y-10 py-6 animate-in slide-in-from-bottom duration-700">
            <div className="bg-orange-50 border-[8px] border-black p-10 rounded-[3rem] text-center relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]">
                <div className="absolute top-0 left-0 w-full h-8 bg-orange-200 opacity-50"></div>
                
                <div className="flex justify-center -space-x-8 mb-10">
                    <img src={context.l1Image} className="w-40 h-40 object-cover rounded-3xl border-[6px] border-black shadow-xl rotate-[-8deg] relative z-10 hover:z-30 transition-all hover:scale-110" />
                    <img src={context.l2Image} className="w-40 h-40 object-cover rounded-3xl border-[6px] border-black shadow-xl rotate-[8deg] relative z-20 hover:z-30 transition-all hover:scale-110" />
                </div>

                <h2 className="text-6xl cartoon-font text-orange-600 mb-8 drop-shadow-md">传奇探险家！</h2>
                
                {ability && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border-[5px] border-black p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <p className="cartoon-font text-2xl text-gray-500 mb-4 flex items-center justify-center gap-2">
                                    <span>🧠</span> 知识掌控度
                                </p>
                                <div className="h-8 w-full bg-gray-100 rounded-full border-[4px] border-black overflow-hidden p-1 shadow-inner">
                                    <div className="h-full bg-green-400 rounded-full border-r-[4px] border-black" style={{ width: `${ability.mastery}%` }}></div>
                                </div>
                                <p className="text-4xl cartoon-font mt-4 text-green-600">{ability.mastery}%</p>
                            </div>
                            <div className="bg-white border-[5px] border-black p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <p className="cartoon-font text-2xl text-gray-500 mb-4 flex items-center justify-center gap-2">
                                    <span>⚡</span> 逻辑推演力
                                </p>
                                <div className="h-8 w-full bg-gray-100 rounded-full border-[4px] border-black overflow-hidden p-1 shadow-inner">
                                    <div className="h-full bg-blue-400 rounded-full border-r-[4px] border-black" style={{ width: `${ability.logic}%` }}></div>
                                </div>
                                <p className="text-4xl cartoon-font mt-4 text-blue-600">{ability.logic}%</p>
                            </div>
                        </div>
                        
                        <div className="bg-white border-[5px] border-black p-8 rounded-[2rem] text-left shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 -mr-8 -mt-8 rounded-full"></div>
                            <h4 className="text-2xl cartoon-font text-orange-800 mb-4 flex items-center gap-2">
                                <span>📜</span> 探险家档案评语：
                            </h4>
                            <p className="text-xl text-gray-700 leading-relaxed font-medium">
                                {ability.advice}
                            </p>
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-12 bg-orange-500 hover:bg-orange-600 text-white px-16 py-6 rounded-full border-[6px] border-black cartoon-font text-4xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-2 hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
                >
                    重启新冒险 🔄
                </button>
            </div>
            <div className="flex justify-center gap-4 text-6xl opacity-50 animate-bounce">🏆 🎖️ 🏆</div>
        </div>
      )}
    </GameLayout>
  );
};

export default App;
