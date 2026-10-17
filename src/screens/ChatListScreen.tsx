import { useState } from 'react';
import { Alert, Pressable, SectionList, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, useApi } from '@/api';
import { useAuthed } from '@/auth/session';
import { Avatar, Empty, IconButton, Row, Sheet, T } from '@/components/ui';
import { chatStamp } from '@/lib/fmt';
import { color, font, radius } from '@/theme/tokens';

/** Design 16 · Чат (shared by both tab groups). */
export function ChatListScreen() {
  const { user } = useAuthed();
  const [q, setQ] = useState('');
  const [picking, setPicking] = useState(false);
  const { data, loading, reload } = useApi(() => api.listThreads(user.id), [user.id]);
  type Thread = NonNullable<typeof data>[number];
  const filtered: Thread[] = (data ?? []).filter((t) => t.title.toLowerCase().includes(q.toLowerCase()));
  const sections = [
    { title: 'ГРУПП', data: filtered.filter((t) => t.kind === 'group') },
    { title: 'ХУВИЙН', data: filtered.filter((t) => t.kind === 'direct') },
  ].filter((s) => s.data.length);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.surface }} edges={['top']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T weight="bold" size={24}>
            Чат
          </T>
          <IconButton icon="create-outline" label="Шинэ чат" bg={color.surfaceSunken} onPress={() => setPicking(true)} />
        </Row>
        <Row gap={10} style={{ minHeight: 46, paddingHorizontal: 14, borderRadius: radius.lg, backgroundColor: color.surfaceSunken }}>
          <Ionicons name="search" size={18} color={color.textMuted} />
          <TextInput
            accessibilityLabel="Хайх"
            placeholder="Хайх"
            placeholderTextColor={color.textMuted}
            value={q}
            onChangeText={setQ}
            style={{ flex: 1, fontFamily: font.regular, fontSize: 16, color: color.text, paddingVertical: 10 }}
          />
        </Row>
      </View>
      <SectionList<Thread>
        sections={sections}
        keyExtractor={(t) => t.id}
        refreshing={loading && !!data}
        onRefresh={() => void reload()}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={data ? <Empty icon="chatbubbles-outline" title="Чат алга" body="Ажил олгогчтой холбогдохдоо ажлын зар дээрээс мессеж бичнэ" /> : undefined}
        renderSectionHeader={({ section }) => (
          <T size={12} weight="semibold" tone="muted" style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6, letterSpacing: 0.5 }}>
            {section.title}
          </T>
        )}
        renderItem={({ item: t }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/chat/${t.id}`)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: pressed ? color.surfaceMuted : color.surface })}
          >
            <Avatar label={t.initials} size={48} round={t.kind === 'direct'} tone={t.kind === 'direct' ? 'primary' : 'neutral'} />
            <View style={{ flex: 1, gap: 2, borderBottomWidth: 1, borderBottomColor: color.divider, paddingBottom: 10 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T weight="semibold" size={16} numberOfLines={1} style={{ flex: 1 }}>
                  {t.title}
                  {t.kind === 'direct' && t.subtitle ? (
                    <T size={14} tone="muted">
                      {' '}
                      · {t.subtitle}
                    </T>
                  ) : null}
                </T>
                <T size={12} tone="muted">
                  {t.lastMessage ? chatStamp(t.lastMessage.createdAt) : ''}
                </T>
              </Row>
              <T size="md" tone="muted" numberOfLines={1}>
                {t.lastMessage ? `${t.kind === 'group' ? `${t.lastMessage.senderName}: ` : ''}${t.lastMessage.text}` : 'Мессеж алга'}
              </T>
            </View>
          </Pressable>
        )}
      />
      {picking && <NewChatSheet onClose={() => setPicking(false)} />}
    </SafeAreaView>
  );
}

function NewChatSheet({ onClose }: { onClose: () => void }) {
  const { user } = useAuthed();
  const { data } = useApi(() => api.listContacts(user.id), [user.id]);
  const open = async (otherId: string, companyId: string) => {
    try {
      const t = await api.openDirectThread(user.id, otherId, companyId);
      onClose();
      router.push(`/chat/${t}`);
    } catch (e) {
      Alert.alert('Алдаа', (e as Error).message);
    }
  };
  return (
    <Sheet visible onClose={onClose} title="Шинэ чат" subtitle="Хамт ажилладаг хүмүүс, өргөдөл гаргасан байгууллагын HR">
      {data?.length === 0 && <Empty icon="people-outline" title="Холбогдох хүн алга" body="Ажилд өргөдөл гаргасны дараа HR-тай чатлах боломжтой" />}
      {data?.map((c) => (
        <Pressable key={c.user.id} accessibilityRole="button" onPress={() => void open(c.user.id, c.companyId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}>
          <Avatar label={c.user.name.charAt(0)} size={44} round tone="primary" />
          <View style={{ flex: 1, gap: 2 }}>
            <T weight="semibold">{c.user.name}</T>
            <T size="sm" tone="muted">
              {c.subtitle}
            </T>
          </View>
        </Pressable>
      ))}
    </Sheet>
  );
}
