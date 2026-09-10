import { getChineseApiError } from './api/errorMessages';
import { splitTimeRange } from './hooks/useTrendQuery';

test('splits long trend ranges into backend-compatible windows', () => {
  const windows = splitTimeRange('2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z');
  expect(windows.length).toBe(5);
  windows.forEach((window) => {
    expect(new Date(window.endTime) - new Date(window.startTime)).toBeLessThanOrEqual(90 * 24 * 60 * 60 * 1000);
  });
});

test('maps backend role errors to Chinese', () => {
  expect(getChineseApiError({ message: 'role is still assigned to 2 user(s)' })).toBe('该角色仍被 2 个用户使用，请先调整用户角色');
});
