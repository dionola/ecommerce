import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        We're sorry, but there was an error loading this part of the application.
                        Please try refreshing the page or contact support if the problem persists.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            onClick={() => window.location.reload()}
                            variant="default"
                        >
                            Refresh Page
                        </Button>
                        <Button
                            onClick={() => this.setState({ hasError: false })}
                            variant="outline"
                        >
                            Try Again
                        </Button>
                    </div>
                    {import.meta.env.DEV && this.state.error && (
                        <pre className="mt-8 p-4 bg-secondary rounded text-left overflow-auto max-w-full text-xs">
                            {this.state.error.stack}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
