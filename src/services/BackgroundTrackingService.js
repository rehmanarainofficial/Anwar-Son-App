import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import notifee, { AndroidImportance } from '@notifee/react-native';

let trackingInterval = null;
let currentEmpCode = null;

const requestLocationPermissions = async () => {
  if (Platform.OS === 'ios') {
    const auth = await Geolocation.requestAuthorization('always');
    return auth === 'granted';
  }

  if (Platform.OS === 'android') {
    const fineGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    let backgroundGranted = true;
    if (Platform.Version >= 29) {
      backgroundGranted =
        (await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        )) === PermissionsAndroid.RESULTS.GRANTED;
    }
    return fineGranted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return false;
};

const getAddressFromCoords = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'KMIVO-ERP-Tracking',
        },
      },
    );
    const data = await response.json();
    return data.display_name || 'Field Location';
  } catch (error) {
    return 'Field Location';
  }
};

const sendLiveLocationUpdate = async empCode => {
  if (!empCode) return;

  Geolocation.getCurrentPosition(
    async position => {
      const { latitude, longitude } = position.coords;
      const now = new Date();
      const currentDateStr = now.toISOString().split('T')[0];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}:${seconds}`;

      const addressName = await getAddressFromCoords(latitude, longitude);

      const formData = new FormData();
      formData.append('company', 'CRM');
      formData.append('code', empCode);
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('current_location', addressName);
      formData.append('ActivityDate', currentDateStr);
      formData.append('ActivityTime', currentTimeStr);

      try {
        await fetch(
          'https://kmivo.com/mobile/portal/update_live_tracking_post.php',
          {
            method: 'POST',
            body: formData,
          },
        );
        console.log('📍 [Background Location Streamed Successfully]', {
          empCode,
          latitude,
          longitude,
          time: currentTimeStr,
        });
      } catch (err) {
        console.log('Background Location Stream Error:', err);
      }
    },
    error => {
      console.log('Background GPS Error:', error);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
  );
};

export const startBackgroundTracking = async empCode => {
  if (!empCode) return;
  currentEmpCode = empCode;

  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) {
    console.log('Background location permission denied');
  }

  // Create Notifee Channel for Android Foreground Service
  if (Platform.OS === 'android') {
    const channelId = await notifee.createChannel({
      id: 'kmivo_tracking_channel',
      name: 'Live GPS Tracking',
      importance: AndroidImportance.LOW,
    });

    await notifee.displayNotification({
      title: 'KMIVO Live Location Service',
      body: 'Real-time GPS tracking is active in background',
      android: {
        channelId,
        asForegroundService: true,
        ongoing: true,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
      },
    });
  }

  // Initial stream call
  sendLiveLocationUpdate(empCode);

  // Poll location every 20 seconds (background & foreground)
  if (trackingInterval) clearInterval(trackingInterval);
  trackingInterval = setInterval(() => {
    if (currentEmpCode) {
      sendLiveLocationUpdate(currentEmpCode);
    }
  }, 20000);
};

export const stopBackgroundTracking = async () => {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  currentEmpCode = null;

  if (Platform.OS === 'android') {
    try {
      await notifee.stopForegroundService();
    } catch (e) {
      // ignore
    }
  }
};
