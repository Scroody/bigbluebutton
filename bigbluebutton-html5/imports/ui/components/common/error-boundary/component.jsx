import React, { Component } from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  children: PropTypes.element.isRequired,
  Fallback: PropTypes.element,
  errorMessage: PropTypes.string,
};

const defaultProps = {
  Fallback: null,
  errorMessage: 'Something went wrong',
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: '', errorInfo: null };
  }

  componentDidUpdate() {
    const { error, errorInfo } = this.state;

    if (error || errorInfo) {
      console.error({
        logCode: 'Error_Boundary_wrapper',
        extraInfo: { error, errorInfo },
      }, 'generic error boundary logger');
    }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    const { error, errorInfo } = this.state;
    const { children, Fallback, errorMessage } = this.props;

    const fallbackElement = Fallback && error
      ? <Fallback error={error || {}} errorInfo={errorInfo} /> : <div>{errorMessage}</div>;
    return (error
      ? fallbackElement
      : children);
  }
}

ErrorBoundary.propTypes = propTypes;
ErrorBoundary.defaultProps = defaultProps;

export default ErrorBoundary;

export const withErrorBoundary = (WrappedComponent, FallbackComponent) => (props) => (
  <ErrorBoundary Fallback={FallbackComponent}>
    <WrappedComponent {...props} />
  </ErrorBoundary>
);
