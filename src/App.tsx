/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Award, 
  Music, 
  PlayCircle,
  Check,
  X,
  RotateCcw,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
type AudioFormat = 'Stereo' | 'Spatial';

interface Question {
  id: string;
  answer: AudioFormat;
  audioUrl: string;
  displayTitle?: string;
}

interface QuizSet {
  id: number;
  name: string;
  questions: Question[];
}

const AUDIO_SAMPLES = [
  { 
    id: 's1', 
    answer: 'Stereo' as AudioFormat, 
    audioUrl: 'https://res.cloudinary.com/dxikjdqqn/video/upload/v1772641939/1_stereo_-_hypnotic_qf3vqu.mp3' 
  },
  { 
    id: 's2', 
    answer: 'Spatial' as AudioFormat, 
    audioUrl: 'https://res.cloudinary.com/dxikjdqqn/video/upload/v1772641952/2_atmos_-_hot_ikzsky.wav' 
  },
  { 
    id: 's3', 
    answer: 'Spatial' as AudioFormat, 
    audioUrl: 'https://res.cloudinary.com/dxikjdqqn/video/upload/v1772641939/3_atmos_-_ola_b84r2u.wav' 
  },
  { 
    id: 's4', 
    answer: 'Stereo' as AudioFormat, 
    audioUrl: 'https://res.cloudinary.com/dxikjdqqn/video/upload/v1772641936/4_stereo_-_10_Unite_otrccy.mp3' 
  },
  { 
    id: 's5', 
    answer: 'Spatial' as AudioFormat, 
    audioUrl: 'https://res.cloudinary.com/dxikjdqqn/video/upload/v1772641938/5_atmos_-_never_satisfied_dmtar5.wav' 
  },
];
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const QUIZ_SETS: QuizSet[] = Array.from({ length: 5 }).map((_, i) => {
  const questions = i === 0 ? [...AUDIO_SAMPLES] : shuffleArray(AUDIO_SAMPLES);
  return {
    id: i + 1,
    name: `Bộ đề số ${i + 1}`,
    questions: questions.map((q, idx) => ({
      ...q,
      displayTitle: `Bài hát số ${idx + 1}`
    }))
  };
});

