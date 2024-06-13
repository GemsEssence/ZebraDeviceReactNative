import React, {useState} from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';

const ErrorBoundary = ({children}) => {
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  const handleReset = () => {
    setError(null);
    setErrorInfo(null);
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, {color: 'black'}]}>
          Something went wrong.
        </Text>
        <Text style={[styles.errorDetails, {color: 'black'}]}>
          {error && error.toString()}
        </Text>
        <Text style={[styles.errorDetails, {color: 'black'}]}>
          {errorInfo && errorInfo.componentStack}
        </Text>
        <Button title="Try again" onPress={handleReset} />
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorDetails: {
    fontSize: 12,
    color: 'red',
    marginBottom: 20,
  },
});

export default ErrorBoundary;
