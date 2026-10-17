import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, useApi, type Application, type Contract } from '@/api';
import { useAuthed } from '@/auth/session';
import { Avatar, Badge, Button, Card, Empty, Row, Segmented, StepBar, T, type BadgeTone } from '@/components/ui';
import { relativeTime } from '@/lib/fmt';
import { color } from '@/theme/tokens';

const STEPS = ['Илгээсэн', 'Сонгогдсон', 'Гэрээ', 'Ажилд орсон'];

/** Where an application stands in the 4-step hiring flow. */
function progress(a: Application, c: Contract | null): { step: number; badge: string; tone: BadgeTone; note: string; done: boolean; actionable: boolean } {
  if (a.status === 'hired') return { step: 4, badge: 'Ажилд орсон', tone: 'success', note: 'Ажилтны хэсэг нээгдсэн', done: true, actionable: false };
  if (c?.status === 'declined') return { step: 3, badge: 'Татгалзсан', tone: 'neutral', note: 'Та гэрээнээс татгалзсан', done: true, actionable: false };
  if (a.status === 'rejected') return { step: 1, badge: 'Тэнцээгүй', tone: 'neutral', note: 'Энэ удаад тэнцсэнгүй', done: true, actionable: false };
  if (c?.status === 'sent') return { step: 3, badge: 'Гэрээ ирсэн', tone: 'primary', note: '', done: false, actionable: true };
  if (c?.status === 'signed') return { step: 3, badge: 'Гарын үсэг зурсан', tone: 'success', note: 'Ажилд авах шийдвэр хүлээгдэж байна', done: false, actionable: false };
  if (a.status === 'selected') return { step: 2, badge: 'Сонгогдсон', tone: 'success', note: 'Гэрээ бэлтгэгдэж байна', done: false, actionable: false };
  return { step: 1, badge: 'Хянагдаж буй', tone: 'warning', note: `Илгээсэн: ${relativeTime(a.createdAt)}`, done: false, actionable: false };
}

export default function Applications() {
  const { user } = useAuthed();
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const { data, loading, reload } = useApi(() => api.listMyApplications(user.id), [user.id]);
  const rows = (data ?? []).map((r) => ({ ...r, p: progress(r.application, r.contract) }));
  const active = rows.filter((r) => !r.p.done);
  const done = rows.filter((r) => r.p.done);
  const list = tab === 'active' ? active : done;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={['top']}>
      <View style={{ backgroundColor: color.surface, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: color.border }}>
        <T weight="bold" size={24}>
          Миний өргөдлүүд
        </T>
        <Segmented
          value={tab}
          onChange={setTab}
          height={40}
          options={[
            { value: 'active', label: `Идэвхтэй · ${active.length}` },
            { value: 'done', label: `Дууссан · ${done.length}` },
          ]}
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(r) => r.application.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshing={loading && !!data}
        onRefresh={() => void reload()}
        ListEmptyComponent={
          data ? (
            <Empty
              icon="document-text-outline"
              title={tab === 'active' ? 'Идэвхтэй өргөдөл алга' : 'Дууссан өргөдөл алга'}
              body={tab === 'active' ? 'Ажил хайх хэсгээс өргөдөл гаргаарай' : undefined}
            />
          ) : undefined
        }
        renderItem={({ item: { application: a, job, contract, p } }) => (
          <Card highlight={p.actionable} style={{ gap: 12 }}>
            <Row>
              <Avatar label={job.company.initials} />
              <View style={{ flex: 1, gap: 2 }}>
                <T weight="semibold" size={16} onPress={() => router.push(`/job/${job.id}`)}>
                  {job.title}
                </T>
                <T size="md" tone="muted">
                  {job.company.name}
                </T>
              </View>
              <Badge label={p.badge} tone={p.tone} strong />
            </Row>
            <StepBar step={p.step} labels={p.actionable ? STEPS : undefined} />
            {p.actionable && contract ? (
              <Button label="Гэрээ харах, гарын үсэг зурах" size="md" onPress={() => router.push(`/contract/${contract.id}`)} />
            ) : (
              <T size={13} tone="muted">
                {p.note}
              </T>
            )}
            {a.status === 'hired' && <Button label="Ажилтны хэсэг рүү" size="md" variant="secondary" onPress={() => router.push('/employee/home')} />}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
