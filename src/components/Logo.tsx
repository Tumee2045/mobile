import { Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { brand, fontBrand } from '@/theme/tokens';

type Variant = 'light' | 'dark' | 'onBlue';

const COLORS: Record<Variant, { stem: string; arch: string; leg: string; dot: string; hir: string; erp: string }> = {
  light: { stem: brand.navy, arch: brand.blue, leg: brand.blue, dot: brand.orange, hir: brand.navy, erp: brand.blue },
  dark: { stem: '#FFFFFF', arch: brand.blueMid, leg: brand.blueLight, dot: brand.orange, hir: '#FFFFFF', erp: brand.blueLight },
  onBlue: { stem: '#FFFFFF', arch: brand.blueSoft, leg: '#FFFFFF', dot: brand.orange, hir: '#FFFFFF', erp: '#FFFFFF' },
};

/** The HirERP "hi" mark — same geometry as front-end/src/components/layout/parts.tsx. */
export function LogoMark({ size = 32, variant = 'light' }: { size?: number; variant?: Variant }) {
  const c = COLORS[variant];
  return (
    <Svg width={size} height={size} viewBox="0 0 236 240">
      <Path d="M40 177 A77 77 0 0 1 194 177" fill="none" stroke={c.arch} strokeWidth={42} />
      <Rect x={0} y={17} width={61} height={222} rx={30.5} fill={c.stem} />
      <Rect x={172} y={95} width={61} height={144} rx={30.5} fill={c.leg} />
      <Circle cx={203} cy={33} r={33.5} fill={c.dot} />
    </Svg>
  );
}

/** Mark + "HirERP" wordmark. */
export function Logo({ size = 32, variant = 'light' }: { size?: number; variant?: Variant }) {
  const c = COLORS[variant];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="HirERP" style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }}>
      <LogoMark size={size} variant={variant} />
      <Text style={{ fontFamily: fontBrand, fontSize: size * 0.75, color: c.hir, letterSpacing: -0.5 }}>
        Hir<Text style={{ color: c.erp }}>ERP</Text>
      </Text>
    </View>
  );
}
