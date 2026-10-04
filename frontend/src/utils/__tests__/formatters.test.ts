import { describe, it, expect } from 'vitest';
import {
  formatLapTime,
  formatSectorTime,
  formatSpeed,
  formatG,
  formatPercent,
} from '../formatters';

describe('Telemetry Formatters Specification', () => {
  describe('formatLapTime', () => {
    it('formats normal lap time in M:SS.sss standard', () => {
      expect(formatLapTime(81.046)).toBe('1:21.046');
      expect(formatLapTime(65.123)).toBe('1:05.123');
    });

    it('handles multi-minute times', () => {
      expect(formatLapTime(124.500)).toBe('2:04.500');
    });

    it('returns placeholder on null, undefined, or invalid inputs', () => {
      expect(formatLapTime(null)).toBe('--:--.---');
      expect(formatLapTime(undefined)).toBe('--:--.---');
      expect(formatLapTime(0)).toBe('--:--.---');
      expect(formatLapTime(-5.2)).toBe('--:--.---');
      expect(formatLapTime(NaN)).toBe('--:--.---');
    });
  });

  describe('formatSectorTime', () => {
    it('formats sector time to 3 decimal places', () => {
      expect(formatSectorTime(26.845)).toBe('26.845');
    });

    it('returns placeholder for invalid inputs', () => {
      expect(formatSectorTime(null)).toBe('--.---');
      expect(formatSectorTime(0)).toBe('--.---');
    });
  });

  describe('formatSpeed', () => {
    it('formats velocity in km/h with 1 decimal precision', () => {
      expect(formatSpeed(348.24)).toBe('348.2 km/h');
    });

    it('returns placeholder for invalid values', () => {
      expect(formatSpeed(null)).toBe('---.-');
      expect(formatSpeed(NaN)).toBe('---.-');
    });
  });

  describe('formatG', () => {
    it('formats positive and negative G forces', () => {
      expect(formatG(4.5)).toBe('+4.50 g');
      expect(formatG(-3.72)).toBe('-3.72 g');
    });

    it('returns placeholder for invalid values', () => {
      expect(formatG(null)).toBe('-.--');
    });
  });

  describe('formatPercent', () => {
    it('formats percentages with 1 decimal precision', () => {
      expect(formatPercent(98.54)).toBe('98.5%');
      expect(formatPercent(null)).toBe('-.-%');
    });
  });
});
