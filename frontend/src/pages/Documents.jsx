import { useState, useEffect } from 'react';
import { api, BASE_URL } from '../api';
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

    const formatTypeName = (type) => {
        const names = {
            lease: 'Lease Agreement',
            receipt: 'Payment Receipt',
            certificate: 'Legal Certificate',
            document: 'General Document'
        };
        return names[type] || 'General Document';
    };

    if (loading) return <div className="page container"><p>Opening secure vault...</p></div>;

    const isLandlord = user?.role?.toLowerCase() === 'landlord';

    return (
        <div className="page container fade-in" style={{ maxWidth: '960px', padding: '16px 24px' }}>
            {/* Header Description */}
            <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                <span className="text-overline">Vault</span>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--dark-slate)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    Documents Hub
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Access, view, and store digital lease contracts, official payment receipts, and registry filings.
                </p>
            </div>

            {/* UPLOAD FORM FOR LANDLORDS */}
            {isLandlord && (
                <div className="dash-card" style={{ marginBottom: '40px' }}>
                    <div className="dash-card-header">
                        <h3>Deploy New Document</h3>
                    </div>
                    <div className="dash-card-body">
                        <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
                            <div className="form-group">
                                <label>Document Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Signed Addendum No.1"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    style={{ borderRadius: '8px' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>File Category</label>
                                <select className="select" value={uploadType} onChange={(e) => setUploadType(e.target.value)} style={{ borderRadius: '8px' }}>
                                    <option value="lease">Lease Agreement</option>
                                    <option value="receipt">Financial Receipt</option>
                                    <option value="certificate">Legal Certificate</option>
                                    <option value="document">General Document</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Select File</label>
                                <input
                                    type="file"
                                    className="input"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    style={{ padding: '9px 12px', fontSize: '0.85rem', borderRadius: '8px' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-dark" disabled={uploading} style={{ height: '46px', borderRadius: '8px', width: '100%' }}>
                                {uploading ? 'Uploading...' : 'Secure Upload'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {documents.length === 0 ? (
                <div className="dash-card" style={{ padding: '60px 40px', textAlign: 'center', borderStyle: 'dashed' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', fontWeight: 700 }}>Vault is Empty</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '340px', margin: '0 auto', fontSize: '0.9rem' }}>
                        Once active lease logs or transaction receipts are created, they will display here.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {documents.map(doc => (
                        <div key={doc.id} className="dash-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ 
                                width: '44px', 
                                height: '44px', 
                                borderRadius: '50%', 
                                background: 'var(--bg-secondary)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                flexShrink: 0,
                                color: 'var(--dark-slate)'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d={typeIcon(doc.document_type)}></path>
                                </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--dark-slate)' }}>{doc.title}</span>
                                    <span className={`badge ${typeBadge(doc.document_type)}`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                                        {formatTypeName(doc.document_type)}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <a href={`${BASE_URL}${doc.file_url}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ borderRadius: '8px', fontWeight: 700 }}>
                                Download File
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
