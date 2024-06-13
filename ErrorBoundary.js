// ErrorBoundary.js
import React from 'react';
import {View, Text, Button, Alert} from 'react-native';
import ErrorBoundary from 'react-native-error-boundary';

const GlobalErrorBoundary = ({children}) => {
  const errorHandler = (error, stackTrace) => {
    // Handle error as needed
    // Example: Show an alert with the error details
    Alert.alert(
      'Error Occurred',
      `Error: ${error.message}\n\nStack Trace:\n${stackTrace}`,
    );
  };

  const CustomFallback = ({error, resetError}) => (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 18}}>Something went wrong!</Text>
      {error && <Text>Error: {error.message}</Text>}
      <Button title="Dismiss" onPress={resetError} />
    </View>
  );

  return (
    <ErrorBoundary FallbackComponent={CustomFallback} onError={errorHandler}>
      {children}
    </ErrorBoundary>
  );
};

export default GlobalErrorBoundary;
