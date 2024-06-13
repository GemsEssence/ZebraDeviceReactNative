/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {useEffect, useState} from 'react';

import AppScanner from './AppScanner';
import GlobalErrorBoundary from './ErrorBoundary';
import {Text} from 'react-native-elements';

const App = () => {
  const [isLoaded, setLoaded] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setLoaded(true);
    }, 1000);
  }, []);

  if (!isLoaded) {
    return <Text>Loading</Text>;
  }

  return (
    <GlobalErrorBoundary>
      <AppScanner />
    </GlobalErrorBoundary>
  );
};

export default App;
