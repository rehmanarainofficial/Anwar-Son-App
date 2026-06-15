import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import Toast from 'react-native-toast-message';
import { useTheme } from '@config/useTheme';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import {
  useGetCityDropdownMutation,
  useGetTitleDropdownMutation,
  useGetCommunityDropdownMutation,
  useGetAdministrativeRoleDropdownMutation,
  useAddHospitalContactMutation,
} from '@api/baseApi';
import { useGetHospitalDataMutation } from '@api/portalApi';

const CRMAddLeadScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);

  const [personName, setPersonName] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [cellNo, setCellNo] = useState('');
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedAdministrativeRole, setSelectedAdministrativeRole] = useState(null);
  const [selectedHospitals, setSelectedHospitals] = useState([]);

  const [profilePic, setProfilePic] = useState(null);
  const [businessCard, setBusinessCard] = useState(null);

  const [titles, setTitles] = useState([]);
  const [cities, setCities] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [administrativeRoles, setAdministrativeRoles] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  const [getTitleDropdown] = useGetTitleDropdownMutation();
  const [getCityDropdown] = useGetCityDropdownMutation();
  const [getCommunityDropdown] = useGetCommunityDropdownMutation();
  const [getAdministrativeRoleDropdown] = useGetAdministrativeRoleDropdownMutation();
  const [getHospitalData] = useGetHospitalDataMutation();
  const [addHospitalContact] = useAddHospitalContactMutation();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Animated entrance values
  const animValues = useRef([]).current;
  const inputsCount = 10;
  if (animValues.length === 0) {
    for (let i = 0; i < inputsCount; i++) {
      animValues.push({
        translateY: new Animated.Value(20),
        opacity: new Animated.Value(0),
      });
    }
  }

  useEffect(() => {
    fetchDropdowns();
    // Staggered entrance animation
    const anims = animValues.map((av, idx) =>
      Animated.parallel([
        Animated.timing(av.translateY, {
          toValue: 0,
          duration: 450,
          delay: idx * 60,
          useNativeDriver: true,
        }),
        Animated.timing(av.opacity, {
          toValue: 1,
          duration: 450,
          delay: idx * 60,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.stagger(60, anims).start();
  }, []);

  const fetchDropdowns = async () => {
    setLoading(true);
    try {
      const titleRes = await getTitleDropdown({
        id: user?.id || user?.company_user_id,
      }).unwrap();
      if (titleRes?.status === 'true') {
        setTitles(titleRes.data || []);
      }
      const cityRes = await getCityDropdown({
        id: user?.id || user?.company_user_id,
      }).unwrap();
      if (cityRes?.status === 'true') {
        setCities(cityRes.data || []);
      }
      const commRes = await getCommunityDropdown({}).unwrap();
      if (commRes?.status === 'true') {
        setCommunities(commRes.data || []);
      }
      const adminRoleRes = await getAdministrativeRoleDropdown({}).unwrap();
      if (adminRoleRes?.status === 'true') {
        setAdministrativeRoles(adminRoleRes.data || []);
      }
      const hospRes = await getHospitalData({
        user_id: user?.id,
      }).unwrap();
      if (hospRes?.status === 'true') {
        const hData = hospRes.data || [];
        const formattedHospitals = hData.map((h, i) => ({
          ...h,
          unique_id: h.debtor_no ? String(h.debtor_no) : String(i),
          name: h.hospital_name || 'Unknown Hospital',
        }));
        setHospitals(formattedHospitals);
      }
    } catch (e) {
      console.log('Error fetching dropdowns:', e);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!selectedTitle) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Please select Title',
      });
      return false;
    }
    if (!personName || personName.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Person Name is required',
      });
      return false;
    }
    if (!selectedCity) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Please select City',
      });
      return false;
    }
    if (!cellNo || cellNo.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Cell No is required',
      });
      return false;
    }
    if (selectedHospitals.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Please select at least one Hospital',
      });
      return false;
    }
    return true;
  };

  const handleImagePick = async (source, setter) => {
    if (source === 'camera' && Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Toast.show({
            type: 'error',
            text1: 'Permission Denied',
            text2: 'Camera permission is required to take photos.',
          });
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const options = { mediaType: 'photo', quality: 0.5, saveToPhotos: false };
    try {
      const result = source === 'camera'
        ? await launchCamera(options)
        : await launchImageLibrary(options);
      if (result.assets && result.assets.length > 0) {
        setter(result.assets[0]);
      }
    } catch (err) {
      console.log('Error picking image:', err);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await addHospitalContact({
        user_id: user?.id || '',
        title: selectedTitle,
        person_name: personName,
        city: selectedCity,
        personal_email: personalEmail,
        cell_no: cellNo,
        hospital: selectedHospitals.join(','),
        profile_pic_name: profilePic,
        business_card_name: businessCard,
        community: selectedCommunity || '',
        administrative_role: selectedAdministrativeRole || '',
      }).unwrap();

      if (res && String(res.status) === 'true') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: res.message || 'Successfully added.',
        });
        if (route.params?.onSuccess) {
          route.params.onSuccess();
        }
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: res.message || 'Unknown error',
        });
      }
    } catch (e) {
      console.log('Error submitting form', e);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Could not submit form.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderInputAnimated = (
    index,
    placeholder,
    value,
    setValue,
    keyboardType,
  ) => (
    <Animated.View
      style={[
        styles.glassInput,
        {
          transform: [{ translateY: animValues[index].translateY }],
          opacity: animValues[index].opacity,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <TextInput
        style={[styles.textInput, { color: theme.colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={txt => setValue(txt)}
        keyboardType={keyboardType || 'default'}
        selectionColor={theme.colors.primary}
      />
    </Animated.View>
  );

  const renderImagePicker = (index, label, imageState, setImgState) => (
    <Animated.View
      style={[
        styles.imagePickerContainer,
        {
          transform: [{ translateY: animValues[index].translateY }],
          opacity: animValues[index].opacity,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.imageLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <View style={styles.imagePickerRow}>
        <TouchableOpacity
          style={[styles.uploadBtn, { borderColor: theme.colors.border }]}
          onPress={() => handleImagePick('gallery', setImgState)}
        >
          <Icon name="image" size={20} color={theme.colors.primary} />
          <Text style={[styles.uploadText, { color: theme.colors.text }]}>
            Gallery
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.uploadBtn, { borderColor: theme.colors.border }]}
          onPress={() => handleImagePick('camera', setImgState)}
        >
          <Icon name="camera" size={20} color={theme.colors.primary} />
          <Text style={[styles.uploadText, { color: theme.colors.text }]}>
            Camera
          </Text>
        </TouchableOpacity>
      </View>
      {imageState && (
        <View style={[styles.imagePreviewWrapper, { marginTop: 10 }]}>
          <Text
            style={{ color: theme.colors.text, fontSize: 12, flex: 1, marginRight: 8 }}
            numberOfLines={1}
          >
            {imageState.fileName || 'Selected'}
          </Text>
          <TouchableOpacity onPress={() => setImgState(null)}>
            <Icon name="close-circle" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              transform: [{ translateY: animValues[0].translateY }],
              opacity: animValues[0].opacity,
            }}
          >
            <Dropdown
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              data={titles}
              search
              labelField="description"
              valueField="sales_code"
              placeholder="Select Title *"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedTitle}
              onChange={item => setSelectedTitle(item.sales_code)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          {renderInputAnimated(1, 'Person Name *', personName, setPersonName)}

          <Animated.View
            style={{
              transform: [{ translateY: animValues[2].translateY }],
              opacity: animValues[2].opacity,
            }}
          >
            <Dropdown
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              data={cities}
              search
              labelField="cityname"
              valueField="id"
              placeholder="Select City *"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedCity}
              onChange={item => setSelectedCity(item.id)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          {renderInputAnimated(
            3,
            'Personal Email',
            personalEmail,
            setPersonalEmail,
            'email-address',
          )}
          {renderInputAnimated(4, 'Cell No *', cellNo, setCellNo, 'phone-pad')}

          <Animated.View
            style={{
              transform: [{ translateY: animValues[5].translateY }],
              opacity: animValues[5].opacity,
            }}
          >
            <Dropdown
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              data={communities}
              search
              labelField="description"
              valueField="combo_code"
              placeholder="Select Community"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedCommunity}
              onChange={item => setSelectedCommunity(item.combo_code)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: animValues[6].translateY }],
              opacity: animValues[6].opacity,
            }}
          >
            <Dropdown
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              data={administrativeRoles}
              search
              labelField="description"
              valueField="combo_code"
              placeholder="Select Administrative Role"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedAdministrativeRole}
              onChange={item => setSelectedAdministrativeRole(item.combo_code)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: animValues[7].translateY }],
              opacity: animValues[7].opacity,
            }}
          >
            <MultiSelect
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  minHeight: 56,
                  height: 'auto',
                  paddingVertical: 10,
                },
              ]}
              data={hospitals}
              search
              labelField="name"
              valueField="unique_id"
              placeholder="Select Hospitals *"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedHospitals}
              onChange={item => setSelectedHospitals(item)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
              selectedStyle={[
                styles.selectedStyle,
                {
                  backgroundColor: theme.colors.primary + '20',
                  borderColor: theme.colors.primary,
                },
              ]}
            />
          </Animated.View>

          {renderImagePicker(8, 'Profile Picture', profilePic, setProfilePic)}
          {renderImagePicker(8, 'Business Card', businessCard, setBusinessCard)}

          <Animated.View
            style={{
              transform: [{ translateY: animValues[9].translateY }],
              opacity: animValues[9].opacity,
            }}
          >
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: theme.colors.primary },
                submitting && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}
                >
                  Submit
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
};

export default CRMAddLeadScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glassInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
  },
  textInput: {
    height: 56,
    fontSize: 16,
  },
  dropdown: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  selectedStyle: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  imagePickerContainer: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  uploadText: {
    fontWeight: '600',
  },
  imagePreviewWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00000008',
  },
  submitBtn: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
});
