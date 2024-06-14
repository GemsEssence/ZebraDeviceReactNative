/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  NativeModules,
  NativeEventEmitter,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import {Button} from 'react-native-elements';
import DataWedgeIntents from 'react-native-datawedge-intents';

const PROFILE_APP_NAME1 = 'May29ZebraDeviceTestApp';

const DW_INTENTS = {
  CREATE_PROFILE: 'com.symbol.datawedge.api.CREATE_PROFILE',
  SET_CONFIG: 'com.symbol.datawedge.api.SET_CONFIG',
};

const AppScanner = () => {
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState(JSON.stringify(''));
  const [scanStarted, setScanStarted] = useState(false);

  const sendCommand = (extraName, extraValue, sendCommandResult = false) => {
    const broadcastExtras = {};
    broadcastExtras[extraName] = extraValue;

    if (sendCommandResult) {
      broadcastExtras.SEND_RESULT = 'true';
    }

    DataWedgeIntents.sendBroadcastWithExtras({
      action: 'com.symbol.datawedge.api.ACTION',
      extras: broadcastExtras,
    });
  };

  const handleAlert = (title, message) => {
    Alert.alert(title, message, [
      {text: 'OK', onPress: () => console.log('OK Pressed')},
    ]);
  };

  const getDataWedgeStatus = intent => {
    sendCommand('com.symbol.datawedge.api.GET_DATAWEDGE_STATUS', '');
  };

  const broadcastReceiver = intent => {
    handleAlert('Broadcast Receiver: ', JSON.stringify(intent));
    setData(JSON.stringify(intent));
  };

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.DataWedgeIntents);

    const subscription = eventEmitter.addListener(
      'datawedge_broadcast_intent',
      broadcastReceiver,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const registerBroadcastReceiver = () => {
    DataWedgeIntents.registerBroadcastReceiver({
      filterActions: [
        'com.zebradevicetestapp.ACTION',
        'com.symbol.datawedge.api.RESULT_ACTION',
      ],
      filterCategories: ['android.intent.category.DEFAULT'],
    });
  };

  const determineVersion = () => {
    sendCommand('com.symbol.datawedge.api.GET_VERSION_INFO', '');
  };

  useEffect(() => {
    getDataWedgeStatus();
    setLoading(true);
    setTimeout(() => {
      registerBroadcastReceiver();
      profileConfigure(PROFILE_APP_NAME1, {
        scanner_selection: 'auto',
        scanner_selection_by_identifier: 'AUTO',
      });
      determineVersion();
    }, 2000);
  }, []);

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const createProfile = async profileName => {
    sendCommand(DW_INTENTS.CREATE_PROFILE, profileName, true);
    await delay(2000);
    sendCommand(
      'com.symbol.datawedge.api.SWITCH_TO_PROFILE',
      profileName,
      true,
    );
  };

  const profileUpdate = (profileName, plugInParams) => {
    // Configure the profile after a short delay to ensure it has been created
    const configureProfile = {
      PROFILE_NAME: profileName,
      PROFILE_ENABLED: 'true',
      CONFIG_MODE: 'CREATE_IF_NOT_EXIST',
      PLUGIN_CONFIG: {
        PLUGIN_NAME: 'BARCODE',
        RESET_CONFIG: 'true',
        PARAM_LIST: plugInParams,
      },
      APP_LIST: [
        {
          PACKAGE_NAME: 'com.zebradevicetestapp',
          ACTIVITY_LIST: ['*'],
        },
      ],
    };
    sendCommand(DW_INTENTS.SET_CONFIG, configureProfile, true);
  };

  const profileIntentUpdate = profileName => {
    // Configure the profile after a short delay to ensure it has been created
    const configureProfile = {
      PROFILE_NAME: profileName,
      PROFILE_ENABLED: 'true',
      CONFIG_MODE: 'UPDATE',
      PLUGIN_CONFIG: {
        PLUGIN_NAME: 'INTENT',
        RESET_CONFIG: 'true',
        PARAM_LIST: {
          intent_output_enabled: 'true',
          intent_action: 'com.zebradevicetestapp.ACTION',
          intent_delivery: '2',
        },
      },
    };
    sendCommand(DW_INTENTS.SET_CONFIG, configureProfile, true);
  };

  const stopScanning = () => {
    setScanStarted(false);
    sendCommand(
      'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER',
      'STOP_SCANNING',
      true,
    );
  };

  const startScanning = async () => {
    setScanStarted(true);
    sendCommand(
      'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER',
      'START_SCANNING',
      true,
    );
    ToastAndroid.show('Scan might start', ToastAndroid.LONG);
  };

  const profileConfigure = async (profileName, plugInParams) => {
    setLoading(true);
    ToastAndroid.show(`Profile ${profileName}`, ToastAndroid.SHORT);
    createProfile(profileName);
    await delay(2000);
    sendCommand('com.symbol.datawedge.api.GET_ACTIVE_PROFILE', '');
    profileUpdate(profileName, plugInParams);
    await delay(2000);
    profileIntentUpdate(profileName);
    await delay(2000);
    setLoading(false);
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.h1}>POC: Zebra ReactNative DataWedge Demo</Text>
        {loading && <ActivityIndicator size="large" />}

        <View style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: 10}}>
          <View style={{margin: 5}}>
            <Button
              disabled={loading || scanStarted}
              title="Start Scan"
              color="#333333"
              buttonStyle={styles.btn}
              onPress={startScanning}
            />
          </View>
          <View style={{margin: 5}}>
            <Button
              disabled={loading || !scanStarted}
              title="Stop Scan"
              color="#333333"
              buttonStyle={styles.btn}
              onPress={stopScanning}
            />
          </View>
        </View>
        <View style={{borderColor: 'grey', borderWidth: 1}}>
          <Text
            style={{
              fontSize: 12,
              textAlign: 'left',
              left: 10,
              fontWeight: 'bold',
              color: '#000000',
            }}>
            Data:
          </Text>
          <Text
            style={{
              fontSize: 12,
              textAlign: 'left',
              margin: 10,
              color: '#000000',
            }}>
            {data}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
  },
  btn: {
    height: 45,
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 5,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  h1: {
    fontSize: 20,
    textAlign: 'center',
    margin: 5,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 14,
    textAlign: 'center',
    margin: 10,
    fontWeight: 'bold',
  },
  itemHeading: {
    fontSize: 12,
    textAlign: 'left',
    left: 10,
    fontWeight: 'bold',
  },
  itemText: {
    fontSize: 12,
    textAlign: 'left',
    margin: 10,
  },
  itemTextAttention: {
    fontSize: 12,
    textAlign: 'left',
    margin: 10,
  },
  scanDataHead: {
    fontSize: 10,
    margin: 2,
    fontWeight: 'bold',
    color: 'white',
  },
  scanDataHeadRight: {
    fontSize: 10,
    margin: 2,
    textAlign: 'right',
    fontWeight: 'bold',
    color: 'white',
  },
  scanData: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 2,
    color: 'white',
  },
});

export default AppScanner;
