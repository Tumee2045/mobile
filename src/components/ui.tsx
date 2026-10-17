/**
 * Mobile UI kit — built from the team's mobile design (Claude Design canvas
 * "HR Platform Mobile") on the shared blue tokens.
 */
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { color, font, radius, space, text, touch } from '@/theme/tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// ---------- Text ----------

type Tone = 'text' | 'muted' | 'secondary' | 'primary' | 'onPrimary' | 'danger' | 'warning' | 'success' | 'onInverseMuted';
const TONES: Record<Tone, string> = {
  text: color.text,
  muted: color.textMuted,
  secondary: color.textSecondary,
  primary: color.primary,
  onPrimary: color.onPrimary,
  danger: color.danger,
  warning: color.warning,
  success: color.success,
  onInverseMuted: color.onInverseMuted,
};

export function T({
  weight = 'regular',
  size = 'base',
  tone = 'text',
  style,
  ...rest
}: TextProps & { weight?: keyof typeof font; size?: keyof typeof text | number; tone?: Tone }) {
  const fontSize = typeof size === 'number' ? size : text[size];
  return <Text {...rest} style={[{ fontFamily: font[weight], fontSize, color: TONES[tone], lineHeight: Math.round(fontSize * 1.35) }, style]} />;
}

// ---------- Layout ----------

/** Full-height screen with safe-area top padding. */
export function Screen({
  children,
  scroll = true,
  bg = color.bg,
  padded = true,
  footer,
  header,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  bg?: string;
  padded?: boolean;
  footer?: ReactNode;
  header?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const body = [padded && styles.padded, contentStyle];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        {scroll ? (
          <ScrollView contentContainerStyle={body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, body]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** White header bar with an optional back button (design: 18–24px title). */
export function Header({ title, back = true, right, large }: { title: string; back?: boolean; right?: ReactNode; large?: boolean }) {
  return (
    <View style={styles.header}>
      {back && <IconButton icon="chevron-back" label="Буцах" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} plain />}
      <T weight={large ? 'bold' : 'semibold'} size={large ? 24 : 18} style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </T>
      {right}
    </View>
  );
}

/** Sticky bottom action bar (design: 104px with buttons). */
export function Footer({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) + 4 }]}>{children}</View>;
}

export function Card({ children, style, highlight }: { children: ReactNode; style?: StyleProp<ViewStyle>; highlight?: boolean }) {
  return <View style={[styles.card, highlight && { borderWidth: 2, borderColor: color.primary }, style]}>{children}</View>;
}

export function InverseCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.inverse, style]}>{children}</View>;
}

export function Row({ children, style, gap = space[3] }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

// ---------- Buttons ----------

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  size = 'lg',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'white';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg' | 'xl';
}) {
  const v = {
    primary: { bg: color.primary, fg: color.onPrimary, border: color.primary },
    secondary: { bg: color.surface, fg: color.text, border: color.borderStrong },
    ghost: { bg: 'transparent', fg: color.primary, border: 'transparent' },
    danger: { bg: color.surface, fg: '#A11F14', border: color.borderStrong },
    white: { bg: '#FFFFFF', fg: color.inverse, border: '#FFFFFF' },
  }[variant];
  const off = disabled || loading;
  const height = { md: 46, lg: 54, xl: 60 }[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        { minHeight: height, backgroundColor: off ? color.surfaceSunken : v.bg, borderColor: off ? color.border : v.border, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'xl' ? 24 : 20} color={off ? color.textMuted : v.fg} />}
          <T weight={size === 'xl' ? 'bold' : 'semibold'} size={size === 'md' ? 15 : size === 'xl' ? 18 : 17} style={{ color: off ? color.textMuted : v.fg }}>
            {label}
          </T>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  plain,
  dot,
  size = 44,
  tint = color.text,
  bg,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  plain?: boolean;
  dot?: boolean;
  size?: number;
  tint?: string;
  bg?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: 12, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 },
        !plain && { backgroundColor: bg ?? color.surface, borderWidth: bg ? 0 : 1, borderColor: color.border },
      ]}
    >
      <Ionicons name={icon} size={22} color={tint} />
      {dot && <View style={styles.dot} />}
    </Pressable>
  );
}

