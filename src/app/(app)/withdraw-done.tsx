import { Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, KeyValue, T } from '@/components/ui';
import { money, shortDate, timeHM } from '@/lib/fmt';
import { color } from '@/theme/tokens';

/** Design 14c · QPay-style confirmation (mock payment). */
export default function WithdrawDone() {
  const p = useLocalSearchParams<{ amount: string; account: string; at: string; tx: string; left: string }>();
  const amount = Number(p.amount);
  const when = p.at ? `${shortDate(p.at.slice(0, 10))} · ${timeHM(p.at)}` : '—';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.surface, padding: 24, gap: 20 }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 22 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: color.successSoft, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: color.success, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark" size={36} color="#FFFFFF" />
            </View>
          </View>
          <T size="lg" tone="muted">
            Шилжүүлэг амжилттай
          </T>
          <T weight="bold" size={36}>
            {money(amount)}
          </T>
        </View>
        <KeyValue
          rows={[
            ['Данс', p.account ?? '—'],
            ['Огноо', when],
            ['Гүйлгээний дугаар', p.tx ?? '—'],
            ['Үлдэгдэл авах боломж', money(Number(p.left))],
          ]}
        />
        <T size="sm" tone="muted" style={{ textAlign: 'center' }}>
          Жишээ баталгаажуулах дэлгэц — бодит төлбөр холбогдоогүй
        </T>
      </View>
      <View style={{ gap: 10 }}>
        <Button label="Болсон" onPress={() => router.replace('/employee/earnings')} />
        <Button
          label="Баримт хуваалцах"
          variant="secondary"
          onPress={() => void Share.share({ message: `Цалингийн урьдчилгаа: ${money(amount)}\n${p.account}\n${when}\nГүйлгээ: ${p.tx}` })}
        />
      </View>
    </SafeAreaView>
  );
}
