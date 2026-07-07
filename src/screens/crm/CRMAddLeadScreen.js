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
  useGetDepartmentDropdownMutation,
  useGetSurgicalSpecialityDropdownMutation,
  useGetHospitalDropdownMutation,
  useGetProcedureFocusDropdownMutation,
  useGetSurgicalRoleDropdownMutation,
  useGetContactTierDropdownMutation,
  useGetFocusProductDropdownMutation,
} from '@api/baseApi';

const mapDropdownData = (data, valueKey = null, labelKey = null) => {
  return (data || []).map((item, index) => {
    let id = valueKey
      ? item[valueKey]
      : item.id !== undefined && item.id !== null
      ? item.id
      : item.sales_code !== undefined && item.sales_code !== null
      ? item.sales_code
      : item.combo_code !== undefined && item.combo_code !== null
      ? item.combo_code
      : item.debtor_no !== undefined && item.debtor_no !== null
      ? item.debtor_no
      : item.unique_id !== undefined && item.unique_id !== null
      ? item.unique_id
      : null;
    if (id === null || id === undefined || id === '') {
      id = String(index);
    }
    const description = labelKey
      ? item[labelKey]
      : item.description ||
        item.cityname ||
        item.hospital_name ||
        item.name ||
        '';
    return {
      ...item,
      id: String(id),
      description: String(description),
    };
  });
};

const CRMAddLeadScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);

  // Form Field States
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [personName, setPersonName] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [personalEmail, setPersonalEmail] = useState('');
  const [cellNo, setCellNo] = useState('');

  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedSpeciality, setSelectedSpeciality] = useState(null);
  const [selectedProcedures, setSelectedProcedures] = useState([]);
  const [selectedSurgicalRole, setSelectedSurgicalRole] = useState(null);
  const [selectedAdministrativeRole, setSelectedAdministrativeRole] =
    useState(null);

  const [selectedContactTier, setSelectedContactTier] = useState(null);
  const [selectedFocusProducts, setSelectedFocusProducts] = useState([]);

  const [profilePic, setProfilePic] = useState(null);
  const [businessCard, setBusinessCard] = useState(null);

  // Dropdown Lists Data States
  const [titles, setTitles] = useState([]);
  const [cities, setCities] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [surgicalRoles, setSurgicalRoles] = useState([]);
  const [administrativeRoles, setAdministrativeRoles] = useState([]);
  const [contactTiers, setContactTiers] = useState([]);
  const [focusProducts, setFocusProducts] = useState([]);

  // API Mutations
  const [getTitleDropdown] = useGetTitleDropdownMutation();
  const [getCityDropdown] = useGetCityDropdownMutation();
  const [getCommunityDropdown] = useGetCommunityDropdownMutation();
  const [getAdministrativeRoleDropdown] =
    useGetAdministrativeRoleDropdownMutation();
  const [getHospitalDropdown] = useGetHospitalDropdownMutation();
  const [getDepartmentDropdown] = useGetDepartmentDropdownMutation();
  const [getSurgicalSpecialityDropdown] =
    useGetSurgicalSpecialityDropdownMutation();
  const [getProcedureFocusDropdown] = useGetProcedureFocusDropdownMutation();
  const [getSurgicalRoleDropdown] = useGetSurgicalRoleDropdownMutation();
  const [getContactTierDropdown] = useGetContactTierDropdownMutation();
  const [getFocusProductDropdown] = useGetFocusProductDropdownMutation();
  const [addHospitalContact] = useAddHospitalContactMutation();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const animValues = useRef([]).current;
  const inputsCount = 25;
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
    const anims = animValues.map((av, idx) =>
      Animated.parallel([
        Animated.timing(av.translateY, {
          toValue: 0,
          duration: 450,
          delay: idx * 40,
          useNativeDriver: true,
        }),
        Animated.timing(av.opacity, {
          toValue: 1,
          duration: 450,
          delay: idx * 40,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.stagger(40, anims).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDropdowns = async () => {
    setLoading(true);
    try {
      const uId = user?.id;

      // 1. Sales Title
      const titleRes = await getTitleDropdown({ id: uId }).unwrap();
      if (titleRes?.status === 'true') {
        setTitles(mapDropdownData(titleRes.data || []));
      }

      // 2. City
      const cityRes = await getCityDropdown({ id: uId }).unwrap();
      if (cityRes?.status === 'true') {
        setCities(mapDropdownData(cityRes.data || []));
      }

      // 3. Hospital
      const hospRes = await getHospitalDropdown({ user_id: uId }).unwrap();
      if (hospRes?.status === 'true') {
        setHospitals(mapDropdownData(hospRes.data || []));
      }

      // 4. Community
      const commRes = await getCommunityDropdown({}).unwrap();
      if (commRes?.status === 'true') {
        setCommunities(mapDropdownData(commRes.data || []));
      }

      // 10. Contact Tier
      const tierRes = await getContactTierDropdown({}).unwrap();
      if (tierRes?.status === 'true') {
        setContactTiers(mapDropdownData(tierRes.data || []));
      }

      // 11. Focus Product
      const prodRes = await getFocusProductDropdown({}).unwrap();
      if (prodRes?.status === 'true') {
        setFocusProducts(mapDropdownData(prodRes.data || []));
      }
    } catch (e) {
      console.log('Error fetching dropdowns:', e);
    } finally {
      setLoading(false);
    }
  };

  // Cascading Dynamic Loads
  const handleCommunityChange = async communityId => {
    setSelectedCommunity(communityId);

    // Reset dependant selections
    setSelectedDepartment(null);
    setSelectedSurgicalRole(null);
    setSelectedAdministrativeRole(null);
    setSelectedSpeciality(null);
    setSelectedProcedures([]);

    // Clear lists
    setDepartments([]);
    setSurgicalRoles([]);
    setAdministrativeRoles([]);
    setSpecialities([]);
    setProcedures([]);

    if (!communityId) return;

    try {
      // 5. Department
      const deptRes = await getDepartmentDropdown({
        community_id: communityId,
      }).unwrap();
      if (deptRes?.status === 'true') {
        setDepartments(mapDropdownData(deptRes.data || []));
      }

      // 8. Surgical Role
      const surgRes = await getSurgicalRoleDropdown({
        community_id: communityId,
      }).unwrap();
      if (surgRes?.status === 'true') {
        setSurgicalRoles(mapDropdownData(surgRes.data || []));
      }

      // 9. Administrative Role
      const adminRes = await getAdministrativeRoleDropdown({
        community_id: communityId,
      }).unwrap();
      if (adminRes?.status === 'true') {
        setAdministrativeRoles(mapDropdownData(adminRes.data || []));
      }
    } catch (e) {
      console.log('Error fetching community cascade data:', e);
    }
  };

  const handleDepartmentChange = async departmentId => {
    setSelectedDepartment(departmentId);

    // Reset dependant selections
    setSelectedSpeciality(null);
    setSelectedProcedures([]);

    // Clear lists
    setSpecialities([]);
    setProcedures([]);

    if (!departmentId) return;

    try {
      // 6. Surgical Speciality
      const specRes = await getSurgicalSpecialityDropdown({
        department_id: departmentId,
      }).unwrap();
      if (specRes?.status === 'true') {
        setSpecialities(mapDropdownData(specRes.data || []));
      }
    } catch (e) {
      console.log('Error fetching department cascade data:', e);
    }
  };

  const handleSpecialityChange = async specialityId => {
    setSelectedSpeciality(specialityId);

    // Reset dependant selections
    setSelectedProcedures([]);

    // Clear lists
    setProcedures([]);

    if (!specialityId) return;

    try {
      // 7. Procedure Focus
      const procRes = await getProcedureFocusDropdown({
        surgery_id: specialityId,
      }).unwrap();
      if (procRes?.status === 'true') {
        setProcedures(mapDropdownData(procRes.data || []));
      }
    } catch (e) {
      console.log('Error fetching speciality cascade data:', e);
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
    if (!selectedCommunity) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Please select Community',
      });
      return false;
    }
    if (!selectedDepartment) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Please select Department',
      });
      return false;
    }
    if (!selectedSpeciality) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Please select Speciality',
      });
      return false;
    }
    if (!selectedSurgicalRole) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Please select Surgical Role',
      });
      return false;
    }
    if (!selectedAdministrativeRole) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Please select Administrative Role',
      });
      return false;
    }
    if (!selectedContactTier) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Please select Contact Tier',
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
      const result =
        source === 'camera'
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
        community: selectedCommunity || '',
        department: selectedDepartment || '',
        surgical_speciality: selectedSpeciality || '',
        procedure_focus: selectedProcedures.join(','),
        surgical_role: selectedSurgicalRole || '',
        administrative_role: selectedAdministrativeRole || '',
        contact_tier: selectedContactTier || '',
        focus_product: selectedFocusProducts.join(','),
        profile_pic_name: profilePic,
        business_card_name: businessCard,
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

  const renderHeading = (index, text) => (
    <Animated.View
      style={{
        transform: [{ translateY: animValues[index].translateY }],
        opacity: animValues[index].opacity,
      }}
    >
      <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>
        {text}
      </Text>
    </Animated.View>
  );

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
            style={{
              color: theme.colors.text,
              fontSize: 12,
              flex: 1,
              marginRight: 8,
            }}
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
          {/* Section 1: Basic Information */}
          {renderHeading(0, 'Basic Information')}

          <Animated.View
            style={{
              transform: [{ translateY: animValues[1].translateY }],
              opacity: animValues[1].opacity,
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
              valueField="id"
              placeholder="Select Title *"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedTitle}
              onChange={item => setSelectedTitle(item.id)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          {renderInputAnimated(2, 'Person Name *', personName, setPersonName)}

          <Animated.View
            style={{
              transform: [{ translateY: animValues[3].translateY }],
              opacity: animValues[3].opacity,
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
              labelField="description"
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
            4,
            'Personal Email',
            personalEmail,
            setPersonalEmail,
            'email-address',
          )}

          {renderInputAnimated(5, 'Cell No *', cellNo, setCellNo, 'phone-pad')}

          {/* Section 2: Professional Information */}
          {renderHeading(6, 'Professional Information')}

          {/* Hospitals (Multi-Selection) */}
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
              labelField="description"
              valueField="id"
              placeholder="Select Hospitals"
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

          {/* Community* */}
          <Animated.View
            style={{
              transform: [{ translateY: animValues[8].translateY }],
              opacity: animValues[8].opacity,
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
              valueField="id"
              placeholder="Select Community *"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedCommunity}
              onChange={item => handleCommunityChange(item.id)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          {/* Department* (community_id input) */}
          <Animated.View
            style={[
              {
                transform: [{ translateY: animValues[9].translateY }],
                opacity: animValues[9].opacity,
              },
              !selectedCommunity && { opacity: 0.6 },
            ]}
          >
            <Dropdown
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              disable={!selectedCommunity}
              data={departments}
              search
              labelField="description"
              valueField="id"
              placeholder={
                selectedCommunity
                  ? 'Select Department *'
                  : 'Select Department (Select Community First) *'
              }
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedDepartment}
              onChange={item => handleDepartmentChange(item.id)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          {/* Surgical Speciality* (department_id input) */}
          <Animated.View
            style={[
              {
                transform: [{ translateY: animValues[10].translateY }],
                opacity: animValues[10].opacity,
              },
              !selectedDepartment && { opacity: 0.6 },
            ]}
          >
            <Dropdown
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              disable={!selectedDepartment}
              data={specialities}
              search
              labelField="description"
              valueField="id"
              placeholder={
                selectedDepartment
                  ? 'Select Speciality *'
                  : 'Select Speciality (Select Department First) *'
              }
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedSpeciality}
              onChange={item => handleSpecialityChange(item.id)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          {/* Procedure Focus (Multi-Selection) (surgery_id input) */}
          <Animated.View
            style={[
              {
                transform: [{ translateY: animValues[11].translateY }],
                opacity: animValues[11].opacity,
              },
              !selectedSpeciality && { opacity: 0.6 },
            ]}
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
              disable={!selectedSpeciality}
              data={procedures}
              search
              labelField="description"
              valueField="id"
              placeholder={
                selectedSpeciality
                  ? 'Select Procedures'
                  : 'Select Procedures (Select Speciality First)'
              }
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedProcedures}
              onChange={item => setSelectedProcedures(item)}
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

          {/* Surgical Role* (community_id input) */}
          <Animated.View
            style={[
              {
                transform: [{ translateY: animValues[12].translateY }],
                opacity: animValues[12].opacity,
              },
              !selectedCommunity && { opacity: 0.6 },
            ]}
          >
            <Dropdown
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              disable={!selectedCommunity}
              data={surgicalRoles}
              search
              labelField="description"
              valueField="id"
              placeholder={
                selectedCommunity
                  ? 'Select Surgical Role *'
                  : 'Select Surgical Role (Select Community First) *'
              }
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedSurgicalRole}
              onChange={item => setSelectedSurgicalRole(item.id)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          {/* Administrative Role* (community_id input) */}
          <Animated.View
            style={[
              {
                transform: [{ translateY: animValues[13].translateY }],
                opacity: animValues[13].opacity,
              },
              !selectedCommunity && { opacity: 0.6 },
            ]}
          >
            <Dropdown
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              disable={!selectedCommunity}
              data={administrativeRoles}
              search
              labelField="description"
              valueField="id"
              placeholder={
                selectedCommunity
                  ? 'Select Administrative Role *'
                  : 'Select Administrative Role (Select Community First) *'
              }
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedAdministrativeRole}
              onChange={item => setSelectedAdministrativeRole(item.id)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          {/* Section 3: Business Focus */}
          {renderHeading(14, 'Business Focus')}

          {/* Contact Tier* */}
          <Animated.View
            style={{
              transform: [{ translateY: animValues[15].translateY }],
              opacity: animValues[15].opacity,
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
              data={contactTiers}
              search
              labelField="description"
              valueField="id"
              placeholder="Select Contact Tier *"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedContactTier}
              onChange={item => setSelectedContactTier(item.id)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          {/* Focus Products (Multi-Selection) */}
          <Animated.View
            style={{
              transform: [{ translateY: animValues[16].translateY }],
              opacity: animValues[16].opacity,
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
              data={focusProducts}
              search
              labelField="description"
              valueField="id"
              placeholder="Select Focus Products"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={selectedFocusProducts}
              onChange={item => setSelectedFocusProducts(item)}
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

          {/* Section 4: Profile Picture */}
          {renderHeading(17, 'Profile Picture')}

          {renderImagePicker(18, 'Profile Picture', profilePic, setProfilePic)}
          {renderImagePicker(
            19,
            'Business Card',
            businessCard,
            setBusinessCard,
          )}

          {/* Submit */}
          <Animated.View
            style={{
              transform: [{ translateY: animValues[20].translateY }],
              opacity: animValues[20].opacity,
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
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
