import { useState } from 'react';
import { View } from 'react-native';
import { Link, router } from 'expo-router';
import { api } from '@/api';
import { useSession } from '@/auth/session';
import { Button, Checkbox, Field, IconButton, Row, Screen, T } from '@/components/ui';
import { color } from '@/theme/tokens';

export default function Register() {
  const { signIn } = useSession();
  const [form, setForm] = useState({ lastName: '', firstName: '', phone: '', email: '', password: '' });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const u = await api.register({ ...form, email: form.email || undefined });
      await signIn(u.id, null);
      router.replace('/seeker/jobs');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen bg={color.surface} contentStyle={{ paddingHorizontal: 24, gap: 22 }}>
      <View style={{ marginLeft: -10 }}>
        <IconButton icon="chevron-back" label="Буцах" plain onPress={() => router.back()} />
      </View>
      <View style={{ gap: 6 }}>
        <T weight="bold" size={28}>
          Бүртгүүлэх
        </T>
        <T size="lg" tone="muted">
          Нэг бүртгэлээр ажил хайж, ажилдаа ороод ч ашиглана
        </T>
      </View>
      <View style={{ gap: 14 }}>
        <Row gap={12}>
          <View style={{ flex: 1 }}>
            <Field label="Овог" value={form.lastName} onChangeText={set('lastName')} autoComplete="family-name" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Нэр" value={form.firstName} onChangeText={set('firstName')} autoComplete="given-name" />
          </View>
        </Row>
        <Field label="Утасны дугаар" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="9911 2233" autoComplete="tel" />
        <Field label="И-мэйл (заавал биш)" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" placeholder="name@mail.mn" />
        <Field label="Нууц үг" value={form.password} onChangeText={set('password')} secureTextEntry hint="Дор хаяж 6 тэмдэгт" />
        <Checkbox checked={agree} onChange={setAgree} label="Үйлчилгээний нөхцөл болон нууцлалын бодлогыг зөвшөөрч байна" />
      </View>
      {error && (
        <T tone="danger" size="md">
          {error}
        </T>
      )}
      <View style={{ gap: 14, marginTop: 8 }}>
        <Button label="Бүртгүүлэх" onPress={submit} loading={submitting} disabled={!agree} />
        <Row style={{ justifyContent: 'center' }} gap={4}>
          <T tone="muted">Бүртгэлтэй юу?</T>
          <Link href="/login">
            <T weight="semibold" tone="primary">
              Нэвтрэх
            </T>
          </Link>
        </Row>
      </View>
    </Screen>
  );
}