// ---------- Data display ----------

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const BADGES: Record<BadgeTone, { bg: string; fg: string }> = {
  primary: { bg: color.primarySoft, fg: color.primaryText },
  success: { bg: color.successSoft, fg: color.success },
  warning: { bg: color.warningSoft, fg: color.warning },
  danger: { bg: color.dangerSoft, fg: color.danger },
  neutral: { bg: color.surfaceSunken, fg: color.textSecondary },
  info: { bg: color.infoSoft, fg: color.info },
};

export function Badge({ label, tone = 'neutral', strong }: { label: string; tone?: BadgeTone; strong?: boolean }) {
  const b = BADGES[tone];
  return (
    <View style={{ backgroundColor: b.bg, borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <T size={12} weight={strong ? 'semibold' : 'medium'} style={{ color: b.fg, lineHeight: 16 }}>
        {label}
      </T>
    </View>
  );
}

export function Avatar({ label, size = 44, round, tone = 'neutral' }: { label: string; size?: number; round?: boolean; tone?: 'neutral' | 'primary' | 'warning' }) {
  const t = { neutral: { bg: color.surfaceSunken, fg: color.text }, primary: { bg: color.primarySoft, fg: color.primary }, warning: { bg: color.warningSoft, fg: color.warning } }[tone];
  return (
    <View
      accessible={false}
      style={{ width: size, height: size, borderRadius: round ? size / 2 : size * 0.27, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <T weight="bold" size={Math.round(size * 0.34)} style={{ color: t.fg }}>
        {label}
      </T>
    </View>
  );
}

/** Small grey stat tile (label above value). */
export function Tile({ label, value, valueColor, style }: { label: string; value: string; valueColor?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.tile, style]}>
      <T size={12} tone="muted">
        {label}
      </T>
      <T weight="bold" size={16} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </T>
    </View>
  );
}

/** Bordered white stat (design: home / earnings). */
export function Stat({ label, value, valueColor, onPress }: { label: string; value: string; valueColor?: string; onPress?: () => void }) {
  const body = (
    <>
      <T size={12} tone="muted">
        {label}
      </T>
      <T weight="bold" size={17} style={valueColor ? { color: valueColor } : undefined} numberOfLines={1}>
        {value}
      </T>
    </>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.stat, { flex: 1 }]}>
      {body}
    </Pressable>
  ) : (
    <View style={[styles.stat, { flex: 1 }]}>{body}</View>
  );
}

/** Label / value rows inside a card (design: contract, receipts). */
export function KeyValue({ rows, highlightLast }: { rows: [string, string][]; highlightLast?: boolean }) {
  return (
    <View style={[styles.card, { paddingVertical: 4, gap: 0 }]}>
      {rows.map(([k, v], i) => (
        <Row key={k} style={[{ justifyContent: 'space-between', paddingVertical: 12 }, i < rows.length - 1 && styles.divider]}>
          <T tone="muted">{k}</T>
          <T weight={highlightLast && i === rows.length - 1 ? 'bold' : 'semibold'} tone={highlightLast && i === rows.length - 1 ? 'primary' : 'text'} style={{ flexShrink: 1, textAlign: 'right' }}>
            {v}
          </T>
        </Row>
      ))}
    </View>
  );
}

/** 4-segment progress (design: application steps). */
export function StepBar({ step, total = 4, labels }: { step: number; total?: number; labels?: string[] }) {
  return (
    <View style={{ gap: 6 }} accessibilityRole="progressbar" accessibilityLabel={`Алхам ${step}/${total}`}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 5, borderRadius: radius.full, backgroundColor: i < step ? color.primary : color.border }} />
        ))}
      </View>
      {labels && (
        <Row style={{ justifyContent: 'space-between' }}>
          {labels.map((l, i) => (
            <T key={l} size={11} weight={i === step - 1 ? 'semibold' : 'regular'} tone={i === step - 1 ? 'primary' : 'muted'}>
              {l}
            </T>
          ))}
        </Row>
      )}
    </View>
  );
}

