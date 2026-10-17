import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { api, useMutation } from '@/api';
import { useAuthed } from '@/auth/session';
import { Button, Field, Footer, Header, Row, Screen, T } from '@/components/ui';
import { color } from '@/theme/tokens';

export default function ProfileEdit() {
  const { user } = useAuthed();
  const save = useMutation(api.updateProfile);
  const [headline, setHeadline] = useState(user.headline);
  const [district, setDistrict] = useState(user.district);
  const [availability, setAvailability] = useState(user.availabilityNote ?? '');
  const [skills, setSkills] = useState(user.skills.join(', '));
  const [looking, setLooking] = useState(user.lookingForWork);

  const submit = async () => {
    try {
      await save.mutate(user.id, {
        headline,
        district,
        availabilityNote: availability,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        lookingForWork: looking,
      });
      router.back();
    } catch (e) {
      Alert.alert('Хадгалж чадсангүй', (e as Error).message);
    }
  };

  return (
    <Screen
      header={<Header title="Ур чадвар, танилцуулга" />}
      footer={
        <Footer>
          <View style={{ flex: 1 }}>
            <Button label="Хадгалах" onPress={submit} loading={save.pending} />
          </View>
        </Footer>
      }
    >
      <Field label="Товч танилцуулга" value={headline} onChangeText={setHeadline} placeholder="Оюутан · Бариста" />
      <Field label="Дүүрэг" value={district} onChangeText={setDistrict} placeholder="Сүхбаатар дүүрэг" />
      <Field label="Боломжтой цаг" value={availability} onChangeText={setAvailability} placeholder="Орой, амралтын өдөр" />
      <Field label="Ур чадвар" value={skills} onChangeText={setSkills} hint="Таслалаар тусгаарлана" multiline />
      <Row style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
        <T weight="medium">Ажил хайж байна</T>
        <Switch accessibilityLabel="Ажил хайж байна" value={looking} onValueChange={setLooking} trackColor={{ true: color.primary, false: color.borderStrong }} />
      </Row>
    </Screen>
  );
}
