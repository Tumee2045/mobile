import { useEffect, useState } from 'react';
import { Alert, Pressable, Switch, View } from 'react-native';
import { Link, Redirect, router } from 'expo-router';
import { API_URL, api, getMode, httpAuth, setMode, useApi, type DataMode, type PersonaKey } from '@/api';
import { homeFor, useSession } from '@/auth/session';
import { Button, Field, Row, Screen, Segmented, T } from '@/components/ui';
import { isSimulatingLocation, setSimulatingLocation } from '@/lib/location';
import { Logo } from '@/components/Logo';
import { color, radius } from '@/theme/tokens';

type Role = Extract<PersonaKey, 'seeker' | 'employee'>;

export default function Login() {
  const { ready, user, isEmployee, signIn } = useSession();
  const [mode, setModeState] = useState<DataMode>(getMode);
  const { data: personas, error: personasError } = useApi(() => api.listPersonas(), [mode]);
  const [role, setRole] = useState<Role>('seeker');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [simulate, setSimulate] = useState(isSimulatingLocation);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isApi = mode === 'api';

  // Picking a role fills in that role's demo account.
  useEffect(() => {
    const p = personas?.find((x) => x.key === role);
    setIdentifier(isApi ? (p?.identifier ?? '') : (p?.key ?? role));
    setPassword(isApi ? (p?.password ?? '') : '1234');
  }, [isApi, personas, role]);

  if (ready && user && !submitting) return <Redirect href={homeFor(isEmployee)} />;

  const switchMode = (m: DataMode) => {
    setMode(m);
    setModeState(m);
    setError(null);
  };

  const submit = async () => {
    setError(null);
    const persona = personas?.find((p) => p.key === role);
    setSubmitting(true);
    try {
      if (!isApi) {
        if (!persona) return;
        await signIn(persona.userId, persona.companyId);
        router.replace(homeFor(role === 'employee'));
        return;
      }
      const u = await httpAuth.login(identifier, password);
      const ms = await api.getMemberships(u.id);
      const employee = ms.find((m) => m.role.permissions.includes('self.attendance'));
      const asEmployee = role === 'employee' && !!employee;
      if (role === 'employee' && !employee) Alert.alert('Ажилтны эрх алга', 'Энэ бүртгэл одоогоор ажилтан биш тул ажил хайгч горимоор нэвтэрлээ.');
      await signIn(u.id, asEmployee ? employee!.company.id : null);
      router.replace(homeFor(asEmployee));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen bg={color.surface} contentStyle={{ paddingHorizontal: 24, paddingTop: 40, gap: 28, flexGrow: 1 }}>
      <View style={{ gap: 18 }}>
        <Logo size={44} />
        <View style={{ gap: 6 }}>
          <T weight="bold" size={28}>
            Тавтай морил
          </T>
          <T size="lg" tone="muted">
            HirERP-д нэвтэрнэ үү
          </T>
        </View>
      </View>

      <View style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <T size="md" weight="medium">
            Би
          </T>
          <Segmented<Role>
            value={role}
            onChange={setRole}
            options={[
              { value: 'seeker', label: 'Ажил хайгч' },
              { value: 'employee', label: 'Ажилтан' },
            ]}
          />
        </View>
        <Field label="Утас эсвэл и-мэйл" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" editable={isApi} />
        <Field label="Нууц үг" value={password} onChangeText={setPassword} secureTextEntry editable={isApi} />
        <Pressable accessibilityRole="link" style={{ alignSelf: 'flex-end', paddingVertical: 6 }} onPress={() => Alert.alert('Нууц үг сэргээх', 'Энэ боломж удахгүй нэмэгдэнэ.')}>
          <T size="md" tone="primary">
            Нууц үг мартсан?
          </T>
        </Pressable>
        {error && (
          <T tone="danger" size="md" accessibilityLiveRegion="polite">
            {error}
          </T>
        )}
        <Button label="Нэвтрэх" onPress={submit} loading={submitting} disabled={!personas} />
      </View>

      <Row style={{ justifyContent: 'center' }} gap={4}>
        <T tone="muted">Бүртгэлгүй юу?</T>
        <Link href="/register" accessibilityRole="link">
          <T weight="semibold" tone="primary">
            Бүртгүүлэх
          </T>
        </Link>
      </Row>

      {/* Developer mode (design): data source + demo location. */}
      <View style={{ marginTop: 'auto', padding: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: color.borderStrong, borderRadius: radius.lg, gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <T size={13} weight="semibold">
              Хөгжүүлэгчийн горим
            </T>
            <T size={12} tone="muted">
              Өгөгдлийн эх үүсвэр
            </T>
          </View>
          <View style={{ width: 160 }}>
            <Segmented<DataMode>
              value={mode}
              onChange={switchMode}
              height={34}
              options={[
                { value: 'mock', label: 'Mock' },
                { value: 'api', label: 'Backend' },
              ]}
            />
          </View>
        </Row>
        {isApi && (
          <T size={12} tone={personasError ? 'danger' : 'muted'}>
            {personasError ? `Сервертэй холбогдсонгүй · ${API_URL}` : `Сервер: ${API_URL}`}
          </T>
        )}
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <T size={13} weight="semibold">
              Демо байршил
            </T>
            <T size={12} tone="muted">
              Ирц бүртгэхэд салбараас 45 м зайд гэж үзнэ
            </T>
          </View>
          <Switch
            accessibilityLabel="Демо байршил"
            value={simulate}
            onValueChange={(v) => {
              setSimulate(v);
              setSimulatingLocation(v);
            }}
            trackColor={{ true: color.primary, false: color.borderStrong }}
          />
        </Row>
      </View>
    </Screen>
  );
}
