import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, useApi } from '@/api';
import { useAuthed } from '@/auth/session';
import { Avatar, Button, Card, IconButton, InverseCard, Loading, Row, SectionTitle, Stat, T } from '@/components/ui';
import { dayLabel, distanceLabel, greeting, longDate, moneyCompact, todayISO } from '@/lib/fmt';
import { useBranchDistance } from '@/lib/location';
import { color } from '@/theme/tokens';

export default function Home() {
  const { user, active } = useAuthed();
  const companyId = active!.company.id;
  const today = useApi(() => api.getMyToday(user.id, companyId), [user.id, companyId]);
  const { data: earnings } = useApi(() => api.getEarnings(user.id, companyId), [user.id, companyId]);
  const { data: upcoming } = useApi(() => api.getMySchedule(user.id, companyId, 10), [user.id, companyId]);
  const { data: leave } = useApi(() => api.listMyLeave(user.id), [user.id]);
  const { data: notes } = useApi(() => api.listNotifications(user.id), [user.id]);
  const { data: news } = useApi(() => api.listAnnouncements(companyId), [companyId]);
  const t = today.data;
  const { state: loc } = useBranchDistance(t?.branch);

  if (!t) return <Loading />;

  const rec = t.record;
  const state = t.onLeave ? 'leave' : !rec ? 'out' : rec.clockOut ? 'done' : 'in';
  const chip = { leave: 'Чөлөөтэй', out: 'Ирээгүй', in: `Ажил дээр · ${rec?.clockIn}`, done: `Дууссан · ${rec?.hours} цаг` }[state];
  const unread = notes?.filter((n) => !n.read).length ?? 0;

  const pendingLeave = new Set(
    (leave ?? []).filter((l) => l.request.status === 'pending').map((l) => l.request.startDate),
  );
  const next = (upcoming ?? [])
    .filter((d) => d.date !== todayISO() && (d.shift || d.onLeave || pendingLeave.has(d.date)))
    .slice(0, 2);

  const locText =
    loc.status === 'ok'
      ? `Ажлын байрнаас ${distanceLabel(loc.distanceM)} · ${loc.distanceM <= (t.branch?.geofenceRadiusM ?? 100) ? 'радиус дотор' : 'радиусаас гадна'}${loc.simulated ? ' (демо)' : ''}`
      : loc.status === 'denied'
        ? 'Байршлын зөвшөөрөл олгоогүй'
        : loc.status === 'error'
          ? 'Байршил тодорхойлж чадсангүй'
          : 'Байршил шалгаж байна…';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 28 }} refreshControl={<RefreshControl refreshing={today.loading} onRefresh={() => void today.reload()} />}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${active?.company.name}, горим солих`}
            onPress={() => router.push('/employee/profile')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40, paddingLeft: 6, paddingRight: 12, borderRadius: 999, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border }}
          >
            <Avatar label={active!.company.initials} size={28} round />
            <T weight="semibold" size="md">
              {active?.company.name}
            </T>
            <Ionicons name="chevron-down" size={16} color={color.textMuted} />
          </Pressable>
          <IconButton icon="notifications-outline" label="Мэдэгдэл" dot={unread > 0} onPress={() => router.push('/notifications')} />
        </Row>

        <View style={{ gap: 2 }}>
          <T weight="bold" size={24}>
            {greeting()}, {user.name.split(' ')[0]}
          </T>
          <T size="md" tone="muted">
            {longDate(todayISO())}
          </T>
        </View>

        <InverseCard>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ gap: 4, flex: 1 }}>
              <T size={13} tone="onInverseMuted">
                {t.membership.scheduleType === 'shift' ? 'Өнөөдрийн ээлж' : 'Өнөөдрийн ажлын цаг'}
              </T>
              <T weight="bold" size={26} tone="onPrimary">
                {t.shift ? `${t.shift.start} – ${t.shift.end}` : t.onLeave ? 'Чөлөөтэй' : 'Ээлжгүй өдөр'}
              </T>
              <T size="md" tone="onInverseMuted">
                {t.branch?.name} · {t.membership.title}
              </T>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: color.inverseTrack }}>
              <T size={12} weight="medium" tone="onPrimary">
                {chip}
              </T>
            </View>
          </Row>
          <Row gap={8}>
            <Ionicons name="location-outline" size={18} color={color.onInverseMuted} />
            <T size="md" style={{ color: '#E3EAFB', flex: 1 }}>
              {locText}
            </T>
          </Row>
          {(state === 'out' || state === 'in') && (
            <Button
              variant="white"
              size="xl"
              icon="qr-code-outline"
              label={state === 'in' ? 'Ажил дуусгах' : 'Ирц бүртгэх'}
              onPress={() => router.push('/qr')}
            />
          )}
        </InverseCard>

        <Row gap={10}>
          <Stat label="7 хоногт" value={`${t.weekHours} цаг`} />
          <Stat label="Цагтаа" value={t.weekOnTime} />
          <Stat label="Авах боломжтой" value={earnings ? moneyCompact(earnings.availableNow) : '…'} valueColor={color.primary} onPress={() => router.push('/employee/earnings')} />
        </Row>

        <Row gap={10}>
          <QuickLink icon="calendar-outline" label="Чөлөө хүсэх" onPress={() => router.push('/leave')} />
          <QuickLink icon="megaphone-outline" label={`Зарлал${news?.length ? ` · ${news.length}` : ''}`} onPress={() => router.push('/notifications?tab=news')} />
        </Row>

        {t.membership.scheduleType === 'shift' && (
          <Card style={{ gap: 10, paddingVertical: 14 }}>
            <SectionTitle title="Дараагийн ээлж" action="Бүгд" onAction={() => router.push('/employee/schedule')} />
            {next.length === 0 && (
              <T size="md" tone="muted">
                Ойрын өдрүүдэд ээлж алга
              </T>
            )}
            {next.map((d) => (
              <Row key={d.date} style={{ justifyContent: 'space-between' }}>
                <T weight="medium" size={15}>
                  {dayLabel(d.date)}
                </T>
                {d.onLeave ? (
                  <T size={15} tone="warning">
                    Чөлөөтэй
                  </T>
                ) : pendingLeave.has(d.date) ? (
                  <T size={15} tone="warning">
                    Чөлөө хүссэн
                  </T>
                ) : (
                  <T size={15} tone="secondary">
                    {d.shift!.start} – {d.shift!.end}
                  </T>
                )}
              </Row>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickLink({ icon, label, onPress }: { icon: 'calendar-outline' | 'megaphone-outline'; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 56,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: color.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={color.primary} />
      <T weight="medium" size={15}>
        {label}
      </T>
    </Pressable>
  );
}
