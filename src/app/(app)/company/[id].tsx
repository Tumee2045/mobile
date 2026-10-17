import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, useApi } from '@/api';
import { useAuthed } from '@/auth/session';
import { Avatar, Button, Card, IconButton, Loading, Row, T } from '@/components/ui';
import { payCompact } from '@/lib/fmt';
import { color } from '@/theme/tokens';

export default function Company() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthed();
  const insets = useSafeAreaInsets();
  const { data } = useApi(() => api.getCompany(id), [id]);
  const [following, setFollowing] = useState(false);

  if (!data) return <Loading />;
  const { company, openJobs, stats } = data;

  const message = async () => {
    const contact = await api.getCompanyContact(company.id);
    if (!contact) return Alert.alert('Холбогдох хүн олдсонгүй');
    router.push(`/chat/${await api.openDirectThread(user.id, contact, company.id)}`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ height: 160 + insets.top, backgroundColor: '#C9D3EA', alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
        <T size="md" tone="secondary">
          [Нүүр зураг]
        </T>
      </View>
      <View style={{ position: 'absolute', top: insets.top + 12, left: 12 }}>
        <IconButton icon="chevron-back" label="Буцах" onPress={() => router.back()} />
      </View>
      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <Card style={{ marginTop: -40, borderRadius: 18, gap: 14 }}>
          <Row gap={14}>
            <Avatar label={company.initials} size={64} />
            <View style={{ flex: 1, gap: 2 }}>
              <T weight="bold" size={22}>
                {company.name}
              </T>
              <T size="md" tone="muted">
                {company.industry} · {company.foundedYear} оноос
              </T>
            </View>
          </Row>
          <Row gap={8}>
            {[
              [String(stats.branches), 'Салбар'],
              [String(stats.employees), 'Ажилтан'],
              [`${stats.avgTenureMonths} сар`, 'Дундаж ажилласан'],
            ].map(([v, l]) => (
              <View key={l} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12, backgroundColor: color.surfaceMuted, alignItems: 'center', gap: 2 }}>
                <T weight="bold" size={18}>
                  {v}
                </T>
                <T size={12} tone="muted" style={{ textAlign: 'center' }}>
                  {l}
                </T>
              </View>
            ))}
          </Row>
          <Row gap={10}>
            <Button size="md" label={following ? 'Дагаж байна' : 'Дагах'} variant={following ? 'secondary' : 'primary'} onPress={() => setFollowing((f) => !f)} style={{ flex: 1 }} />
            <Button size="md" label="Мессеж" variant="secondary" onPress={message} style={{ flex: 1 }} />
          </Row>
        </Card>
        <Card style={{ borderRadius: 18, gap: 8 }}>
          <T weight="semibold" size={17}>
            Бидний тухай
          </T>
          <T tone="secondary" style={{ lineHeight: 23 }}>
            {company.about}
          </T>
        </Card>
        <Card style={{ borderRadius: 18, gap: 0 }}>
          <T weight="semibold" size={17} style={{ marginBottom: 6 }}>
            Нээлттэй ажил · {openJobs.length}
          </T>
          {openJobs.map((j, i) => (
            <Pressable
              key={j.id}
              accessibilityRole="button"
              onPress={() => router.push(`/job/${j.id}`)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: i < openJobs.length - 1 ? 1 : 0, borderBottomColor: color.divider }}
            >
              <View style={{ gap: 2, flex: 1 }}>
                <T weight="semibold">{j.title}</T>
                <T size={13} tone="muted">
                  {j.branch.name} · {j.scheduleType === 'shift' ? 'Ээлжийн' : 'Тогтмол'}
                </T>
              </View>
              <T weight="bold" size={14} tone="primary">
                {payCompact(j.payType, j.payAmount)}
              </T>
            </Pressable>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
