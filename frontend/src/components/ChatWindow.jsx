import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, User } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';

const ChatWindow = ({ currentUser, contactUser, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const currentUserId = currentUser.id || currentUser.userId || currentUser.user_id;
    const room = [currentUserId, contactUser.id].sort().join('-');

    useEffect(() => {
        // Fetch chat history
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/chats/history/${contactUser.id}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to load chat history", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();

        // Connect to Socket.io
        socketRef.current = io("http://localhost:3000");

        socketRef.current.emit("join_room", room);

        socketRef.current.on("receive_message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [contactUser.id, room]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            sender_id: currentUserId,
            receiver_id: contactUser.id,
            message: newMessage.trim(),
            room: room,
        };

        socketRef.current.emit("send_message", messageData);
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
            {/* Chat Header */}
            <div className="bg-primary-600 text-white p-4 flex items-center gap-4 shadow-md z-10">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-primary-700 rounded-full transition-colors flex-shrink-0"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    {contactUser.profilePicture || contactUser.profile_picture ? (
                        <img
                            src={contactUser.profilePicture || contactUser.profile_picture}
                            alt={contactUser.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-primary-400"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-500 border-2 border-primary-400 flex items-center justify-center font-bold text-white shadow-sm">
                            {contactUser.name ? contactUser.name.charAt(0) : <User size={20} />}
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-lg leading-tight">{contactUser.name}</h3>
                        <p className="text-primary-100 text-xs">Direct Chat</p>
                    </div>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow p-4 overflow-y-auto bg-slate-50">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center text-slate-400">Loading history...</div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <p>No messages yet.</p>
                        <p className="text-sm">Send a message to start the conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, index) => {
                            const isMine = msg.sender_id === currentUserId;
                            return (
                                <div
                                    key={index}
                                    className={`flex max-w-[80%] ${isMine ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                                >
                                    <div
                                        className={`px-4 py-2 rounded-2xl ${isMine
                                            ? 'bg-primary-600 text-white rounded-br-none'
                                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.message}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-primary-200' : 'text-slate-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2 bg-slate-50 p-1 pl-4 rounded-full border border-slate-200 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 transition-all"
                >
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow bg-transparent outline-none text-slate-700 placeholder:text-slate-400 py-2"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-primary-600 hover:bg-primary-700 text-white p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:bg-slate-400 flex-shrink-0"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
