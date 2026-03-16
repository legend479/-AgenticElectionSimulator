
import { NudgeType, EditableNudgeParams, ModelType, FullSimulationConfig } from './types';

export const SCENARIO_TEMPLATES: Record<string, FullSimulationConfig> = {
  TVM: {
    profileName: "Thiruvananthapuram (The Kerala Model)",
    globalContext: {
      ground_truth_turnout: 0.7345, // Actual 2019
      electoral_competitiveness: 0.85, // Shashi Tharoor vs Kummanam was competitive
      voting_cost_total: 0.2, // High polling station density, easy access
      campaign_duration: 60,
      population_size: 10000,
    },
    agentGeneration: {
      education_skew: 3.5, // Very High Literacy (Kerala > 95%)
      age_min: 25,
      age_range: 30,
      urban_prob: 0.65, // High Rurban density
      civic_duty_skew: 2.8, // Strong political consciousness
      past_vote_prob: 0.80, // High historic engagement
      social_pressure_skew: 1.5, // Moderate community pressure
      risk_aversion_skew: 1.0, // Balanced
      partisan_strength_skew: 2.5, // Strong ideological affiliations (Left vs Congress vs BJP)
    },
    modelPhysics: {
      utility: { beta_pB: 1.2, beta_C: -2.5, beta_D: 1.5, beta_S: 0.5, beta_H: 0.8, decision_noise: 0.8 },
      ddm: { base_mu: 0.1, threshold_a: 1.2, noise: 1.0, beta_D: 0.3, beta_H: 0.2, beta_S: 0.1, beta_C: -0.3, beta_pB: 0.3, beta_OC: 0.1 },
      dual_system: { h_habit: 1.5, h_social: 0.5, h_affect: 0.8, h_momentum: 0.2, u_duty: 1.8, u_pB: 1.2, u_cost: -2.0, lambda_base: 0.4, lambda_edu_factor: -0.5, lambda_risk_factor: -0.2 },
    }
  },
  SHR: {
    profileName: "Shravasti (Migrant/Rural Low Turnout)",
    globalContext: {
      ground_truth_turnout: 0.5208, // Actual 2019 (One of the lowest in UP)
      electoral_competitiveness: 0.50,
      voting_cost_total: 0.7, // High cost (Distance + Migration factor)
      campaign_duration: 60,
      population_size: 10000,
    },
    agentGeneration: {
      education_skew: 0.3, // Very Low Literacy skew
      age_min: 20,
      age_range: 25,
      urban_prob: 0.05, // Deep rural
      civic_duty_skew: 1.0, // Average
      past_vote_prob: 0.50, // Low habit due to migration
      social_pressure_skew: 1.2, // Rural norms exist but fragmented by migration
      risk_aversion_skew: 2.5, // High economic risk aversion
      partisan_strength_skew: 1.5, // Caste-based alignments
    },
    modelPhysics: {
      utility: { beta_pB: 0.5, beta_C: -4.0, beta_D: 0.8, beta_S: 0.6, beta_H: 0.4, decision_noise: 1.2 },
      ddm: { base_mu: -0.15, threshold_a: 0.9, noise: 1.5, beta_D: 0.1, beta_H: 0.1, beta_S: 0.15, beta_C: -0.8, beta_pB: 0.1, beta_OC: 0.0 },
      dual_system: { h_habit: 0.8, h_social: 0.8, h_affect: 0.4, h_momentum: -0.1, u_duty: 0.5, u_pB: 0.5, u_cost: -5.0, lambda_base: 0.8, lambda_edu_factor: -0.1, lambda_risk_factor: -0.1 },
    }
  },
  BLR: {
    profileName: "Bangalore South (Urban Apathy)",
    globalContext: {
      ground_truth_turnout: 0.5370, // Actual 2019
      electoral_competitiveness: 0.20, // Stronghold seat (BJP safe seat), low pB
      voting_cost_total: 0.15, // Low physical cost, but...
      campaign_duration: 60,
      population_size: 10000
    },
    agentGeneration: {
      education_skew: 4.5, // Extremely High Education (IT Hub)
      age_min: 25,
      age_range: 30,
      urban_prob: 0.98,
      civic_duty_skew: 0.6, // KEY: Low "Duty" skew explains urban apathy despite education
      past_vote_prob: 0.50, // Spotty history
      social_pressure_skew: 0.4, // Low: Urban atomization (neighbors don't know neighbors)
      risk_aversion_skew: 1.0, 
      partisan_strength_skew: 1.8
    },
    modelPhysics: {
      utility: { beta_pB: 0.2, beta_C: -2.0, beta_D: 0.5, beta_S: 0.1, beta_H: 0.6, decision_noise: 1.5 }, // High noise (weekend plans vs voting)
      ddm: { base_mu: -0.1, threshold_a: 1.5, noise: 1.2, beta_D: 0.1, beta_H: 0.2, beta_S: 0.05, beta_C: -0.4, beta_pB: 0.05, beta_OC: 0.1 },
      dual_system: { h_habit: 0.6, h_social: 0.1, h_affect: 0.4, h_momentum: -0.2, u_duty: 0.4, u_pB: 0.2, u_cost: -1.5, lambda_base: 0.3, lambda_edu_factor: -0.6, lambda_risk_factor: -0.2 } // Low Lambda (Rational), but low Utility inputs
    }
  },
  KPT: {
    profileName: "Koraput (Tribal/Rural Mobilization)",
    globalContext: {
      ground_truth_turnout: 0.7530, // Actual 2019 (High turnout reserved seat)
      electoral_competitiveness: 0.70,
      voting_cost_total: 0.6, // Difficult terrain
      campaign_duration: 60,
      population_size: 10000
    },
    agentGeneration: {
      education_skew: 0.5, // Low literacy
      age_min: 20,
      age_range: 30,
      urban_prob: 0.10,
      civic_duty_skew: 2.5, // High duty/community norms
      past_vote_prob: 0.85, // Strong habit
      social_pressure_skew: 3.5, // Very High: Village head/community voting
      risk_aversion_skew: 2.0,
      partisan_strength_skew: 2.0 // BJD vs Congress/BJP
    },
    modelPhysics: {
      utility: { beta_pB: 0.8, beta_C: -1.5, beta_D: 2.0, beta_S: 2.5, beta_H: 1.0, decision_noise: 0.5 }, // Social pressure (S) is dominant
      ddm: { base_mu: 0.2, threshold_a: 0.8, noise: 0.8, beta_D: 0.3, beta_H: 0.3, beta_S: 0.4, beta_C: -0.3, beta_pB: 0.2, beta_OC: 0.0 },
      dual_system: { h_habit: 2.0, h_social: 2.5, h_affect: 1.0, h_momentum: 0.4, u_duty: 1.5, u_pB: 0.5, u_cost: -3.0, lambda_base: 0.85, lambda_edu_factor: -0.1, lambda_risk_factor: 0.0 } // System 1 Dominant
    }
  },
  MUM: {
    profileName: "Mumbai South (The 'Colaba' Effect)",
    globalContext: {
      ground_truth_turnout: 0.5158, // Actual 2019
      electoral_competitiveness: 0.40,
      voting_cost_total: 0.1, // Very low physical cost
      campaign_duration: 60,
      population_size: 10000
    },
    agentGeneration: {
      education_skew: 4.2, // Very High
      age_min: 28,
      age_range: 30,
      urban_prob: 1.0,
      civic_duty_skew: 0.5, // Cynicism high
      past_vote_prob: 0.45, // Low habit
      social_pressure_skew: 0.3, // High rise isolation
      risk_aversion_skew: 1.2,
      partisan_strength_skew: 1.5
    },
    modelPhysics: {
      utility: { beta_pB: 0.3, beta_C: -2.5, beta_D: 0.4, beta_S: 0.1, beta_H: 0.5, decision_noise: 1.0 }, // High opportunity cost sensitivity
      ddm: { base_mu: -0.15, threshold_a: 1.4, noise: 1.0, beta_D: 0.1, beta_H: 0.15, beta_S: 0.05, beta_C: -0.5, beta_pB: 0.1, beta_OC: 0.1 },
      dual_system: { h_habit: 0.5, h_social: 0.2, h_affect: 0.3, h_momentum: -0.3, u_duty: 0.4, u_pB: 0.3, u_cost: -2.0, lambda_base: 0.2, lambda_edu_factor: -0.5, lambda_risk_factor: -0.2 }
    }
  },
  BST: {
    profileName: "Bastar (Conflict Zone Resilience)",
    globalContext: {
      ground_truth_turnout: 0.6604, // Actual 2019
      electoral_competitiveness: 0.85,
      voting_cost_total: 0.9, // Security checks, distance, threat
      campaign_duration: 60,
      population_size: 10000
    },
    agentGeneration: {
      education_skew: 0.4,
      age_min: 20,
      age_range: 25,
      urban_prob: 0.15,
      civic_duty_skew: 3.0, // Determination to vote
      past_vote_prob: 0.70,
      social_pressure_skew: 2.0,
      risk_aversion_skew: 3.5, // Very high risk aversion (physical safety)
      partisan_strength_skew: 3.0 // Strong loyalties
    },
    modelPhysics: {
      utility: { beta_pB: 0.6, beta_C: -1.2, beta_D: 3.0, beta_S: 1.5, beta_H: 1.0, decision_noise: 0.6 }, // Duty overrides Cost
      ddm: { base_mu: 0.05, threshold_a: 1.8, noise: 1.5, beta_D: 0.4, beta_H: 0.2, beta_S: 0.2, beta_C: -0.4, beta_pB: 0.2, beta_OC: 0.0 }, // High threshold (caution) due to risk
      dual_system: { h_habit: 1.2, h_social: 1.5, h_affect: 1.0, h_momentum: 0.1, u_duty: 2.5, u_pB: 0.8, u_cost: -1.5, lambda_base: 0.6, lambda_edu_factor: -0.1, lambda_risk_factor: -0.4 } // Risk drives S2, but Duty (S2) pushes vote
    }
  },
  CHN: {
    profileName: "Chennai Central (Regional Stronghold)",
    globalContext: {
      ground_truth_turnout: 0.5898, // Actual 2019
      electoral_competitiveness: 0.30, // DMK swept it
      voting_cost_total: 0.2,
      campaign_duration: 60,
      population_size: 10000
    },
    agentGeneration: {
      education_skew: 3.0, // High
      age_min: 28,
      age_range: 30,
      urban_prob: 1.0,
      civic_duty_skew: 1.8, // Moderate
      past_vote_prob: 0.65,
      social_pressure_skew: 1.2,
      risk_aversion_skew: 1.5,
      partisan_strength_skew: 4.0 // Very high: Dravidian politics identity
    },
    modelPhysics: {
      utility: { beta_pB: 0.4, beta_C: -2.0, beta_D: 1.0, beta_S: 0.8, beta_H: 1.2, decision_noise: 0.9 },
      ddm: { base_mu: 0.0, threshold_a: 1.2, noise: 1.0, beta_D: 0.15, beta_H: 0.25, beta_S: 0.15, beta_C: -0.5, beta_pB: 0.1, beta_OC: 0.1 },
      dual_system: { h_habit: 1.5, h_social: 1.0, h_affect: 2.0, h_momentum: 0.2, u_duty: 1.0, u_pB: 0.5, u_cost: -2.5, lambda_base: 0.5, lambda_edu_factor: -0.4, lambda_risk_factor: -0.2 } // Affect/Identity (S1) is strong
    }
  }
};

