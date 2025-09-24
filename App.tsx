
import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Page, Language, AgendaItem, Poll, PollType, PollOption, QnAQuestion, WordCloudEntry, QuizQuestion, Player, UserRole, Session, QuizState } from './types';
import { translations, ICONS } from './constants';
import { useTimer, useAudio } from './hooks';
import { Button, Card, Input, Modal } from './components';

// --- CONTEXTS ---
const LanguageContext = createContext({
  language: Language.EN,
  setLanguage: (lang: Language) => {},
  t: (key: string) => key,
});
const useLanguage = () => useContext(LanguageContext);

const UserRoleContext = createContext({
  userRole: UserRole.Host, // The "view" role
  baseRole: UserRole.Host, // The "actual" role from lobby
  setUserRole: (role: UserRole) => {},
});
const useUserRole = () => useContext(UserRoleContext);

const SessionContext = createContext<{
  session: Session | null;
  updateSession: (updates: Partial<Session>) => void;
}>({
  session: null,
  updateSession: () => {},
});
const useSession = () => useContext(SessionContext);


// --- PROVIDERS ---
const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(Language.EN);
  const t = useCallback((key: string) => translations[language][key] || key, [language]);
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const UserRoleProvider: React.FC<{ children: React.ReactNode, baseRole: UserRole }> = ({ children, baseRole }) => {
  const [userRole, setUserRole] = useState(baseRole);
  useEffect(() => {
      setUserRole(baseRole);
  }, [baseRole]);
  return (
    <UserRoleContext.Provider value={{ userRole, baseRole, setUserRole }}>
      {children}
    </UserRoleContext.Provider>
  );
};

const SessionProvider: React.FC<{ 
    children: React.ReactNode, 
    sessions: Record<string, Session>,
    setSessions: React.Dispatch<React.SetStateAction<Record<string, Session>>>,
    currentRoomCode: string | null 
}> = ({ children, sessions, setSessions, currentRoomCode }) => {
    const session = currentRoomCode ? sessions[currentRoomCode] : null;

    const updateSession = useCallback((updates: Partial<Session>) => {
        if (!currentRoomCode) return;
        setSessions(prev => ({
            ...prev,
            [currentRoomCode]: {
                ...prev[currentRoomCode],
                ...updates
            }
        }));
    }, [currentRoomCode, setSessions]);
    
    return (
        <SessionContext.Provider value={{ session, updateSession }}>
            {children}
        </SessionContext.Provider>
    );
};


// --- HELPER COMPONENTS ---
const LanguageSwitcher = () => {
    const { language, setLanguage } = useLanguage();
    const toggleLanguage = () => setLanguage(language === Language.EN ? Language.ZH : Language.EN);

    return (
        <button onClick={toggleLanguage} className="flex items-center justify-center w-12 h-9 bg-slate-700/50 border border-slate-600 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out">
            <span className={`text-xs font-bold transition-transform duration-300 ${language === Language.EN ? 'translate-x-3 text-indigo-400' : '-translate-x-3 text-slate-300'}`}>
                {language === Language.EN ? 'EN' : '中'}
            </span>
        </button>
    );
};

