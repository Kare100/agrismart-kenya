import { styles } from '../styles/styles';

export const statusLabel = (status, t) => {
  if (status === 'treated') return t.treated;
  if (status === 'action') return t.actionNeeded;
  return t.pending;
};

export const statusStyle = (status) => ({
  badge:
    status === 'treated' ? styles.badgeTreated : status === 'action' ? styles.badgeAction : styles.badgePending,
  text:
    status === 'treated'
      ? styles.statusTextTreated
      : status === 'action'
      ? styles.statusTextAction
      : styles.statusTextPending,
});
