import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, useApi, type Job, type JobListItem, type ScheduleType } from '@/api';
import { useAuthed } from '@/auth/session';
import { Avatar, Badge, Button, Chip, Empty, IconButton, Row, Sheet, T } from '@/components/ui';
import { payCompact } from '@/lib/fmt';
import { color, font, radius } from '@/theme/tokens';

const CATEGORIES: [Job['category'], string][] = [
  ['cafe', 'Кафе, ресторан'],
  ['retail', 'Дэлгүүр'],
  ['fastfood', 'Түргэн хоол'],
  ['office', 'Оффис'],
];
const DISTRICTS = ['Сүхбаатар', 'Чингэлтэй', 'Баянзүрх', 'Хан-Уул', 'Баянгол', 'Сонгинохайрхан'];

type Quick = 'all' | 'shift' | 'near' | 'fixed' | 'part';
const QUICK: [Quick, string][] = [
  ['all', 'Бүгд'],
  ['shift', 'Ээлжийн'],
  ['near', 'Ойрхон'],
  ['fixed', 'Тогтмол 9–18'],
  ['part', 'Цагийн'],
];

interface Filters {
  schedules: ScheduleType[];
  categories: Job['category'][];
  district: string;
  minHourly: number;
}
const EMPTY: Filters = { schedules: [], categories: [], district: '', minHourly: 5000 };

export default function Jobs() {
  const { user } = useAuthed();
  const [q, setQ] = useState('');
  const [quick, setQuick] = useState<Quick>('all');
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [sheet, setSheet] = useState(false);
  const { data: notes } = useApi(() => api.listNotifications(user.id), [user.id]);
  const unread = notes?.some((n) => !n.read);

  const homeDistrict = user.district.replace(' дүүрэг', '');
  const query = useMemo(() => {
    const schedules = quick === 'shift' ? ['shift' as const] : quick === 'fixed' ? ['fixed' as const] : filters.schedules;
    return {
      q,
      scheduleTypes: schedules,
      categories: filters.categories,
      district: quick === 'near' ? homeDistrict || undefined : filters.district || undefined,
      kind: quick === 'part' ? ('part_time' as const) : ('all' as const),
      minHourly: filters.minHourly > 5000 ? filters.minHourly : undefined,
    };
  }, [q, quick, filters, homeDistrict]);
  const { data: jobs, loading, reload } = useApi(() => api.searchJobs(query), [query]);
  const activeFilters = filters.schedules.length + filters.categories.length + (filters.district ? 1 : 0) + (filters.minHourly > 5000 ? 1 : 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={['top']}>
      <View style={{ backgroundColor: color.surface, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: color.border }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <T size="md" tone="muted">
              Сайн байна уу, {user.name.split(' ')[0]}
            </T>
            <T weight="bold" size={24}>
              Ажил хайх
            </T>
          </View>
          <IconButton icon="notifications-outline" label="Мэдэгдэл" bg={color.surfaceSunken} dot={unread} onPress={() => router.push('/notifications')} />
        </Row>
        <Row gap={10}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: radius.lg, backgroundColor: color.surfaceSunken }}>
            <Ionicons name="search" size={20} color={color.textMuted} />
            <TextInput
              accessibilityLabel="Хайх"
              placeholder="Касс, бариста…"
              placeholderTextColor={color.textMuted}
              value={q}
              onChangeText={setQ}
              returnKeyType="search"
              style={{ flex: 1, fontFamily: font.regular, fontSize: 16, color: color.text, paddingVertical: 10 }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Шүүлтүүр${activeFilters ? `, ${activeFilters} идэвхтэй` : ''}`}
            onPress={() => setSheet(true)}
            style={{ width: 48, height: 48, borderRadius: radius.lg, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="options-outline" size={22} color="#FFFFFF" />
            {activeFilters > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: color.text, alignItems: 'center', justifyContent: 'center' }}>
                <T size={11} weight="semibold" tone="onPrimary" style={{ lineHeight: 14 }}>
                  {activeFilters}
                </T>
              </View>
            )}
          </Pressable>
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }} style={{ marginRight: -20 }}>
          {QUICK.map(([k, label]) => (
            <Chip key={k} label={label} on={quick === k} dark onPress={() => setQuick(k)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={jobs ?? []}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshing={loading && !!jobs}
        onRefresh={() => void reload()}
        ListHeaderComponent={
          <T size="md" tone="muted" style={{ paddingHorizontal: 4 }}>
            <T size="md" weight="bold">
              {jobs?.length ?? '…'}
            </T>{' '}
            ажлын байр
          </T>
        }
        ListEmptyComponent={jobs ? <Empty icon="search" title="Ажил олдсонгүй" body="Шүүлтүүрээ өөрчилж үзнэ үү" /> : undefined}
        renderItem={({ item }) => <JobCard job={item} />}
      />

      <FilterSheet visible={sheet} value={filters} onClose={() => setSheet(false)} onApply={(f) => (setFilters(f), setQuick('all'), setSheet(false))} />
    </SafeAreaView>
  );
}

function JobCard({ job }: { job: JobListItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${job.title}, ${job.company.name}, ${payCompact(job.payType, job.payAmount)}`}
      onPress={() => router.push(`/job/${job.id}`)}
      style={({ pressed }) => ({ backgroundColor: color.surface, borderRadius: 16, borderWidth: 1, borderColor: color.border, padding: 16, gap: 12, opacity: pressed ? 0.85 : 1 })}
    >
      <Row>
        <Avatar label={job.company.initials} />
        <View style={{ flex: 1, gap: 2 }}>
          <T weight="semibold" size={16} numberOfLines={1}>
            {job.title}
          </T>
          <T size="md" tone="muted">
            {job.company.name}
          </T>
        </View>
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={6} style={{ flexShrink: 1, flexWrap: 'wrap' }}>
          <Badge tone={job.scheduleType === 'shift' ? 'primary' : 'neutral'} label={job.scheduleType === 'shift' ? 'Ээлжийн' : 'Тогтмол'} />
          <Badge label={job.branch.district} />
        </Row>
        <T weight="bold" size={15} tone="primary">
          {payCompact(job.payType, job.payAmount)}
        </T>
      </Row>
    </Pressable>
  );
}

