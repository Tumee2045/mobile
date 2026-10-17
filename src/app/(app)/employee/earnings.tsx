import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, useApi, useMutation, type EarningsSummary } from '@/api';
import { useAuthed } from '@/auth/session';
import { Button, Card, Chip, InverseCard, Loading, Row, Sheet, Stat, T } from '@/components/ui';
import { money, moneyCompact, shortDate } from '@/lib/fmt';
import { color, font, radius } from '@/theme/tokens';

/** Design 14 · Цалин (+ 14b withdraw sheet). */
export default function Earnings() {
  const { user, active } = useAuthed();
  const companyId = active!.company.id;
  const e = useApi(() => api.getEarnings(user.id, companyId), [user.id, companyId]);
  const { data: payouts } = useApi(() => api.listPayouts(user.id), [user.id]);
  const [sheet, setSheet] = useState(false);
  const d = e.data;
  if (!d) return <Loading />;

  const cap = d.availableNow + d.withdrawn;
  const withdrawnPct = cap ? (d.withdrawn / cap) * 50 : 0;
  const availablePct = cap ? (d.availableNow / cap) * 50 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 28 }} refreshControl={<RefreshControl refreshing={e.loading} onRefresh={() => void e.reload()} />}>
        <View style={{ gap: 2 }}>
          <T weight="bold" size={24}>
            Цалин
          </T>
          <T size="md" tone="muted">
            {d.periodLabel} · Олгох өдөр {shortDate(d.payday)}
          </T>
        </View>

        <InverseCard>
          <View style={{ gap: 4 }}>
            <T size="md" tone="onInverseMuted">
              Одоо авах боломжтой
            </T>
            <T weight="bold" size={40} tone="onPrimary" style={{ lineHeight: 46 }}>
              {money(d.availableNow)}
            </T>
            <T size={13} tone="onInverseMuted">
              Татвар суутгасан цэвэр дүн · олсны {d.withdrawCapPercent}% хүртэл
            </T>
          </View>
          <View
            accessibilityLabel={`Авсан ${money(d.withdrawn)}, үлдсэн ${money(d.availableNow)}`}
            style={{ height: 8, borderRadius: 999, backgroundColor: color.inverseTrack, overflow: 'hidden', flexDirection: 'row' }}
          >
            <View style={{ width: `${withdrawnPct}%`, backgroundColor: '#94A3C4' }} />
            <View style={{ width: `${availablePct}%`, backgroundColor: color.accent }} />
          </View>
          <Button variant="white" label="Цалингаа авах" onPress={() => setSheet(true)} disabled={d.availableNow <= 0} />
        </InverseCard>

        <Row gap={10}>
          <Stat label="Олсон" value={moneyCompact(d.netEarned)} />
          <Stat label="Авсан" value={moneyCompact(d.withdrawn)} />
          <Stat label="Ажилласан" value={active?.membership.payType === 'hourly' ? `${d.hoursWorked} цаг` : `${d.daysWorked} өдөр`} />
        </Row>

        <Card style={{ paddingVertical: 6, gap: 0 }}>
          <T weight="semibold" size={15} style={{ paddingTop: 10, paddingBottom: 6 }}>
            Гүйлгээ
          </T>
          {payouts?.length === 0 && (
            <T size="md" tone="muted" style={{ paddingVertical: 12 }}>
              Гүйлгээ алга
            </T>
          )}
          {payouts?.map((p, i) => {
            const advance = p.kind === 'advance';
            return (
              <Row key={p.id} style={{ paddingVertical: 12, borderBottomWidth: i < payouts.length - 1 ? 1 : 0, borderBottomColor: color.divider }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: advance ? color.primarySoft : color.successSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={advance ? 'flash-outline' : 'wallet-outline'} size={20} color={advance ? color.primary : color.success} />
                </View>
                <View style={{ flex: 1, gap: 1 }}>
                  <T weight="medium">{p.label}</T>
                  <T size={13} tone="muted">
                    {shortDate(p.date)}
                  </T>
                </View>
                <T weight="bold">{money(p.amount)}</T>
              </Row>
            );
          })}
        </Card>
      </ScrollView>
      {sheet && <WithdrawSheet summary={d} companyId={companyId} onClose={() => setSheet(false)} />}
    </SafeAreaView>
  );
}

function WithdrawSheet({ summary, companyId, onClose }: { summary: EarningsSummary; companyId: string; onClose: () => void }) {
  const { user } = useAuthed();
  const withdraw = useMutation(api.withdraw);
  const [amount, setAmount] = useState(Math.min(100000, summary.availableNow));
  const tooMuch = amount > summary.availableNow;
  const quick: [string, number][] = [
    ['50к', 50000],
    ['100к', 100000],
    ['200к', 200000],
    ['Бүгд', summary.availableNow],
  ];

  const submit = async () => {
    try {
      const r = await withdraw.mutate(user.id, companyId, amount);
      onClose();
      router.push({
        pathname: '/withdraw-done',
        params: { amount: String(r.payout.amount), account: r.account, at: r.at, tx: r.transactionId, left: String(summary.availableNow - r.payout.amount) },
      });
    } catch (e) {
      Alert.alert('Амжилтгүй', (e as Error).message);
    }
  };

  return (
    <Sheet visible onClose={onClose} title="Цалингаа авах" subtitle={`Авах боломжтой: ${money(summary.availableNow)}`}>
      <View style={{ gap: 6 }}>
        <T size="md" weight="medium">
          Дүн
        </T>
        <TextInput
          accessibilityLabel="Дүн"
          keyboardType="number-pad"
          value={amount ? `${amount.toLocaleString('en-US')}₮` : ''}
          onChangeText={(v) => setAmount(Number(v.replace(/\D/g, '')) || 0)}
          style={{ minHeight: 64, borderWidth: 2, borderColor: tooMuch ? color.danger : color.primary, borderRadius: radius.lg, paddingHorizontal: 16, fontFamily: font.bold, fontSize: 28, color: color.text }}
        />
        {tooMuch && (
          <T size="sm" tone="danger">
            Хамгийн ихдээ {money(summary.availableNow)}
          </T>
        )}
      </View>
      <Row gap={8}>
        {quick.map(([l, v]) => (
          <View key={l} style={{ flex: 1 }}>
            <Chip label={l} on={amount === v} onPress={() => setAmount(Math.min(v, summary.availableNow))} />
          </View>
        ))}
      </Row>
      <View style={{ gap: 6 }}>
        <T size="md" weight="medium">
          Хүлээн авах данс
        </T>
        <Row style={{ minHeight: 52, borderWidth: 1, borderColor: color.borderStrong, borderRadius: radius.lg, paddingHorizontal: 14, justifyContent: 'space-between' }}>
          <T>{summary.payoutAccount}</T>
          <Ionicons name="chevron-down" size={18} color={color.textMuted} />
        </Row>
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <T tone="muted">Шимтгэл</T>
        <T>{summary.serviceFee == null ? '[Шимтгэл]' : money(summary.serviceFee)}</T>
      </Row>
      <Button label={`${money(amount)} авах`} onPress={submit} loading={withdraw.pending} disabled={!amount || tooMuch} />
    </Sheet>
  );
}
