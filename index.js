import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
if (appName !== 'Kmivo') {
  AppRegistry.registerComponent('Kmivo', () => App);
}
if (appName !== 'KKS') {
  AppRegistry.registerComponent('KKS', () => App);
}
