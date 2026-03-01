import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ErrorBoundary } from './ErrorBoundary';

export function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary selection:text-primary-foreground">
            <Navbar />
            <main className="flex-1 pt-20">
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
            <Footer />
        </div>
    );
}
