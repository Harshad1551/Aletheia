import React, { useState, useRef, useCallback } from 'react';
import {
    Home,
    MessageSquare,
    BarChart2,
    Book,
    Settings,
    LogOut,
    Menu,
    Send,
    Plus,
    X,
    User,
    Mail,
    Calendar,
    Save,
    Trash2,
    Phone,
    MapPin,
    MessageCircle,
    Loader,
    PenLine,
    Mic,
    Clock,
    ChevronRight,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import ChatWindow from '../components/ChatWindow';
import VoiceButton from '../components/ui/VoiceButton';
import chatService from '../services/chatService';
import authService from '../services/authService';
import moodService from '../services/moodService';
import diaryService from '../services/diaryService';
import api from '../services/api';
import AvatarDropdown from '../components/ui/AvatarDropdown';

// Emotion color map for the mood history chart
const emotionColors = {
    joy: '#10b981',
    neutral: '#6366f1',
    sadness: '#3b82f6',
    anger: '#ef4444',
    fear: '#f59e0b',
    disgust: '#8b5cf6',
    surprise: '#ec4899',
};

const ClientDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const currentUser = authService.getCurrentUser();
    const user = currentUser?.user;
    console.log(user)
    // Chat State
    const [chatMessage, setChatMessage] = useState('');
    const [activeChatId, setActiveChatId] = useState(null);
    const [chatHistoryList, setChatHistoryList] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [activeChatAvatar, setActiveChatAvatar] = useState('Academic/Career Stress');

    // Voice Recording State
    const [voiceState, setVoiceState] = useState('idle'); // idle | recording | processing | success | error
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const handleVoicePress = useCallback(() => {
        if (voiceState === 'idle') {
            // Start recording
            setVoiceState('recording');
            audioChunksRef.current = [];

            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                    mediaRecorderRef.current = recorder;

                    recorder.ondataavailable = (e) => {
                        if (e.data.size > 0) {
                            audioChunksRef.current.push(e.data);
                        }
                    };

                    recorder.onstop = async () => {
                        // Stop all tracks
                        stream.getTracks().forEach((t) => t.stop());

                        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                        setVoiceState('processing');

                        try {
                            const transcript = await chatService.transcribeAudio(audioBlob);
                            if (transcript && transcript.trim()) {
                                setChatMessage(transcript);
                                setVoiceState('success');
                            } else {
                                setVoiceState('error');
                            }
                        } catch (err) {
                            console.error('STT failed:', err);
                            setVoiceState('error');
                        }

                        // Auto-return to idle after feedback
                        setTimeout(() => setVoiceState('idle'), 1500);
                    };

                    recorder.start();
                })
                .catch((err) => {
                    console.error('Mic access denied:', err);
                    setVoiceState('error');
                    setTimeout(() => setVoiceState('idle'), 1500);
                });

        } else if (voiceState === 'recording') {
            // Stop recording — triggers onstop handler above
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        }
    }, [voiceState]);

    // Diary State
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [tempEntry, setTempEntry] = useState({ title: '', content: '' });
    const [diaryEntries, setDiaryEntries] = useState([]);
    const [diaryLoading, setDiaryLoading] = useState(false);
    const [diarySaving, setDiarySaving] = useState(false);

    // Mood State
    const [moodData, setMoodData] = useState(null);
    const [moodLoading, setMoodLoading] = useState(false);
    const [moodError, setMoodError] = useState(null);

    // Overview Mood History State
    const [moodHistory, setMoodHistory] = useState([]);
    const [moodHistoryLoading, setMoodHistoryLoading] = useState(false);

    // Profile State
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState(null);

    // Therapist Map State
    const [therapists, setTherapists] = useState([]);
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [clientLocation, setClientLocation] = useState(null);
    const [selectedTherapist, setSelectedTherapist] = useState(null);
    const [activeChatContact, setActiveChatContact] = useState(null);
    const [chats, setChats] = useState([]);
    const [chatsLoading, setChatsLoading] = useState(false);
    const [requestStatus, setRequestStatus] = useState({}); // { [therapistId]: 'sending' | 'success' | 'error' | 'idle' }

    const handleSendRequest = async (therapistId) => {
        if (!therapistId) return;
        setRequestStatus(prev => ({ ...prev, [therapistId]: 'sending' }));
        try {
            await api.post('/therapists/request', { therapist_id: therapistId });
            setRequestStatus(prev => ({ ...prev, [therapistId]: 'success' }));
            setTimeout(() => setRequestStatus(prev => ({ ...prev, [therapistId]: 'idle' })), 3000);
        } catch (err) {
            console.error("Failed to send connection request:", err);
            setRequestStatus(prev => ({ ...prev, [therapistId]: 'error' }));
            setTimeout(() => setRequestStatus(prev => ({ ...prev, [therapistId]: 'idle' })), 3000);
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Initial Chat Load + Profile Fetch + Mood Fetch
    React.useEffect(() => {
        if (activeTab === 'overview') {
            setMoodHistoryLoading(true);
            moodService.getMoodHistory()
                .then(data => setMoodHistory(data))
                .catch(err => console.error('Failed to load mood history', err))
                .finally(() => setMoodHistoryLoading(false));
        }
        if (activeTab === 'chat') {
            loadChatHistory();
        }
        if (activeTab === 'mood') {
            setMoodLoading(true);
            setMoodError(null);
            moodService.getMoodData()
                .then(data => {
                    const formatted = Object.entries(data).map(([emotion, count]) => ({ emotion, count }));
                    setMoodData(formatted);
                })
                .catch(() => setMoodError('Could not load mood data.'))
                .finally(() => setMoodLoading(false));
        }
        if (activeTab === 'settings' && !profile) {
            setProfileLoading(true);
            setProfileError(null);
            authService.getProfile()
                .then(data => setProfile(data))
                .catch(err => setProfileError(err))
                .finally(() => setProfileLoading(false));
        }

        if (activeTab === 'messages' && !activeChatContact) {
            setChatsLoading(true);
            api.get('/chats/contacts')
                .then(res => setChats(res.data))
                .catch(err => console.error(err))
                .finally(() => setChatsLoading(false));
        }

        if (activeTab === 'map' && therapists.length === 0) {
            setMapLoading(true);
            setMapError(null);
            // Get client's own location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    pos => setClientLocation([pos.coords.latitude, pos.coords.longitude]),
                    () => { } // silent fail
                );
            }
            api.get('/therapists')
                .then(res => setTherapists(res.data))
                .catch(() => setMapError('Could not load therapist locations.'))
                .finally(() => setMapLoading(false));
        }
        if (activeTab === 'diary') {
            loadDiaryEntries();
        }
    }, [activeTab, profile, therapists.length, currentUser?.token, activeChatContact]);

    const loadChatHistory = async () => {
        try {
            const history = await chatService.getHistory();
            setChatHistoryList(history);
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    const handleSelectChat = async (chatId) => {
        setActiveChatId(chatId);
        setSuggestions([]);
        setIsChatLoading(true);
        try {
            const messages = await chatService.getMessages(chatId);
            setChatMessages(messages);
        } catch (error) {
            console.error(error);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveChatId(null);
        setChatMessages([]);
        setSuggestions([]);
    };

    const sendChatMessage = async (messageText) => {
        if (!messageText.trim()) return;
        setSuggestions([]);
        const userMsgContent = messageText;
        setChatMessage('');

        // Optimistic UI update
        const tempMsg = { sender: 'user', content: userMsgContent };
        setChatMessages(prev => [...prev, tempMsg]);
        setIsChatLoading(true);

        try {
            const response = await chatService.sendMessage(userMsgContent, activeChatId, activeChatAvatar);

            // If it was a new chat, we get a chatId back
            if (!activeChatId && response.chatId) {
                setActiveChatId(response.chatId);
                loadChatHistory();
            }

            setChatMessages(prev => [...prev, { sender: 'assistant', content: response.reply }]);
            setSuggestions(response.suggestions || []);
        } catch (error) {
            setChatMessages(prev => [...prev, { sender: 'assistant', content: "Error sending message. Please try again." }]);
            setSuggestions([]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        sendChatMessage(chatMessage);
    };

    const handleSuggestionClick = (suggestion) => {
        sendChatMessage(suggestion);
    };

    // Diary handlers
    const loadDiaryEntries = async () => {
        setDiaryLoading(true);
        try {
            const entries = await diaryService.getEntries();
            setDiaryEntries(entries);
        } catch (err) {
            console.error('Failed to load diary entries', err);
        } finally {
            setDiaryLoading(false);
        }
    };

    const handleSaveDiaryEntry = async () => {
        if (!tempEntry.content?.trim()) return;
        setDiarySaving(true);
        try {
            const saved = await diaryService.createEntry(tempEntry.title, tempEntry.content);
            setDiaryEntries([saved, ...diaryEntries]);
            setTempEntry({ title: '', content: '' });
            setShowNewEntry(false);
        } catch (err) {
            console.error('Failed to save diary entry', err);
        } finally {
            setDiarySaving(false);
        }
    };

    const handleDeleteDiaryEntry = async (id) => {
        try {
            await diaryService.deleteEntry(id);
            setDiaryEntries(diaryEntries.filter(e => e.id !== id));
        } catch (err) {
            console.error('Failed to delete diary entry', err);
        }
    };

    // Helper to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDiaryDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
        });
    };

    const handleLogout = () => {
        authService.logout(); // Clear token from localStorage
        navigate('/');
    };

    const SidebarItem = ({ icon: Icon, label, id }) => (
        <button
            onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${activeTab === id
                ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );

    return (
        // ... (keep structure until Main Content)
        <div className="min-h-screen bg-slate-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Sidebar (Navigation) */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#111111] shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-white/5
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 flex flex-col
            `}>
                <div className="h-20 flex items-center px-6 border-b border-white/10">
                    <span className="text-xl font-display font-bold text-white tracking-tight uppercase">Aletheia</span>
                </div>

                <div className="p-4 space-y-1 flex-grow overflow-y-auto">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4 mt-4">Menu</div>
                    <SidebarItem icon={Home} label="Overview" id="overview" />
                    <SidebarItem icon={MessageSquare} label="AI Chat" id="chat" />
                    <SidebarItem icon={BarChart2} label="Mood Tracker" id="mood" />
                    <SidebarItem icon={Book} label="My Diary" id="diary" />
                    <SidebarItem icon={MapPin} label="Find Therapists" id="map" />
                    <SidebarItem icon={MessageCircle} label="Messages" id="messages" />

                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4 mt-8">Settings</div>
                    <SidebarItem icon={Settings} label="Profile" id="settings" />
                </div>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                    >
                        <LogOut size={20} />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:hidden flex-shrink-0">
                    <span className="font-bold text-slate-900">Dashboard</span>
                    <button onClick={toggleSidebar} className="p-2 text-slate-600">
                        <Menu size={24} />
                    </button>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    {/* Chat Tab with History Sidebar */}
                    {activeTab === 'chat' ? (
                        <div className="flex h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Chat History Sidebar */}
                            <div className="w-64 border-r border-slate-200 flex flex-col bg-slate-50">
                                <div className="p-4 border-b border-slate-200">
                                    <Button onClick={handleNewChat} className="w-full flex items-center gap-2 justify-center">
                                        <Plus size={16} /> New Chat
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    {chatHistoryList.length === 0 && <div className="text-center text-xs text-slate-400 mt-4">No history yet</div>}
                                    {chatHistoryList.map(chat => (
                                        <button
                                            key={chat.chat_id || chat.id} // Handle potential ID naming mismatch
                                            onClick={() => handleSelectChat(chat.chat_id || chat.id)}
                                            className={`w-full text-left px-3 py-3 rounded-lg text-sm truncate transition-colors ${(activeChatId === (chat.chat_id || chat.id))
                                                ? 'bg-white shadow-sm text-primary-700 font-medium'
                                                : 'text-slate-600 hover:bg-slate-200/50'
                                                }`}
                                        >
                                            {chat.title || 'Untitled Chat'}
                                            <div className="text-[10px] text-slate-400 mt-1">{formatDate(chat.created_at)}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white z-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                            <MessageSquare className="text-primary-600" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">
                                                {activeChatId ? (chatHistoryList.find(c => (c.chat_id || c.id) === activeChatId)?.title || 'Chat') : 'New Conversation'}
                                            </h3>
                                            <p className="text-xs text-slate-500">Aletheia AI</p>
                                        </div>
                                    </div>

                                    {!activeChatId && (
                                        <AvatarDropdown
                                            selectedAvatar={activeChatAvatar}
                                            onSelect={setActiveChatAvatar}
                                        />
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                    {chatMessages.length === 0 && !activeChatId && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <MessageSquare size={48} className="mb-4 opacity-50" />
                                            <p>Start a new conversation with Aletheia.</p>
                                        </div>
                                    )}

                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`
                                                max-w-[80%] rounded-2xl px-5 py-3 
                                                ${msg.sender === 'user'
                                                        ? 'bg-primary-600 text-white rounded-br-none'
                                                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}
                                            `}
                                                style={{ whiteSpace: 'pre-wrap' }}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Typing indicator */}
                                    {isChatLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none shadow-sm px-5 py-3 flex items-center gap-1.5">
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Suggestion Chips */}
                                    {!isChatLoading && suggestions.length > 0 && (
                                        <div className="flex flex-col gap-2 pt-1">
                                            <p className="text-xs text-slate-400 font-medium px-1">💡 Select a suggestion or type your own:</p>
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSuggestionClick(s)}
                                                    className="text-left text-sm px-4 py-2.5 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 hover:border-primary-400 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                                                >
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold mr-2 flex-shrink-0">{i + 1}</span>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-white border-t border-slate-200">
                                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                                        <input
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                            placeholder="Type your message or pick a suggestion above..."
                                            value={chatMessage}
                                            onChange={(e) => setChatMessage(e.target.value)}
                                            disabled={isChatLoading}
                                        />
                                        <VoiceButton
                                            state={voiceState}
                                            onPress={handleVoicePress}
                                            disabled={isChatLoading}
                                        />
                                        <Button type="submit" size="icon" disabled={isChatLoading} className="rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                            <Send size={18} />
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Standard Content for other tabs
                        <div className="max-w-5xl mx-auto space-y-8">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h1 className="text-2xl font-bold text-slate-900">Hello, {user?.name} 👋</h1>
                                            <p className="text-slate-500">How are you feeling today?</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6">
                                        {/* Mood Card */}
                                        <Card className="p-6 md:col-span-2">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-bold text-slate-900">Mood History</h3>
                                                <span className="text-sm text-slate-500">Last 7 Days</span>
                                            </div>
                                            <div className="h-64">
                                                {moodHistoryLoading ? (
                                                    <div className="h-full flex items-center justify-center text-slate-400">Loading mood history...</div>
                                                ) : moodHistory.length === 0 || moodHistory.every(d => Object.values(d).every(v => v === 0 || typeof v === 'string')) ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                        <BarChart2 size={40} className="mb-3 opacity-40" />
                                                        <p>No mood data yet. Start chatting!</p>
                                                    </div>
                                                ) : (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={moodHistory}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
                                                            <Tooltip
                                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                                                            />
                                                            {Object.entries(emotionColors).map(([emotion, color]) => (
                                                                <Line
                                                                    key={emotion}
                                                                    type="monotone"
                                                                    dataKey={emotion}
                                                                    stroke={color}
                                                                    strokeWidth={2}
                                                                    dot={{ fill: color, strokeWidth: 2, r: 3 }}
                                                                    activeDot={{ r: 5 }}
                                                                />
                                                            ))}
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                )}
                                            </div>
                                            {/* Emotion Legend */}
                                            <div className="flex flex-wrap gap-3 mt-4 justify-center">
                                                {Object.entries(emotionColors).map(([emotion, color]) => (
                                                    <div key={emotion} className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                                        <span className="text-xs text-slate-500 capitalize">{emotion}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>

                                        {/* Quick Actions */}
                                        <div className="space-y-6">
                                            <Card className="p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white border-none">
                                                <h3 className="font-bold text-lg mb-2">Talk to Aletheia</h3>
                                                <p className="text-primary-100 text-sm mb-4">Feeling overwhelmed? Let's chat about it.</p>
                                                <Button
                                                    variant="ghost" /* Using ghost to avoid default primary white text styles */
                                                    onClick={() => setActiveTab('chat')}
                                                    className="w-full !bg-white !text-primary-700 hover:!bg-primary-50 shadow-md font-bold tracking-wide"
                                                >
                                                    Start Chat
                                                </Button>
                                            </Card>

                                            <Card className="p-6">
                                                <h3 className="font-bold text-slate-900 mb-4">My Diary</h3>
                                                <p className="text-sm text-slate-500 mb-4">Write down your thoughts...</p>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => { setActiveTab('diary'); setShowNewEntry(true); }}
                                                    className="w-full justify-center"
                                                >
                                                    Open Diary
                                                </Button>
                                            </Card>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Mood Tracker Tab */}
                            {activeTab === 'mood' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">Mood Tracker</h2>
                                            <p className="text-slate-500 mt-1">Emotion breakdown from your last 100 messages</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setMoodLoading(true);
                                                setMoodError(null);
                                                moodService.getMoodData()
                                                    .then(data => setMoodData(Object.entries(data).map(([emotion, count]) => ({ emotion, count }))))
                                                    .catch(() => setMoodError('Could not load mood data.'))
                                                    .finally(() => setMoodLoading(false));
                                            }}
                                            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                                        >
                                            ↻ Refresh
                                        </button>
                                    </div>

                                    <Card className="p-6">
                                        {moodLoading && (
                                            <div className="h-72 flex items-center justify-center text-slate-400">Loading mood data...</div>
                                        )}
                                        {moodError && (
                                            <div className="h-72 flex items-center justify-center text-red-400">{moodError}</div>
                                        )}
                                        {!moodLoading && !moodError && moodData && (
                                            moodData.every(d => d.count === 0) ? (
                                                <div className="h-72 flex flex-col items-center justify-center text-slate-400">
                                                    <BarChart2 size={48} className="mb-3 opacity-40" />
                                                    <p>No mood data yet. Start chatting with Aletheia!</p>
                                                </div>
                                            ) : (
                                                <div className="h-72">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={moodData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                            <XAxis dataKey="emotion" axisLine={false} tickLine={false} tick={{ fill: '#64748b', textTransform: 'capitalize' }} />
                                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
                                                            <Tooltip
                                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                formatter={(value, name) => [value, 'Messages']}
                                                            />
                                                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                                {moodData.map((entry) => {
                                                                    const colorMap = {
                                                                        joy: '#10b981',
                                                                        neutral: '#6366f1',
                                                                        sadness: '#3b82f6',
                                                                        anger: '#ef4444',
                                                                        fear: '#f59e0b',
                                                                        disgust: '#8b5cf6',
                                                                        surprise: '#ec4899',
                                                                    };
                                                                    return <Cell key={entry.emotion} fill={colorMap[entry.emotion] || '#0f766e'} />;
                                                                })}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )
                                        )}
                                    </Card>

                                    {/* Emotion Legend */}
                                    {!moodLoading && moodData && (
                                        <div className="grid grid-cols-4 gap-3">
                                            {[{ e: 'joy', c: '#10b981' }, { e: 'neutral', c: '#6366f1' }, { e: 'sadness', c: '#3b82f6' }, { e: 'anger', c: '#ef4444' }, { e: 'fear', c: '#f59e0b' }, { e: 'disgust', c: '#8b5cf6' }, { e: 'surprise', c: '#ec4899' }].map(({ e, c }) => {
                                                const item = moodData.find(d => d.emotion === e);
                                                return (
                                                    <div key={e} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
                                                        <span className="text-xs font-medium text-slate-600 capitalize">{e}</span>
                                                        <span className="ml-auto text-sm font-bold text-slate-900">{item ? item.count : 0}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Diary Tab */}
                            {activeTab === 'diary' && !showNewEntry && (
                                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                                    <div className="flex justify-between items-end border-b border-primary-100 pb-6">
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900">My Journal</h2>
                                            <p className="text-slate-500 mt-2 font-medium">A mindful space for your thoughts & reflections</p>
                                        </div>
                                        <Button onClick={() => setShowNewEntry(true)} className="rounded-full px-6 shadow-sm hover:shadow-md transition-all">
                                            <PenLine size={18} className="mr-2" /> Write Entry
                                        </Button>
                                    </div>

                                    {diaryLoading ? (
                                        <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                                            <Loader size={32} className="animate-spin mb-4 text-primary-400" />
                                            <p className="font-medium tracking-wide">Retrieving your entries...</p>
                                        </div>
                                    ) : diaryEntries.length === 0 ? (
                                        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                                            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Book size={32} className="text-primary-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">Your journal is waiting</h3>
                                            <p className="text-slate-500 max-w-sm mx-auto mb-8">Take a moment for yourself. Start writing your first entry — your thoughts matter.</p>
                                            <Button className="rounded-full px-8 py-6 shadow-lg shadow-primary-500/20" onClick={() => setShowNewEntry(true)}>
                                                <PenLine size={18} className="mr-2" /> Begin Writing
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {diaryEntries.map((entry) => {
                                                const entryDate = new Date(entry.created_at);
                                                const day = entryDate.getDate();
                                                const month = entryDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                                                const year = entryDate.getFullYear();

                                                return (
                                                    <div
                                                        key={entry.id}
                                                        className="flex flex-col sm:flex-row gap-6 group"
                                                    >
                                                        {/* Date Column */}
                                                        <div className="sm:w-24 flex-shrink-0 flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 sm:pr-6 sm:border-r border-slate-100 pt-1">
                                                            <span className="text-3xl font-light text-slate-800">{day}</span>
                                                            <div className="flex sm:flex-col items-center sm:items-end gap-1 sm:gap-0 mt-1">
                                                                <span className="text-xs font-bold text-primary-600 tracking-widest">{month}</span>
                                                                <span className="text-xs text-slate-400 mt-0.5">{year}</span>
                                                            </div>
                                                        </div>

                                                        {/* Content Column */}
                                                        <div className="flex-1">
                                                            <Card className="p-8 border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(15,118,110,0.08)] transition-all duration-300 rounded-2xl bg-white/80 backdrop-blur-sm relative overflow-hidden">
                                                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-400 to-primary-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                                <div className="flex items-start justify-between mb-4">
                                                                    <h3 className="text-xl font-semibold text-slate-900 leading-tight">
                                                                        {entry.title || 'Untitled Entry'}
                                                                    </h3>
                                                                    <button
                                                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                                                        onClick={() => handleDeleteDiaryEntry(entry.id)}
                                                                        title="Delete entry"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                                <div
                                                                    className="text-slate-600 font-medium text-[1.05rem] leading-relaxed whitespace-pre-wrap"
                                                                >
                                                                    {entry.content}
                                                                </div>
                                                            </Card>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Diary — New Entry Editor */}
                            {activeTab === 'diary' && showNewEntry && (
                                <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
                                    <div className="flex justify-between items-center bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-slate-100 sticky top-4 z-10 shadow-sm">
                                        <button
                                            onClick={() => setShowNewEntry(false)}
                                            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
                                        >
                                            <X size={18} className="mr-2" /> Discard
                                        </button>
                                        <div className="text-sm font-medium text-slate-400">
                                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </div>
                                        <Button
                                            onClick={handleSaveDiaryEntry}
                                            disabled={diarySaving || !tempEntry.content?.trim()}
                                            className="rounded-full px-6 shadow-md transition-all hover:shadow-lg"
                                        >
                                            {diarySaving ? (
                                                <><Loader size={16} className="mr-2 animate-spin" /> Saving…</>
                                            ) : (
                                                <><Save size={16} className="mr-2" /> Save Entry</>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="bg-[#FCFBF8] border border-[#f0ede6] rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] p-8 md:p-14 min-h-[600px] flex flex-col relative transition-all overflow-hidden z-0">
                                        {/* Soft decorative blur */}
                                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10 mix-blend-multiply" />
                                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-50/60 rounded-full blur-3xl pointer-events-none -z-10 mix-blend-multiply" />

                                        <input
                                            type="text"
                                            placeholder="Give your entry a title..."
                                            className="w-full text-4xl md:text-5xl font-medium bg-transparent border-none focus:outline-none placeholder:text-slate-300 text-slate-800 mb-8 pb-4 border-b border-transparent focus:border-[#eae6df] transition-colors"
                                            value={tempEntry.title}
                                            onChange={(e) => setTempEntry({ ...tempEntry, title: e.target.value })}
                                            autoFocus
                                        />

                                        <textarea
                                            placeholder="What's on your mind today?"
                                            className="w-full flex-1 resize-none bg-transparent border-none focus:outline-none text-slate-700 placeholder:text-slate-300 text-lg leading-loose"
                                            value={tempEntry.content}
                                            onChange={(e) => setTempEntry({ ...tempEntry, content: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Find Therapists Map Tab */}
                            {activeTab === 'map' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Find Nearby Therapists</h2>
                                        <p className="text-slate-500 mt-1">Therapists available near you are shown on the map.</p>
                                    </div>

                                    {mapLoading && (
                                        <div className="h-96 flex items-center justify-center text-slate-400">Loading map...</div>
                                    )}
                                    {mapError && (
                                        <div className="h-96 flex items-center justify-center text-red-400">{mapError}</div>
                                    )}
                                    {!mapLoading && !mapError && (
                                        <>
                                            {therapists.length === 0 ? (
                                                <div className="h-96 flex flex-col items-center justify-center text-slate-400">
                                                    <MapPin size={48} className="mb-3 opacity-40" />
                                                    <p>No therapists with location data found yet.</p>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <Card className="overflow-hidden rounded-2xl">
                                                        <MapContainer
                                                            center={clientLocation || [therapists[0].latitude, therapists[0].longitude]}
                                                            zoom={12}
                                                            style={{ height: '520px', width: '100%' }}
                                                        >
                                                            <TileLayer
                                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                            />
                                                            {/* Client location marker */}
                                                            {clientLocation && (
                                                                <Marker
                                                                    position={clientLocation}
                                                                    icon={L.divIcon({
                                                                        className: '',
                                                                        html: `<div style="width:14px;height:14px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px #2563eb44;"></div>`,
                                                                        iconSize: [14, 14],
                                                                        iconAnchor: [7, 7]
                                                                    })}
                                                                >
                                                                    <Popup><strong>You are here</strong></Popup>
                                                                </Marker>
                                                            )}
                                                            {/* Therapist markers */}
                                                            {therapists.map((t, i) => (
                                                                <Marker
                                                                    key={i}
                                                                    position={[t.latitude, t.longitude]}
                                                                    icon={L.divIcon({
                                                                        className: '',
                                                                        html: t.profilePicture
                                                                            ? `<img src="${t.profilePicture}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;" />`
                                                                            : `<div style="width:40px;height:40px;border-radius:50%;background:#0f766e;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:16px;cursor:pointer;">${t.name.charAt(0)}</div>`,
                                                                        iconSize: [40, 40],
                                                                        iconAnchor: [20, 20]
                                                                    })}
                                                                    eventHandlers={{
                                                                        click: () => setSelectedTherapist(t)
                                                                    }}
                                                                >
                                                                    <Popup>
                                                                        <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                                                            <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{t.name}</p>
                                                                            <p style={{ margin: 0, fontSize: 11, color: '#6366f1', cursor: 'pointer' }}>Click for full profile →</p>
                                                                        </div>
                                                                    </Popup>
                                                                </Marker>
                                                            ))}
                                                        </MapContainer>
                                                    </Card>

                                                    {/* ── Therapist Profile Sidebar ── */}
                                                    {selectedTherapist && (
                                                        <>
                                                            {/* Backdrop overlay — scoped to map area */}
                                                            <div
                                                                className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl"
                                                                style={{ animation: 'fadeIn 0.3s ease-out', zIndex: 1000 }}
                                                                onClick={() => setSelectedTherapist(null)}
                                                            />
                                                            {/* Slide-in panel — same height as map */}
                                                            <div
                                                                className="absolute top-0 right-0 w-[380px] bg-white shadow-2xl flex flex-col rounded-r-2xl overflow-hidden"
                                                                style={{
                                                                    height: '520px',
                                                                    zIndex: 1001,
                                                                    animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                                                                    borderLeft: '1px solid rgba(0,0,0,0.06)'
                                                                }}
                                                            >
                                                                {/* Header gradient bar */}
                                                                <div className="relative h-28 bg-gradient-to-br from-[#111111] via-[#1a1a2e] to-[#16213e] flex-shrink-0 overflow-hidden">
                                                                    {/* Decorative circles */}
                                                                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#F5B94A]/10" />
                                                                    <div className="absolute bottom-4 -left-6 w-24 h-24 rounded-full bg-[#7CBDB6]/10" />

                                                                    {/* Close button */}
                                                                    <button
                                                                        onClick={() => setSelectedTherapist(null)}
                                                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>

                                                                    {/* Profile picture - positioned to overlap */}
                                                                    <div className="absolute -bottom-10 left-6">
                                                                        <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                                                                            {selectedTherapist.profilePicture ? (
                                                                                <img
                                                                                    src={selectedTherapist.profilePicture}
                                                                                    alt={selectedTherapist.name}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full bg-gradient-to-br from-[#0f766e] to-[#0d9488] flex items-center justify-center text-white font-bold text-2xl">
                                                                                    {selectedTherapist.name.charAt(0)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 overflow-y-auto pt-14 px-6 pb-4">
                                                                    {/* Name & role badge */}
                                                                    <div className="mb-4">
                                                                        <h3 className="text-xl font-bold text-slate-900 mb-1">{selectedTherapist.name}</h3>
                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0f766e]/10 text-[#0f766e]">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e] animate-pulse" />
                                                                            Licensed Therapist
                                                                        </span>
                                                                    </div>

                                                                    {/* Info cards */}
                                                                    <div className="space-y-2 mb-4">
                                                                        {selectedTherapist.email && (
                                                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:bg-[#F5B94A]/5 hover:border-[#F5B94A]/20 transition-all duration-200">
                                                                                <div className="w-9 h-9 rounded-lg bg-[#F5B94A]/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                                    <Mail size={16} className="text-[#d4a03d]" />
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Email</p>
                                                                                    <p className="text-sm font-medium text-slate-700 truncate">{selectedTherapist.email}</p>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {selectedTherapist.contactNumber && (
                                                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:bg-[#7CBDB6]/5 hover:border-[#7CBDB6]/20 transition-all duration-200">
                                                                                <div className="w-9 h-9 rounded-lg bg-[#7CBDB6]/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                                    <Phone size={16} className="text-[#5ca89f]" />
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Phone</p>
                                                                                    <p className="text-sm font-medium text-slate-700">{selectedTherapist.contactNumber}</p>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {selectedTherapist.address && (
                                                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:bg-[#D85A7D]/5 hover:border-[#D85A7D]/20 transition-all duration-200">
                                                                                <div className="w-9 h-9 rounded-lg bg-[#D85A7D]/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                                    <MapPin size={16} className="text-[#c04a6a]" />
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Clinic Address</p>
                                                                                    <p className="text-sm font-medium text-slate-700">{selectedTherapist.address}</p>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {selectedTherapist.joinedAt && (
                                                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:bg-[#6366f1]/5 hover:border-[#6366f1]/20 transition-all duration-200">
                                                                                <div className="w-9 h-9 rounded-lg bg-[#6366f1]/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                                    <Clock size={16} className="text-[#6366f1]" />
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Member Since</p>
                                                                                    <p className="text-sm font-medium text-slate-700">
                                                                                        {new Date(selectedTherapist.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Footer action */}
                                                                <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/80 space-y-3">
                                                                    <Button
                                                                        type="button"
                                                                        onClick={() => handleSendRequest(selectedTherapist.id || selectedTherapist.user_id)}
                                                                        disabled={requestStatus[selectedTherapist.id || selectedTherapist.user_id] === 'sending' || requestStatus[selectedTherapist.id || selectedTherapist.user_id] === 'success'}
                                                                        className={`w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all ${requestStatus[selectedTherapist.id || selectedTherapist.user_id] === 'success'
                                                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                                                                                : requestStatus[selectedTherapist.id || selectedTherapist.user_id] === 'error'
                                                                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                                                                            }`}
                                                                    >
                                                                        {requestStatus[selectedTherapist.id || selectedTherapist.user_id] === 'sending' ? (
                                                                            <><Loader size={16} className="animate-spin" /> Sending Request...</>
                                                                        ) : requestStatus[selectedTherapist.id || selectedTherapist.user_id] === 'success' ? (
                                                                            <><CheckCircle size={16} /> Request Sent!</>
                                                                        ) : requestStatus[selectedTherapist.id || selectedTherapist.user_id] === 'error' ? (
                                                                            <><XCircle size={16} /> Error Sending</>
                                                                        ) : (
                                                                            <><Calendar size={16} /> Send Connection Request</>
                                                                        )}
                                                                    </Button>

                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setActiveChatContact({
                                                                                id: selectedTherapist.user_id || selectedTherapist.id,
                                                                                name: selectedTherapist.name,
                                                                                profile_picture: selectedTherapist.profilePicture,
                                                                                role: 'therapist'
                                                                            });
                                                                            setSelectedTherapist(null);
                                                                            setActiveTab('messages');
                                                                        }}
                                                                        className="w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 bg-white"
                                                                    >
                                                                        <MessageCircle size={16} />
                                                                        Start Conversation
                                                                        <ChevronRight size={14} className="ml-1" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {therapists.map((t, i) => (
                                                    <Card
                                                        key={i}
                                                        className={`p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200 ${selectedTherapist?.id === t.id ? 'ring-2 ring-primary/40 border-primary/30 shadow-md' : ''
                                                            }`}
                                                        onClick={() => setSelectedTherapist(t)}
                                                    >
                                                        {t.profilePicture
                                                            ? <img src={t.profilePicture} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary-100 flex-shrink-0" />
                                                            : <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg flex-shrink-0">{t.name.charAt(0)}</div>
                                                        }
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-slate-900">{t.name}</p>
                                                            {t.address && <p className="text-sm text-slate-500 truncate">{t.address}</p>}
                                                            {t.contactNumber && <p className="text-sm text-slate-500">{t.contactNumber}</p>}
                                                        </div>
                                                        <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
                                                    </Card>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Direct Messages Tab */}
                            {activeTab === 'messages' && (
                                <div className="max-w-4xl mx-auto space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900">Direct Messages</h2>
                                    {activeChatContact ? (
                                        <ChatWindow
                                            currentUser={user}
                                            contactUser={activeChatContact}
                                            onBack={() => setActiveChatContact(null)}
                                        />
                                    ) : (
                                        <Card className="p-6">
                                            <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Conversations</h2>
                                            {chatsLoading ? (
                                                <div className="text-center py-12 text-slate-400">Loading your inbox...</div>
                                            ) : chats.length === 0 ? (
                                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                                                    <MessageCircle size={48} className="mx-auto text-slate-300 mb-4 opacity-50" />
                                                    <h3 className="text-lg font-semibold text-slate-700">No active chat</h3>
                                                    <p className="text-slate-500 mt-2">Find a therapist on the Map and click "Chat" to start a new conversation.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {chats.map(contact => (
                                                        <div
                                                            key={contact.id}
                                                            onClick={() => setActiveChatContact({ id: contact.id, name: contact.name, profilePicture: contact.profilePicture, role: contact.role })}
                                                            className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50 cursor-pointer transition-all"
                                                        >
                                                            {contact.profilePicture ? (
                                                                <img src={contact.profilePicture} alt={contact.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                                                    {contact.name.charAt(0)}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <h3 className="font-bold text-slate-900">{contact.name}</h3>
                                                                <p className="text-sm text-slate-500">Therapist • Click to view messages</p>
                                                            </div>
                                                            <Button variant="ghost" className="ml-auto pointer-events-none hidden sm:block">Open Chat</Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Profile Tab */}
                            {activeTab === 'settings' && (
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>

                                    {profileLoading && (
                                        <div className="text-center py-12 text-slate-400">Loading profile...</div>
                                    )}

                                    {profileError && (
                                        <div className="text-center py-12 text-red-500">Could not load profile. Please try again.</div>
                                    )}

                                    {profile && !profileLoading && (
                                        <Card className="p-8">
                                            <div className="flex items-center gap-6 mb-8">
                                                {profile.profilePicture ? (
                                                    <img
                                                        src={profile.profilePicture.startsWith('data:') ? profile.profilePicture : `http://localhost:3000${profile.profilePicture}`}
                                                        alt="Profile"
                                                        className="w-20 h-20 rounded-full object-cover border-2 border-primary-100"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                                                        <User size={32} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
                                                    <span className="text-xs font-semibold uppercase tracking-wide bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{profile.role}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                                    <Mail className="text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase font-bold">Email</p>
                                                        <p className="text-slate-900">{profile.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                                    <Phone className="text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase font-bold">Contact Number</p>
                                                        <p className="text-slate-900">{profile.contact_number}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                                    <Calendar className="text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase font-bold">Member Since</p>
                                                        <p className="text-slate-900">
                                                            {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>

                                            </div>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ClientDashboard;
