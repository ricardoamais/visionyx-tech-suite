import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <p className="text-muted-foreground">Algo deu errado. Tente novamente.</p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            onClick={() => this.setState({ hasError: false })}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
