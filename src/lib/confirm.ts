import { Alert, Platform } from 'react-native';

/**
 * Yes/no confirmation that also works on web — react-native-web's Alert
 * ignores buttons, so a native-style confirm would never fire there.
 */
export function confirm(title: string, message: string | undefined, okLabel: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message ? `${title}\n\n${message}` : title)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Болих', style: 'cancel' },
    { text: okLabel, style: 'destructive', onPress: onOk },
  ]);
}
