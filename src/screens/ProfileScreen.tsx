import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, useApi } from '@/api';
import { useAuthed } from '@/auth/session';
import { Avatar, Card, Empty, IconButton, InverseCard, Row, Segmented, T } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { monthDot } from '@/lib/fmt';
import { color } from '@/theme/tokens';

/** Shared by both tab groups (design 9 · Профайл). */
export function ProfileScreen() {
  const { user, employeeMemberships, isEmployee, switchCompany, signOut } = useAuthed();
  const { data } = useApi(() => api.getWorkerProfile(user.id), [user.id]);
  const employer = employeeMemberships[0];
  const r = data?.reliability;
  const verified = data?.history.filter((h) => h.verified) ?? [];
  const quote = verified.find((h) => h.managerQuote)?.managerQuote;

  const setMode = (m: 'seeker' | 'employee') => {
    if (m === 'employee' && employer) {
      switchCompany(employer.company.id);
      router.replace('/employee/profile');
    } else if (m === 'seeker') {
      switchCompany(null);
      router.replace('/seeker/profile');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>
        {employer && (
          <Segmented
            bg={color.border}
            height={42}
            value={isEmployee ? 'employee' : 'seeker'}
            onChange={setMode}
            options={[
              { value: 'seeker', label: 'Ажил хайгч' },
              { value: 'employee', label: `Ажилтан · ${employer.company.name}` },
            ]}
          />
        )}

        <Row gap={14}>
          <Avatar label={user.name.charAt(0)} size={64} round tone="primary" />
          <View style={{ flex: 1, gap: 2 }}>
            <T weight="bold" size={22}>
              {user.shortName}
            </T>
            <T size="md" tone="muted">
              {[user.headline, user.district].filter(Boolean).join(' · ') || 'Профайлаа бөглөнө үү'}
            </T>
          </View>
          <IconButton icon="create-outline" label="Профайл засах" onPress={() => router.push('/profile-edit')} />
        </Row>

        <InverseCard style={{ borderRadius: 18, padding: 18, gap: 14 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ gap: 2, flex: 1 }}>
              <T weight="semibold" size={15} tone="onPrimary">
                Найдвартай байдлын оноо
              </T>
              <T size={12} tone="onInverseMuted">
                {r?.status === 'insufficient' ? 'Шинэ · мэдээлэл дутуу — бага оноо биш' : '100 онооны загвар · 5 хэсэг'}
              </T>
            </View>
            <Row gap={4} style={{ alignItems: 'baseline' }}>
              <T weight="bold" size={40} tone="onPrimary" style={{ lineHeight: 44 }}>
                {r ? (r.score ?? 'Шинэ') : '—'}
              </T>
              {r?.score != null && (
                <T size="md" tone="onInverseMuted">
                  /100
                </T>
              )}
            </Row>
          </Row>
          <View style={{ height: 8, borderRadius: 999, backgroundColor: color.inverseTrack, overflow: 'hidden' }}>
            <View style={{ width: `${r?.score ?? 0}%`, height: '100%', borderRadius: 999, backgroundColor: color.accent }} />
          </View>
          <View style={{ gap: 10 }}>
            {r?.breakdown.map((p) => (
              <View key={p.key} style={{ gap: 4 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T size={13} tone="onInverseMuted">
                    {p.label}
                  </T>
                  <T weight="semibold" size={13} tone="onPrimary">
                    {p.points == null ? '—' : `${p.points}/${p.max}`}
                  </T>
                </Row>
                <View style={{ height: 4, borderRadius: 999, backgroundColor: color.inverseTrack, overflow: 'hidden' }}>
                  <View style={{ width: `${p.points == null ? 0 : (p.points / p.max) * 100}%`, height: '100%', backgroundColor: color.accent }} />
                </View>
                <T size={11} tone="onInverseMuted">
                  {p.detail}
                </T>
              </View>
            ))}
          </View>
          <T size={11} tone="onInverseMuted">
            Хүйс, нас, эрүүл мэндийн мэдээлэл ашиглахгүй. Санал нийлэхгүй бол маргаан гаргах эрхтэй.
          </T>
        </InverseCard>

        <Card style={{ borderRadius: 18, gap: 12 }}>
          <T weight="semibold" size={16}>
            Баталгаажсан ажлын түүх
          </T>
          {data && verified.length === 0 && (
            <Empty icon="ribbon-outline" title="Одоогоор түүх алга" body="Платформоор ажилд ороход ирц, үнэлгээ тань энд автоматаар баталгаажна" />
          )}
          {verified.map((h) => (
            <Row key={h.id} gap={12}>
              <Avatar label={h.companyInitials} size={40} />
              <View style={{ flex: 1, gap: 1 }}>
                <T weight="semibold" size={15} numberOfLines={1}>
                  {h.title} · {h.companyName}
                </T>
                <T size={13} tone="muted">
                  {monthDot(h.startDate)} – {h.endDate ? monthDot(h.endDate) : 'одоо'}
                  {h.attendancePercent != null ? ` · Ирц ${h.attendancePercent}%` : ''}
                  {h.avgRating ? ` · ★${h.avgRating}` : ''}
                </T>
              </View>
              <View accessibilityLabel="Баталгаажсан" style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={14} color={color.primary} />
              </View>
            </Row>
          ))}
          {quote && (
            <View style={{ padding: 12, borderRadius: 10, backgroundColor: color.surfaceMuted }}>
              <T size="md" tone="secondary">
                “{quote.text}” — {quote.author.split(' ').pop()}
              </T>
            </View>
          )}
        </Card>

        <Card style={{ borderRadius: 18, paddingVertical: 4, gap: 0 }}>
          <MenuRow label="Ур чадвар, танилцуулга" onPress={() => router.push('/profile-edit')} />
          <MenuRow label="Мэдэгдэл" onPress={() => router.push('/notifications')} />
          <MenuRow
            label="Гарах"
            danger
            last
            onPress={() =>
              confirm('Гарах уу?', undefined, 'Гарах', async () => {
                await signOut();
                router.replace('/login');
              })
            }
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({ label, onPress, danger, last }: { label: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 50, borderBottomWidth: last ? 0 : 1, borderBottomColor: color.divider }}
    >
      <T size={15} style={danger ? { color: '#A11F14' } : undefined}>
        {label}
      </T>
      {!danger && <Ionicons name="chevron-forward" size={18} color={color.textMuted} />}
    </Pressable>
  );
}
