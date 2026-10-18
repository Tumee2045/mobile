import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ScorePart } from '@/shared/api/types';
import { brand, color } from '@/theme/tokens';
import { Row, T } from './ui';

const ICONS: Record<ScorePart['key'], keyof typeof Ionicons.glyphMap> = {
  attendance: 'time-outline',
  performance: 'checkmark-done-outline',
  rating: 'star-outline',
  experience: 'briefcase-outline',
  reliability: 'shield-checkmark-outline',
};

/** Same cut-offs as the web: high ≥ 80% of the part's max, mid ≥ 50%. */
export const LEVEL_COLORS = { high: '#5EE0A0', mid: brand.orange, low: '#FF8A80' } as const;
export const scoreLevel = (ratio: number) => (ratio >= 0.8 ? 'high' : ratio >= 0.5 ? 'mid' : 'low');

export function scoreLabel(score: number | null) {
  if (score == null) return 'Шинэ · мэдээлэл дутуу';
  if (score >= 85) return 'Маш найдвартай';
  if (score >= 70) return 'Найдвартай';
  if (score >= 50) return 'Дундаж';
  return 'Сайжруулах шаардлагатай';
}

/** The five parts of the 100-point reliability score, on the dark score card. */
export function ScoreBreakdown({ parts }: { parts: ScorePart[] }) {
  return (
    <View>
      {parts.map((p, i) => {
        const ratio = p.points == null ? 0 : p.points / p.max;
        return (
          <Row
            key={p.key}
            gap={12}
            style={{
              alignItems: 'flex-start',
              paddingVertical: 11,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: color.inverseRaised,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={ICONS[p.key]} size={17} color={brand.blueLight} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <T weight="semibold" size={14} tone={p.points == null ? 'onInverseMuted' : 'onPrimary'} style={{ flex: 1 }}>
                  {p.label}
                </T>
                {p.points == null ? (
                  <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: color.onInverseMuted, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 }}>
                    <T size={11} weight="semibold" tone="onInverseMuted">
                      Мэдээлэлгүй
                    </T>
                  </View>
                ) : (
                  <T weight="bold" size={16} tone="onPrimary">
                    {p.points}
                    <T size={12} tone="onInverseMuted">
                      {' '}
                      / {p.max}
                    </T>
                  </T>
                )}
              </Row>
              <View style={{ height: 8, borderRadius: 999, backgroundColor: color.inverseTrack, overflow: 'hidden' }}>
                <View style={{ width: `${ratio * 100}%`, height: '100%', borderRadius: 999, backgroundColor: LEVEL_COLORS[scoreLevel(ratio)] }} />
              </View>
              <T size={12} tone="onInverseMuted">
                {p.detail}
              </T>
            </View>
          </Row>
        );
      })}
    </View>
  );
}
