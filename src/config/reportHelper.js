import { PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { generatePDF } from 'react-native-html-to-pdf';
import * as XLSX from 'xlsx';
import Toast from 'react-native-toast-message';

export const requestStoragePermission = async () => {
  if (Platform.OS === 'ios') return true;
  try {
    if (Platform.Version >= 33) return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.log('Permission Error:', err);
    return false;
  }
};

export const saveFileToDownloads = async (filePath, fileName, mimeType) => {
  try {
    const isPermitted = await requestStoragePermission();
    if (!isPermitted) {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'Storage permission is required.',
      });
      return false;
    }

    const dirs = ReactNativeBlobUtil.fs.dirs;
    const destPath =
      Platform.OS === 'android'
        ? `${dirs.DownloadDir}/${fileName}`
        : `${dirs.DocumentDir}/${fileName}`;

    await ReactNativeBlobUtil.fs.cp(filePath, destPath);

    if (Platform.OS === 'android') {
      ReactNativeBlobUtil.android.actionViewIntent(destPath, mimeType);
    } else {
      ReactNativeBlobUtil.ios.openDocument(destPath);
    }

    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: `File saved to Downloads: ${fileName}`,
    });
    return true;
  } catch (error) {
    console.log('Save File Error:', error);
    Toast.show({
      type: 'error',
      text1: 'Save Error',
      text2: 'Could not save the file.',
    });
    return false;
  }
};

export const exportReportToPDF = async (html, fileName) => {
  try {
    const options = {
      html,
      fileName: fileName || `Report_${Date.now()}`,
      directory: 'Documents',
    };

    const file = await generatePDF(options);
    return await saveFileToDownloads(
      file.filePath,
      `${fileName || 'Report'}_${Date.now()}.pdf`,
      'application/pdf',
    );
  } catch (error) {
    console.log('PDF Export Error:', error);
    Toast.show({
      type: 'error',
      text1: 'Export Failed',
      text2: 'Could not generate PDF.',
    });
    return false;
  }
};

export const exportReportToExcel = async (data, fileName, sheetName = 'Report') => {
  try {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri =
      ReactNativeBlobUtil.fs.dirs.CacheDir + `/${fileName}_${Date.now()}.xlsx`;

    await ReactNativeBlobUtil.fs.writeFile(uri, wbout, 'base64');
    return await saveFileToDownloads(
      uri,
      `${fileName || 'Report'}_${Date.now()}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  } catch (error) {
    console.log('Excel Export Error:', error);
    Toast.show({
      type: 'error',
      text1: 'Export Failed',
      text2: 'Could not generate Excel.',
    });
    return false;
  }
};
