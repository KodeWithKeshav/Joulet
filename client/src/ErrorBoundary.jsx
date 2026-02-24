import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught error:', error, info)
    this.setState({ error, info })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: '#111827', color: '#fff', height: '100vh' }}>
          <h1 style={{ color: '#ff6868' }}>Application Error</h1>
          <p style={{ color: '#fff' }}>An error occurred while rendering the app. See details below.</p>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12, color: '#f8f8f2' }}>
            {String(this.state.error && this.state.error.toString())}
            {this.state.info && this.state.info.componentStack}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}