function FilterSheet({ visible, value, onClose, onApply }: { visible: boolean; value: Filters; onClose: () => void; onApply: (f: Filters) => void }) {
  const [f, setF] = useState<Filters>(value);
  const toggle = <K extends 'schedules' | 'categories'>(k: K, v: Filters[K][number]) =>
    setF((cur) => {
      const list = cur[k] as string[];
      return { ...cur, [k]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] };
    });
  const preview = useApi(
    () =>
      visible
        ? api.searchJobs({ scheduleTypes: f.schedules, categories: f.categories, district: f.district || undefined, minHourly: f.minHourly > 5000 ? f.minHourly : undefined })
        : Promise.resolve(null),
    [visible, f],
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Шүүлтүүр">
      <Row style={{ justifyContent: 'flex-end', marginTop: -48 }}>
        <Pressable accessibilityRole="button" onPress={() => setF(EMPTY)} style={{ minHeight: 44, justifyContent: 'center' }}>
          <T weight="medium" tone="primary">
            Арилгах
          </T>
        </Pressable>
      </Row>
      <View style={{ gap: 10 }}>
        <T size="md" weight="semibold">
          Цагийн хуваарь
        </T>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Chip label="Ээлжийн" on={f.schedules.includes('shift')} onPress={() => toggle('schedules', 'shift')} />
          <Chip label="Тогтмол (9–18)" on={f.schedules.includes('fixed')} onPress={() => toggle('schedules', 'fixed')} />
        </Row>
      </View>
      <View style={{ gap: 10 }}>
        <T size="md" weight="semibold">
          Салбар
        </T>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {CATEGORIES.map(([k, label]) => (
            <Chip key={k} label={label} on={f.categories.includes(k)} onPress={() => toggle('categories', k)} />
          ))}
        </Row>
      </View>
      <View style={{ gap: 10 }}>
        <T size="md" weight="semibold">
          Дүүрэг
        </T>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Chip label="Бүх дүүрэг" on={!f.district} onPress={() => setF({ ...f, district: '' })} />
          {DISTRICTS.map((d) => (
            <Chip key={d} label={d} on={f.district === d} onPress={() => setF({ ...f, district: d })} />
          ))}
        </Row>
      </View>
      <View style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T size="md" weight="semibold">
            Доод цалин (цагийн)
          </T>
          <T size="md" weight="semibold" tone="primary">
            {f.minHourly.toLocaleString('en-US')}₮+
          </T>
        </Row>
        <Slider
          accessibilityLabel="Доод цалин"
          minimumValue={5000}
          maximumValue={20000}
          step={500}
          value={f.minHourly}
          onValueChange={(v) => setF((cur) => ({ ...cur, minHourly: v }))}
          minimumTrackTintColor={color.primary}
          maximumTrackTintColor={color.border}
          thumbTintColor={color.primary}
        />
        <Row style={{ justifyContent: 'space-between' }}>
          <T size={12} tone="muted">
            5,000₮
          </T>
          <T size={12} tone="muted">
            20,000₮
          </T>
        </Row>
      </View>
      <Button label={preview.data ? `${preview.data.length} ажлыг харах` : 'Харах'} onPress={() => onApply(f)} />
    </Sheet>
  );
}