export function Empty({ icon = 'file-tray-outline', title, body }: { icon?: IconName; title: string; body?: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: space[10] }}>
      <Ionicons name={icon} size={36} color={color.textMuted} />
      <T weight="semibold">{title}</T>
      {body && (
        <T size="md" tone="muted" style={{ textAlign: 'center' }}>
          {body}
        </T>
      )}
    </View>
  );
}

export function Loading({ bg = color.bg }: { bg?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
      <ActivityIndicator color={color.primary} />
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <T weight="semibold" size={15}>
        {title}
      </T>
      {action && (
        <Pressable accessibilityRole="link" onPress={onAction} hitSlop={10}>
          <T size="md" tone="primary">
            {action}
          </T>
        </Pressable>
      )}
    </Row>
  );
}

// ---------- Inputs ----------

/** Two-option segmented control (design: role picker, mode switch, tabs). */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  bg = color.surfaceSunken,
  height = 44,
}: {
  options: { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
  bg?: string;
  height?: number;
}) {
  return (
    <View style={[styles.segment, { backgroundColor: bg }]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, { minHeight: height }, on && styles.segmentOn]}
          >
            <Text style={{ fontFamily: on ? font.semibold : font.regular, fontSize: 14, color: on ? color.text : color.textSecondary }} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pill toggle (design: filters, quick chips). */
export function Chip({ label, on, onPress, dark }: { label: string; on: boolean; onPress: () => void; dark?: boolean }) {
  const activeBg = dark ? color.text : color.primary;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={[styles.chip, on ? { backgroundColor: activeBg, borderColor: activeBg } : null]}
    >
      <T size={14} weight={on ? 'medium' : 'regular'} style={{ color: on ? '#FFFFFF' : color.text }}>
        {label}
      </T>
    </Pressable>
  );
}

export function Field({ label, hint, error, ...input }: TextInputProps & { label: string; hint?: string; error?: string | null }) {
  return (
    <View style={{ gap: 6 }}>
      <T size="md" weight="medium">
        {label}
      </T>
      <TextInput
        placeholderTextColor={color.textMuted}
        accessibilityLabel={label}
        {...input}
        style={[styles.input, input.multiline && { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' }, error ? { borderColor: color.danger } : null, input.style]}
      />
      {hint && !error && (
        <T size="sm" tone="muted">
          {hint}
        </T>
      )}
      {error && (
        <T size="sm" tone="danger">
          {error}
        </T>
      )}
    </View>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => onChange(!checked)} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? color.primary : color.borderStrong,
          backgroundColor: checked ? color.primary : color.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        {checked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </View>
      <T size="md" tone="secondary" style={{ flex: 1 }}>
        {label}
      </T>
    </Pressable>
  );
}

// ---------- Bottom sheet ----------

export function Sheet({ visible, onClose, title, subtitle, children }: { visible: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityRole="button" accessibilityLabel="Хаах" style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <View style={styles.grabber} />
          <View style={{ gap: 4 }}>
            <T weight="bold" size={20}>
              {title}
            </T>
            {subtitle && <T tone="muted">{subtitle}</T>}
          </View>
          <ScrollView contentContainerStyle={{ gap: 18 }} keyboardShouldPersistTaps="handled" style={{ maxHeight: 560 }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  padded: { padding: space[4], gap: 14, paddingBottom: space[8] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: color.surface,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius['2xl'],
    padding: space[4],
    gap: 12,
  },
  inverse: { backgroundColor: color.inverse, borderRadius: 22, padding: 20, gap: 16 },
  button: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[5],
  },
  dot: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: color.danger },
  tile: { flex: 1, backgroundColor: color.surfaceMuted, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  stat: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: radius.xl, padding: 12, gap: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: color.divider },
  segment: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.lg },
  segmentItem: { flex: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  segmentOn: {
    backgroundColor: color.surface,
    shadowColor: '#14171F',
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: color.borderStrong,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    fontFamily: font.regular,
    fontSize: 16,
    color: color.text,
    backgroundColor: color.surface,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,20,35,0.55)' },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 18,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: radius.full, backgroundColor: color.borderStrong },
});

export const touchTarget = touch;
