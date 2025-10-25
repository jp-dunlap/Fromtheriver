import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: String(err) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("App render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: "#fff" }}>
          <h1>Something went wrong.</h1>
          <p style={{ opacity: 0.8 }}>
            The UI failed to mount. Check the console for details.
          </p>
          {this.state.message && (
            <pre style={{ whiteSpace: "pre-wrap", opacity: 0.7 }}>
              {this.state.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
