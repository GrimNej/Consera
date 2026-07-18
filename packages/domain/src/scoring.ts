export type ImpactComponents = Readonly<{
  strategicRelevance: number;
  capabilityOverlap: number;
  dependencyImpact: number;
  competitorAdvantage: number;
  substitutability: number;
  adoptionFriction: number;
  userPainSignal: number;
  solutionAdjacency: number;
  marketMomentum: number;
  evidenceQuality: number;
}>;

export type ImpactScores = Readonly<{
  relevanceScore: number;
  opportunityScore: number;
  threatScore: number;
  replacementRiskScore: number;
  urgencyScore: number;
}>;

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('Impact components must be finite numbers.');
  }
  return Math.min(1, Math.max(0, value));
}

function percentage(value: number): number {
  return Math.round(clampUnit(value) * 100);
}

export function calculateImpactScores(components: ImpactComponents): ImpactScores {
  const relevance =
    0.35 * components.strategicRelevance +
    0.25 * components.dependencyImpact +
    0.2 * components.capabilityOverlap +
    0.2 * components.evidenceQuality;
  const replacementPressure =
    0.35 * components.capabilityOverlap +
    0.3 * components.substitutability +
    0.2 * components.competitorAdvantage +
    0.15 * components.marketMomentum -
    0.3 * components.adoptionFriction;
  const opportunity =
    0.3 * components.userPainSignal +
    0.25 * components.solutionAdjacency +
    0.2 * components.strategicRelevance +
    0.15 * components.marketMomentum +
    0.1 * components.evidenceQuality;
  const threat =
    0.3 * components.capabilityOverlap +
    0.25 * components.competitorAdvantage +
    0.2 * components.dependencyImpact +
    0.15 * components.substitutability +
    0.1 * components.marketMomentum -
    0.2 * components.adoptionFriction;
  const urgency =
    0.35 * Math.max(clampUnit(opportunity), clampUnit(threat)) +
    0.25 * components.marketMomentum +
    0.2 * components.dependencyImpact +
    0.1 * components.competitorAdvantage +
    0.1 * components.evidenceQuality;

  return {
    relevanceScore: percentage(relevance),
    opportunityScore: percentage(opportunity),
    threatScore: percentage(threat),
    replacementRiskScore: percentage(replacementPressure),
    urgencyScore: percentage(urgency),
  };
}
