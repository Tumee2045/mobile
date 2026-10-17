import { useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, useApi, useMutation, type LeaveType } from '@/api';
import { useAuthed } from '@/auth/session';
import { Button, Chip, Field, Footer, IconButton, Row, Screen, T } from '@/components/ui';
import { addDays, shortDate, todayISO, weekdayShort } from '@/lib/fmt';
import { parseDate, toISODate } from '@/shared/lib/format';
import { color, font, radius } from '@/theme/tokens';

const TYPES: [LeaveType, string][] = [
  ['sick', 'Өвчтэй'],
  ['personal', 'Хувийн'],
  ['vacation', 'Ээлжийн амралт'],
  ['other', 'Бусад'],
];

/** Design 13b · Чөлөө хүсэх */
export default function LeaveNew() {
  const { user, active } = useAuthed();
  const companyId = active!.company.id;
  const [type, setType] = useState<LeaveType>('sick');
  const [start, setStart] = useState(addDays(todayISO(), 1));
  const [end, setEnd] = useState(addDays(todayISO(), 1));
  const [reason, setReason] = useState('');
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);
  const { data: ctx } = useApi(() => api.getLeaveContext(user.id, companyId, start), [user.id, companyId, start]);
  const request = useMutation(api.requestLeave);

  const submit = async () => {
    if (!reason.trim()) return Alert.alert('Шалтгаанаа бичнэ үү');
    try {
      await request.mutate(user.id, companyId, { type, startDate: start, endDate: end, reason: reason.trim() });
      router.back();
    } catch (e) {
      Alert.alert('Илгээж чадсангүй', (e as Error).message);
    }
  };

  const onPick = (iso: string) => {
    if (picking === 'start') {
      setStart(iso);
      if (end < iso) setEnd(iso);
    } else if (picking === 'end') setEnd(iso < start ? start : iso);
    if (Platform.OS !== 'ios') setPicking(null);
  };

  return (
    <Screen
      bg={color.surface}
      header={
        <Row gap={4} style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: color.border }}>
          <IconButton icon="close" label="Хаах" plain onPress={() => router.back()} />
          <T weight="semibold" size={18}>
            Чөлөө хүсэх
          </T>
        </Row>
      }
      footer={
        <Footer>
          <View style={{ flex: 1 }}>
            <Button label="Хүсэлт илгээх" onPress={submit} loading={request.pending} />
          </View>
        </Footer>
      }
      contentStyle={{ gap: 18 }}
    >
      <View style={{ gap: 10 }}>
        <T size="md" weight="semibold">
          Төрөл
        </T>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {TYPES.map(([k, l]) => (
            <Chip key={k} label={l} on={type === k} onPress={() => setType(k)} />
          ))}
        </Row>
      </View>
      <Row gap={12}>
        <DateBox label="Эхлэх" value={start} onPress={() => setPicking('start')} />
        <DateBox label="Дуусах" value={end} onPress={() => setPicking('end')} />
      </Row>
      {picking && (
        <DateTimePicker
          value={parseDate(picking === 'start' ? start : end)}
          mode="date"
          minimumDate={parseDate(picking === 'end' ? start : todayISO())}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(e, d) => {
            if (e.type === 'dismissed' || !d) return setPicking(null);
            onPick(toISODate(d));
          }}
        />
      )}
      {picking && Platform.OS === 'ios' && <Button size="md" variant="secondary" label="Болсон" onPress={() => setPicking(null)} />}
      {ctx?.shiftOnDate && (
        <View style={{ padding: 14, borderRadius: radius.lg, backgroundColor: color.warningSoft }}>
          <T size="md" style={{ color: color.warning }}>
            Энэ өдөр таны{' '}
            <T size="md" weight="bold" style={{ color: color.warning }}>
              {ctx.shiftOnDate.start}–{ctx.shiftOnDate.end}
            </T>{' '}
            {active?.membership.scheduleType === 'shift' ? 'ээлж' : 'ажлын цаг'} байна. Батлагдвал менежер өөр хүн томилно.
          </T>
        </View>
      )}
      <Field label="Шалтгаан" value={reason} onChangeText={setReason} multiline placeholder="Товч тайлбар" />
      <Pressable
        accessibilityRole="button"
        onPress={() => Alert.alert('Зураг хавсаргах', 'Файл хадгалах сервис холбогдсоны дараа идэвхжинэ.')}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: color.borderStrong }}
      >
        <Ionicons name="camera-outline" size={20} color={color.textSecondary} />
        <T tone="secondary">Зураг хавсаргах (заавал биш)</T>
      </Pressable>
      {ctx?.approver && (
        <T size="md" tone="muted">
          Батлах: {ctx.approver.name.split(' ')[0]} ({ctx.approver.title.toLowerCase()})
        </T>
      )}
    </Screen>
  );
}

function DateBox({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <T size="md" weight="medium">
        {label}
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={onPress}
        style={{ minHeight: 52, borderWidth: 1, borderColor: color.borderStrong, borderRadius: radius.lg, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <T style={{ fontFamily: font.regular, fontSize: 16 }}>
          {weekdayShort(value)} {shortDate(value)}
        </T>
        <Ionicons name="calendar-outline" size={18} color={color.textMuted} />
      </Pressable>
    </View>
  );
}
