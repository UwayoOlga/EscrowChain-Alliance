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
            alert('Failed to securely dispatch message. Verify active connection.');
        }
    };

    if (loading) return <div className="page container">Loading Communication Channels...</div>;

    return (
        <div className="page fade-in" style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', padding: '24px 32px' }}>
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <span className="text-overline">Direct Line</span>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Messages</h1>
            </div>

            <div className="card" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 0 }}>
                {contacts.length === 0 ? (
                    <div style={{ padding: '48px', margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                        You must possess an active smart contract lease before initiating a communication channel.
                    </div>
                ) : (
                    <>
                        <div style={{ width: '320px', borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', overflowY: 'auto' }}>
                            {contacts.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedContact(c)}
                                    style={{
                                        padding: '16px 24px',
                                        borderBottom: '1px solid var(--border)',
                                        cursor: 'pointer',
                                        background: selectedContact?.id === c.id ? '#ffffff' : 'transparent',
                                        borderLeft: selectedContact?.id === c.id ? '4px solid var(--accent)' : '4px solid transparent',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ fontWeight: 700, color: 'var(--dark-slate)', marginBottom: '4px' }}>{c.other_user_name}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.other_user_role}</span>
                                        {c.last_message && (
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : ''}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {c.last_message || 'Start a conversation'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: '#fff' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>SECURE THREAD</div>
                                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--dark-slate)' }}>{selectedContact?.other_user_name}</div>
                            </div>

                            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {messages.length === 0 ? (
                                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        End-to-end lease connection established. Send a secure transmission.
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMine = msg.sender_id === user.id;
                                        return (
                                            <div key={msg.id || idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                                <div style={{
                                                    padding: '12px 16px',
                                                    borderRadius: isMine ? '8px 8px 0 8px' : '8px 8px 8px 0',
                                                    background: isMine ? 'var(--dark-slate)' : '#fff',
                                                    color: isMine ? '#fff' : 'var(--text-primary)',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                    fontSize: '0.95rem',
                                                    lineHeight: 1.5,
                                                    border: isMine ? 'none' : '1px solid var(--border)'
                                                }}>
                                                    {msg.content}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: isMine ? 'right' : 'left' }}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid var(--border)' }}>
                                <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Transmit message..."
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        style={{ flex: 1, background: 'var(--bg-secondary)', border: 'none', padding: '14px 20px', borderRadius: '30px' }}
                                    />
                                    <button type="submit" className="btn btn-dark" style={{ borderRadius: '30px', padding: '0 24px' }}>
                                        Dispatch
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