const UserRoleSwitcher = () => {
  const { userRole, baseRole, setUserRole } = useUserRole();
  const { t } = useLanguage();

  const toggleRole = () => {
    setUserRole(userRole === UserRole.Host ? UserRole.Participant : UserRole.Host);
  };
  
  if (baseRole === UserRole.Participant) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400 hidden sm:block">{userRole === UserRole.Host ? t('host_view') : t('participant_view')}</span>
      <button onClick={toggleRole} className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${userRole === UserRole.Host ? 'translate-x-1' : 'translate-x-6'}`} />
      </button>
    </div>
  );
};


const Header: React.FC<{ activePage: Page; setActivePage: (page: Page) => void, roomCode: string | null }> = ({ activePage, setActivePage, roomCode }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if(!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="p-4 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Engage<span className="text-indigo-400">Sphere</span></h1>
        <nav className="hidden md:flex items-center space-x-2 bg-slate-800/80 p-1 rounded-lg">
          {Object.values(Page).map(page => (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${activePage === page ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >
              {ICONS[page]} {t(page)}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {roomCode && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-sm text-slate-400">{t('room_code')}</span>
              <span className="font-mono font-bold text-indigo-400">{roomCode}</span>
              <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors">
                {copied ? t('copied') : ICONS.copy}
              </button>
            </div>
          )}
          <UserRoleSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
       <nav className="md:hidden mt-4 flex flex-wrap justify-center gap-2">
          {Object.values(Page).map(page => (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${activePage === page ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >
              {ICONS[page]} {t(page)}
            </button>
          ))}
        </nav>
    </header>
  );
};

// --- FEATURE COMPONENTS ---

const TimerManager = () => {
  const { t } = useLanguage();
  const { userRole } = useUserRole();
  const { session, updateSession } = useSession();
  const playSound = useAudio();

  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDuration, setNewItemDuration] = useState(5);
  
  const agenda = session?.agenda || [];
  const currentItemIndex = session?.currentItemIndex || 0;
  const isTimerActive = session?.isTimerActive || false;
  
  const currentItem = agenda[currentItemIndex];
  const { seconds, start, pause, reset, isFinished } = useTimer(currentItem?.duration || 0);

  // Sync local timer with session state
  useEffect(() => {
    if (isTimerActive) {
      start();
    } else {
      pause();
    }
  }, [isTimerActive, start, pause]);

  useEffect(() => {
    if (isFinished && currentItem) {
      playSound('long-beep');
      if (currentItemIndex < agenda.length - 1) {
        updateSession({ currentItemIndex: currentItemIndex + 1 });
      } else {
        updateSession({ isTimerActive: false });
      }
    }
  }, [isFinished, currentItem, currentItemIndex, agenda.length, playSound, updateSession]);

  useEffect(() => {
      reset(agenda[currentItemIndex]?.duration || 0);
  }, [currentItemIndex, agenda, reset]);
  
  useEffect(() => {
    if (!isTimerActive) return;
    if (seconds > 0 && seconds <= 5) {
      playSound('short-beep');
    } else if (seconds === 30 || seconds === 60) {
      playSound('milestone-beep');
    }
  }, [seconds, isTimerActive, playSound]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemTitle && newItemDuration > 0) {
      const newAgenda = [...agenda, { id: Date.now(), title: newItemTitle, duration: newItemDuration * 60 }];
      updateSession({ agenda: newAgenda });
      setNewItemTitle('');
      setNewItemDuration(5);
    }
  };

  const handleRemoveItem = (id: number) => updateSession({ agenda: agenda.filter(item => item.id !== id) });
  
  const handleResetCurrentTimer = useCallback(() => {
    if (currentItem) {
      reset(currentItem.duration);
    }
  }, [currentItem, reset]);
  
  const handleStart = () => updateSession({ isTimerActive: true });
  const handlePause = () => updateSession({ isTimerActive: false });

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  const timerColor = seconds <= 10 ? 'text-red-400' : seconds <= 30 ? 'text-yellow-400' : 'text-green-400';

  const TimerDisplay = () => (
     <Card>
        <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-300 mb-2">{currentItem?.title || t('session_agenda')}</h2>
            {currentItem ? (
              <>
                <p className={`text-8xl font-bold tracking-tighter ${timerColor} transition-colors duration-500`}>
                  {formatTime(seconds)}
                </p>
                <p className="text-slate-400 mt-2">{t('time_left')}</p>
                 {userRole === UserRole.Host && (
                    <div className="flex justify-center gap-4 mt-6">
                        {isTimerActive ? (
                            <Button onClick={handlePause} variant="secondary">{ICONS.pause} {t('pause')}</Button>
                        ) : (
                            <Button onClick={handleStart} disabled={isFinished && currentItemIndex >= agenda.length - 1}>
                                {ICONS.play} {seconds > 0 && seconds < currentItem.duration ? t('resume') : t('start')}
                            </Button>
                        )}
                        <Button onClick={handleResetCurrentTimer} variant="outline" disabled={!currentItem}>{ICONS.reset} {t('reset')}</Button>
                    </div>
                 )}
              </>
            ) : (
                <p className="text-3xl font-semibold text-slate-400 py-20">{userRole === UserRole.Host ? t('add_item_to_start') : t('waiting_for_host_to_start')}</p>
            )}
             {isFinished && currentItemIndex >= agenda.length - 1 && currentItem && <p className="text-green-400 text-2xl mt-4 animate-pulse">{t('session_complete')}</p>}
          </div>
     </Card>
  )

  if (userRole === UserRole.Participant) {
    return (
        <div className="max-w-3xl mx-auto">
            <TimerDisplay />
        </div>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <TimerDisplay />
      </div>
      <div>
        <Card>
          <h3 className="text-xl font-bold mb-4">{t('session_agenda')}</h3>
          <form onSubmit={handleAddItem} className="space-y-3 mb-4">
            <Input type="text" placeholder={t('agenda_item_title')} value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} required />
            <Input type="number" placeholder={t('duration_in_minutes')} value={newItemDuration} onChange={e => setNewItemDuration(Number(e.target.value))} min="1" required />
            <Button type="submit" className="w-full">{t('add_item')}</Button>
          </form>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {agenda.map((item, index) => (
              <li key={item.id} className={`flex justify-between items-center p-2 rounded-lg ${index === currentItemIndex ? 'bg-indigo-600/30' : 'bg-slate-700/50'}`}>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-slate-400">{item.duration / 60} minutes</p>
                </div>
                <button onClick={() => handleRemoveItem(item.id)} className="text-slate-500 hover:text-red-400">{ICONS.trash}</button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};


const PollingStation = () => {
    const { t } = useLanguage();
    const { userRole } = useUserRole();
    const { session, updateSession } = useSession();
    const poll = session?.activePoll;

    // Local state for host creating a poll
    const [view, setView] = useState<'create' | 'vote' | 'results'>('create');
    const [question, setQuestion] = useState('');
    const [pollType, setPollType] = useState<PollType>(PollType.MultipleChoice);
    const [options, setOptions] = useState<string[]>(['', '']);
    
    // Local state for participant voting
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [openTextAnswer, setOpenTextAnswer] = useState('');
    
    useEffect(() => {
        if(userRole === UserRole.Host) {
            setView('create');
        }
    }, [userRole]);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => setOptions([...options, '']);
    const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

    const startPoll = () => {
        if (!question) return;
        const newPoll: Poll = {
            question,
            type: pollType,
            options: pollType === PollType.MultipleChoice ? options.filter(o => o.trim() !== '').map(o => ({ text: o, votes: 0 })) : [],
            openTextAnswers: [],
        };
        updateSession({ activePoll: newPoll, pollView: 'vote' });
    };

    const submitVote = () => {
        if (!poll) return;
        const newPoll = { ...poll, options: [...poll.options], openTextAnswers: [...poll.openTextAnswers] };
        if (poll.type === PollType.MultipleChoice && selectedOption !== null) {
            newPoll.options[selectedOption] = { ...newPoll.options[selectedOption], votes: newPoll.options[selectedOption].votes + 1 };
        }
        if (poll.type === PollType.OpenText && openTextAnswer.trim() !== '') {
            newPoll.openTextAnswers.push(openTextAnswer.trim());
        }
        updateSession({ activePoll: newPoll });
        setSelectedOption(null);
        setOpenTextAnswer('');
    };
    
    const COLORS = ['#818cf8', '#f472b6', '#4ade80', '#fb923c', '#60a5fa', '#a78bfa'];
    const voteData = poll?.options.map(o => ({ name: o.text, votes: o.votes }));

    const CurrentView = useMemo(() => {
        if (userRole === UserRole.Host) return view;
        return session?.pollView || 'vote';
    }, [userRole, view, session?.pollView]);
    
    return (
        <Card className="w-full max-w-4xl mx-auto">
            {userRole === UserRole.Host && view === 'create' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">{t('create_poll')}</h2>
                    <Input placeholder={t('poll_question')} value={question} onChange={e => setQuestion(e.target.value)} />
                    <select value={pollType} onChange={e => setPollType(e.target.value as PollType)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white">
                        <option value={PollType.MultipleChoice}>{t('multiple_choice')}</option>
                        <option value={PollType.OpenText}>{t('open_text')}</option>
                    </select>
                    {pollType === PollType.MultipleChoice && (
                        <div className="space-y-2">
                            {options.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input placeholder={`${t('option')} ${i + 1}`} value={opt} onChange={e => handleOptionChange(i, e.target.value)} />
                                    {options.length > 2 && <Button variant="secondary" onClick={() => removeOption(i)}>{ICONS.trash}</Button>}
                                </div>
                            ))}
                            <Button variant="ghost" onClick={addOption}>{t('add_option')}</Button>
                        </div>
                    )}
                    <div className="flex gap-4">
                      <Button onClick={startPoll}>{t('start_polling')}</Button>
                    </div>
                </div>
            )}
            
            {!poll && (userRole === UserRole.Participant || (userRole === UserRole.Host && view !== 'create')) && (
                 <p className="text-center text-slate-400 py-10">{t('waiting_for_poll')}</p>
            )}

            {CurrentView === 'vote' && poll && (
                <div className="space-y-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">{poll.question}</h2>
                    {poll.type === PollType.MultipleChoice && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {poll.options.map((opt, i) => (
                                <button key={i} onClick={() => setSelectedOption(i)} className={`p-4 rounded-lg text-lg transition-all border-2 ${selectedOption === i ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}>
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    )}
                    {poll.type === PollType.OpenText && (
                        <Input placeholder={t('your_answer')} value={openTextAnswer} onChange={e => setOpenTextAnswer(e.target.value)} />
                    )}
                    <div className="flex justify-center gap-4 pt-4">
                        <Button onClick={submitVote}>{t('submit_vote')}</Button>
                        {userRole === UserRole.Host && <Button variant="secondary" onClick={() => setView('results')}>{t('view_results')}</Button>}
                    </div>
                </div>
            )}
            
            {CurrentView === 'results' && poll && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-center">{t('live_poll_results')}</h2>
                    <h3 className="text-xl text-center text-slate-300 mb-6">{poll.question}</h3>
                    {poll.type === PollType.MultipleChoice && (
                        <div className="h-80 chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={voteData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis type="number" stroke="#94a3b8" />
                                    <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                    <Bar dataKey="votes" fill="#818cf8" barSize={30}>
                                        <LabelList dataKey="votes" position="right" style={{ fill: '#f1f5f9' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {poll.type === PollType.OpenText && (
                        <div className="max-h-80 overflow-y-auto space-y-2 p-4 bg-slate-900/50 rounded-lg">
                           {poll.openTextAnswers.length > 0 ? poll.openTextAnswers.map((ans, i) => (
                                <p key={i} className="bg-slate-700 p-2 rounded">{ans}</p>
                           )) : <p className="text-slate-400 text-center">{t('no_answers_yet')}</p>}
                        </div>
                    )}
                    <div className="flex justify-center gap-4 pt-4">
                       {userRole === UserRole.Host && <Button onClick={() => setView('vote')}>{t('back_to_voting')}</Button>}
                       {userRole === UserRole.Host && <Button variant="secondary" onClick={() => { setView('create'); updateSession({ activePoll: null }); }}>{t('new_poll')}</Button>}
                    </div>
                </div>
            )}
        </Card>
    );
};

const QnAForum = () => {
    const { t } = useLanguage();
    const { userRole } = useUserRole();
    const { session, updateSession } = useSession();
    const questions = session?.qnaQuestions || [];

    const [newQuestion, setNewQuestion] = useState('');
    const [author, setAuthor] = useState('');
    const [sortByUpvotes, setSortByUpvotes] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newQuestion.trim()) {
            const newQuestions = [...questions, {
                id: Date.now(),
                text: newQuestion,
                author: author || t('anonymous'),
                upvotes: 0
            }];
            updateSession({ qnaQuestions: newQuestions });
            setNewQuestion('');
        }
    };

    const handleUpvote = (id: number) => {
        const newQuestions = questions.map(q => q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q);
        updateSession({ qnaQuestions: newQuestions });
    };
    
    const handleToggleAnswered = (id: number) => {
        const newQuestions = questions.map(q => q.id === id ? { ...q, answered: !q.answered } : q);
        updateSession({ qnaQuestions: newQuestions });
    };

    const sortedQuestions = useMemo(() => {
        return [...questions].sort((a, b) => {
            if (a.answered !== b.answered) return a.answered ? 1 : -1;
            if (sortByUpvotes) return b.upvotes - a.upvotes;
            return 0;
        });
    }, [questions, sortByUpvotes]);

    return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <h2 className="text-xl font-bold mb-4">{t('ask_a_question')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={3}
                            placeholder={t('ask_a_question')}
                            value={newQuestion}
                            onChange={e => setNewQuestion(e.target.value)}
                            required
                        ></textarea>
                        <Input
                            type="text"
                            placeholder={t('your_name')}
                            value={author}
                            onChange={e => setAuthor(e.target.value)}
                        />
                        <Button type="submit" className="w-full">{t('submit_question')}</Button>
                    </form>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">{t('submitted_questions')}</h2>
                        <Button variant="ghost" onClick={() => setSortByUpvotes(!sortByUpvotes)}>
                            {t('sort_by_upvotes')} ({sortByUpvotes ? 'On' : 'Off'})
                        </Button>
                    </div>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {sortedQuestions.length > 0 ? sortedQuestions.map(q => (
                            <div key={q.id} className={`bg-slate-700/50 p-4 rounded-lg flex items-start gap-4 transition-opacity ${q.answered ? 'opacity-50' : ''}`}>
                                <div className="flex-shrink-0 text-center">
                                    <button onClick={() => handleUpvote(q.id)} className="text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-50" disabled={q.answered}>
                                        {ICONS.upvote}
                                    </button>
                                    <span className="font-bold text-lg">{q.upvotes}</span>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-white">{q.text}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-sm text-slate-400">- {q.author}</p>
                                        {userRole === UserRole.Host && (
                                            <Button variant="ghost" size="sm" onClick={() => handleToggleAnswered(q.id)}>{q.answered ? t('answered') : t('mark_as_answered')}</Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )) : <p className="text-slate-400 text-center py-10">{t('no_questions_yet')}</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const WordCloudGenerator = () => {
    const { t } = useLanguage();
    const { session, updateSession } = useSession();
    const words = session?.wordCloudWords || [];

    const [newWord, setNewWord] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newWord.trim()) {
            updateSession({ wordCloudWords: [...words, newWord.trim().toLowerCase()] });
            setNewWord('');
        }
    };

    const wordCloudData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        words.forEach(word => {
            counts[word] = (counts[word] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([text, count]) => ({ text, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 50); // Limit to top 50 words
    }, [words]);

    const getFontSize = (count: number, maxCount: number) => {
        if (maxCount === 0) return '1rem';
        const minSize = 1; // rem
        const maxSize = 5; // rem
        const size = minSize + (maxSize - minSize) * (count / maxCount);
        return `${size}rem`;
    };

    const maxCount = wordCloudData[0]?.count || 0;

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-4">{t('word_cloud_live')}</h2>
            <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
                <Input
                    type="text"
                    placeholder={t('enter_word')}
                    value={newWord}
                    onChange={e => setNewWord(e.target.value)}
                />
                <Button type="submit">{t('submit_word')}</Button>
            </form>
            <div className="bg-slate-900/50 min-h-[40vh] p-6 rounded-lg flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
                {wordCloudData.length > 0 ? wordCloudData.map(entry => (
                    <span
                        key={entry.text}
                        style={{ fontSize: getFontSize(entry.count, maxCount), lineHeight: 1.1, fontWeight: 600 }}
                        className="text-indigo-300 transition-all duration-300"
                    >
                        {entry.text}
                    </span>
                )) : <p className="text-slate-400 text-center">{t('submit_words_to_see_cloud')}</p>}
            </div>
        </Card>
    );
};

const QUIZ_QUESTIONS: QuizQuestion[] = [
    { id: 1, question: "What is the capital of France?", options: ["Berlin", "Madrid", "Paris", "Rome"], correctAnswerIndex: 2, timeLimit: 15 },
    { id: 2, question: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Jupiter", "Venus"], correctAnswerIndex: 1, timeLimit: 15 },
    { id: 3, question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswerIndex: 3, timeLimit: 20 },
    { id: 4, question: "Who wrote 'To Kill a Mockingbird'?", options: ["Harper Lee", "Mark Twain", "J.K. Rowling", "F. Scott Fitzgerald"], correctAnswerIndex: 0, timeLimit: 20 },
];

const QuizGame = () => {
    const { t } = useLanguage();
    const { userRole } = useUserRole();
    const { session, updateSession } = useSession();
    const quizState = session?.quizState;
    
    const [playerName, setPlayerName] = useState('');
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    const playSound = useAudio();
    
    const currentQuestion = quizState ? QUIZ_QUESTIONS[quizState.currentQuestionIndex] : null;
    const { seconds, start, reset, isFinished } = useTimer(currentQuestion?.timeLimit || 0);
    const currentPlayer = quizState?.players.find(p => p.id === currentPlayerId);

    useEffect(() => {
        if (quizState?.gameState === 'question' && isFinished) {
            updateSession({ quizState: { ...quizState, gameState: 'result' } });
        }
    }, [isFinished, quizState, updateSession]);

    const handleJoinQuiz = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim() && quizState) {
            const newPlayer = { id: Date.now().toString(), name: playerName, score: 0 };
            const newPlayers = [...quizState.players, newPlayer];
            updateSession({ quizState: { ...quizState, players: newPlayers } });
            setCurrentPlayerId(newPlayer.id);
            setPlayerName('');
        }
    };

    const handleStartQuiz = () => {
        if(!quizState) return;
        playSound('start');
        const newQuizState = { ...quizState, currentQuestionIndex: 0, gameState: 'question' as const };
        updateSession({ quizState: newQuizState });
        reset(QUIZ_QUESTIONS[0].timeLimit);
        start();
    };

    const handleAnswer = (optionIndex: number) => {
        if (!currentPlayer || !quizState || !currentQuestion) return;
        const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;
        let scoreToAdd = 0;
        
        if (isCorrect) {
            playSound('correct');
            scoreToAdd = 1000 + (seconds * 10);
        } else {
            playSound('incorrect');
        }

        const newPlayers = quizState.players.map(p => p.id === currentPlayerId ? { ...p, score: p.score + scoreToAdd } : p);
        updateSession({ quizState: { ...quizState, players: newPlayers, gameState: 'result', lastAnswerCorrect: isCorrect } });
    };
    
    const handleNext = () => {
        if (!quizState) return;
        if (quizState.currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
            const newQuestionIndex = quizState.currentQuestionIndex + 1;
            updateSession({ 
                quizState: { 
                    ...quizState,
                    currentQuestionIndex: newQuestionIndex,
                    gameState: 'question',
                    lastAnswerCorrect: null,
                }
            });
            reset(QUIZ_QUESTIONS[newQuestionIndex].timeLimit);
            start();
        } else {
            updateSession({ quizState: { ...quizState, gameState: 'leaderboard' } });
        }
    };
    
    const handlePlayAgain = () => {
        if(!quizState) return;
        updateSession({
            quizState: {
                ...quizState,
                players: quizState.players.map(p => ({ ...p, score: 0 })),
                gameState: 'lobby'
            }
        });
    };
    
    const sortedPlayers = useMemo(() => quizState ? [...quizState.players].sort((a,b) => b.score - a.score): [], [quizState]);

    if (!quizState) return null;

    return (
        <Card className="w-full max-w-4xl mx-auto text-center">
            {quizState.gameState === 'lobby' && (
                <div>
                    <h2 className="text-3xl font-bold mb-4">{t('quiz_lobby')}</h2>
                    {userRole === UserRole.Participant && !currentPlayerId && (
                      <form onSubmit={handleJoinQuiz} className="flex gap-2 max-w-sm mx-auto mb-6">
                          <Input placeholder={t('enter_your_name')} value={playerName} onChange={e => setPlayerName(e.target.value)} />
                          <Button type="submit">{t('join_quiz')}</Button>
                      </form>
                    )}
                    {userRole === UserRole.Participant && currentPlayerId && (
                        <p className="text-xl text-slate-300 mb-6">{t('waiting_for_host_to_start')}</p>
                    )}
                    <div className="mb-6">
                        <h3 className="font-semibold">{t('players_joined')}</h3>
                        {quizState.players.length > 0 ? (
                            <ul className="mt-2 space-y-1">
                                {quizState.players.map(p => <li key={p.id}>{p.name}</li>)}
                            </ul>
                        ) : <p className="text-slate-400 mt-2">{t('waiting_for_players')}</p>}
                    </div>
                    {userRole === UserRole.Host && <Button onClick={handleStartQuiz} disabled={quizState.players.length === 0}>{t('start_quiz')}</Button>}
                </div>
            )}
            
            {quizState.gameState === 'question' && currentQuestion && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p>{t('question')} {quizState.currentQuestionIndex + 1}/{QUIZ_QUESTIONS.length}</p>
                        <div className="text-2xl font-bold bg-indigo-600 rounded-full h-12 w-12 flex items-center justify-center">{seconds}</div>
                    </div>
                    <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.options.map((opt, i) => (
                            <Button key={i} onClick={() => handleAnswer(i)} className="text-lg p-6 h-full" disabled={userRole === UserRole.Host || !currentPlayerId}>
                                {opt}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
            
            {quizState.gameState === 'result' && currentQuestion && (
                <div>
                    {quizState.lastAnswerCorrect !== null && userRole === UserRole.Participant && (
                        <h2 className={`text-3xl font-bold mb-4 ${quizState.lastAnswerCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {quizState.lastAnswerCorrect ? t('you_are_correct') : t('you_are_wrong')}
                        </h2>
                    )}
                    <p className="mb-6">{t('correct_answer_is')} <span className="font-bold text-indigo-400">{currentQuestion.options[currentQuestion.correctAnswerIndex]}</span></p>
                    <h3 className="text-xl font-bold mb-2">{t('leaderboard')}</h3>
                    <ul className="space-y-1 mb-6">
                        {sortedPlayers.slice(0, 5).map((p, i) => (
                          <li key={p.id} className="flex justify-between max-w-sm mx-auto p-2 bg-slate-700 rounded">
                            <span>{i+1}. {p.name}</span>
                            <span>{p.score}</span>
                          </li>
                        ))}
                    </ul>
                    {userRole === UserRole.Host && <Button onClick={handleNext}>{t('next')}</Button>}
                    {userRole === UserRole.Participant && <p className="text-slate-400">{t('waiting_for_host_to_start')}</p>}
                </div>
            )}
            
            {quizState.gameState === 'leaderboard' && (
                <div>
                    <h2 className="text-3xl font-bold mb-4">{t('final_scores')}</h2>
                     <ul className="space-y-2 mb-6">
                        {sortedPlayers.map((p, i) => (
                          <li key={p.id} className={`flex justify-between max-w-sm mx-auto p-3 rounded-lg text-lg font-semibold ${i === 0 ? 'bg-yellow-500 text-slate-900' : i === 1 ? 'bg-slate-400 text-slate-900' : i === 2 ? 'bg-yellow-700 text-white' : 'bg-slate-700'}`}>
                            <span>{i+1}. {p.name}</span>
                            <span>{p.score}</span>
                          </li>
                        ))}
                    </ul>
                    {userRole === UserRole.Host && <Button onClick={handlePlayAgain}>{t('play_again')}</Button>}
                </div>
            )}
        </Card>
    );
};


const Lobby = ({ onHostCreate, onParticipantJoin } : { 
    onHostCreate: (roomCode: string) => void, 
    onParticipantJoin: (roomCode: string) => void 
}) => {
    const { t } = useLanguage();
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        // The parent component will handle validation
        onParticipantJoin(roomCode.toUpperCase());
    };
    
    const handleCreate = () => {
        const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        onHostCreate(newRoomCode);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-5xl font-bold text-white tracking-tight">Engage<span className="text-indigo-400">Sphere</span></h1>
            <p className="text-slate-400 mt-2 mb-12">{t('interactive_session_platform')}</p>
            <Card className="w-full max-w-sm">
                <div className="space-y-4">
                    <Button onClick={handleCreate} className="w-full" size="lg">{t('create_room')}</Button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-600" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-slate-800 px-2 text-sm text-slate-400">OR</span>
                        </div>
                    </div>
                    <form onSubmit={handleJoin} className="space-y-3">
                        <Input
                            placeholder={t('enter_room_code')}
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            className="text-center tracking-widest font-mono"
                        />
                        <Button type="submit" variant="secondary" className="w-full">{t('join_room')}</Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}

const InSessionView = () => {
    const [activePage, setActivePage] = useState<Page>(Page.Timer);
    const { session } = useSession();

    const renderActivePage = () => {
        switch (activePage) {
            case Page.Timer: return <TimerManager />;
            case Page.Polling: return <PollingStation />;
            case Page.QnA: return <QnAForum />;
            case Page.WordCloud: return <WordCloudGenerator />;
            case Page.Quiz: return <QuizGame />;
            default: return <TimerManager />;
        }
    };
    
    if (!session) return null; // Or a loading/error state

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            <Header activePage={activePage} setActivePage={setActivePage} roomCode={session.roomCode} />
            <main className="container mx-auto p-4 md:p-8">
                {renderActivePage()}
            </main>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [baseRole, setBaseRole] = useState<UserRole>(UserRole.Host);

  const createNewSession = (roomCode: string): Session => ({
    roomCode,
    agenda: [],
    currentItemIndex: 0,
    isTimerActive: false,
    activePoll: null,
    pollView: 'vote',
    qnaQuestions: [],
    wordCloudWords: [],
    quizState: {
        gameState: 'lobby',
        players: [],
        currentQuestionIndex: 0,
        lastAnswerCorrect: null,
    }
  });

  const handleHostCreate = (roomCode: string) => {
    const newSession = createNewSession(roomCode);
    setSessions(prev => ({ ...prev, [roomCode]: newSession }));
    setBaseRole(UserRole.Host);
    setCurrentRoomCode(roomCode);
  };
  
  const handleParticipantJoin = (roomCode: string) => {
    if (sessions[roomCode]) {
        setBaseRole(UserRole.Participant);
        setCurrentRoomCode(roomCode);
    } else {
        // Here you would show an error message
        alert('Invalid Room Code');
    }
  };

  return (
    <LanguageProvider>
        <SessionProvider sessions={sessions} setSessions={setSessions} currentRoomCode={currentRoomCode}>
          <UserRoleProvider baseRole={baseRole}>
            {!currentRoomCode ? (
                <Lobby onHostCreate={handleHostCreate} onParticipantJoin={handleParticipantJoin} />
            ) : (
                <InSessionView />
            )}
          </UserRoleProvider>
        </SessionProvider>
    </LanguageProvider>
  );
}
