import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        api.getMessageContacts()
            .then(data => {
                setContacts(data);
                if (data.length > 0) {
                    setSelectedContact(data[0]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedContact) return;
        const fetchThread = () => {
            api.getMessages(selectedContact.other_user_id)
                .then(data => setMessages(data))
                .catch(err => console.error(err));
        };
        fetchThread();
        const interval = setInterval(fetchThread, 10000);
        return () => clearInterval(interval);
    }, [selectedContact]);

    useEffect(() => {
        // Scroll to newest message
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedContact) return;

        try {
            const content = replyText.trim();
            const newMsg = {
                id: Date.now().toString(),
                sender_id: user.id,
                content: content,
                created_at: new Date().toISOString()
            };

            // Update state immediately
            setMessages(prev => [...prev, newMsg]);
            setReplyText('');

            await api.sendMessage({ receiverId: selectedContact.other_user_id, content: content });
        } catch (error) {
            console.error(error);
            alert('Could not deliver message. Please check your connection.');
        }
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
    };

    const getRoleBadge = (role) => {
        const r = role?.toLowerCase();
        if (r === 'landlord') return <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Landlord</span>;
        if (r === 'tenant') return <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Tenant</span>;
        return <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Arbitrator</span>;
    };

    if (loading) return <div className="page container"><p>Opening secure channels...</p></div>;

    return (
        <div className="page fade-in" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', padding: '16px 24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <span className="text-overline">Messages</span>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-slate)', letterSpacing: '-0.02em' }}>Direct Chat</h1>
            </div>

            <div className="dash-card" style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%', minHeight: 0 }}>
                {contacts.length === 0 ? (
                    <div style={{ padding: '80px 40px', margin: 'auto', textAlign: 'center', maxWidth: '420px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>💬</div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>No Conversations Yet</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Conversations are created automatically when you sign a lease. Once active, you'll be able to chat here.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Contacts Sidebar List */}
                        <div style={{ width: '300px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#fff', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                ACTIVE CONVERSATIONS
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                {contacts.map(c => {
                                    const isSelected = selectedContact?.id === c.id;
                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() => setSelectedContact(c)}
                                            style={{
                                                padding: '16px 20px',
                                                borderBottom: '1px solid var(--border)',
                                                cursor: 'pointer',
                                                background: isSelected ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                                                borderLeft: isSelected ? '4px solid var(--accent)' : '4px solid transparent',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}
                                        >
                                            {/* Avatar */}
                                            <div style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '50%',
                                                background: isSelected ? 'var(--accent)' : 'var(--border-hover)',
                                                color: isSelected ? '#fff' : 'var(--text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                flexShrink: 0
                                            }}>
                                                {getInitials(c.other_user_name)}
                                            </div>
                                            
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--dark-slate)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {c.other_user_name}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                                        {c.last_message || 'No messages yet'}
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                                        {c.updated_at ? new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Message Panel */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                            {/* Panel Header */}
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '50%',
                                        background: 'var(--accent-subtle)',
                                        color: 'var(--accent)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.95rem',
                                        fontWeight: 700
                                    }}>
                                        {getInitials(selectedContact?.other_user_name)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--dark-slate)' }}>{selectedContact?.other_user_name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                            {getRoleBadge(selectedContact?.other_user_role)}
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Secure Link</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Message Threads List */}
                            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc' }}>
                                {messages.length === 0 ? (
                                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '280px' }}>
                                        💬 Let's get the conversation started. Send a message to {selectedContact?.other_user_name} below.
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMine = msg.sender_id === user.id;
                                        return (
                                            <div key={msg.id || idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', flexDirection: 'column' }}>
                                                <div style={{
                                                    padding: '12px 16px',
                                                    borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                                    background: isMine ? 'linear-gradient(135deg, var(--accent) 0%, #3B82F6 100%)' : '#fff',
                                                    color: isMine ? '#fff' : 'var(--text-primary)',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                                    fontSize: '0.92rem',
                                                    lineHeight: 1.5,
                                                    border: isMine ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {msg.content}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: isMine ? 'right' : 'left', fontWeight: 600 }}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Composer Area */}
                            <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid var(--border)' }}>
                                <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder={`Message ${selectedContact?.other_user_name}...`}
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        style={{ flex: 1, background: 'var(--bg-secondary)', border: 'none', padding: '14px 20px', borderRadius: '24px', fontSize: '0.92rem' }}
                                    />
                                    <button type="submit" className="btn btn-dark" style={{ borderRadius: '24px', padding: '0 24px', height: '46px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Send
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
