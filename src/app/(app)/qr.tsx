import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, useApi, useMutation } from '@/api';
import { useAuthed } from '@/auth/session';
import { Avatar, Button, IconButton, Loading, Row, T } from '@/components/ui';
import { distanceLabel } from '@/lib/fmt';
import { useBranchDistance } from '@/lib/location';

const FRAME = 280;

/** Full-screen QR scanner (design 11). Scans the branch QR, checks the geofence, clocks in/out. */
export default function QrScan() {
  const insets = useSafeAreaInsets();
  const { user, active } = useAuthed();
  const companyId = active!.company.id;
  const { data: today } = useApi(() => api.getMyToday(user.id, companyId), [user.id, companyId]);
  const { state: loc } = useBranchDistance(today?.branch);
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const clock = useMutation(api.clock);
  const busy = useRef(false);

  if (!today) return <Loading bg="#0B0F1A" />;
  const branch = today.branch;
  const clockingOut = !!today.record?.clockIn && !today.record.clockOut;

  const submit = async (qrPayload: string) => {
    if (busy.current || loc.status !== 'ok') return;
    busy.current = true;
    try {
      const r = await clock.mutate(user.id, companyId, {
        qrPayload,
        simulatedDistanceM: loc.distanceM,
        ...(loc.coords ? { lat: loc.coords.lat, lng: loc.coords.lng } : {}),
      });
      router.replace({
        pathname: '/qr-result',
        params: r.ok
          ? { ok: '1', kind: r.kind, time: (r.kind === 'in' ? r.record.clockIn : r.record.clockOut) ?? '', status: r.record.status, late: String(r.record.lateMinutes), hours: String(r.record.hours) }
          : { ok: '0', reason: r.reason, distance: String(r.distanceM), radius: String(r.radiusM) },
      });
    } catch (e) {
      router.replace({ pathname: '/qr-result', params: { ok: '0', reason: 'error', message: (e as Error).message } });
    }
  };

  const camera = permission?.granted && Platform.OS !== 'web';
  const locOk = loc.status === 'ok';
  const within = locOk && loc.distanceM <= (branch?.geofenceRadiusM ?? 100);

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      {camera ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => void submit(data)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1A2133', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 230 }]}>
          <T size={13} style={{ color: '#8590A6' }}>
            {permission && !permission.granted && Platform.OS !== 'web' ? 'Камерын зөвшөөрөл хэрэгтэй' : 'Камер ашиглах боломжгүй'}
          </T>
        </View>
      )}

      <Row style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, justifyContent: 'space-between' }}>
        <IconButton icon="close" label="Хаах" tint="#FFFFFF" bg="rgba(0,0,0,0.5)" onPress={() => router.back()} />
        <Row gap={8} style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: !locOk ? '#C7CEDC' : within ? '#5EE0A8' : '#FF8A80' }} />
          <T size={13} weight="medium" tone="onPrimary">
            {locOk ? `Байршил шалгагдлаа · ${distanceLabel(loc.distanceM)}${loc.simulated ? ' (демо)' : ''}` : loc.status === 'loading' ? 'Байршил шалгаж байна…' : 'Байршил олдсонгүй'}
          </T>
        </Row>
        <IconButton icon={torch ? 'flashlight' : 'flashlight-outline'} label="Гэрэл асаах" tint="#FFFFFF" bg="rgba(0,0,0,0.5)" onPress={() => setTorch((x) => !x)} />
      </Row>

      <View pointerEvents="none" style={{ position: 'absolute', top: '25%', alignSelf: 'center', width: FRAME, height: FRAME }}>
        <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 20 }]} />
        <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 20 }]} />
        <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 20 }]} />
        <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 20 }]} />
        <View style={{ position: 'absolute', top: FRAME / 2, left: 20, right: 20, height: 3, borderRadius: 999, backgroundColor: '#8FB0FF' }} />
      </View>

      <View style={{ position: 'absolute', left: 24, right: 24, top: '25%', marginTop: FRAME + 28, alignItems: 'center', gap: 6 }}>
        <T weight="bold" size={20} tone="onPrimary" style={{ textAlign: 'center' }}>
          {clock.pending ? 'Бүртгэж байна…' : 'QR кодыг хүрээнд багтаана уу'}
        </T>
        <T size={15} style={{ color: '#C7CEDC', textAlign: 'center' }}>
          Салбарын хаалган дээрх кодыг уншуулна
        </T>
        {!camera && permission && !permission.granted && Platform.OS !== 'web' && (
          <Button label="Камер зөвшөөрөх" size="md" variant="white" onPress={requestPermission} style={{ marginTop: 8, paddingHorizontal: 24 }} />
        )}
      </View>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 24, gap: 10 }}>
        {/* Demo fallback when there's no camera (web preview, emulator) or no printed QR. */}
        {branch && (
          <Pressable accessibilityRole="button" onPress={() => void submit(`HRP:${branch.id}`)} disabled={!locOk || clock.pending} style={{ alignSelf: 'center', padding: 8 }}>
            <T size={13} style={{ color: '#8FB0FF', textDecorationLine: 'underline' }}>
              Демо: QR-гүйгээр уншуулсан гэж үзэх
            </T>
          </Pressable>
        )}
        <Row style={{ padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <Avatar label={active!.company.initials} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <T weight="semibold" tone="onPrimary">
              {active?.company.name} · {branch?.name}
            </T>
            <T size={13} style={{ color: '#C7CEDC' }}>
              {today.shift ? `Ээлж ${today.shift.start} – ${today.shift.end}` : 'Ээлжгүй өдөр'} · {clockingOut ? 'Явах' : 'Ирэх'}
            </T>
          </View>
        </Row>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', width: 56, height: 56, borderColor: '#FFFFFF' },
});
