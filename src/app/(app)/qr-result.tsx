import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, useApi } from '@/api';
import { useAuthed } from '@/auth/session';
import { Button, KeyValue, Row, T } from '@/components/ui';
import { distanceLabel, todayISO } from '@/lib/fmt';
import { color } from '@/theme/tokens';

type Params = { ok: string; kind?: string; time?: string; status?: string; late?: string; hours?: string; reason?: string; distance?: string; radius?: string; message?: string };

/** Clock-in outcome (design 11b success / 11c location error). */
export default function QrResult() {
  const p = useLocalSearchParams<Params>();
  const { user, active } = useAuthed();
  const companyId = active!.company.id;
  const { data: today } = useApi(() => api.getMyToday(user.id, companyId), [user.id, companyId]);

  if (p.ok === '1') {
    const isIn = p.kind === 'in';
    const late = Number(p.late ?? 0);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.surface, padding: 24, gap: 24 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <Circle bg={color.successSoft} fg={color.success} icon="checkmark" />
          <View style={{ alignItems: 'center', gap: 6 }}>
            <T weight="bold" size={26}>
              {isIn ? 'Ирц бүртгэгдлээ' : 'Ажил дууслаа'}
            </T>
            <T size="lg" tone="muted" style={{ textAlign: 'center' }}>
              {isIn ? (late > 5 ? 'Дараагийн удаа цагтаа ирээрэй!' : 'Амжилттай ээлж өнгөрүүлээрэй!') : `Өнөөдөр ${p.hours} цаг ажиллалаа. Баярлалаа!`}
            </T>
          </View>
          <View style={{ alignSelf: 'stretch' }}>
            <KeyValue
              rows={[
                [isIn ? 'Ирсэн цаг' : 'Явсан цаг', p.time ?? '—'],
                ...(isIn ? ([['Төлөв', p.status === 'late' ? `${late} мин хоцорсон` : 'Цагтаа']] as [string, string][]) : []),
                ['Салбар', today?.branch?.name ?? '—'],
                ...(isIn && today?.shift ? ([['Ээлж дуусах', today.shift.end]] as [string, string][]) : []),
              ]}
            />
          </View>
          {isIn && (
            <T size="md" tone="muted" style={{ textAlign: 'center' }}>
              Явахдаа дахин QR уншуулж гарсан цагаа бүртгүүлнэ үү
            </T>
          )}
        </View>
        <Button label="Болсон" onPress={() => router.replace('/employee/home')} />
      </SafeAreaView>
    );
  }

  const geofence = p.reason === 'outside_geofence';
  const title = geofence ? 'Ажлын байрнаас хол байна' : p.reason === 'invalid_qr' ? 'QR код буруу байна' : 'Ирц бүртгэгдсэнгүй';
  const body = geofence
    ? `Та салбараас ${distanceLabel(Number(p.distance))} зайд байна. Ирц бүртгэхийн тулд ${p.radius} м радиус дотор байх шаардлагатай.`
    : p.reason === 'invalid_qr'
      ? 'Энэ код таны ажилладаг салбарын код биш байна. Салбарын хаалган дээрх кодыг уншуулна уу.'
      : (p.message ?? 'Дахин оролдоно уу.');

  const notifyManager = async () => {
    const ctx = await api.getLeaveContext(user.id, companyId, todayISO());
    if (!ctx.approver) return router.replace('/employee/chat');
    const t = await api.openDirectThread(user.id, ctx.approver.id, companyId);
    router.replace(`/chat/${t}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.surface, padding: 24, gap: 24 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Circle bg={color.dangerSoft} fg={color.danger} icon={geofence ? 'location-outline' : 'close'} />
        <View style={{ alignItems: 'center', gap: 8 }}>
          <T weight="bold" size={24} style={{ textAlign: 'center' }}>
            {title}
          </T>
          <T size="lg" tone="muted" style={{ textAlign: 'center', lineHeight: 24 }}>
            {body}
          </T>
        </View>
        {geofence && <DistanceDiagram distance={Number(p.distance)} radius={Number(p.radius)} />}
      </View>
      <View style={{ gap: 10 }}>
        <Button label="Дахин оролдох" onPress={() => router.replace('/qr')} />
        <Button label="Менежерт мэдэгдэх" variant="secondary" onPress={() => void notifyManager()} />
      </View>
    </SafeAreaView>
  );
}

function Circle({ bg, fg, icon }: { bg: string; fg: string; icon: 'checkmark' | 'close' | 'location-outline' }) {
  return (
    <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: fg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={38} color="#FFFFFF" />
      </View>
    </View>
  );
}

/** Branch radius vs. your position (design 11c). */
function DistanceDiagram({ distance, radius }: { distance: number; radius: number }) {
  return (
    <View style={{ alignSelf: 'stretch', height: 150, borderRadius: 16, backgroundColor: color.surfaceMuted, overflow: 'hidden', justifyContent: 'center' }} accessibilityLabel={`Салбараас ${distance} метр`}>
      <View style={{ position: 'absolute', left: 30, width: 110, height: 110, borderRadius: 55, backgroundColor: color.primarySoft, borderWidth: 2, borderColor: color.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color.primary }} />
        <T size={12} weight="semibold" tone="primary" style={{ marginTop: 4 }}>
          Салбар · {radius} м
        </T>
      </View>
      <View style={{ position: 'absolute', left: 150, right: 70, top: 74, borderTopWidth: 2, borderStyle: 'dashed', borderColor: color.borderStrong }} />
      <Row style={{ position: 'absolute', right: 22, top: 58 }} gap={0}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: color.danger, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </View>
          <T size={12} weight="semibold" tone="danger">
            Та · {distanceLabel(distance)}
          </T>
        </View>
      </Row>
    </View>
  );
}
