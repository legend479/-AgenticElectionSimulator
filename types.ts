

export interface Agent {
  id: number;
  // Demographics
  education_normalized: number;
  age: number;
  urbanicity: number; // 1 for urban, 0 for rural
  // Psychology
  civic_duty: number;
  habit_strength: number;
  social_pressure_sensitivity: number;
  risk_aversion: number;
  partisan_identity_strength: number;
  overconfidence: number;
  personality_match_candidate: number;
  issue_salience: number;
}

export interface AgentDecision extends Agent {
  voted: boolean;
  voteProb: number;
  // Model-specific transient properties included in results
  affect?: number;
}

export interface ScenarioContext {
  ground_truth_turnout: number;
  electoral_competitiveness: number;
  voting_cost_total: number;
  campaign_duration: number;
  population_size: number;
}

export enum ModelType {
  Utility = "Extended Utility",
  DDM = "Drift-Diffusion",
  DualSystem = "Dual-System",
}

export enum NudgeType {
  None = "None",
  Monetary = "Monetary Lottery",
  SocialNorm = "Social Norm Info",
  IdentityFrame = "Linguistic Identity Frame",
  Disclosure = "Public Disclosure",
  Implementation = "Implementation Intention",
  Competitiveness = "Competitiveness Info",
}

export type EditableNudgeParams = {
  [NudgeType.Monetary]: { lottery_probability: number, lottery_value: number };
  [NudgeType.SocialNorm]: { revealed_turnout: number, strength: number };
  [NudgeType.IdentityFrame]: { strength: number };
  [NudgeType.Disclosure]: { threat_level: number, credibility: number };
  [NudgeType.Implementation]: { cost_reduction: number, habit_boost: number };
  [NudgeType.Competitiveness]: { info_boost: number, revealed_competitiveness: number };
  [NudgeType.None]: {};
};

// --- Full Configuration Types ---

export interface AgentGenerationParams {
  education_skew: number;
  age_min: number;
  age_range: number;
  urban_prob: number;
  civic_duty_skew: number;
  past_vote_prob: number;
  social_pressure_skew: number;
  risk_aversion_skew: number;
  partisan_strength_skew: number;
}

export interface ModelPhysicsParams {
  utility: {
    beta_pB: number;
    beta_C: number;
    beta_D: number;
    beta_S: number;
    beta_H: number;
    decision_noise: number;
  };
  ddm: {
    base_mu: number;
    threshold_a: number;
    noise: number;
    beta_D: number;
    beta_H: number;
    beta_S: number;
    beta_C: number;
    beta_pB: number;
    beta_OC: number;
  };
  dual_system: {
    // System 1: Heuristic / Associative
    h_habit: number;
    h_social: number;
    h_affect: number;
    h_momentum: number; // Baseline activation
    
    // System 2: Rational / Utility
    u_duty: number;
    u_pB: number;
    u_cost: number;
    
    // Arbiter: Cognitive Control
    lambda_base: number;
    lambda_edu_factor: number;
    lambda_risk_factor: number;
  };
}


export interface FullSimulationConfig {
  profileName: string;
  globalContext: ScenarioContext;
  agentGeneration: AgentGenerationParams;
  modelPhysics: ModelPhysicsParams;
}

export interface SimulationSettings {
  numAgents: number;
  model: ModelType;
  nudge: NudgeType;
  nudgeParams: EditableNudgeParams;
}

// --- Visualization Data Types ---

export interface UtilityVizData {
  model: ModelType.Utility;
  components: { name: string, value: number }[];
  finalUtility: number;
  voteProb: number;
}

export interface DDMVizData {
  model: ModelType.DDM;
  params: { mu: number, a: number, z: number, sigma: number };
  paths: { t: number, x: number }[][];
}

export interface DualSystemVizData {
  model: ModelType.DualSystem;
  p_vote_s1: number;
  p_vote_s2: number;
  lambda: number;
  final_p_vote: number;
  s1_components: { name: string, value: number }[];
  s2_components: { name: string, value: number }[];
}

export type RepresentativeAgentData = UtilityVizData | DDMVizData | DualSystemVizData;


export interface SimulationResult {
  turnout: number;
  groundTruth: number;
  baselineTurnout?: number;
  voteProbDistribution: { prob: number; density: number }[];
  diagnostics?: Record<string, any>;
  agents: AgentDecision[];
  turnoutByModel: { model: ModelType, turnout: number }[];
}

// --- Tuning Types ---

export interface TuningHistoryPoint {
    iteration: number;
    error: number;
}

export interface AnalysisReport {
    mathematicalSummary: string;
    behavioralInsight: string;
    theoreticalImplication: string;
    policyRecommendation: string;
}

export interface CalibrationPoint {
    scenarioName: string;
    actual: number;
    predicted: number;
}

export interface TunerConfiguration {
    modelType: ModelType;
    iterationsPerRun: number;
    totalRuns: number;
    populationSizeHighFidelity: number;
    populationSizeLowFidelity: number;
}

export interface TuningResult {
    optimizedParams: ModelPhysicsParams;
    history: TuningHistoryPoint[];
    multiRunHistory: { run: number; data: TuningHistoryPoint[] }[];
    finalError: number;
    improvement: number;
    rSquared: number;
    mae: number;
    calibrationData: CalibrationPoint[];
    paramSensitivity: { name: string; sensitivity: number }[];
    analysis: AnalysisReport;
    paramHistory: { iteration: number; [key: string]: number }[];
    tunerConfig: TunerConfiguration;
}

export interface TuningScenario {
    id: string;
    config: FullSimulationConfig;
    nudgeSettings: {
        nudge: NudgeType;
        nudgeParams: EditableNudgeParams;
    };
}

// --- Deep Analysis Types ---

export interface NudgePerformance {
    nudge: NudgeType;
    avgLift: number;
    consistency: number; // standard deviation of lift
    bestScenario: string;
    worstScenario: string;
}

export interface ScenarioNudgeResult {
    scenarioName: string;
    nudge: NudgeType;
    turnout: number;
    baseline: number;
    lift: number;
}

export interface DeepAnalysisResult {
    nudgePerformance: NudgePerformance[];
    detailedResults: ScenarioNudgeResult[];
    report: {
        executiveSummary: string;
        strategicRecommendations: string;
        contextualInsights: string;
    }
}