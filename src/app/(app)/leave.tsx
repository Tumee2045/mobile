import { Alert, FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, useApi, useMutation } from '@/api';
import { useAuthed } from '@/auth/session';
import { Avatar, Badge, Button, Card, Empty, Footer, Header, Row, T, type BadgeTone } from '@/components/ui';
import { relativeTime, shortDate, timeHM, weekdayShort } from '@/lib/fmt';
import { color } from '@/theme/tokens';

const TYPE = { sick: 'Өвчтэй', personal: 'Хувийн', vacation: 'Ээлжийн амралт', other: 'Бусад' } as const;
const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Хүлээгдэж буй', tone: 'warning' },
  approved: { label: 'Зөвшөөрсөн', tone: 'success' },
  rejected: { label: 'Татгалзсан', tone: 'danger' },
  cancelled: { label: 'Цуцалсан', tone: 'neutral' },
};

/** Design 13 · Миний чөлөө */
export default function Leave() {
  const { user, active } = useAuthed();
  const companyId = active?.company.id;
  const { data, loading, reload } = useApi(() => api.listMyLeave(user.id), [user.id]);
  const { data: ctx } = useApi(() => (companyId ? api.getLeaveContext(user.id, companyId, new Date().toISOString().slice(0, 10)) : Promise.resolve(null)), [user.id, companyId]);
  const cancel = useMutation(api.cancelLeave);

  const range = (a: string, b: string) => (a === b ? `${weekdayShort(a)} ${shortDate(a)}` : `${shortDate(a)} – ${shortDate(b)}`);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={['top']}>
      <Header title="Миний чөлөө" />
      <FlatList
        data={data ?? []}
        keyExtractor={(x) => x.request.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshing={loading && !!data}
        onRefresh={() => void reload()}
        ListEmptyComponent={data ? <Empty icon="calendar-outline" title="Хүсэлт алга" body="Доорх товчоор чөлөө хүснэ үү" /> : undefined}
        renderItem={({ item: { request: l, approverName } }) => (
          <Card style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T weight="semibold" size={16}>
                {TYPE[l.type]} · {range(l.startDate, l.endDate)}
              </T>
              <Badge label={STATUS[l.status].label} tone={STATUS[l.status].tone} />
            </Row>
            {l.status === 'pending' && (
              <>
                <T size="md" tone="muted">
                  Илгээсэн {relativeTime(l.createdAt).toLowerCase()} {timeHM(l.createdAt)}
                </T>
                {ctx?.approver && (
                  <Row gap={8}>
                    <Avatar label={ctx.approver.name.charAt(0)} size={24} round tone="warning" />
                    <T size="md" tone="secondary">
                      {ctx.approver.name.split(' ')[0]} батлах
                    </T>
                  </Row>
                )}
                <Button
                  label="Цуцлах"
                  size="md"
                  variant="danger"
                  style={{ alignSelf: 'flex-start', paddingHorizontal: 16 }}
                  loading={cancel.pending}
                  onPress={() =>
                    Alert.alert('Хүсэлтээ цуцлах уу?', undefined, [
                      { text: 'Үгүй', style: 'cancel' },
                      { text: 'Цуцлах', style: 'destructive', onPress: () => void cancel.mutate(l.id, user.id).catch((e: Error) => Alert.alert('Алдаа', e.message)) },
                    ])
                  }
                />
              </>
            )}
            {l.status === 'approved' && (
              <T size="md" tone="muted">
                {approverName} зөвшөөрсөн{l.decidedAt ? ` · ${shortDate(l.decidedAt.slice(0, 10))}` : ''}
              </T>
            )}
            {l.status === 'rejected' && (
              <View style={{ padding: 10, borderRadius: 10, backgroundColor: color.surfaceMuted }}>
                <T size="md" tone="secondary">
                  {l.decisionNote ? `“${l.decisionNote}”` : `${approverName} татгалзсан`}
                </T>
              </View>
            )}
          </Card>
        )}
      />
      <Footer>
        <View style={{ flex: 1 }}>
          <Button label="Чөлөө хүсэх" icon="add" onPress={() => router.push('/leave-new')} />
        </View>
      </Footer>
    </SafeAreaView>
  );
}
