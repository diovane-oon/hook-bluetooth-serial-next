import { useState, useEffect } from 'react';
import { PermissionsAndroid } from 'react-native';
import AndroidOpenSettings from 'react-native-android-open-settings';
import BluetoothSerial, { isConnected } from 'react-native-bluetooth-serial-next';


export function useBluetooth() {
    const [ km, setKm ] = useState(0);
    const [ statusBluetooth, setStatus ] = useState('Inativo');

    const requestConnectPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                return true;
            } else {
                throw new Error('Connect permission denied');
            }
        } catch (erro) {
            return erro
        }
    };

    const requestScanPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                return true;
            } else {
                throw new Error('Scan permission denied');
            }
        } catch (erro) {
            return erro
        }
    };

    const requestAdvertisePermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                return true;
            } else {
                throw new Error("Advertise permission denied");
            }
        } catch (err) {
            console.warn(err);
            return false;
        }
    };


    async function checkIsBluetoothEnabled() {
        try {
            const isEnabled = await BluetoothSerial.isEnabled();
            if (!isEnabled) {
                AndroidOpenSettings.bluetoothSettings();
                return "Bluetooth is disabled";
            } else {
                return true;
            }
        } catch (error) {
            return error;
        }
    }

    async function checkIsDevicePaired() {
        try {
            const devices = await BluetoothSerial.list()
            const devicePaired = devices.filter(obj => obj.name === 'OONBOX-Beta')[ 0 ];
            if (!devicePaired) {
                throw new Error('Device not paired');
            }
            return {
                isPaired: true,
                device: devicePaired
            };
        } catch (error) {
            return error
        }
    }

    async function checkIsConnected(id) {
        try {
            const isConnected = await BluetoothSerial.isConnected(id);
            isConnected ? setStatus('Sincronizado') : setStatus('Inativo');
            return isConnected;
        } catch (error) {
            return error
        }
    }

    async function connect(id) {
        try {
            const bluetooth = await BluetoothSerial.connect(id);
            return bluetooth
        } catch (error) {
            console.log("Error :" + error)
            return false
        }
    }

    async function checkStatusBluetooth() {
        try {
            const isConnectEnabled = await requestConnectPermission();
            if (isConnectEnabled !== true) throw new Error('Connect permission denied');

            const isScanEnabled = await requestScanPermission();
            if (isScanEnabled !== true) throw new Error('Scan permission denied');

            const isEnabled = await checkIsBluetoothEnabled();
            if (isEnabled !== true) throw new Error('Bluetooth is disabled');

            const devicePaired = await checkIsDevicePaired();
            console.log('devicePaired', devicePaired);
            if (!devicePaired?.isPaired) throw new Error('Device not paired');

            const isConnected = await checkIsConnected(devicePaired.device.id);
            if (isConnected) {
                console.log('isConnected: true');
                return 'isConnected';
            } else {
                await BluetoothSerial.clear();
                console.log('isConnected: false');
                console.log('connecting...');
                await connect(devicePaired.device.id);
                return false;
            }
        } catch (error) {
            return error;
        }
    }

    async function readOON() {
        try {
            console.log('chamou')

            BluetoothSerial.readEvery(
                (data, intervalId) => {
                    checkStatusBluetooth();
                    console.log(data)
                    setKm(Number(data));
                },
                5000,
                "\n"
            );

        } catch (error) {
            return false
        }
    }


    return {
        readOON,
        km,
        statusBluetooth
    }
}