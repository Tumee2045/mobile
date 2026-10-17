import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, useApi, useMutation } from '@/api';
import { useAuthed } from '@/auth/session';
import { Button, Card, Checkbox, Footer, Header, KeyValue, Loading, Row, T } from '@/components/ui';
import { SignaturePad } from '@/components/SignaturePad';
import { pay } from '@/lib/fmt';
import { color } from '@/theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';

const dot = (iso?: string) => (iso ? iso.replaceAll('-', '.') : '—');

export default function ContractScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthed();
  const { data } = useApi(() => api.getContract(id), [id]);
  const sign = useMutation(api.signContract);
  const decline = useMutation(api.declineContract);
  const [signature, setSignature] = useState('');
  const [agree, setAgree] = useState(false);
  const [drawing, setDrawing] = useState(false);

  if (!data) return <Loading />;
  const { contract: c, company, branch, hired } = data;
  const pending = c.status === 'sent';

  const banner = {
    sent: { text: `${company.name} гарын үсгийг тань хүлээж байна`, bg: color.warningSoft, fg: '#6B3D00', icon: 'time-outline' as const },
    signed: { text: hired ? 'Та ажилд орсон. Амжилт хүсье!' : 'Гарын үсэг зурсан · ажилд авах шийдвэр хүлээгдэж байна', bg: color.successSoft, fg: color.success, icon: 'checkmark-circle-outline' as const },
    declined: { text: 'Та энэ гэрээнээс татгалзсан', bg: color.surfaceSunken, fg: color.textSecondary, icon: 'close-circle-outline' as const },
    draft: { text: 'Гэрээ бэлтгэгдэж байна', bg: color.surfaceSunken, fg: color.textSecondary, icon: 'document-outline' as const },
  }[c.status];

  const doSign = async () => {
    try {
      await sign.mutate(c.id, user.id, signature);
      Alert.alert('Гарын үсэг зурлаа', 'HR таныг ажилд авмагц ажилтны хэсэг нээгдэнэ.');
      router.back();
    } catch (e) {
      Alert.alert('Алдаа', (e as Error).message);
    }
  };

  const doDecline = () =>
    Alert.alert('Гэрээнээс татгалзах уу?', 'Энэ өргөдөл хаагдана.', [
      { text: 'Болих', style: 'cancel' },
      {
        text: 'Татгалзах',
        style: 'destructive',
        onPress: async () => {
          try {
            await decline.mutate(c.id, user.id);
            router.back();
          } catch (e) {
            Alert.alert('Алдаа', (e as Error).message);
          }
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={['top']}>
      <Header title="Хөдөлмөрийн гэрээ" />
      <ScrollView scrollEnabled={!drawing} contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Row gap={10} style={{ padding: 14, borderRadius: 12, backgroundColor: banner.bg }}>
          <Ionicons name={banner.icon} size={20} color={banner.fg} />
          <T size="md" style={{ color: banner.fg, flex: 1 }}>
            {banner.text}
          </T>
        </Row>
        <KeyValue
          highlightLast
          rows={[
            ['Байгууллага', company.name],
            ['Албан тушаал', c.title],
            ['Салбар', branch.name],
            ['Хугацаа', `${dot(c.startDate)} – ${dot(c.endDate)}`],
            ['Хуваарь', c.scheduleType === 'shift' ? 'Ээлжийн' : 'Тогтмол'],
            [c.payType === 'hourly' ? 'Цагийн хөлс' : 'Сарын цалин', pay(c.payType, c.payAmount)],
          ]}
        />
        <Card style={{ borderStyle: 'dashed', borderColor: color.borderStrong, gap: 6 }}>
          <T weight="semibold">Гэрээний бүрэн текст</T>
          <T size="md" tone="muted">
            [Загвар, нөхцөлүүдийг дараа тодорхойлно]
          </T>
        </Card>
        {pending && (
          <Card style={{ gap: 10 }}>
            <T size="md" weight="semibold">
              Гарын үсэг
            </T>
            <SignaturePad onChange={setSignature} onDrawing={setDrawing} />
            <Checkbox checked={agree} onChange={setAgree} label="Гэрээний нөхцөлийг уншиж, зөвшөөрсөн" />
          </Card>
        )}
      </ScrollView>
      {pending && (
        <Footer>
          <Button label="Татгалзах" variant="danger" onPress={doDecline} loading={decline.pending} style={{ paddingHorizontal: 18 }} />
          <Button label="Гарын үсэг зурах" onPress={doSign} disabled={!agree || !signature} loading={sign.pending} style={{ flex: 1 }} />
        </Footer>
      )}
      {hired && (
        <Footer>
          <View style={{ flex: 1 }}>
            <Button label="Ажилтны хэсэг рүү" onPress={() => router.replace('/employee/home')} />
          </View>
        </Footer>
      )}
    </SafeAreaView>
  );
}
