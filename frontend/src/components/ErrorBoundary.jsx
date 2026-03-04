import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unexpected UI error',
    }
  }

  componentDidCatch(error, info) {
    // Keep the app alive even if a dashboard widget fails to render.
    // eslint-disable-next-line no-console
    console.error('Dashboard render error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="card max-w-xl p-6 text-center">
            <h2 className="text-lg font-bold text-white">Dashboard encountered an error</h2>
            <p className="mt-2 text-sm text-slate-400">{this.state.message || 'No data available'}</p>
            <button className="btn-primary mx-auto mt-4" onClick={this.handleReset}>Try Again</button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
