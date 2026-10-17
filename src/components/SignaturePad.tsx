import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { T } from './ui';
import { color, palette } from '@/theme/tokens';

/**
 * Finger signature. Emits an SVG path string (sent with the contract signature).
 * `onDrawing` lets the parent lock its ScrollView while the finger is down.
 */
export function SignaturePad({ onChange, onDrawing }: { onChange: (path: string) => void; onDrawing?: (active: boolean) => void }) {
  const [paths, setPaths] = useState<string[]>([]);
  const current = useRef('');
  const [, force] = useState(0);
  const size = useRef({ w: 0, h: 0 });

  const emit = (list: string[]) => onChange(list.join(' '));

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          onDrawing?.(true);
          const { locationX: x, locationY: y } = e.nativeEvent;
          current.current = `M${x.toFixed(1)},${y.toFixed(1)}`;
          force((n) => n + 1);
        },
        onPanResponderMove: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          if (x < 0 || y < 0 || x > size.current.w || y > size.current.h) return;
          current.current += ` L${x.toFixed(1)},${y.toFixed(1)}`;
          force((n) => n + 1);
        },
        onPanResponderRelease: () => {
          onDrawing?.(false);
          if (current.current.includes('L')) {
            setPaths((p) => {
              const next = [...p, current.current];
              emit(next);
              return next;
            });
          }
          current.current = '';
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const clear = () => {
    setPaths([]);
    emit([]);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
  };

  const empty = paths.length === 0 && !current.current;

  return (
    <View style={{ gap: 6 }}>
      <View
        onLayout={onLayout}
        accessibilityLabel="Гарын үсэг зурах талбар"
        style={{ height: 120, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.borderStrong, borderRadius: 12, backgroundColor: palette.gray25, overflow: 'hidden' }}
        {...responder.panHandlers}
      >
        <Svg width="100%" height="100%">
          {[...paths, current.current].filter(Boolean).map((d, i) => (
            <Path key={i} d={d} stroke={color.text} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
        {empty && (
          <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
            <T size="md" tone="muted">
              Энд хуруугаараа зурна уу
            </T>
          </View>
        )}
      </View>
      {!empty && (
        <Pressable accessibilityRole="button" onPress={clear} style={{ alignSelf: 'flex-end', paddingVertical: 4 }}>
          <T size="sm" tone="primary">
            Арилгах
          </T>
        </Pressable>
      )}
    </View>
  );
}
