import React, { useState } from 'react';
import {
    Users,
    Calendar,
    Settings,
    LogOut,
    Menu,
    Bell,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    Shield,
    BellRing,
    User,
    Mail,
    Phone,
    MessageCircle,
    Book,
    Mic,
    Upload,
    Eye,
    Loader,
    AlertCircle,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import ChatWindow from '../components/ChatWindow';
import authService from '../services/authService';
import notesService from '../services/notesService';
import api from '../services/api';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

// ── Self-contained Mini Calendar ──
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MiniCalendar = ({ selected, onSelect }) => {
    const today = new Date();
    const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : today.getMonth());
    const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : today.getFullYear());

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const isSameDay = (a, b) => a && b && a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    const isToday = (day) => isSameDay(new Date(viewYear, viewMonth, day), today);
    const isSelected = (day) => isSameDay(new Date(viewYear, viewMonth, day), selected);
    const isPast = (day) => new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
    const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, outside: true });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, outside: false });
    const remaining = 7 - (cells.length % 7); if (remaining < 7) for (let i = 1; i <= remaining; i++) cells.push({ day: i, outside: true });

    return (
        <div style={{ width: '100%', userSelect: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
                <button type="button" onClick={prev} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#64748b' }}>
                    <ChevronLeft size={16} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{MONTHS[viewMonth]} {viewYear}</span>
                <button type="button" onClick={next} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#64748b' }}>
                    <ChevronRight size={16} />
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
                {DAYS.map(d => <div key={d} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', padding: '6px 0' }}>{d}</div>)}
                {cells.map((c, i) => {
                    if (c.outside) return <div key={i} style={{ padding: 6, fontSize: 13, color: '#cbd5e1' }}>{c.day}</div>;
                    const past = isPast(c.day);
                    const sel = isSelected(c.day);
                    const tod = isToday(c.day);
                    return (
                        <button type="button" key={i} disabled={past}
                            onClick={() => onSelect(new Date(viewYear, viewMonth, c.day))}
                            style={{
                                padding: 6, fontSize: 13, fontWeight: sel || tod ? 700 : 500, borderRadius: 10, border: 'none', cursor: past ? 'default' : 'pointer',
                                background: sel ? '#6366f1' : tod ? '#eef2ff' : 'transparent',
                                color: sel ? 'white' : past ? '#cbd5e1' : tod ? '#6366f1' : '#334155',
                                position: 'relative', transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { if (!sel && !past) e.currentTarget.style.background = '#f1f5f9'; }}
                            onMouseLeave={(e) => { if (!sel && !past) e.currentTarget.style.background = tod ? '#eef2ff' : 'transparent'; }}
                        >
                            {c.day}
                            {tod && <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: sel ? 'white' : '#6366f1' }} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const TherapistDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('clients');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const currentUser = authService.getCurrentUser()?.user;

    const [chats, setChats] = useState([]);
    const [chatsLoading, setChatsLoading] = useState(false);
    const [activeChatContact, setActiveChatContact] = useState(null);

    // Clients State (categorized)
    const [activeClients, setActiveClients] = useState([]);
    const [upcomingClients, setUpcomingClients] = useState([]);
    const [recentClients, setRecentClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientSearch, setClientSearch] = useState("");
    const [openCalendarId, setOpenCalendarId] = useState(null);
    const [openNextSessionId, setOpenNextSessionId] = useState(null);
    const [clientDocs, setClientDocs] = useState({});
    const [scheduleModalClient, setScheduleModalClient] = useState(null);
    const [scheduleDate, setScheduleDate] = useState(null);
    const [scheduleTime, setScheduleTime] = useState("09:00");
    const [sessionDetailClient, setSessionDetailClient] = useState(null);
    const [completeNotes, setCompleteNotes] = useState("");
    const [highlightSection, setHighlightSection] = useState(null);

    // Appointment Requests State
    const [pendingRequests, setPendingRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);

    // Dashboard Stats State
    const [stats, setStats] = useState({ activeClients: 0, upcomingSessions: 0, recentClients: 0, pendingRequests: 0 });
    const [statsLoading, setStatsLoading] = useState(false);

    const fetchStats = () => {
        setStatsLoading(true);
        api.get('/therapists/stats')
            .then(res => setStats(res.data))
            .catch(err => console.error('Stats error:', err))
            .finally(() => setStatsLoading(false));
    };

    const fetchClients = () => {
        setClientsLoading(true);
        api.get('/therapists/clients')
            .then(res => {
                setActiveClients(res.data.active || []);
                setUpcomingClients(res.data.upcoming || []);
                setRecentClients(res.data.recent || []);
            })
            .catch(err => console.error(err))
            .finally(() => setClientsLoading(false));
    };

    const fetchPendingRequests = () => {
        setRequestsLoading(true);
        api.get('/therapists/requests/pending')
            .then(res => setPendingRequests(res.data))
            .catch(err => console.error(err))
            .finally(() => setRequestsLoading(false));
    };

    React.useEffect(() => {
        const docs = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('client_doc_')) {
                docs[key.replace('client_doc_', '')] = true;
            }
        }
        setClientDocs(docs);
    }, []);


    // Settings State
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        sms: false
    });

    // Profile State
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState(null);

    // Transcription State
    const [transcribeFile, setTranscribeFile] = useState(null);
    const [transcribeEmail, setTranscribeEmail] = useState(currentUser?.email || '');
    const [transcribeStatus, setTranscribeStatus] = useState('idle'); // idle | uploading | processing | success | error
    const [transcribeProgress, setTranscribeProgress] = useState(0);
    const [transcribeMessage, setTranscribeMessage] = useState('');
    const [transcribeResult, setTranscribeResult] = useState(null);

    React.useEffect(() => {
        if (!profile) {
            setProfileLoading(true);
            setProfileError(null);
            authService.getProfile()
                .then(data => setProfile(data))
                .catch(err => setProfileError(err))
                .finally(() => setProfileLoading(false));
        }
    }, []);

    React.useEffect(() => {
        if (activeTab === 'messages' && !activeChatContact) {
            setChatsLoading(true);
            api.get('/chats/contacts')
                .then(res => setChats(res.data))
                .catch(err => console.error(err))
                .finally(() => setChatsLoading(false));
        } else if (activeTab === 'clients') {
            fetchClients();
            fetchStats();
        } else if (activeTab === 'appointments') {
            fetchPendingRequests();
            fetchStats(); // keep pending count fresh
        }
    }, [activeTab, activeChatContact]);

    const handleAcceptRequest = async (requestId) => {
        try {
            await api.put(`/therapists/request/${requestId}/status`, { status: 'accepted' });
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));
            // Refresh clients so newly accepted one appears in the Recent Clients tab
            fetchClients();
            fetchStats();
        } catch (err) {
            console.error("Failed to accept request", err);
        }
    };

    const handleDeclineRequest = async (requestId) => {
        try {
            await api.put(`/therapists/request/${requestId}/status`, { status: 'declined' });
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));
            fetchStats();
        } catch (err) {
            console.error("Failed to decline request", err);
        }
    };

    const handleUpdateSession = async (clientId, field, value) => {
        try {
            await api.put(`/therapists/client/${clientId}/session`, { [field]: value });
            fetchClients();
            fetchStats();
        } catch (err) {
            console.error('Failed to update session:', err);
        }
    };

    const handleScheduleSession = async () => {
        if (!scheduleModalClient || !scheduleDate) return;
        const [hours, minutes] = scheduleTime.split(':');
        const dt = new Date(scheduleDate);
        dt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        try {
            await api.put(`/therapists/client/${scheduleModalClient.id}/session`, { nextSession: dt.toISOString() });
            setScheduleModalClient(null);
            setScheduleDate(null);
            setScheduleTime("09:00");
            fetchClients();
            fetchStats();
        } catch (err) {
            console.error('Failed to schedule session:', err);
        }
    };

    const handleCompleteSession = async (clientId) => {
        try {
            await api.put(`/therapists/client/${clientId}/complete-session`, { sessionNotes: completeNotes || null });
            setSessionDetailClient(null);
            setCompleteNotes("");
            fetchClients();
            fetchStats();
        } catch (err) {
            console.error('Failed to complete session:', err);
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        authService.logout();
        navigate('/', { replace: true });
    };

    const handleTranscribe = async (e) => {
        e.preventDefault();
        if (!transcribeFile) {
            setTranscribeMessage('Please select a recording file.');
            setTranscribeStatus('error');
            return;
        }
        if (!transcribeEmail) {
            setTranscribeMessage('Please enter your email address.');
            setTranscribeStatus('error');
            return;
        }

        setTranscribeStatus('uploading');
        setTranscribeProgress(0);
        setTranscribeMessage('');
        setTranscribeResult(null);

        try {
            const result = await notesService.transcribeRecording(
                transcribeFile,
                transcribeEmail,
                (pct) => {
                    setTranscribeProgress(pct);
                    if (pct === 100) setTranscribeStatus('processing');
                }
            );
            setTranscribeStatus('success');
            setTranscribeMessage(result.message || `Transcript sent to ${transcribeEmail}! Check your inbox.`);
            setTranscribeResult(result);
            setTranscribeFile(null);
            const fileInput = document.getElementById('session-recording-input');
            if (fileInput) fileInput.value = '';
        } catch (err) {
            setTranscribeStatus('error');
            setTranscribeMessage(err.message || 'An error occurred. Please try again.');
        }
    };

    const handleDownloadDocx = async () => {
        if (!transcribeResult) return;
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const children = [
            new Paragraph({
                children: [new TextRun({ text: 'Session Transcription Report', bold: true, size: 36, font: 'Calibri', color: '2563EB' })],
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
            }),
            new Paragraph({
                children: [new TextRun({ text: `Generated on ${dateStr}`, italics: true, size: 20, color: '64748B', font: 'Calibri' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }),
        ];

        if (transcribeResult.summary) {
            children.push(
                new Paragraph({ children: [new TextRun({ text: 'Summary', bold: true, size: 28, font: 'Calibri', color: '1E293B' })], heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
                ...transcribeResult.summary.split('\n').filter(l => l.trim()).map(line =>
                    new Paragraph({ children: [new TextRun({ text: line, size: 22, font: 'Calibri' })], spacing: { after: 100 } })
                )
            );
        }

        if (transcribeResult.transcript) {
            children.push(
                new Paragraph({ children: [new TextRun({ text: 'Full Transcript', bold: true, size: 28, font: 'Calibri', color: '1E293B' })], heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 150 } }),
                ...transcribeResult.transcript.split('\n').filter(l => l.trim()).map(line =>
                    new Paragraph({ children: [new TextRun({ text: line, size: 22, font: 'Calibri' })], spacing: { after: 80 } })
                )
            );
        }

        // Fallback: if result has other text fields, include them
        if (!transcribeResult.summary && !transcribeResult.transcript) {
            const text = transcribeResult.text || transcribeResult.result || transcribeResult.message || JSON.stringify(transcribeResult, null, 2);
            children.push(
                new Paragraph({ children: [new TextRun({ text: 'Results', bold: true, size: 28, font: 'Calibri', color: '1E293B' })], heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
                ...text.split('\n').filter(l => l.trim()).map(line =>
                    new Paragraph({ children: [new TextRun({ text: line, size: 22, font: 'Calibri' })], spacing: { after: 80 } })
                )
            );
        }

        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Session_Transcription_${now.toISOString().slice(0, 10)}.docx`);
    };

    const handleFileUpload = (clientId, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                localStorage.setItem(`client_doc_${clientId}`, e.target.result);
                setClientDocs(prev => ({ ...prev, [clientId]: true }));
            } catch (err) {
                alert("File too large to store in browser localStorage!");
            }
        };
        reader.readAsDataURL(file);
    };

    const handleViewDoc = (clientId) => {
        const dataUrl = localStorage.getItem(`client_doc_${clientId}`);
        if (dataUrl) {
            const win = window.open();
            if (win) {
                win.document.write(`<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%; position:absolute;" allowfullscreen></iframe>`);
            } else {
                alert("Please allow popups to view the document.");
            }
        }
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
        <div className="min-h-screen bg-slate-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#111111] shadow-2xl border-r border-white/5 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 flex flex-col
      `}>
                <div className="h-20 flex items-center px-6 border-b border-white/10">
                    <span className="text-xl font-display font-bold text-white tracking-tight uppercase">ALETHEIA</span>
                </div>

                <div className="p-4 space-y-1 flex-grow overflow-y-auto">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4 mt-4">Practice</div>
                    <SidebarItem icon={Users} label="My Clients" id="clients" />
                    <SidebarItem icon={Calendar} label="Appointments" id="appointments" />
                    <SidebarItem icon={Book} label="Documentation" id="notes" />
                    <SidebarItem icon={MessageCircle} label="Messages" id="messages" />

                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4 mt-8">Account</div>
                    <SidebarItem icon={Settings} label="Settings" id="settings" />
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
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar} className="p-2 text-slate-600 md:hidden">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900 hidden md:block">
                            {activeTab === 'messages' ? 'Direct Messages' : activeTab === 'clients' ? 'Client Management' : activeTab === 'appointments' ? 'Appointments' : activeTab === 'notes' ? 'Note Taking' : 'Settings'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-slate-600 relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        {profile?.profilePicture ? (
                            <img
                                src={profile.profilePicture.startsWith('data:') ? profile.profilePicture : `http://localhost:3000${profile.profilePicture}`}
                                alt="Profile"
                                className="w-8 h-8 rounded-full object-cover border border-primary-200"
                                onClick={() => setActiveTab('settings')}
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                                <User size={16} />
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto space-y-8">

                        {activeTab === 'clients' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                <Card className="p-6 flex items-center gap-4 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all" onClick={() => { setHighlightSection('active'); document.getElementById('section-active')?.scrollIntoView({ behavior: 'smooth' }); }}>
                                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Active Clients</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {statsLoading ? <Loader size={20} className="animate-spin text-slate-400" /> : stats.activeClients}
                                        </p>
                                    </div>
                                </Card>
                                <Card className="p-6 flex items-center gap-4 cursor-pointer hover:ring-2 hover:ring-green-300 transition-all" onClick={() => { setHighlightSection('upcoming'); document.getElementById('section-upcoming')?.scrollIntoView({ behavior: 'smooth' }); }}>
                                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Upcoming Sessions</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {statsLoading ? <Loader size={20} className="animate-spin text-slate-400" /> : stats.upcomingSessions}
                                        </p>
                                    </div>
                                </Card>
                                <Card className="p-6 flex items-center gap-4 cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all" onClick={() => { setHighlightSection('recent'); document.getElementById('section-recent')?.scrollIntoView({ behavior: 'smooth' }); }}>
                                    <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Recent Clients</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {statsLoading ? <Loader size={20} className="animate-spin text-slate-400" /> : stats.recentClients}
                                        </p>
                                    </div>
                                </Card>
                                <Card className="p-6 flex items-center gap-4 cursor-pointer hover:ring-2 hover:ring-yellow-300 transition-all" onClick={() => { setActiveTab('appointments'); }}>
                                    <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                                        <Bell size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Pending Requests</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {statsLoading ? <Loader size={20} className="animate-spin text-slate-400" /> : stats.pendingRequests}
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* Clients Tab — 3 Sections */}
                        {activeTab === 'clients' && (
                            <div className="space-y-8">

                                {/* Search Bar */}
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="text" placeholder="Search clients..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
                                </div>

                                {clientsLoading ? (
                                    <div className="flex items-center justify-center p-12">
                                        <Loader size={28} className="animate-spin text-primary-500" />
                                    </div>
                                ) : (
                                    <>
                                        {/* ── Section 1: Active Clients ── */}
                                        <div id="section-active">
                                            <Card className={`overflow-hidden transition-all duration-300 ${highlightSection === 'active' ? 'ring-2 ring-blue-400' : ''}`} onAnimationEnd={() => setHighlightSection(null)}>
                                                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users size={18} /></div>
                                                    <h2 className="text-lg font-bold text-slate-900">Active Clients</h2>
                                                    <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{activeClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length}</span>
                                                </div>
                                                {activeClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                                                    <div className="px-6 py-8 text-center text-slate-400 text-sm">No active clients waiting for first session.</div>
                                                ) : (
                                                    <div className="divide-y divide-slate-50">
                                                        {activeClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(client => (
                                                            <div key={client.id} onClick={() => { setScheduleModalClient(client); setScheduleDate(null); setScheduleTime("09:00"); }}
                                                                className="flex items-center gap-4 px-6 py-4 hover:bg-blue-50/50 cursor-pointer transition-colors group">
                                                                {client.profilePicture ? (
                                                                    <img src={client.profilePicture} alt={client.name} className="w-10 h-10 rounded-full object-cover" />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">{client.name.charAt(0)}</div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-semibold text-slate-900 truncate">{client.name}</p>
                                                                    <p className="text-xs text-slate-400">Accepted {new Date(client.acceptedAt).toLocaleDateString()}</p>
                                                                </div>
                                                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full group-hover:bg-blue-100 transition-colors">Schedule Session →</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card>
                                        </div>

                                        {/* ── Section 2: Upcoming Sessions ── */}
                                        <div id="section-upcoming">
                                            <Card className={`overflow-hidden transition-all duration-300 ${highlightSection === 'upcoming' ? 'ring-2 ring-green-400' : ''}`}>
                                                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                                                    <div className="p-2 bg-green-100 rounded-lg text-green-600"><Calendar size={18} /></div>
                                                    <h2 className="text-lg font-bold text-slate-900">Upcoming Sessions</h2>
                                                    <span className="ml-auto text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{upcomingClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length}</span>
                                                </div>
                                                {upcomingClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                                                    <div className="px-6 py-8 text-center text-slate-400 text-sm">No upcoming sessions scheduled.</div>
                                                ) : (
                                                    <div className="divide-y divide-slate-50">
                                                        {upcomingClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(client => (
                                                            <div key={client.id} className="flex items-center gap-4 px-6 py-4 hover:bg-green-50/50 transition-colors">
                                                                {client.profilePicture ? (
                                                                    <img src={client.profilePicture} alt={client.name} className="w-10 h-10 rounded-full object-cover" />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">{client.name.charAt(0)}</div>
                                                                )}
                                                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setSessionDetailClient(client); setCompleteNotes(""); }}>
                                                                    <p className="font-semibold text-slate-900 truncate">{client.name}</p>
                                                                    <p className="text-xs text-slate-400">
                                                                        {client.lastSession ? `Last: ${new Date(client.lastSession).toLocaleDateString()}` : 'First session'}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right mr-3">
                                                                    <p className="text-sm font-bold text-green-700">{new Date(client.nextSession).toLocaleDateString()}</p>
                                                                    <p className="text-xs text-green-600">{new Date(client.nextSession).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                </div>
                                                                <button onClick={(e) => { e.stopPropagation(); handleCompleteSession(client.id); }}
                                                                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors shadow-sm">
                                                                    <CheckCircle size={14} /> Done
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card>
                                        </div>

                                        {/* ── Section 3: Recent Clients ── */}
                                        <div id="section-recent">
                                            <Card className={`overflow-hidden transition-all duration-300 ${highlightSection === 'recent' ? 'ring-2 ring-purple-400' : ''}`}>
                                                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Clock size={18} /></div>
                                                    <h2 className="text-lg font-bold text-slate-900">Recent Clients</h2>
                                                    <span className="ml-auto text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{recentClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length}</span>
                                                </div>
                                                {recentClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                                                    <div className="px-6 py-8 text-center text-slate-400 text-sm">No recent clients yet.</div>
                                                ) : (
                                                    <div className="divide-y divide-slate-50">
                                                        {recentClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(client => (
                                                            <div key={client.id} className="flex items-center gap-4 px-6 py-4 hover:bg-purple-50/30 transition-colors">
                                                                {client.profilePicture ? (
                                                                    <img src={client.profilePicture} alt={client.name} className="w-10 h-10 rounded-full object-cover" />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold">{client.name.charAt(0)}</div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-semibold text-slate-900 truncate">{client.name}</p>
                                                                    <p className="text-xs text-slate-400">Last session: {new Date(client.lastSession).toLocaleDateString()}</p>
                                                                    {client.sessionNotes && <p className="text-xs text-slate-500 mt-1 italic">"{client.sessionNotes}"</p>}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => {
                                                                        setActiveTab('messages');
                                                                        setActiveChatContact({ id: client.id, name: client.name, profilePicture: client.profilePicture, role: 'user' });
                                                                    }} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Message">
                                                                        <MessageCircle size={16} />
                                                                    </button>
                                                                    {client.nextSession && new Date(client.nextSession) > new Date() ? (
                                                                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                                                                            Upcoming: {new Date(client.nextSession).toLocaleDateString()}
                                                                        </span>
                                                                    ) : (
                                                                        <button onClick={() => { setScheduleModalClient(client); setScheduleDate(null); setScheduleTime("09:00"); }}
                                                                            className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors">
                                                                            Schedule Next →
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card>
                                        </div>
                                    </>
                                )}

                                {/* ── Schedule Session Modal ── */}
                                {scheduleModalClient && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setScheduleModalClient(null)}>
                                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                                            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-bold text-slate-900">Schedule Session</h3>
                                                    <p className="text-xs text-slate-500 mt-0.5">with {scheduleModalClient.name}</p>
                                                </div>
                                                <button onClick={() => setScheduleModalClient(null)} className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={18} /></button>
                                            </div>
                                            <div className="p-5 flex flex-col gap-5">
                                                <MiniCalendar selected={scheduleDate} onSelect={(date) => setScheduleDate(date)} />
                                                <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-slate-600">Time</span>
                                                    <input type="time" className="text-sm font-medium p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                                        value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                                                </div>
                                                <button onClick={handleScheduleSession} disabled={!scheduleDate}
                                                    className="w-full bg-primary text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                    Confirm Session
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Session Detail / Complete Modal ── */}
                                {sessionDetailClient && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSessionDetailClient(null)}>
                                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                                            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-bold text-slate-900">Session Details</h3>
                                                    <p className="text-xs text-slate-500 mt-0.5">with {sessionDetailClient.name}</p>
                                                </div>
                                                <button onClick={() => setSessionDetailClient(null)} className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={18} /></button>
                                            </div>
                                            <div className="p-5 space-y-4">
                                                <div className="flex items-center gap-4">
                                                    {sessionDetailClient.profilePicture ? (
                                                        <img src={sessionDetailClient.profilePicture} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-green-100" />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-lg font-bold">{sessionDetailClient.name.charAt(0)}</div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-slate-900">{sessionDetailClient.name}</p>
                                                        <p className="text-xs text-slate-500">{sessionDetailClient.firstSessionDate ? `Client since ${new Date(sessionDetailClient.firstSessionDate).toLocaleDateString()}` : 'New client'}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                                                    <div className="flex items-center gap-2 text-green-800 font-semibold text-sm"><Calendar size={16} /> Scheduled</div>
                                                    <p className="text-lg font-bold text-green-900">{new Date(sessionDetailClient.nextSession).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                    <p className="text-sm text-green-700">{new Date(sessionDetailClient.nextSession).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                {sessionDetailClient.lastSession && (
                                                    <p className="text-xs text-slate-400">Previous session: {new Date(sessionDetailClient.lastSession).toLocaleDateString()}</p>
                                                )}
                                                {new Date(sessionDetailClient.nextSession) <= new Date() && (
                                                    <>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Session Notes (optional)</label>
                                                            <textarea rows={2} value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)}
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Brief session summary..." />
                                                        </div>
                                                        <button onClick={() => handleCompleteSession(sessionDetailClient.id)}
                                                            className="w-full bg-green-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                                                            <CheckCircle size={16} /> Mark as Completed
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Appointments Tab */}
                        {activeTab === 'appointments' && (
                            <div className="space-y-4">
                                <h2 className="font-bold text-slate-900">Pending Requests</h2>
                                {requestsLoading ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader className="animate-spin text-primary-500" size={24} />
                                    </div>
                                ) : pendingRequests.length === 0 ? (
                                    <Card className="p-8 text-center text-slate-500">
                                        <p>No pending appointment requests.</p>
                                    </Card>
                                ) : (
                                    pendingRequests.map((req, i) => (
                                        <Card key={i} className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {req.profilePicture ? (
                                                    <img src={req.profilePicture} alt={req.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-bold shadow-inner">
                                                        {req.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{req.name}</h3>
                                                    <p className="text-sm text-slate-500">{new Date(req.time).toLocaleString()}</p>
                                                    <p className="text-xs text-primary-600 font-medium mt-1">{req.type}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDeclineRequest(req.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><XCircle /></button>
                                                <button onClick={() => handleAcceptRequest(req.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"><CheckCircle /></button>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Note Taking Tab — Session Transcription */}
                        {activeTab === 'notes' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Session Transcription</h2>
                                    <p className="text-slate-500 mt-1">Upload a session recording to get an AI-generated transcript &amp; summary sent to your email.</p>
                                </div>

                                <Card className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                                            <Mic size={20} className="text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Upload Recording</h3>
                                            <p className="text-sm text-slate-500">Supported formats: MP3, MP4, M4A, WAV, MOV and more — up to 500 MB</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleTranscribe} className="space-y-5">
                                        {/* File picker */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Recording File</label>
                                            <label
                                                htmlFor="session-recording-input"
                                                className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors
                                                    ${transcribeFile ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'}`}
                                            >
                                                <Upload size={22} className={transcribeFile ? 'text-primary-600' : 'text-slate-400'} />
                                                <div className="flex-1 min-w-0">
                                                    {transcribeFile ? (
                                                        <>
                                                            <p className="text-sm font-medium text-primary-700 truncate">{transcribeFile.name}</p>
                                                            <p className="text-xs text-slate-500">{(transcribeFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm font-medium text-slate-600">Click to choose a file</p>
                                                            <p className="text-xs text-slate-400">MP3, MP4, M4A, WAV, MOV and more — up to 500 MB</p>
                                                        </>
                                                    )}
                                                </div>
                                                {transcribeFile && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); setTranscribeFile(null); const inp = document.getElementById('session-recording-input'); if (inp) inp.value = ''; }}
                                                        className="text-slate-400 hover:text-red-500 flex-shrink-0"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                )}
                                            </label>
                                            <input
                                                id="session-recording-input"
                                                type="file"
                                                accept="audio/*,video/*"
                                                className="hidden"
                                                onChange={(e) => { setTranscribeFile(e.target.files[0] || null); setTranscribeStatus('idle'); setTranscribeMessage(''); }}
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Send results to</label>
                                            <input
                                                type="email"
                                                placeholder="your@email.com"
                                                value={transcribeEmail}
                                                onChange={(e) => setTranscribeEmail(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                                required
                                            />
                                        </div>

                                        {/* Upload progress */}
                                        {(transcribeStatus === 'uploading' || transcribeStatus === 'processing') && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-600 flex items-center gap-2">
                                                        <Loader size={14} className="animate-spin text-primary-500" />
                                                        {transcribeStatus === 'uploading'
                                                            ? `Uploading… ${transcribeProgress}%`
                                                            : 'Processing with AI — this may take a few minutes…'}
                                                    </span>
                                                </div>
                                                {transcribeStatus === 'uploading' && (
                                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                                        <div
                                                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${transcribeProgress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Feedback messages */}
                                        {transcribeStatus === 'success' && (
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                                    <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-emerald-800 flex-1">{transcribeMessage}</p>
                                                </div>
                                                {transcribeResult && (
                                                    <button
                                                        type="button"
                                                        onClick={handleDownloadDocx}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                        Download Results as .docx
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {transcribeStatus === 'error' && (
                                            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-700">{transcribeMessage}</p>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full justify-center"
                                            disabled={transcribeStatus === 'uploading' || transcribeStatus === 'processing'}
                                        >
                                            {transcribeStatus === 'uploading' || transcribeStatus === 'processing' ? (
                                                <><Loader size={16} className="mr-2 animate-spin" /> Processing…</>
                                            ) : (
                                                <><Mic size={16} className="mr-2" /> Upload &amp; Transcribe</>
                                            )}
                                        </Button>
                                    </form>
                                </Card>
                            </div>
                        )}

                        {/* Messages Tab */}
                        {activeTab === 'messages' && (
                            <div className="space-y-6">
                                {activeChatContact ? (
                                    <ChatWindow
                                        currentUser={currentUser}
                                        contactUser={activeChatContact}
                                        onBack={() => setActiveChatContact(null)}
                                    />
                                ) : (
                                    <Card className="p-6">
                                        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Conversations</h2>
                                        {chatsLoading ? (
                                            <div className="text-center py-12 text-slate-400">Loading your inbox...</div>
                                        ) : chats.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400">
                                                <MessageCircle className="mx-auto mb-3 opacity-20" size={48} />
                                                <p>Your inbox is empty.</p>
                                                <p className="text-sm">When clients send you messages, they will appear here.</p>
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
                                                            <p className="text-sm text-slate-500">Click to view messages</p>
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

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <h2 className="text-2xl font-bold text-slate-900">Practice Settings</h2>

                                {/* Profile Card — pulled from backend */}
                                {profileLoading && <div className="text-center py-6 text-slate-400">Loading profile...</div>}
                                {profileError && <div className="text-center py-6 text-red-500">Could not load profile.</div>}
                                {profile && !profileLoading && (
                                    <Card className="p-6">
                                        <div className="flex items-center gap-5 mb-6">
                                            {profile.profilePicture ? (
                                                <img
                                                    src={profile.profilePicture.startsWith('data:') ? profile.profilePicture : `http://localhost:3000${profile.profilePicture}`}
                                                    alt="Profile"
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-100"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                                                    <User size={28} />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{profile.name}</h3>
                                                <span className="text-xs font-semibold uppercase tracking-wide bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Therapist</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                                <Mail className="text-slate-400" size={16} />
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-bold">Email</p>
                                                    <p className="text-slate-900 text-sm">{profile.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                                <Phone className="text-slate-400" size={16} />
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-bold">Contact</p>
                                                    <p className="text-slate-900 text-sm">{profile.contact_number}</p>
                                                </div>
                                            </div>
                                            {profile.address && (
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                                    <span className="text-base">🏥</span>
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase font-bold">Clinic Address</p>
                                                        <p className="text-slate-900 text-sm">{profile.address}</p>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </Card>
                                )}


                                <Card className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                            <BellRing size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Notifications</h3>
                                            <p className="text-sm text-slate-500">Choose how you want to be updated.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
                                            <span className="text-slate-700">Email Notifications</span>
                                            <input type="checkbox" checked={notifications.email} onChange={() => setNotifications({ ...notifications, email: !notifications.email })} className="w-5 h-5 text-primary-600 rounded" />
                                        </label>
                                        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
                                            <span className="text-slate-700">Push Notifications</span>
                                            <input type="checkbox" checked={notifications.push} onChange={() => setNotifications({ ...notifications, push: !notifications.push })} className="w-5 h-5 text-primary-600 rounded" />
                                        </label>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Security</h3>
                                            <p className="text-sm text-slate-500">Protect your account.</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full">Change Password</Button>
                                </Card>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
};

export default TherapistDashboard;
