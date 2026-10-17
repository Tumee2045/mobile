import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, useApi, useMutation, type AppNotification } from '@/api';
import { useAuthed } from '@/auth/session';
import { Card, Empty, IconButton, Row, Segmented, T } from '@/components/ui';
import { mobileRoute } from '@/lib/links';
import { relativeTime } from '@/lib/fmt';
import { color } from '@/theme/tokens';

/** Icon tile colours by notification topic (design 15). */
function topic(n: AppNotification) {
  const blue = { bg: color.primarySoft, fg: color.primary };
  const green = { bg: color.successSoft, fg: color.success };
  const amber = { bg: color.warningSoft, fg: color.warning };
  if (n.link.includes('contract')) return { ...blue, icon: 'Г' };
  if (n.text.includes('₮')) return { ...green, icon: '₮' };
  if (n.link.includes('leave')) return { ...amber, icon: 'Ч' };
  if (n.link.includes('schedule')) return { ...blue, icon: 'Х' };
  if (n.text.includes('үнэлгээ')) return { ...blue, icon: '★' };
  if (n.link.includes('applications') || n.text.includes('ажилд')) return { ...green, icon: 'Ө' };
  return { ...blue, icon: 'М' };
}

export default function Notifications() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, active, isEmployee } = useAuthed();
  const companyId = active?.company.id;
  const [tab, setTab] = useState<'all' | 'news'>(params.tab === 'news' ? 'news' : 'all');
  const notes = useApi(() => api.listNotifications(user.id), [user.id]);
  const { data: news } = useApi(() => (companyId ? api.listAnnouncements(companyId) : Promise.resolve([])), [companyId]);
  const markOne = useMutation(api.markNotificationRead);
  const markAll = useMutation(api.markAllNotificationsRead);
  const unread = notes.data?.filter((n) => !n.read).length ?? 0;
  const pinned = news?.find((a) => a.announcement.pinned);

  const open = async (n: AppNotification) => {
    if (!n.read) await markOne.mutate(n.id).catch(() => {});
    const to = mobileRoute(n.link, isEmployee);
    if (to) router.push(to);
  };

  const header = (
    <View style={{ gap: 12 }}>
      {tab === 'all' && pinned && <NewsCard item={pinned} pinned />}
      {tab === 'news' && news?.length === 0 && <Empty icon="megaphone-outline" title="Зарлал алга" body={companyId ? undefined : 'Ажилд орсны дараа байгууллагын зарлал энд харагдана'} />}
      {tab === 'news' && news?.map((a) => <NewsCard key={a.announcement.id} item={a} pinned={a.announcement.pinned} />)}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={['top']}>
      <View style={{ backgroundColor: color.surface, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: color.border }}>
        <Row gap={4}>
          <IconButton icon="chevron-back" label="Буцах" plain onPress={() => router.back()} />
          <T weight="bold" size={22} style={{ flex: 1 }}>
            Мэдэгдэл
          </T>
          <Pressable accessibilityRole="button" disabled={!unread} onPress={() => void markAll.mutate(user.id)} style={{ padding: 8 }}>
            <T size="md" tone={unread ? 'primary' : 'muted'}>
              Бүгдийг уншсан
            </T>
          </Pressable>
        </Row>
        <View style={{ paddingHorizontal: 8 }}>
          <Segmented
            value={tab}
            onChange={setTab}
            height={40}
            options={[
              { value: 'all', label: unread ? `Бүгд · ${unread} шинэ` : 'Бүгд' },
              { value: 'news', label: 'Зарлал' },
            ]}
          />
        </View>
      </View>
      <FlatList
        data={tab === 'all' ? (notes.data ?? []) : []}
        keyExtractor={(n) => n.id}
        refreshing={notes.loading && !!notes.data}
        onRefresh={() => void notes.reload()}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={header}
        ListEmptyComponent={tab === 'all' && notes.data ? <Empty icon="notifications-outline" title="Мэдэгдэл алга" /> : undefined}
        renderItem={({ item: n, index }) => {
          const t = topic(n);
          const list = notes.data ?? [];
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${n.text}${n.read ? '' : ', уншаагүй'}`}
              onPress={() => void open(n)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                backgroundColor: color.surface,
                borderColor: color.border,
                borderWidth: 1,
                borderTopLeftRadius: index === 0 ? 16 : 0,
                borderTopRightRadius: index === 0 ? 16 : 0,
                borderBottomLeftRadius: index === list.length - 1 ? 16 : 0,
                borderBottomRightRadius: index === list.length - 1 ? 16 : 0,
                marginTop: index === 0 ? 0 : -13,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
                <T weight="bold" style={{ color: t.fg }}>
                  {t.icon}
                </T>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T size={15} weight={n.read ? 'regular' : 'semibold'}>
                  {n.text}
                </T>
                <T size={13} tone="muted">
                  {relativeTime(n.createdAt)}
                </T>
              </View>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: n.read ? 'transparent' : color.primary }} />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

function NewsCard({ item, pinned }: { item: { announcement: { title: string; body: string; createdAt: string }; authorName: string }; pinned?: boolean }) {
  const { active } = useAuthed();
  return (
    <Card style={{ borderColor: pinned ? color.primary : color.border, borderWidth: pinned ? 2 : 1, gap: 6 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T size={12} weight="semibold" tone={pinned ? 'primary' : 'muted'}>
          {pinned ? 'Тогтоосон зарлал' : 'Зарлал'}
        </T>
        <T size={12} tone="muted">
          {relativeTime(item.announcement.createdAt)}
        </T>
      </Row>
      <T weight="bold" size={17}>
        {item.announcement.title}
      </T>
      <T tone="secondary" style={{ lineHeight: 22 }}>
        {item.announcement.body}
      </T>
      <T size={13} tone="muted">
        {item.authorName} · {active?.company.name}
      </T>
    </Card>
  );
}