export default function App() {
  const [screen, setScreen] = useState<'welcome' | 'quiz' | 'result'>('welcome');
  const [playerName, setPlayerName] = useState('');
  const [currentSetIdx, setCurrentSetIdx] = useState<number | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(AudioFormat | null)[]>([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timer, setTimer] = useState('00:00');
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState<{ name: string; score: number; time: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('spatial_challenge_highscore');
    if (saved) setHighScore(JSON.parse(saved));
  }, []);

  const startTimer = () => {
    const start = Date.now();
    setStartTime(start);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const secs = (elapsed % 60).toString().padStart(2, '0');
      setTimer(`${mins}:${secs}`);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const handleSetSelect = (idx: number) => {
    setCurrentSetIdx(idx);
    setShowStartModal(true);
  };

  const confirmStart = () => {
    setShowStartModal(false);
    setScreen('quiz');
    setCurrentQuestionIdx(0);
    setUserAnswers(new Array(5).fill(null));
    startTimer();
  };

  const FADE_IN_DURATION = 3000; // 3 giây
const FADE_OUT_DURATION = 1000; // 1 giây
const INTERVAL = 50; // Bước nhảy mỗi 50ms

const toggleAudio = () => {
  if (isPlaying) {
    audioRef.current?.pause();
    setIsPlaying(false);
  } else {
    const currentSet = QUIZ_SETS[currentSetIdx!];
    const song = currentSet.questions[currentQuestionIdx];
    
    if (audioRef.current) audioRef.current.pause();
    
    const audio = new Audio(song.audioUrl);
    audioRef.current = audio;
    audio.currentTime = 20;
    
    // --- FADE IN LOGIC (3s) ---
    audio.volume = 0;
    audio.play();
    setIsPlaying(true);
    
    const steps = FADE_IN_DURATION / INTERVAL; // 3000 / 50 = 60 bước
    const volumeStep = 1 / steps; // Mỗi bước tăng 1/60 volume (~0.016)

    const fadeIn = setInterval(() => {
      if (audio.volume < 1) {
        // Tăng dần volume
        audio.volume = Math.min(audio.volume + volumeStep, 1);
      } else {
        clearInterval(fadeIn); // Đạt 1 thì dừng interval
      }
    }, INTERVAL);

    // --- FADE OUT LOGIC (1s) ---
    const handleTimeUpdate = () => {
      const remainingTime = 40 - audio.currentTime;

      // Nếu còn đúng 1 giây là đến mốc 40s, bắt đầu Fade Out
      if (remainingTime <= (FADE_OUT_DURATION / 1000) && remainingTime > 0) {
        audio.volume = Math.max(audio.volume - (1 / (FADE_OUT_DURATION / INTERVAL)), 0);
      }

      if (audio.currentTime >= 40) {
        audio.pause();
        setIsPlaying(false);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        clearInterval(fadeIn); 
      }
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.onended = () => {
        setIsPlaying(false);
        clearInterval(fadeIn); // Đề phòng interval vẫn chạy
    };
  }
};

  const handleSelectOption = (choice: AudioFormat) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIdx] = choice;
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < 4) {
      setCurrentQuestionIdx(prev => prev + 1);
      setIsPlaying(false);
      audioRef.current?.pause();
    } else {
      finishQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
      setIsPlaying(false);
      audioRef.current?.pause();
    }
  };

  const finishQuiz = () => {
    stopTimer();
    audioRef.current?.pause();
    setIsPlaying(false);
    setScreen('result');

    // Calculate score
    const currentSet = QUIZ_SETS[currentSetIdx!];
    let score = 0;
    userAnswers.forEach((ans, i) => {
      if (ans === currentSet.questions[i].answer) score++;
    });

    // Update high score
    if (!highScore || score > highScore.score || (score === highScore.score && timer < highScore.time)) {
      const newHighScore = { name: playerName || 'Anonymous', score, time: timer };
      setHighScore(newHighScore);
      localStorage.setItem('spatial_challenge_highscore', JSON.stringify(newHighScore));
    }
  };

  const restartQuiz = () => {
    confirmStart();
  };

  const backToHome = () => {
    setScreen('welcome');
    setCurrentSetIdx(null);
    setTimer('00:00');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-white/10 sticky top-0 bg-black/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 dolby-gradient rounded-full flex items-center justify-center">
            <Headphones className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tighter italic uppercase">
            Thử thách <span className="text-purple-500">Spatial</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {screen === 'quiz' && (
            <div className="font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-md border border-purple-500/20">
              {timer}
            </div>
          )}
          <div className="text-sm font-medium text-white/60 uppercase">
            BỘ ĐỀ: <span className="text-white">{currentSetIdx !== null ? QUIZ_SETS[currentSetIdx].name : '---'}</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {screen === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 py-12"
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight uppercase">
                Thử thách <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Spatial</span>
              </h1>
              <p className="text-white/60 text-lg max-w-xl mx-auto">
                Lắng nghe 5 bài hát và phân biệt Spatial Audio vs Stereo. <br />
                Bạn có thể tự do di chuyển qua lại giữa các câu hỏi trước khi nộp bài.
              </p>

              <div className="max-w-xs mx-auto space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/40 block">Tên của bạn</label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Nhập tên để lưu kỷ lục..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>

              {highScore && (
                <div className="inline-flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white/60">Kỷ lục: <span className="text-white font-bold">{highScore.name}</span> - <span className="text-white font-bold">{highScore.score}/5</span> trong <span className="text-white font-bold">{highScore.time}</span></span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
                {QUIZ_SETS.map((set, idx) => (
                  <button 
                    key={set.id}
                    onClick={() => handleSetSelect(idx)}
                    disabled={!playerName.trim()}
                    className="glass-card p-6 rounded-2xl text-left group hover:border-purple-500/50 transition-all active:scale-95 border-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:bg-purple-500/10 transition-colors">
                      <Music className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-lg">{set.name}</h3>
                    <p className="text-white/40 text-xs mt-1 uppercase tracking-wider">5 Thử thách</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {screen === 'quiz' && (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold italic">{QUIZ_SETS[currentSetIdx!].questions[currentQuestionIdx].displayTitle}</h2>
                  <p className="text-white/50 italic text-sm">Hãy lắng nghe kỹ âm trường và không gian</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-white/40 block mb-1 uppercase tracking-widest">Tiến độ</span>
                  <span className="text-2xl font-mono font-bold">{currentQuestionIdx + 1} / 5</span>
                </div>
              </div>

              {/* Visualization Area */}
              <div className="glass-card rounded-3xl p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[250px]">
                <div className="flex items-center gap-1 h-24 mb-6">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`wave-bar ${isPlaying ? 'animating' : ''}`}
                      style={{ 
                        animationDelay: `${i * 0.05}s`,
                        height: isPlaying ? undefined : '4px'
                      }}
                    />
                  ))}
                </div>
                <button 
                  onClick={toggleAudio}
                  className="w-20 h-20 rounded-full dolby-gradient flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white" />}
                </button>
                <p className="mt-4 text-xs font-medium text-white/30 uppercase tracking-[0.2em]">
                  {isPlaying ? 'Đang phát...' : 'Sẵn sàng'}
                </p>
              </div>

              {/* Options Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => handleSelectOption('Stereo')}
                  className={`option-btn p-8 glass-card rounded-2xl flex flex-col items-center gap-4 border-2 transition-all duration-500 ${userAnswers[currentQuestionIdx] === 'Stereo' ? 'bg-purple-600/30 border-purple-500 scale-105 shadow-[0_0_30px_rgba(168,85,247,0.4)]' : 'border-white/5 opacity-60 hover:opacity-100'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${userAnswers[currentQuestionIdx] === 'Stereo' ? 'bg-purple-500' : 'bg-white/10'}`}>
                    <Music className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="opt-label text-xs uppercase tracking-[0.3em] text-white/40 block mb-1">Định dạng</span>
                    <span className="opt-value text-2xl font-black uppercase tracking-widest">Stereo</span>
                  </div>
                </button>
                <button 
                  onClick={() => handleSelectOption('Spatial')}
                  className={`option-btn p-8 glass-card rounded-2xl flex flex-col items-center gap-4 border-2 transition-all duration-500 ${userAnswers[currentQuestionIdx] === 'Spatial' ? 'bg-purple-600/30 border-purple-500 scale-105 shadow-[0_0_30px_rgba(168,85,247,0.4)]' : 'border-white/5 opacity-60 hover:opacity-100'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${userAnswers[currentQuestionIdx] === 'Spatial' ? 'bg-purple-500' : 'bg-white/10'}`}>
                    <Headphones className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="opt-label text-xs uppercase tracking-[0.3em] text-white/40 block mb-1">Định dạng</span>
                    <span className="opt-value text-2xl font-black uppercase tracking-widest">Spatial Audio</span>
                  </div>
                </button>
              </div>

              {/* Navigation Area */}
              <div className="flex justify-between items-center pt-4">
                <button 
                  onClick={prevQuestion}
                  disabled={currentQuestionIdx === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl glass-card hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" /> Trước
                </button>
                <div className="flex gap-2">
                  {userAnswers.map((ans, i) => (
                    <div 
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentQuestionIdx ? 'bg-purple-500 w-5' : (ans ? 'bg-purple-500/40' : 'bg-white/10')}`}
                    />
                  ))}
                </div>
                <button 
                  onClick={nextQuestion}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${currentQuestionIdx === 4 ? 'bg-green-600 shadow-green-500/20' : 'dolby-gradient shadow-purple-500/20'}`}
                >
                  {currentQuestionIdx === 4 ? 'Nộp bài' : 'Tiếp'} 
                  {currentQuestionIdx === 4 ? <CheckCircle className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          )}

          {screen === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="inline-block p-4 rounded-full bg-purple-500/10 mb-2">
                  <Award className="w-12 h-12 text-purple-500" />
                </div>
                <h2 className="text-4xl font-bold uppercase tracking-tight">Kết thúc trò chơi</h2>
                <div className="flex justify-center gap-12 py-6">
                  <div className="text-center">
                    <span className="block text-white/40 text-xs uppercase tracking-widest mb-1">Điểm số</span>
                    <span className="text-4xl font-bold text-purple-400">
                      {userAnswers.filter((ans, i) => ans === QUIZ_SETS[currentSetIdx!].questions[i].answer).length}/5
                    </span>
                  </div>
                  <div className="text-center border-l border-white/10 pl-12">
                    <span className="block text-white/40 text-xs uppercase tracking-widest mb-1">Thời gian</span>
                    <span className="text-4xl font-bold text-blue-400">{timer}</span>
                  </div>
                </div>
              </div>

              {/* Answer Comparison Table */}
              <div className="glass-card rounded-2xl overflow-hidden border-purple-500/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                      <tr>
                        <th className="p-4 font-semibold">Câu hỏi</th>
                        <th className="p-4 font-semibold">Lựa chọn</th>
                        <th className="p-4 font-semibold">Đáp án gốc</th>
                        <th className="p-4 font-semibold text-center">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {QUIZ_SETS[currentSetIdx!].questions.map((q, i) => {
                        const userChoice = userAnswers[i] || "Bỏ trống";
                        const isCorrect = userChoice === q.answer;
                        return (
                          <tr key={q.id} className="group hover:bg-white/5 transition-colors">
                            <td className="p-4 font-medium text-sm text-white/80 italic">{q.displayTitle}</td>
                            <td className={`p-4 text-sm font-semibold ${userChoice === 'Bỏ trống' ? 'text-white/20' : (isCorrect ? 'text-green-400' : 'text-red-400')}`}>
                              {userChoice}
                            </td>
                            <td className="p-4 text-sm text-white/60 font-medium">{q.answer}</td>
                            <td className="p-4 text-center">
                              {isCorrect ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">
                <button 
                  onClick={restartQuiz}
                  className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> CHƠI LẠI BỘ ĐỀ NÀY
                </button>
                <button 
                  onClick={backToHome}
                  className="px-8 py-3 glass-card text-white font-bold rounded-full hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" /> QUAY LẠI TRANG CHỦ
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Start Modal */}
      <AnimatePresence>
        {showStartModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card max-w-md w-full p-8 rounded-3xl text-center space-y-6 border-purple-500/30"
            >
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                <PlayCircle className="w-10 h-10 text-purple-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{QUIZ_SETS[currentSetIdx!].name}</h3>
                <p className="text-white/60 mt-2">Đồng hồ sẽ bắt đầu tính giờ ngay khi bạn nhấn Bắt đầu. <br/>Khuyến nghị: Hãy sử dụng tai nghe tốt nhất của bạn.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmStart}
                  className="flex-1 py-3 rounded-xl dolby-gradient font-bold shadow-lg shadow-purple-500/20"
                >
                  Bắt đầu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