export const NUDGE_PARAMS: EditableNudgeParams = {
  [NudgeType.None]: {},
  [NudgeType.Monetary]: { lottery_probability: 0.01, lottery_value: 5.0 },
  [NudgeType.SocialNorm]: { revealed_turnout: 0.85, strength: 0.8 },
  [NudgeType.IdentityFrame]: { strength: 1.0 },
  [NudgeType.Disclosure]: { threat_level: 1.5, credibility: 0.9 },
  [NudgeType.Implementation]: { cost_reduction: 0.15, habit_boost: 0.1 },
  [NudgeType.Competitiveness]: { info_boost: 0.8, revealed_competitiveness: 0.98 },
};

export const MODEL_DESCRIPTIONS: Record<ModelType, string> = {
    [ModelType.Utility]: "Calculates a voter's 'utility' score. If the benefit of voting outweighs the cost, they are more likely to vote. A classic economic approach with behavioral twists.",
    [ModelType.DDM]: "Models decision-making as a race. Evidence for 'Vote' or 'Abstain' accumulates over time until a threshold is hit. Captures decision speed and uncertainty.",
    [ModelType.DualSystem]: "Assumes two competing mindsets: a fast, intuitive 'System 1' (Pattern Matching) and a slow, analytical 'System 2' (Utility Calculus). The final decision is a weighted arbitrage."
};

export const NUDGE_DESCRIPTIONS: Record<NudgeType, string> = {
    [NudgeType.None]: "No intervention. This is the baseline simulation.",
    [NudgeType.Monetary]: "Offers a small chance of a cash prize for voting. Tests the effect of extrinsic financial incentives.",
    [NudgeType.SocialNorm]: "Informs agents that a high number of their peers are voting. Tests the power of social pressure and conformity.",
    [NudgeType.IdentityFrame]: "Frames voting as an act of identity ('Be a voter') rather than just a behavior ('Go vote'). Tests if self-concept motivates action.",
    [NudgeType.Disclosure]: "Threatens to make an agent's voting record public. A strong form of social accountability.",
    [NudgeType.Implementation]: "Asks an agent to make a concrete plan to vote (when, where, how). Tests if reducing mental friction increases follow-through.",
    [NudgeType.Competitiveness]: "Informs agents that the election is expected to be very close. Tests if a feeling of pivotal importance increases turnout.",
};