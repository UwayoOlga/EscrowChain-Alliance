import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../context/AuthContext';

export default function MainLayout({ children }) {
    const { user } = useAuth();

    if (!user) return <>{children}</>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
            <Sidebar />
            <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
                <Topbar />
                <main style={{ padding: '40px', flex: 1 }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
