import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@config/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGetLiveTrackingMutation } from '@api/portalApi';

const getEmpKey = emp => {
  if (!emp) return '';
  return String(emp.id || emp.EmployeeCode || emp.name || '');
};

const LiveTrackingMapScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { employee: initialEmployee, employees: initialEmployeesList } =
    route.params || {};

  const webViewRef = useRef(null);
  const [getLiveTracking] = useGetLiveTrackingMutation();

  const [employeesList, setEmployeesList] = useState(
    Array.isArray(initialEmployeesList) && initialEmployeesList.length > 0
      ? initialEmployeesList
      : initialEmployee
      ? [initialEmployee]
      : [],
  );

  const [selectedEmp, setSelectedEmp] = useState(
    initialEmployee || (employeesList.length > 0 ? employeesList[0] : null),
  );

  const selectedEmpKeyRef = useRef(getEmpKey(selectedEmp));

  useEffect(() => {
    selectedEmpKeyRef.current = getEmpKey(selectedEmp);
  }, [selectedEmp]);

  const [initialLoading, setInitialLoading] = useState(true);

  const validEmployees = employeesList.filter(
    emp => emp.latitude && emp.longitude && !isNaN(parseFloat(emp.latitude)),
  );

  const defaultLat =
    validEmployees.length > 0 ? parseFloat(validEmployees[0].latitude) : 31.5204;
  const defaultLon =
    validEmployees.length > 0 ? parseFloat(validEmployees[0].longitude) : 74.3587;

  // Generate Leaflet Map HTML supporting smooth pin transitions and polyline trail
  const getMapHtml = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          background-color: #f8fafc;
        }
        .pin-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 44px;
          height: 44px;
          position: relative;
        }
        .pin-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: ${theme.colors.primary || '#0284c7'};
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          color: #ffffff;
          font-family: sans-serif;
          font-size: 11px;
          font-weight: bold;
          z-index: 2;
        }
        .pin-pulse {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(16, 185, 129, 0.35);
          animation: pulse 1.8s infinite ease-out;
          z-index: 1;
        }
        @keyframes pulse {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .leaflet-marker-icon {
          transition: transform 0.8s ease-in-out;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 4px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        .popup-title {
          font-size: 13px;
          font-weight: bold;
          color: #0f172a;
          margin-bottom: 2px;
        }
        .popup-subtitle {
          font-size: 11px;
          color: #64748b;
        }
        .popup-loc {
          font-size: 11px;
          color: #334155;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${defaultLat}, ${defaultLon}], 14);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap, © CARTO',
          maxZoom: 20
        }).addTo(map);

        var markersMap = {};
        var routeHistory = {};
        var polylinesMap = {};
        var markersGroup = L.featureGroup().addTo(map);

        function createCustomIcon(initials) {
          return L.divIcon({
            className: 'custom-emp-icon',
            html: '<div class="pin-container"><div class="pin-pulse"></div><div class="pin-avatar">' + initials + '</div></div>',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });
        }

        function getInitials(name) {
          if (!name) return 'EMP';
          return name.split(' ').slice(0, 2).map(function(n){ return n[0]; }).join('').toUpperCase();
        }

        function updateOrAddMarkers(employeesData, fitBoundsOnLoad) {
          if (!Array.isArray(employeesData) || employeesData.length === 0) return;

          var hasValidCoords = false;

          employeesData.forEach(function(emp) {
            if (!emp.latitude || !emp.longitude || isNaN(parseFloat(emp.latitude))) return;

            var empKey = String(emp.id || emp.EmployeeCode || emp.name || '');
            if (!empKey) return;

            var lat = parseFloat(emp.latitude);
            var lon = parseFloat(emp.longitude);
            var initials = getInitials(emp.name);

            hasValidCoords = true;

            // Track route history for trailing polyline
            if (!routeHistory[empKey]) {
              routeHistory[empKey] = [];
            }
            var lastPos = routeHistory[empKey][routeHistory[empKey].length - 1];
            if (!lastPos || lastPos[0] !== lat || lastPos[1] !== lon) {
              routeHistory[empKey].push([lat, lon]);
            }

            // Draw/Update polyline trail
            if (routeHistory[empKey].length > 1) {
              if (polylinesMap[empKey]) {
                polylinesMap[empKey].setLatLngs(routeHistory[empKey]);
              } else {
                polylinesMap[empKey] = L.polyline(routeHistory[empKey], {
                  color: '${theme.colors.primary || '#0284c7'}',
                  weight: 4,
                  opacity: 0.7,
                  dashArray: '6, 8'
                }).addTo(map);
              }
            }

            var popupHtml = '<div style="font-family: sans-serif; padding: 2px;">' +
              '<div class="popup-title">' + (emp.name || 'Employee') + '</div>' +
              '<div class="popup-subtitle">Code: ' + (emp.EmployeeCode || 'N/A') + ' | Time: ' + (emp.ActivityTime || 'N/A') + '</div>' +
              '<div class="popup-loc">📍 ' + (emp.current_location || 'No location address') + '</div>' +
              '</div>';

            if (markersMap[empKey]) {
              markersMap[empKey].setLatLng([lat, lon]);
              markersMap[empKey].setPopupContent(popupHtml);
            } else {
              var icon = createCustomIcon(initials);
              var marker = L.marker([lat, lon], { icon: icon }).bindPopup(popupHtml);
              
              (function(key) {
                marker.on('click', function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SELECT_EMP',
                    employeeKey: key
                  }));
                });
              })(empKey);

              markersMap[empKey] = marker;
              markersGroup.addLayer(marker);
            }
          });

          if (fitBoundsOnLoad && hasValidCoords && markersGroup.getLayers().length > 0) {
            try {
              map.fitBounds(markersGroup.getBounds().pad(0.2));
            } catch(e) {
              console.log('Error fitting bounds:', e);
            }
          }
        }

        var initialData = ${JSON.stringify(validEmployees)};
        updateOrAddMarkers(initialData, true);

        window.addEventListener('message', function(event) {
          try {
            var message = JSON.parse(event.data);
            if (message.type === 'UPDATE_ALL_COORDS') {
              updateOrAddMarkers(message.employees, false);
            } else if (message.type === 'FIT_ALL') {
              if (markersGroup.getLayers().length > 0) {
                map.fitBounds(markersGroup.getBounds().pad(0.2), { animate: true });
              }
            } else if (message.type === 'FOCUS_EMP') {
              var empKey = message.employeeKey;
              if (markersMap[empKey]) {
                var latLng = markersMap[empKey].getLatLng();
                map.setView(latLng, 16, { animate: true });
                markersMap[empKey].openPopup();
              }
            }
          } catch (e) {
            console.error('Error handling WebView message:', e);
          }
        });
      </script>
    </body>
    </html>
  `;

  const fetchAllTrackingData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await getLiveTracking({
        emp_code: '',
        date: todayStr,
      }).unwrap();

      if (
        res &&
        (res.status === 'true' || res.status === true) &&
        Array.isArray(res.data) &&
        res.data.length > 0
      ) {
        setEmployeesList(res.data);

        const currentKey = selectedEmpKeyRef.current;
        if (currentKey) {
          const match = res.data.find(e => getEmpKey(e) === currentKey);
          if (match) {
            setSelectedEmp(match);
          }
        } else {
          setSelectedEmp(res.data[0]);
        }

        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'UPDATE_ALL_COORDS',
              employees: res.data,
            }),
          );
        }
      }
    } catch (error) {
      console.log('Error fetching all tracking data:', error);
    } finally {
      setInitialLoading(false);
    }
  }, [getLiveTracking]);

  // Battery & Network Optimization: Poll every 5s ONLY when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAllTrackingData();
      const interval = setInterval(fetchAllTrackingData, 5000);
      return () => clearInterval(interval);
    }, [fetchAllTrackingData]),
  );

  const handleWebViewMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_EMP' && data.employeeKey) {
        const found = employeesList.find(
          e => getEmpKey(e) === String(data.employeeKey),
        );
        if (found) {
          setSelectedEmp(found);
        }
      }
    } catch (e) {
      console.log('Error handling message from WebView:', e);
    }
  };

  const handleFitAllPins = () => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'FIT_ALL' }));
    }
  };

  const handleFocusEmployee = emp => {
    setSelectedEmp(emp);
    const empKey = getEmpKey(emp);
    if (webViewRef.current && empKey) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'FOCUS_EMP',
          employeeKey: empKey,
        }),
      );
    }
  };

  const getInitials = name => {
    if (!name) return 'EMP';
    return name
      .split(' ')
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const selectedKey = getEmpKey(selectedEmp);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      {/* Map Viewport */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: getMapHtml() }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          onLoadEnd={() => setInitialLoading(false)}
        />

        {initialLoading && (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[styles.loaderText, { color: theme.colors.textSecondary }]}
            >
              Loading employee map pins...
            </Text>
          </View>
        )}

        {/* Floating Controls Overlay */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={[
              styles.controlBtn,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={handleFitAllPins}
            activeOpacity={0.8}
          >
            <Icon name="expand-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.controlBtnText, { color: theme.colors.text }]}>
              Fit All Pins ({validEmployees.length})
            </Text>
          </TouchableOpacity>

          {selectedEmp && (
            <TouchableOpacity
              style={[
                styles.controlBtn,
                { backgroundColor: theme.colors.surface, marginLeft: 8 },
              ]}
              onPress={() => handleFocusEmployee(selectedEmp)}
              activeOpacity={0.8}
            >
              <Icon
                name="locate-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.controlBtnText, { color: theme.colors.text }]}
              >
                Focus
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Employee Quick Selector Bar */}
      {validEmployees.length > 1 && (
        <View
          style={[
            styles.selectorContainer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorScroll}
          >
            {validEmployees.map(emp => {
              const empKey = getEmpKey(emp);
              const isSelected = selectedKey === empKey;
              return (
                <TouchableOpacity
                  key={empKey}
                  style={[
                    styles.empPill,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.background,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => handleFocusEmployee(emp)}
                >
                  <Text
                    style={[
                      styles.empPillText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {emp.name ? emp.name.split(' ')[0] : 'Emp'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* HUD Employee Info Overlay */}
      {selectedEmp && (
        <View
          style={[
            styles.hudCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.hudHeader}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Text
                style={[styles.avatarText, { color: theme.colors.primary }]}
              >
                {getInitials(selectedEmp.name)}
              </Text>
            </View>

            <View style={styles.driverMeta}>
              <Text
                style={[styles.driverName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {selectedEmp.name || 'Unknown Employee'}
              </Text>
              {selectedEmp.father_name ? (
                <Text
                  style={[
                    styles.driverSO,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  S/O: {selectedEmp.father_name}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.driverCode,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Employee Code: {selectedEmp.EmployeeCode || 'N/A'}
              </Text>
            </View>

            <View
              style={[
                styles.timeBadge,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Icon
                name="time-outline"
                size={13}
                color={theme.colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.timeText, { color: theme.colors.primary }]}>
                {selectedEmp.ActivityTime || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Location Row */}
          <View
            style={[
              styles.locRow,
              { borderTopColor: theme.colors.border + '30' },
            ]}
          >
            <Icon
              name="location-outline"
              size={16}
              color={theme.colors.primary}
              style={{ marginTop: 2 }}
            />
            <Text
              style={[styles.locText, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {selectedEmp.current_location || 'GPS location streaming...'}
            </Text>
          </View>

          {/* Coordinate Badges */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                LAT:{' '}
              </Text>
              <Text style={[styles.badgeValue, { color: theme.colors.text }]}>
                {parseFloat(selectedEmp.latitude || '0').toFixed(6)}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  marginLeft: 8,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                LON:{' '}
              </Text>
              <Text style={[styles.badgeValue, { color: theme.colors.text }]}>
                {parseFloat(selectedEmp.longitude || '0').toFixed(6)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  floatingControls: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  controlBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  selectorContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  selectorScroll: {
    paddingHorizontal: 14,
  },
  empPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  empPillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  hudCard: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  hudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  driverMeta: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverSO: {
    fontSize: 12,
    marginTop: 1,
  },
  driverCode: {
    fontSize: 11,
    marginTop: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    paddingTop: 10,
    marginBottom: 12,
  },
  locText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeValue: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export default LiveTrackingMapScreen;
