import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { calculateImpactScores } from './scoring';

describe('calculateImpactScores', () => {
  it('clamps negative replacement pressure after adoption friction', () => {
    const scores = calculateImpactScores({
      strategicRelevance: 0,
      capabilityOverlap: 0,
      dependencyImpact: 0,
      competitorAdvantage: 0,
      substitutability: 0,
      adoptionFriction: 1,
      userPainSignal: 0,
      solutionAdjacency: 0,
      marketMomentum: 0,
      evidenceQuality: 0,
    });

    expect(scores.replacementRiskScore).toBe(0);
    expect(scores.threatScore).toBe(0);
  });

  it('returns reproducible integer scores for bounded components', () => {
    const scores = calculateImpactScores({
      strategicRelevance: 1,
      capabilityOverlap: 1,
      dependencyImpact: 1,
      competitorAdvantage: 1,
      substitutability: 1,
      adoptionFriction: 0,
      userPainSignal: 1,
      solutionAdjacency: 1,
      marketMomentum: 1,
      evidenceQuality: 1,
    });

    expect(scores).toEqual({
      relevanceScore: 100,
      opportunityScore: 100,
      threatScore: 100,
      replacementRiskScore: 100,
      urgencyScore: 100,
    });
  });

  it('keeps every score within the published percentage range', () => {
    const component = fc.double({ min: 0, max: 1, noNaN: true });
    const components = fc.record({
      strategicRelevance: component,
      capabilityOverlap: component,
      dependencyImpact: component,
      competitorAdvantage: component,
      substitutability: component,
      adoptionFriction: component,
      userPainSignal: component,
      solutionAdjacency: component,
      marketMomentum: component,
      evidenceQuality: component,
    });

    fc.assert(
      fc.property(components, (input) => {
        for (const value of Object.values(calculateImpactScores(input))) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        }
      }),
    );
  });
});
