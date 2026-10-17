import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, useApi, useMutation } from '@/api';
import { useAuthed } from '@/auth/session';
import { Avatar, Badge, Button, Checkbox, Chip, Field, Footer, IconButton, Loading, Row, Sheet, T, Tile } from '@/components/ui';
import { monthsSummary } from '@/lib/history';
import { pay } from '@/lib/fmt';
import { color } from '@/theme/tokens';

const KIND = { part_time: 'Цагийн', full_time: 'Бүтэн цагийн' } as const;
const STATUS = { new: 'Хянагдаж буй', selected: 'Сонгогдсон', rejected: 'Тэнцээгүй', hired: 'Ажилд орсон' } as const;

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthed();
  const { data } = useApi(() => api.getJob(id), [id]);
  const { data: mine } = useApi(() => api.getMyApplicationForJob(id, user.id), [id, user.id]);
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);

  if (!data) return <Loading bg={color.surface} />;
  const { job } = data;

  const message = async () => {
    try {
      const contact = await api.getCompanyContact(job.company.id);
      if (!contact) return Alert.alert('Холбогдох хүн олдсонгүй');
      const t = await api.openDirectThread(user.id, contact, job.company.id);
      router.push(`/chat/${t}`);
    } catch (e) {
      Alert.alert('Алдаа', (e as Error).message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.surface }} edges={['top']}>
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 4 }}>
        <IconButton icon="chevron-back" label="Буцах" plain onPress={() => router.back()} />
        <IconButton icon={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? 'Хадгалсан' : 'Хадгалах'} plain tint={saved ? color.primary : color.text} onPress={() => setSaved((s) => !s)} />
      </Row>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 20 }}>
        <Row gap={14}>
          <Avatar label={job.company.initials} size={60} />
          <View style={{ flex: 1, gap: 4 }}>
            <T weight="bold" size={24}>
              {job.title}
            </T>
            <T weight="medium" size={15} tone="primary" onPress={() => router.push(`/company/${job.company.id}`)} accessibilityRole="link">
              {job.company.name} · {job.branch.name}
            </T>
          </View>
        </Row>
        <View style={{ gap: 10 }}>
          <Row gap={10}>
            <Tile label="Цалин" value={pay(job.payType, job.payAmount)} valueColor={color.primary} />
            <Tile label="Хуваарь" value={job.scheduleType === 'shift' ? 'Ээлжийн' : 'Тогтмол'} />
          </Row>
          <Row gap={10}>
            <Tile label="Төрөл" value={KIND[job.employmentKind]} />
            <Tile label="Байршил" value={job.branch.district} />
          </Row>
        </View>
        {job.shifts.length > 0 && (
          <Section title={job.scheduleType === 'shift' ? 'Ээлжийн цаг' : 'Ажлын цаг'}>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {job.shifts.map((s) => (
                <View key={s.id} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: color.primarySoft }}>
                  <T size="md" style={{ color: color.primaryText }}>
                    {s.label} {s.start}–{s.end}
                  </T>
                </View>
              ))}
            </Row>
          </Section>
        )}
        {job.scheduleType === 'fixed' && job.shifts.length === 0 && (
          <Section title="Ажлын цаг">
            <T tone="secondary">Даваа–Баасан 09:00–18:00</T>
          </Section>
        )}
        <Bullets title="Хийх ажил" items={job.duties} />
        <Bullets title="Шаардлага" items={job.requirements} />
        <Bullets title="Нөхцөл" items={job.perks} />
      </ScrollView>
      <Footer>
        <IconButton icon="chatbubble-outline" label="Мессеж бичих" size={56} onPress={message} />
        {mine ? (
          <View style={{ flex: 1, minHeight: 56, borderRadius: 14, backgroundColor: color.surfaceSunken, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <T weight="semibold">Өргөдөл илгээсэн</T>
            <T size="sm" tone="muted">
              {STATUS[mine.status]}
            </T>
          </View>
        ) : (
          <Button label="Өргөдөл гаргах" onPress={() => setApplying(true)} style={{ flex: 1, minHeight: 56 }} />
        )}
      </Footer>
      {applying && (
        <ApplySheet
          jobId={job.id}
          title={`${job.title} · ${job.company.name}`}
          isShift={job.scheduleType === 'shift'}
          onClose={() => setApplying(false)}
          onDone={() => {
            setApplying(false);
            router.push('/seeker/applications');
          }}
        />
      )}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <T weight="semibold" size={17}>
        {title}
      </T>
      {children}
    </View>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Section title={title}>
      {items.map((x) => (
        <Row key={x} gap={10} style={{ alignItems: 'flex-start' }}>
          <T tone="secondary">•</T>
          <T tone="secondary" style={{ flex: 1, lineHeight: 24 }}>
            {x}
          </T>
        </Row>
      ))}
    </Section>
  );
}

function ApplySheet({ jobId, title, isShift, onClose, onDone }: { jobId: string; title: string; isShift: boolean; onClose: () => void; onDone: () => void }) {
  const { user } = useAuthed();
  const { data: profile } = useApi(() => api.getWorkerProfile(user.id), [user.id]);
  const apply = useMutation(api.apply);
  const [slots, setSlots] = useState<string[]>(['Өглөө', 'Орой']);
  const [note, setNote] = useState('');
  const [share, setShare] = useState(true);
  const toggle = (s: string) => setSlots((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = async () => {
    try {
      await apply.mutate(jobId, user.id, { coverNote: note, availability: slots.join(', ') || 'Тохиролцоно', shareVerifiedHistory: share });
      onDone();
    } catch (e) {
      Alert.alert('Илгээж чадсангүй', (e as Error).message);
    }
  };

  return (
    <Sheet visible onClose={onClose} title="Өргөдөл гаргах" subtitle={title}>
      <Row style={{ padding: 14, borderRadius: 14, backgroundColor: color.surfaceMuted }}>
        <Avatar label={user.name.charAt(0)} round tone="primary" />
        <View style={{ flex: 1, gap: 2 }}>
          <T weight="semibold">{user.shortName}</T>
          <T size="sm" tone="muted">
            {profile ? monthsSummary(profile.history) : '…'}
          </T>
        </View>
        <View style={{ alignItems: 'center' }}>
          <T weight="bold" size={20} tone="primary">
            {profile ? (profile.reliability.score ?? 'Шинэ') : '—'}
          </T>
          <T size={11} tone="muted">
            оноо
          </T>
        </View>
      </Row>
      {isShift && (
        <View style={{ gap: 8 }}>
          <T size="md" weight="semibold">
            Боломжтой ээлж
          </T>
          <Row gap={8}>
            {['Өглөө', 'Орой', 'Амралтын өдөр'].map((s) => (
              <View key={s} style={{ flex: 1 }}>
                <Chip label={s} on={slots.includes(s)} onPress={() => toggle(s)} />
              </View>
            ))}
          </Row>
        </View>
      )}
      <Field label="Танилцуулга (заавал биш)" value={note} onChangeText={setNote} multiline placeholder="Яагаад энэ ажилд тохирох вэ?" />
      <Checkbox checked={share} onChange={setShare} label="Найдвартай байдлын оноо, баталгаажсан түүхээ ажил олгогчид харуулах" />
      <Badge tone="neutral" label="Ажил олгогч таны баталгаажсан түүхийг харж хариу өгнө" />
      <Button label="Илгээх" onPress={submit} loading={apply.pending} />
    </Sheet>
  );
}
