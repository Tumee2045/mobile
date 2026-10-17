import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, useApi } from '@/api';
import { useAuthed } from '@/auth/session';
import { Empty, IconButton, Row, T } from '@/components/ui';
import { addDays, dayNumber, shortDate, todayISO, weekStart, weekdayShort } from '@/lib/fmt';
import { hoursBetween } from '@/shared/lib/format';
import { color } from '@/theme/tokens';

const LEAVE_TYPE = { sick: 'Өвчтэй', personal: 'Хувийн', vacation: 'Ээлжийн амралт', other: 'Бусад' } as const;

/** Design 12 · Хуваарь — week strip + day cards. */
export default function Schedule() {
  const { user, active } = useAuthed();
  const companyId = active!.company.id;
  const [week, setWeek] = useState(weekStart(todayISO()));
  const [selected, setSelected] = useState<string | null>(null);
  const { data } = useApi(() => api.getMyWeekSchedule(user.id, companyId, week), [user.id, companyId, week]);
  const { data: leave } = useApi(() => api.listMyLeave(user.id), [user.id]);

  const leaveOn = (date: string) =>
    leave?.find((l) => (l.request.status === 'pending' || l.request.status === 'approved') && l.request.startDate <= date && l.request.endDate >= date)?.request;

  const days = (data ?? []).map((d) => ({ ...d, leave: leaveOn(d.date) }));
  const shifts = days.filter((d) => d.shift && !d.leave);
  const hours = shifts.reduce((s, d) => s + hoursBetween(d.shift!.start, d.shift!.end), 0);
  const rows = days.filter((d) => (d.shift || d.leave) && (!selected || d.date === selected));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={['top']}>
      <View style={{ backgroundColor: color.surface, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: color.border }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T weight="bold" size={22} numberOfLines={1} style={{ flexShrink: 1 }}>
            Миний хуваарь
          </T>
          <Row gap={2}>
            <IconButton icon="chevron-back" label="Өмнөх 7 хоног" size={40} bg={color.surfaceSunken} onPress={() => (setWeek(addDays(week, -7)), setSelected(null))} />
            <T size="md" weight="medium" style={{ paddingHorizontal: 6 }}>
              {shortDate(week)} – {shortDate(addDays(week, 6))}
            </T>
            <IconButton icon="chevron-forward" label="Дараах 7 хоног" size={40} bg={color.surfaceSunken} onPress={() => (setWeek(addDays(week, 7)), setSelected(null))} />
          </Row>
        </Row>
        <Row gap={6}>
          {days.map((d) => {
            const on = selected === d.date || (!selected && d.date === todayISO());
            const dot = d.leave ? '#D97706' : d.shift ? color.primary : 'transparent';
            return (
              <Pressable
                key={d.date}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${weekdayShort(d.date)} ${dayNumber(d.date)}${d.shift ? ', ээлжтэй' : ''}${d.leave ? ', чөлөө' : ''}`}
                onPress={() => setSelected(selected === d.date ? null : d.date)}
                style={{ flex: 1, minHeight: 60, borderRadius: 12, backgroundColor: on ? color.primary : color.surfaceMuted, alignItems: 'center', justifyContent: 'center', gap: 2 }}
              >
                <T size={12} style={{ color: on ? '#FFFFFF' : color.textMuted }}>
                  {weekdayShort(d.date)}
                </T>
                <T size={17} weight={on ? 'bold' : 'semibold'} style={{ color: on ? '#FFFFFF' : color.text }}>
                  {dayNumber(d.date)}
                </T>
                {!on && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: dot }} />}
              </Pressable>
            );
          })}
        </Row>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        <Row style={{ justifyContent: 'space-between', paddingHorizontal: 2 }}>
          <T size="md" tone="muted">
            {shifts.length} ээлж · {Math.round(hours)} цаг
          </T>
          <T size="md" tone="muted">
            {active?.branch?.name}
          </T>
        </Row>
        {data && rows.length === 0 && <Empty icon="calendar-outline" title={selected ? 'Энэ өдөр ээлжгүй' : 'Энэ 7 хоногт ээлж алга'} />}
        {rows.map((d) => {
          const isLeave = !!d.leave;
          const bar = isLeave ? '#D97706' : color.primary;
          return (
            <View key={d.date} style={{ flexDirection: 'row', gap: 12, backgroundColor: color.surface, borderWidth: 1, borderColor: d.date === todayISO() ? color.primary : color.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 }}>
              <View style={{ width: 44, alignItems: 'center', justifyContent: 'center' }}>
                <T size={12} tone="muted">
                  {weekdayShort(d.date)}
                </T>
                <T size={18} weight="bold">
                  {dayNumber(d.date)}
                </T>
              </View>
              <View style={{ width: 4, borderRadius: 999, backgroundColor: bar }} />
              <View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
                <T size={16} weight="semibold">
                  {isLeave ? 'Чөлөө' : `${d.shift!.start} – ${d.shift!.end}`}
                </T>
                <T size={13} tone="muted">
                  {isLeave
                    ? `${LEAVE_TYPE[d.leave!.type]} · ${d.leave!.status === 'approved' ? 'зөвшөөрсөн' : 'хүлээгдэж буй'}`
                    : `${d.shift!.slot === 'morning' ? 'Өглөөний' : 'Оройн'} ээлж · ${active?.branch?.name ?? ''}`}
                </T>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
