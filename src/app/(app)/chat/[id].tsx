import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, useApi, useMutation } from '@/api';
import { useAuthed } from '@/auth/session';
import { Avatar, IconButton, Loading, Row, T } from '@/components/ui';
import { chatStamp, timeHM, todayISO } from '@/lib/fmt';
import { toISODate } from '@/shared/lib/format';
import { color, font, radius } from '@/theme/tokens';

/** Design 16b · conversation (1-on-1 or group). Polls every 5 s for new messages. */
export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthed();
  const insets = useSafeAreaInsets();
  const { data, reload } = useApi(() => api.getThread(id, user.id), [id, user.id]);
  const send = useMutation(api.sendMessage);
  const [text, setText] = useState('');
  const list = useRef<FlatList>(null);

  useEffect(() => {
    const t = setInterval(reload, 5000);
    return () => clearInterval(t);
  }, [reload]);

  if (!data) return <Loading bg={color.surface} />;

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    try {
      await send.mutate(id, user.id, t);
    } catch (e) {
      setText(t);
      Alert.alert('Илгээж чадсангүй', (e as Error).message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.surface }} edges={['top']}>
      <Row gap={10} style={{ paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: color.border }}>
        <IconButton icon="chevron-back" label="Буцах" plain onPress={() => router.back()} />
        <Avatar label={data.initials} size={40} round={data.kind === 'direct'} tone={data.kind === 'direct' ? 'primary' : 'neutral'} />
        <View style={{ flex: 1 }}>
          <T weight="semibold" size={16} numberOfLines={1}>
            {data.title}
          </T>
          <T size={13} tone="muted" numberOfLines={1}>
            {data.subtitle}
          </T>
        </View>
        {data.kind === 'group' && <IconButton icon="people-outline" label="Гишүүд" plain onPress={() => Alert.alert(data.title, data.subtitle)} />}
      </Row>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top}>
        <FlatList
          ref={list}
          data={data.messages}
          keyExtractor={(m) => m.id}
          style={{ backgroundColor: color.bg }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          renderItem={({ item: m, index }) => {
            const day = toISODate(new Date(m.createdAt));
            const prev = index > 0 ? toISODate(new Date(data.messages[index - 1].createdAt)) : null;
            const mine = m.senderId === user.id;
            return (
              <View style={{ gap: 12 }}>
                {day !== prev && (
                  <View style={{ alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border }}>
                    <T size={12} tone="muted">
                      {day === todayISO() ? 'Өнөөдөр' : chatStamp(m.createdAt)}
                    </T>
                  </View>
                )}
                {mine ? (
                  <View style={{ alignSelf: 'flex-end', maxWidth: '80%', alignItems: 'flex-end', gap: 4 }}>
                    <View style={{ backgroundColor: color.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderTopRightRadius: 4 }}>
                      <T style={{ color: '#FFFFFF', lineHeight: 21 }}>{m.text}</T>
                    </View>
                    <T size={11} tone="muted">
                      {timeHM(m.createdAt)}
                    </T>
                  </View>
                ) : (
                  <Row gap={8} style={{ alignItems: 'flex-start', maxWidth: '85%' }}>
                    {data.kind === 'group' && <Avatar label={m.senderName.charAt(0)} size={32} round />}
                    <View style={{ gap: 4, flexShrink: 1 }}>
                      {data.kind === 'group' && (
                        <T size={12} tone="muted">
                          <T size={12} weight="semibold">
                            {m.senderName}
                          </T>
                          {m.senderRole ? ` · ${m.senderRole}` : ''} · {timeHM(m.createdAt)}
                        </T>
                      )}
                      <View style={{ backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderTopLeftRadius: 4 }}>
                        <T style={{ lineHeight: 21 }}>{m.text}</T>
                      </View>
                      {data.kind === 'direct' && (
                        <T size={11} tone="muted">
                          {timeHM(m.createdAt)}
                        </T>
                      )}
                    </View>
                  </Row>
                )}
              </View>
            );
          }}
        />
        <Row gap={8} style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10), borderTopWidth: 1, borderTopColor: color.border, backgroundColor: color.surface }}>
          <IconButton icon="attach" label="Хавсаргах" plain onPress={() => Alert.alert('Хавсралт', 'Файл хадгалах сервис холбогдсоны дараа идэвхжинэ.')} />
          <TextInput
            accessibilityLabel="Мессеж"
            placeholder="Мессеж…"
            placeholderTextColor={color.textMuted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            returnKeyType="send"
            style={{ flex: 1, minHeight: 44, borderRadius: radius.full, backgroundColor: color.surfaceSunken, paddingHorizontal: 16, fontFamily: font.regular, fontSize: 16, color: color.text }}
          />
          <IconButton icon="send" label="Илгээх" tint="#FFFFFF" bg={text.trim() ? color.primary : color.borderStrong} onPress={() => void submit()} />
        </Row>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
