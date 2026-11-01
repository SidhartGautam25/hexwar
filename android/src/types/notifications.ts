export type NotificationKind =
  | 'gold'
  | 'silver'
  | 'money'
  | 'shield_zone'
  | 'trail_erase'
  | 'forced_lock'
  | 'reaper_trap';

export interface MoveNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
}
