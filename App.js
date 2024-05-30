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

const PROFILE_APP_NAME = 'May29ZebraDeviceTestApp';
const RESULT_INTENTS = {
  RESULT_GET_DATAWEDGE_STATUS:
    'com.symbol.datawedge.api.RESULT_GET_DATAWEDGE_STATUS',
};

const DW_INTENTS = {
  CREATE_PROFILE: 'com.symbol.datawedge.api.CREATE_PROFILE',
  SET_CONFIG: 'com.symbol.datawedge.api.SET_CONFIG',
};

const App = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    lastApiText: 'Messages from DataWedge will go here',
    dwStatus: 'STATUS WILL BE HERE',
    dwVersion:
      'Pre 6.3.  Please create and configure profile manually.  See the ReadMe for more details',
    enumeratedScannersText: 'Requires DataWedge 6.3+',
    activeProfileText: 'Requires DataWedge 6.3+',
    scans: [],
  });

  const sendCommand = (extraName, extraValue, sendCommandResult = false) => {
    console.log(
      'Sending Command: ' + extraName + ', ' + JSON.stringify(extraValue),
    );

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

  // const handleDataWedgeScan = intent => {
  //   const scanData = intent['com.symbol.datawedge.data_string'];
  //   const decodedData = intent['com.symbol.datawedge.label_type'];
  //   console.log('Scanned data:', scanData);
  //   console.log('Decoded data:', decodedData);
  // };

  const enumerateScanners = enumeratedScanners => {
    let humanReadableScannerList = '';
    for (let i = 0; i < enumeratedScanners.length; i++) {
      console.log(
        'Scanner found: name= ' +
          enumeratedScanners[i].SCANNER_NAME +
          ', id=' +
          enumeratedScanners[i].SCANNER_INDEX +
          ', connected=' +
          enumeratedScanners[i].SCANNER_CONNECTION_STATE,
      );
      humanReadableScannerList += enumeratedScanners[i].SCANNER_NAME;
      if (i < enumeratedScanners.length - 1) {
        humanReadableScannerList += ', ';
      }
    }

    setData({...data, enumeratedScannersText: humanReadableScannerList});
  };

  const barcodeScanned = (scanData, timeOfScan) => {
    const scannedData = scanData['com.symbol.datawedge.data_string'];
    const scannedType = scanData['com.symbol.datawedge.label_type'];
    console.log('Scan: ' + scannedData);
    let scans = [...data.scan];
    scans.unshift({
      data: scannedData,
      decoder: scannedType,
      timeAtDecode: timeOfScan,
    });
    setData({...data, scans: scans});
  };

  const broadcastReceiver = intent => {
    handleAlert('Broadcast Receiver: ', JSON.stringify(intent));

    if (intent.hasOwnProperty(RESULT_INTENTS.RESULT_GET_DATAWEDGE_STATUS)) {
      const dwStatus = intent[RESULT_INTENTS.RESULT_GET_DATAWEDGE_STATUS];
      setData({...data, dwStatus: dwStatus});
    }

    if (intent.hasOwnProperty('RESULT_INFO')) {
      const commandResult =
        intent.RESULT +
        ' (' +
        intent.COMMAND.substring(
          intent.COMMAND.lastIndexOf('.') + 1,
          intent.COMMAND.length,
        ) +
        ')'; // + JSON.stringify(intent.RESULT_INFO);
      setData({...data, lastApiText: commandResult.toLowerCase()});
    }

    if (
      intent.hasOwnProperty('com.symbol.datawedge.api.RESULT_GET_VERSION_INFO')
    ) {
      //  The version has been returned (DW 6.3 or higher).  Includes the DW version along with other subsystem versions e.g MX
      const versionInfo =
        intent['com.symbol.datawedge.api.RESULT_GET_VERSION_INFO'];
      console.log('Version Info: ' + JSON.stringify(versionInfo));
      const datawedgeVersion = versionInfo.DATAWEDGE;
      console.log('Datawedge version: ' + datawedgeVersion);

      setData({...data, dwVersion: datawedgeVersion});
    } else if (
      intent.hasOwnProperty(
        'com.symbol.datawedge.api.RESULT_ENUMERATE_SCANNERS',
      )
    ) {
      //  Return from our request to enumerate the available scanners
      const enumeratedScannersObj =
        intent['com.symbol.datawedge.api.RESULT_ENUMERATE_SCANNERS'];
      enumerateScanners(enumeratedScannersObj);
    } else if (
      intent.hasOwnProperty(
        'com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE',
      )
    ) {
      //  Return from our request to obtain the active profile
      const activeProfileObj =
        intent['com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE'];
      setData({...data, activeProfileText: activeProfileObj});
    } else if (!intent.hasOwnProperty('RESULT_INFO')) {
      //  A barcode has been scanned
      barcodeScanned(intent, new Date().toLocaleString());
    }
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

  const profileUpdate = () => {
    // Configure the profile after a short delay to ensure it has been created
    setTimeout(() => {
      const configureProfile = {
        PROFILE_NAME: PROFILE_APP_NAME,
        PROFILE_ENABLED: 'true',
        CONFIG_MODE: 'CREATE_IF_NOT_EXIST',
        PLUGIN_CONFIG: {
          PLUGIN_NAME: 'BARCODE',
          RESET_CONFIG: 'true',
          PARAM_LIST: {
            scanner_selection: 'auto',
            scanner_selection_by_identifier: 'AUTO',
          },
        },
        APP_LIST: [
          {
            PACKAGE_NAME: 'com.zebradevicetestapp',
            ACTIVITY_LIST: ['*'],
          },
        ],
      };
      sendCommand(DW_INTENTS.SET_CONFIG, configureProfile, true);
    }, 2000);
  };

  const profileIntentUpdate = () => {
    // Configure the profile after a short delay to ensure it has been created
    setTimeout(() => {
      const configureProfile = {
        PROFILE_NAME: PROFILE_APP_NAME,
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
      //  Give some time for the profile to settle then query its value
      setTimeout(() => {
        setLoading(false);
        sendCommand('com.symbol.datawedge.api.GET_ACTIVE_PROFILE', '');
      }, 2000);
    }, 4000);
  };

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
    setTimeout(() => {
      sendCommand(DW_INTENTS.CREATE_PROFILE, PROFILE_APP_NAME, true);
      profileUpdate();
      profileIntentUpdate();
      registerBroadcastReceiver();
      determineVersion();
    }, 2000);
  }, []);

  const onPressScanButton = () => {
    if (loading) {
      handleAlert('Please wait', 'Please let to complete some process');
    } else {
      ToastAndroid.show('Scan Button Pressed', ToastAndroid.LONG);
      sendCommand(
        'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER',
        'START_SCANNING',
        true,
      );
    }
  };
  console.log('=========data===========', data);
  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.h1}>POC: Zebra ReactNative DataWedge Demo</Text>
        <Text style={styles.h3}>Information / Configuration</Text>

        <Text style={styles.itemHeading}>Active Profile</Text>
        <Text style={styles.itemText}>{data.activeProfileText}</Text>

        <Text style={styles.itemHeading}>DataWedge Status: </Text>
        <Text style={styles.itemText}>{data.dwStatus}</Text>

        <Text style={styles.itemHeading}>LastApiText: </Text>
        <Text style={styles.itemText}>{data.lastApiText}</Text>

        <Text style={styles.itemHeading}>DataWedge Version: </Text>
        <Text style={styles.itemText}>{data.dwVersion}</Text>

        <Text style={styles.itemHeading}>enumeratedScannersText: </Text>
        <Text style={styles.itemText}>{data.enumeratedScannersText}</Text>

        <Text style={styles.itemHeading}>Scans Count: </Text>
        <Text style={styles.itemText}>{data.scans.length}</Text>

        {loading && <ActivityIndicator size="large" />}

        <Button
          title="Scan"
          color="#333333"
          buttonStyle={{
            backgroundColor: '#ffd200',
            height: 45,
            borderColor: 'transparent',
            borderWidth: 0,
            borderRadius: 5,
          }}
          onPress={onPressScanButton}
        />

        <Text style={styles.itemHeading}>
          Scanned barcodes will be displayed here:
        </Text>

        {data.scans.map((item, index) => {
          return (
            <>
              <Text style={styles.scanData} key={index}>
                {index} : {item.data}
              </Text>
            </>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //    justifyContent: 'center',
    //    alignItems: 'center',
    backgroundColor: '#F5FCFF',
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
    backgroundColor: '#ffd200',
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

export default App;
