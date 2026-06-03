import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Documents() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [uploadFile, setUploadFile] = useState(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadType, setUploadType] = useState('lease');

    const loadData = () => {
        api.getDocuments()
            .then(data => setDocuments(Array.isArray(data) ? data : []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return alert('Please select a file to upload');

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('title', uploadTitle || uploadFile.name);
            formData.append('type', uploadType);

            await api.createDocument(formData);

            setUploadFile(null);
            setUploadTitle('');

            loadData();
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const typeIcon = (type) => {
        const icons = {
            lease: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            receipt: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
            certificate: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        };
        return icons[type] || icons.lease;
    };

    const typeBadge = (type) => {
        const map = {
            lease: 'badge-info',
            receipt: 'badge-success',
            certificate: 'badge-warning',
            document: 'badge-secondary'
        };
        return map[type] || 'badge-secondary';
    };

    if (loading) return <div className="page container"><p>Loading Document Vault...</p></div>;

    const isLandlord = user?.role?.toLowerCase() === 'landlord';

    return (
        <div className="page container fade-in" style={{ maxWidth: '960px' }}>
            <div className="page-header text-center" style={{ marginBottom: '64px' }}>
                <span className="text-overline">Cryptographic Vault</span>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Documents Hub</h1>
                <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)' }}>
                    Access digital leases, signed programmatic contracts, and compliance records securely.
                </p>
            </div>

            {/* UPLOAD FORM FOR LANDLORDS */}
            {isLandlord && (
                <div className="card" style={{ marginBottom: '40px', padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 700 }}>Deploy Document</h3>
                    <form onSubmit={handleUpload} className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                        <div className="form-group">
                            <label>Document Title</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. Master Lease Addendum"
                                value={uploadTitle}
                                onChange={(e) => setUploadTitle(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>File Type</label>
                            <select className="select" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                                <option value="lease">Lease Agreement</option>
                                <option value="receipt">Financial Receipt</option>
                                <option value="certificate">Legal Certificate</option>
                                <option value="document">Misc Document</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Physical File</label>
                            <input
                                type="file"
                                className="input"
                                onChange={(e) => setUploadFile(e.target.files[0])}
                                style={{ padding: '8px' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-dark btn-square" disabled={uploading} style={{ height: '46px' }}>
                            {uploading ? 'Uploading...' : 'Secure Upload'}
                        </button>
                    </form>
                </div>
            )}

            {documents.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '80px 40px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--border)' }}>
                    <div className="empty-state" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700 }}>No Documents Yet</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                        Once a lease agreement is signed, contract PDFs and compliance certificates will appear here automatically.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {documents.map(doc => (
                        <div key={doc.id} className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d={typeIcon(doc.type)}></path>
                                </svg>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 700 }}>{doc.title}</span>
                                    <span className={`badge ${typeBadge(doc.type)}`}>{doc.type}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Added {new Date(doc.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm btn-square">
                                Download File
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
