import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MoveNotification } from '../../types/notifications';

interface CollectionPopupProps {
  notification: MoveNotification | null;
  themeColors: {
    cardBackground: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
  };
  onDismiss: () => void;
  autoDismissMs?: number;
}

const KIND_EMOJI: Record<MoveNotification['kind'], string> = {
  gold: '🪙',
  silver: '🥈',
  money: '💵',
  shield_zone: '⛨',
  trail_erase: '⌫',
  forced_lock: '🔒',
  reaper_trap: '☠️',
};

export const CollectionPopup: React.FC<CollectionPopupProps> = ({
  notification,
  themeColors,
  onDismiss,
  autoDismissMs = 2200,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!notification) {
      opacity.setValue(0);
      scale.setValue(0.9);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        onDismiss()
      );
    }, autoDismissMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification?.id]);

  if (!notification) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.accent,
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={styles.emoji}>{KIND_EMOJI[notification.kind]}</Text>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>{notification.title}</Text>
        <Text style={[styles.body, { color: themeColors.textSecondary }]}>{notification.body}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5000,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    width: '82%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    elevation: 12,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  body: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
