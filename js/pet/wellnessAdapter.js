import { getSeverity } from '../features/checkinScoring.js';
import { todayStr } from '../utils/dateUtils.js';

export function getCurrentWellnessState() {
  let checkins = [];
  try {
    const v = localStorage.getItem('checkins');
    if (v !== null) checkins = JSON.parse(v);
  } catch (e) {}

  if (checkins && checkins.length > 0) {
    const latest = checkins[checkins.length - 1];
    const hasTodayCheckin = latest.date === todayStr();
    return {
      scores: hasTodayCheckin ? (latest.scores || {}) : {},
      hasTodayCheckin
    };
  }

  return {
    scores: {},
    hasTodayCheckin: false
  };
}

export function deriveHighConditions(wellnessState) {
  const scores = wellnessState.scores;
  if (!scores) return [];

  const highConditions = [];
  const dims = ['stress', 'anxiety', 'burnout', 'overthinking', 'loneliness'];

  dims.forEach(dim => {
    const score = scores[dim + '_score'];
    if (score !== undefined && getSeverity(score, dim) === 'High') {
      highConditions.push(dim);
    }
  });

  return highConditions;
}
