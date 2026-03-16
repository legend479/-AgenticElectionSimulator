

import { FullSimulationConfig, ModelType, ModelPhysicsParams, TuningResult, AnalysisReport, SimulationSettings, NudgeType, CalibrationPoint, TuningScenario, DeepAnalysisResult, ScenarioNudgeResult, NudgePerformance, EditableNudgeParams, TuningHistoryPoint } from '../types';
import { runSimulation } from './simulationService';
import { SCENARIO_TEMPLATES, NUDGE_PARAMS } from '../constants';

// Helper to deep clone
const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Helper to calculate Root Mean Square Error
const calculateRMSE = (predictions: number[], actuals: number[]): number => {
    const sumSqErr = predictions.reduce((acc, pred, i) => acc + Math.pow(pred - actuals[i], 2), 0);
    return Math.sqrt(sumSqErr / predictions.length);
};

// Helper to calculate Mean Absolute Error
const calculateMAE = (predictions: number[], actuals: number[]): number => {
    const sumAbsErr = predictions.reduce((acc, pred, i) => acc + Math.abs(pred - actuals[i]), 0);
    return sumAbsErr / predictions.length;
};

// Calculate R-Squared (Coefficient of Determination)
const calculateRSquared = (actuals: number[], predictions: number[]): number => {
    const mean = actuals.reduce((a, b) => a + b, 0) / actuals.length;
    const ssTot = actuals.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    const ssRes = actuals.reduce((a, b, i) => a + Math.pow(b - predictions[i], 2), 0);
    // If ssTot is 0 (all actuals are same), R2 is undefined/0
    if (ssTot === 0) return 0;
    return Math.max(0, 1 - (ssRes / ssTot));
};

// --- RANDOM INITIALIZATION HELPERS ---

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

const generateRandomParams = (modelType: ModelType): ModelPhysicsParams => {
    // Start with a base structure to ensure shape is correct
    const params = clone(SCENARIO_TEMPLATES.TVM.modelPhysics);

    if (modelType === ModelType.Utility) {
        params.utility.beta_pB = randomInRange(0.1, 2.0);
        params.utility.beta_C = randomInRange(-4.0, -0.5);
        params.utility.beta_D = randomInRange(0.1, 2.5);
        params.utility.beta_S = randomInRange(0.1, 2.0);
        params.utility.beta_H = randomInRange(0.1, 2.0);
        params.utility.decision_noise = randomInRange(0.5, 2.0);
    } else if (modelType === ModelType.DDM) {
        params.ddm.base_mu = randomInRange(-0.3, 0.3);
        params.ddm.threshold_a = randomInRange(0.8, 2.5);
        params.ddm.noise = randomInRange(0.5, 2.0);
        params.ddm.beta_D = randomInRange(0.1, 0.8);
        params.ddm.beta_C = randomInRange(-0.8, -0.1);
        // Keep others moderate
        params.ddm.beta_H = randomInRange(0.1, 0.5);
        params.ddm.beta_S = randomInRange(0.1, 0.5);
    } else if (modelType === ModelType.DualSystem) {
        params.dual_system.h_habit = randomInRange(0.5, 2.5);
        params.dual_system.h_social = randomInRange(0.5, 2.0);
        params.dual_system.h_affect = randomInRange(0.5, 2.0);
        params.dual_system.u_cost = randomInRange(-4.0, -1.0);
        params.dual_system.u_duty = randomInRange(0.5, 2.5);
        params.dual_system.lambda_base = randomInRange(0.2, 0.8);
    }
    
    return params;
};

// --- SIMULATED ANNEALING LOGIC ---

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

// Perturb parameters based on current Temperature (intensity)
// High Temp = Large, chaotic jumps. Low Temp = Small, fine-tuning.
const perturbParamsSA = (params: ModelPhysicsParams, modelType: ModelType, temp: number): ModelPhysicsParams => {
    const newParams = clone(params);
    
    // Magnitude scales with temperature. 
    // At Temp=1.0, perturbation is up to +/- 100% of range factor. 
    // At Temp=0.1, perturbation is +/- 10%.
    const magnitude = temp; 

    // Helper to apply noise and clamp
    const perturb = (val: number, min: number, max: number, rangeScale: number = 1.0) => {
        const delta = (Math.random() - 0.5) * 2 * rangeScale * magnitude; 
        return clamp(val + delta, min, max);
    };

    if (modelType === ModelType.Utility) {
        const p = newParams.utility;
        p.beta_pB = perturb(p.beta_pB, 0, 10, 2);
        p.beta_C = perturb(p.beta_C, -20, 0, 5);
        p.beta_D = perturb(p.beta_D, 0, 20, 5);
        p.beta_S = perturb(p.beta_S, 0, 20, 5);
        p.beta_H = perturb(p.beta_H, 0, 20, 5);
        p.decision_noise = perturb(p.decision_noise, 0.1, 10, 2);
    } else if (modelType === ModelType.DDM) {
        const p = newParams.ddm;
        // Drift can be negative or positive
        p.base_mu = perturb(p.base_mu, -1, 1, 0.5);
        p.threshold_a = perturb(p.threshold_a, 0.1, 5, 1);
        p.noise = perturb(p.noise, 0.1, 5, 1);
        
        p.beta_D = perturb(p.beta_D, 0, 2, 0.5);
        p.beta_H = perturb(p.beta_H, 0, 2, 0.5);
        p.beta_S = perturb(p.beta_S, 0, 2, 0.5);
        p.beta_C = perturb(p.beta_C, -2, 0, 0.5);
        p.beta_pB = perturb(p.beta_pB, 0, 2, 0.5);
        p.beta_OC = perturb(p.beta_OC, 0, 2, 0.5);
    } else if (modelType === ModelType.DualSystem) {
        const p = newParams.dual_system;
        // System 1 (Heuristic)
        p.h_habit = perturb(p.h_habit, 0, 5, 1);
        p.h_social = perturb(p.h_social, 0, 5, 1);
        p.h_affect = perturb(p.h_affect, 0, 5, 1);
        p.h_momentum = perturb(p.h_momentum, -1, 1, 0.2);

        // System 2 (Utility)
        p.u_duty = perturb(p.u_duty, 0, 5, 1);
        p.u_pB = perturb(p.u_pB, 0, 5, 1);
        p.u_cost = perturb(p.u_cost, -10, 0, 2);

        // Arbiter
        p.lambda_base = perturb(p.lambda_base, 0, 1, 0.2);
        p.lambda_edu_factor = perturb(p.lambda_edu_factor, -1, 1, 0.5);
        p.lambda_risk_factor = perturb(p.lambda_risk_factor, -1, 1, 0.5);
    }
    return newParams;
};

// Evaluation Function
const evaluateConfig = async (
    params: ModelPhysicsParams, 
    scenarios: TuningScenario[], 
    modelType: ModelType,
    numAgents: number
): Promise<number> => {
    let totalSquaredError = 0;
    
    for (const scenario of scenarios) {
        const testConfig: FullSimulationConfig = {
            ...scenario.config,
            modelPhysics: params
        };

        const scenarioSettings: SimulationSettings = {
            numAgents: numAgents,
            model: modelType,
            nudge: scenario.nudgeSettings.nudge,
            nudgeParams: scenario.nudgeSettings.nudgeParams
        };

        const result = await runSimulation(testConfig, scenarioSettings);
        const error = result.turnout - scenario.config.globalContext.ground_truth_turnout;
        totalSquaredError += error * error;
    }
    
    return Math.sqrt(totalSquaredError / scenarios.length); // RMSE
};


// --- SENSITIVITY ANALYSIS ---
const analyzeSensitivity = async (
    baseParams: ModelPhysicsParams,
    modelType: ModelType,
    scenarios: TuningScenario[],
    baseRMSE: number
): Promise<{ name: string; sensitivity: number }[]> => {
    const sensitivityResults: { name: string; sensitivity: number }[] = [];
    
    // Determine keys to test
    let keys: string[] = [];
    // @ts-ignore
    const params = clone(baseParams);

    if (modelType === ModelType.Utility) {
        keys = Object.keys(params.utility);
    } else if (modelType === ModelType.DDM) {
        keys = Object.keys(params.ddm);
    } else {
        keys = Object.keys(params.dual_system);
    }

    // Test each key by perturbing it +10%
    for (const key of keys) {
        const testParams = clone(baseParams);
        
        // Apply perturbation
        // @ts-ignore
        if (modelType === ModelType.Utility) testParams.utility[key] = testParams.utility[key] === 0 ? 0.1 : testParams.utility[key] * 1.1;
        // @ts-ignore
        else if (modelType === ModelType.DDM) testParams.ddm[key] = Math.abs(testParams.ddm[key]) < 0.01 ? testParams.ddm[key] + 0.1 : testParams.ddm[key] * 1.1;
        // @ts-ignore
        else testParams.dual_system[key] = testParams.dual_system[key] === 0 ? 0.1 : testParams.dual_system[key] * 1.1;

        // Quick eval with fewer agents for sensitivity
        const newRMSE = await evaluateConfig(testParams, scenarios, modelType, 1500);
        
        const sensitivity = Math.abs(newRMSE - baseRMSE) / (baseRMSE + 0.0001); // Avoid div/0
        sensitivityResults.push({ name: key, sensitivity });
    }

    return sensitivityResults.sort((a, b) => b.sensitivity - a.sensitivity);
};


// --- ANALYSIS GENERATOR (CALIBRATION) ---
const generateDeepAnalysis = (
    original: ModelPhysicsParams, 
    optimized: ModelPhysicsParams, 
    modelType: ModelType,
    rSquared: number,
    sensitivities: { name: string; sensitivity: number }[]
): AnalysisReport => {
    let mathSum = "";
    let behInsight = "";
    let theoImp = "";
    let policy = "";

    const topParam = sensitivities[0]?.name || "Unknown";
    const r2Desc = rSquared > 0.8 ? "Excellent" : rSquared > 0.5 ? "Moderate" : "Weak";

    if (modelType === ModelType.Utility) {
        const orig = original.utility;
        const opt = optimized.utility;
        
        const costChange = Math.abs(opt.beta_C) - Math.abs(orig.beta_C);
        const dutyChange = opt.beta_D - orig.beta_D;

        mathSum = `Fit Quality: ${r2Desc} (R² = ${rSquared.toFixed(2)}). Top Sensitive Param: '${topParam}'. The model converged with a ${costChange > 0 ? 'heightened' : 'reduced'} sensitivity to Cost (β_C: ${orig.beta_C.toFixed(2)} → ${opt.beta_C.toFixed(2)}) and ${dutyChange > 0 ? 'increased' : 'decreased'} weight on Civic Duty.`;

        if (Math.abs(opt.beta_C) > Math.abs(opt.beta_D) * 2) {
            behInsight = "High 'Price Elasticity of Voting'. The cost barrier (logistical friction) is the dominant inhibitor, significantly overpowering intrinsic motivations like duty.";
            theoImp = "Homo Economicus dominates Homo Civicus here. Tangible costs outweigh abstract benefits.";
            policy = "Interventions must focus on friction reduction (e.g., Automatic Voter Registration, Mail-in ballots). Moral appeals will yield diminishing returns.";
        } else if (opt.decision_noise > 2.0) {
            behInsight = "High stochasticity (noise) detected. Voter behavior is decoupled from strict utility maximization, suggesting decisions are driven by unmodeled random factors.";
            theoImp = "Suggests voting is 'Expressive' rather than 'Instrumental', or simply low-salience.";
            policy = "High noise environments require strong, simple nudges to break through the randomness. Salience (Identity Frames) is more effective than marginal cost reduction.";
        } else {
             behInsight = "Balanced profile. Agents trade off duty and cost rationally. Social pressure (β_S) remains a key influencer.";
             theoImp = "The standard Riker-Ordeshook calculus (R = PB - C + D) holds well without extreme modification.";
             policy = "A portfolio approach: Combine minor cost reductions with strong 'Get Out The Vote' social pressure campaigns.";
        }
    } else if (modelType === ModelType.DDM) {
        const orig = original.ddm;
        const opt = optimized.ddm;

        mathSum = `Fit Quality: ${r2Desc} (R² = ${rSquared.toFixed(2)}). Top Driver: '${topParam}'. Drift rate baseline shifted (${orig.base_mu.toFixed(2)} → ${opt.base_mu.toFixed(2)}). Decision boundary (Threshold) moved from ${orig.threshold_a.toFixed(2)} to ${opt.threshold_a.toFixed(2)}.`;

        if (opt.threshold_a < 0.8) {
            behInsight = "Low decision thresholds indicate 'Fast, Impulsive' decision making. Agents are not deliberating deeply; they are reacting to immediate cues.";
            theoImp = "Evidence accumulation is truncated. Suggests a heuristic-driven process where 'Cognitive Miser' theory applies.";
            policy = "Rapid-fire, emotional messaging will outperform detailed policy arguments. Capture attention quickly.";
        } else if (opt.base_mu < -0.2) {
            behInsight = "Strong negative baseline drift. The default state is deep apathy/abstention. It requires massive evidence to overcome this inertia.";
            theoImp = "The 'Status Quo Bias' is the strongest force in this system.";
            policy = "Disruption is needed. Standard reminders will fail. High-impact interventions (e.g., Mandatory Voting discussions, Social Shaming) are required.";
        } else {
            behInsight = "Parameters suggest a 'Deliberative' electorate. Moderate thresholds imply agents wait for sufficient evidence before committing.";
            theoImp = "Consistent with 'Bounded Rationality'. Agents are rational but constrained by time and information.";
            policy = "Provide clear, easy-to-process information. Implementation Intentions (Plan Making) will help close the gap between intention and action.";
        }

    } else if (modelType === ModelType.DualSystem) {
        const orig = original.dual_system;
        const opt = optimized.dual_system;

        const lambdaChange = opt.lambda_base - orig.lambda_base;
        
        mathSum = `Fit Quality: ${r2Desc} (R² = ${rSquared.toFixed(2)}). Top Driver: '${topParam}'. System 1 (Heuristic) / System 2 (Utility) balance (λ) shifted by ${lambdaChange.toFixed(2)} (Current Base: ${opt.lambda_base.toFixed(2)}).`;

        if (opt.lambda_base > 0.7) {
             behInsight = "System 1 Dominance. Voting is primarily driven by associative heuristics (habit, social, affect). Rational utility calculus is largely bypassed.";
             theoImp = "Validates the 'Social Intuitionist' model. Agents behave like 'Cognitive Misers', relying on pattern matching over logic.";
             policy = "Focus on habit formation and affective priming. Arguments about 'cost' or 'benefit' will be ignored. Use Identity frames.";
        } else if (Math.abs(opt.u_cost) > 3.0) {
            behInsight = "System 2 is highly sensitive to Cost. When agents DO deliberate, they are easily discouraged by friction.";
            theoImp = "Rational processes are brittle; high friction causes System 2 to reject the action even if System 1 is activated.";
            policy = "Cognitive offloading. If you engage their brain (S2), you must make the path easy. Pre-fill forms, provide maps.";
        } else {
            behInsight = "Dual-process equilibrium. Agents successfully integrate habit cues with rational constraints.";
            theoImp = "A robust mix of 'Logic of Consequences' and 'Logic of Appropriateness'.";
            policy = "Standard multi-modal campaigns (Text reminders + Social Pressure + Information) will work best.";
        }
    }

    return {
        mathematicalSummary: mathSum,
        behavioralInsight: behInsight,
        theoreticalImplication: theoImp,
        policyRecommendation: policy
    };
};

// --- REPORT GENERATOR (NUDGES) ---
const generateNudgeAnalysisReport = (nudgePerformance: NudgePerformance[], detailedResults: ScenarioNudgeResult[]): DeepAnalysisResult['report'] => {
    const topNudge = nudgePerformance[0];
    const bottomNudge = nudgePerformance[nudgePerformance.length - 1];
    const consistentNudge = [...nudgePerformance].sort((a, b) => a.consistency - b.consistency)[0]; // Lowest std dev
    const volatileNudge = [...nudgePerformance].sort((a, b) => b.consistency - a.consistency)[0];

    let execSummary = `Across all simulated scenarios, ${topNudge.nudge} proved to be the most effective intervention, delivering an average lift of +${(topNudge.avgLift * 100).toFixed(2)}pp. `;
    
    if (topNudge.nudge === NudgeType.Monetary) {
        execSummary += "The dominance of extrinsic incentives suggests a transactional electorate sensitive to direct rewards. ";
    } else if (topNudge.nudge === NudgeType.SocialNorm) {
        execSummary += "The strong performance of Social Norms highlights the 'Social Animal' nature of the agents, where peer conformity outweighs individual cost calculations. ";
    } else if (topNudge.nudge === NudgeType.Implementation) {
        execSummary += "Implementation Intentions worked best, indicating that the primary barrier is not motivation but 'friction'—agents want to vote but need help planning the execution. ";
    } else if (topNudge.nudge === NudgeType.IdentityFrame) {
        execSummary += "Identity Framing (being a 'Voter') outperformed other nudges, suggesting self-concept maintenance is a potent driver of behavior in this calibrated population. ";
    }

    if (consistentNudge.nudge === topNudge.nudge) {
        execSummary += `Crucially, ${topNudge.nudge} was also the most consistent performer, making it a low-risk 'Silver Bullet' strategy.`;
    } else {
        execSummary += `However, ${consistentNudge.nudge} offers the most reliable returns (lowest variance), whereas ${topNudge.nudge} is high-risk/high-reward depending on the specific scenario context.`;
    }

    let strategicRecs = `Strategy A (Max Impact): Deploy ${topNudge.nudge} primarily in regions resembling '${topNudge.bestScenario.split('(')[0]}', where it achieved a peak lift of +${(detailedResults.find(r => r.nudge === topNudge.nudge && r.scenarioName === topNudge.bestScenario)?.lift! * 100).toFixed(2)}pp. `;
    strategicRecs += `Strategy B (Safety): Avoid ${bottomNudge.nudge}, which underperformed across the board. `;
    
    if (volatileNudge.consistency > 0.05) {
        strategicRecs += `Caution is advised with ${volatileNudge.nudge}; its volatility suggests it relies heavily on specific population traits (e.g., high education or risk tolerance) present only in certain districts.`;
    }

    let contextInsights = "";
    // Find a scenario where the "best" nudge actually lost to someone else
    const outlierScenario = detailedResults.find(r => r.nudge !== topNudge.nudge && r.lift > (detailedResults.find(tr => tr.scenarioName === r.scenarioName && tr.nudge === topNudge.nudge)?.lift || 0));
    
    if (outlierScenario) {
        contextInsights = `While ${topNudge.nudge} won generally, ${outlierScenario.nudge} surprisingly outperformed it in '${outlierScenario.scenarioName.split('(')[0]}'. This suggests that in specific contexts (likely due to unique demographics like Age or Urbanicity), tailored interventions can beat the general winner.`;
    } else {
        contextInsights = `${topNudge.nudge} appears to be universally dominant, outperforming alternatives in every tested scenario. This indicates a fundamental driver in the population's decision architecture that this specific nudge successfully exploits.`;
    }

    return {
        executiveSummary: execSummary,
        strategicRecommendations: strategicRecs,
        contextualInsights: contextInsights
    };
};


// --- MAIN TUNER FUNCTION ---

// Single run of Simulated Annealing
const runOptimizationChain = async (
    initialParams: ModelPhysicsParams,
    scenarios: TuningScenario[],
    modelType: ModelType,
    iterations: number,
    LOW_FIDELITY_N: number,
    onStep: (step: number, currentEnergy: number, params: ModelPhysicsParams) => void
): Promise<{ bestParams: ModelPhysicsParams, bestEnergy: number }> => {
    
    const INITIAL_TEMP = 1.0;
    const COOLING_RATE = 0.90;
    
    let currentParams = clone(initialParams);
    let currentEnergy = await evaluateConfig(currentParams, scenarios, modelType, LOW_FIDELITY_N); 
    
    let bestParams = clone(currentParams);
    let bestEnergy = currentEnergy;
    
    let temp = INITIAL_TEMP;

    for (let i = 1; i <= iterations; i++) {
        const candidateParams = perturbParamsSA(currentParams, modelType, temp);
        const candidateEnergy = await evaluateConfig(candidateParams, scenarios, modelType, LOW_FIDELITY_N);
        
        const deltaE = candidateEnergy - currentEnergy;
        let accept = false;

        if (deltaE < 0) {
            accept = true;
        } else if (Math.random() < Math.exp(-deltaE / temp)) {
            accept = true;
        }
        
        if (accept) {
            currentParams = candidateParams;
            currentEnergy = candidateEnergy;
            
            if (currentEnergy < bestEnergy) {
                bestEnergy = currentEnergy;
                bestParams = clone(currentParams);
            }
        }
        
        temp *= COOLING_RATE;
        
        onStep(i, bestEnergy, bestParams);
        await new Promise(r => setTimeout(r, 0)); // Yield to UI
    }

    return { bestParams, bestEnergy };
};


export const runTuner = async (
    scenarios: TuningScenario[], 
    modelType: ModelType, 
    iterations: number = 50,
    onProgress: (progress: number, currentError: number, statusText: string, liveData?: { run: number; data: TuningHistoryPoint[] }[]) => void
): Promise<TuningResult> => {
    
    const STEPS = iterations;
    const HIGH_FIDELITY_N = 2500;
    const LOW_FIDELITY_N = 800;
    const NUM_RESTARTS = 3; // Multi-start optimization
    
    // Baseline Physics (template defaults)
    const templateParams = clone(SCENARIO_TEMPLATES.TVM.modelPhysics); 
    
    // 0. Establish Baseline Error
    const initialHighFiError = await evaluateConfig(templateParams, scenarios, modelType, HIGH_FIDELITY_N);

    let globalBestParams = clone(templateParams);
    let globalBestEnergy = Infinity;
    
    const fullHistory: TuningHistoryPoint[] = [];
    const paramHistory: { iteration: number; [key: string]: number }[] = [];
    const multiRunHistory: { run: number; data: TuningHistoryPoint[] }[] = [];
    
    let totalIterationsCount = 0;

    // --- MULTI-START OPTIMIZATION LOOP ---
    for (let run = 1; run <= NUM_RESTARTS; run++) {
        const runHistory: TuningHistoryPoint[] = [];

        // Run 1 starts with template params (conservative).
        // Runs 2+ start with randomized params (exploration).
        const startParams = run === 1 ? templateParams : generateRandomParams(modelType);
        
        onProgress(
            ((run - 1) / NUM_RESTARTS) * 100, 
            globalBestEnergy === Infinity ? initialHighFiError : globalBestEnergy,
            `Optimization Run ${run}/${NUM_RESTARTS}: ${run === 1 ? 'Baseline Refinement' : 'Global Search'}`,
            [...multiRunHistory, { run, data: [] }]
        );

        const { bestParams, bestEnergy } = await runOptimizationChain(
            startParams, 
            scenarios, 
            modelType, 
            STEPS, 
            LOW_FIDELITY_N,
            (step, energy, currentBestParams) => {
                totalIterationsCount++;
                
                // Log history
                const point = { iteration: step, error: energy };
                fullHistory.push({ iteration: totalIterationsCount, error: energy });
                runHistory.push(point);
                
                // Log params (for first run only to keep chart clean, or could avg)
                if (run === 1 || energy < globalBestEnergy) {
                    const snapshot: any = { iteration: totalIterationsCount };
                    const pSource = modelType === ModelType.Utility ? currentBestParams.utility : 
                                    modelType === ModelType.DDM ? currentBestParams.ddm : currentBestParams.dual_system;
                    Object.entries(pSource).forEach(([k, v]) => snapshot[k] = v as number);
                    paramHistory.push(snapshot);
                }

                // Construct live snapshot
                const currentSnapshot = [
                    ...multiRunHistory, 
                    { run: run, data: [...runHistory] } // Copy array to be safe
                ];

                // Update Progress Bar & Live Chart
                const runProgress = (step / STEPS) / NUM_RESTARTS;
                const baseProgress = (run - 1) / NUM_RESTARTS;
                onProgress((baseProgress + runProgress) * 100, energy, `Optimization Run ${run}/${NUM_RESTARTS}`, currentSnapshot);
            }
        );

        multiRunHistory.push({ run, data: runHistory });

        // Update Global Best if this run found a better solution
        if (bestEnergy < globalBestEnergy) {
            globalBestEnergy = bestEnergy;
            globalBestParams = bestParams;
        }
    }

    onProgress(100, globalBestEnergy, "Finalizing Validation...", multiRunHistory);

    // 4. Final Validation (High Fidelity) on Global Best
    const calibrationData: CalibrationPoint[] = [];
    const actuals: number[] = [];
    const predictions: number[] = [];
    
    for (const scenario of scenarios) {
        const finalConfig = { ...scenario.config, modelPhysics: globalBestParams };
        const scenarioSettings: SimulationSettings = {
            numAgents: HIGH_FIDELITY_N, 
            model: modelType,
            nudge: scenario.nudgeSettings.nudge,
            nudgeParams: scenario.nudgeSettings.nudgeParams
        };
        const res = await runSimulation(finalConfig, scenarioSettings);
        actuals.push(scenario.config.globalContext.ground_truth_turnout);
        predictions.push(res.turnout);
        calibrationData.push({
            scenarioName: scenario.config.profileName.replace(' (Customized)', ''),
            actual: scenario.config.globalContext.ground_truth_turnout,
            predicted: res.turnout
        });
    }
    
    const finalValidationRMSE = calculateRMSE(predictions, actuals);
    const rSquared = calculateRSquared(actuals, predictions);
    const mae = calculateMAE(predictions, actuals);
    
    // Perform Sensitivity Analysis on the best model
    const paramSensitivity = await analyzeSensitivity(globalBestParams, modelType, scenarios, finalValidationRMSE);

    // Generate Report
    const analysis = generateDeepAnalysis(
        templateParams, 
        globalBestParams, 
        modelType, 
        rSquared,
        paramSensitivity
    );

    return {
        optimizedParams: globalBestParams,
        history: fullHistory,
        multiRunHistory, // Return the separate run histories
        paramHistory,
        finalError: finalValidationRMSE,
        improvement: initialHighFiError - finalValidationRMSE,
        rSquared,
        mae,
        calibrationData,
        paramSensitivity,
        analysis,
        tunerConfig: {
            modelType,
            iterationsPerRun: STEPS,
            totalRuns: NUM_RESTARTS,
            populationSizeHighFidelity: HIGH_FIDELITY_N,
            populationSizeLowFidelity: LOW_FIDELITY_N
        }
    };
};

// --- DEEP ANALYSIS RUNNER ---

export const runDeepAnalysis = async (
    scenarios: TuningScenario[],
    optimizedParams: ModelPhysicsParams,
    modelType: ModelType,
    onProgress: (progress: number) => void
): Promise<DeepAnalysisResult> => {
    const nudgesToTest = Object.values(NudgeType).filter(n => n !== NudgeType.None);
    const detailedResults: ScenarioNudgeResult[] = [];
    const totalOperations = nudgesToTest.length * scenarios.length * 2; // *2 for baseline + nudge run
    let opsCompleted = 0;

    for (const nudge of nudgesToTest) {
        for (const scenario of scenarios) {
            const config: FullSimulationConfig = {
                ...scenario.config,
                modelPhysics: optimizedParams
            };
            
            // 1. Run Baseline (No Nudge) for this scenario with optimized params
            const baselineSettings: SimulationSettings = {
                numAgents: 2500,
                model: modelType,
                nudge: NudgeType.None,
                nudgeParams: NUDGE_PARAMS // default params map
            };
            
            const baselineRes = await runSimulation(config, baselineSettings);
            opsCompleted++;
            onProgress(opsCompleted / totalOperations * 100);

            // 2. Run Intervention (With Nudge)
            const nudgeSettings: SimulationSettings = {
                numAgents: 2500,
                model: modelType,
                nudge: nudge,
                nudgeParams: NUDGE_PARAMS // Use standard strong params for comparison
            };

            const interventionRes = await runSimulation(config, nudgeSettings);
            opsCompleted++;
            onProgress(opsCompleted / totalOperations * 100);

            detailedResults.push({
                scenarioName: scenario.config.profileName.replace(' (Customized)', ''),
                nudge: nudge,
                turnout: interventionRes.turnout,
                baseline: baselineRes.turnout,
                lift: interventionRes.turnout - baselineRes.turnout
            });
        }
    }

    // Aggregation
    const nudgePerformance: NudgePerformance[] = nudgesToTest.map(nudge => {
        const results = detailedResults.filter(r => r.nudge === nudge);
        const avgLift = results.reduce((sum, r) => sum + r.lift, 0) / results.length;
        
        // Calculate StDev
        const variance = results.reduce((sum, r) => sum + Math.pow(r.lift - avgLift, 2), 0) / results.length;
        const consistency = Math.sqrt(variance);
        
        const sortedByLift = [...results].sort((a, b) => b.lift - a.lift);
        
        return {
            nudge,
            avgLift,
            consistency,
            bestScenario: sortedByLift[0].scenarioName,
            worstScenario: sortedByLift[sortedByLift.length - 1].scenarioName
        };
    }).sort((a, b) => b.avgLift - a.avgLift);

    // Generate Report
    const report = generateNudgeAnalysisReport(nudgePerformance, detailedResults);

    return {
        nudgePerformance,
        detailedResults,
        report
    };
};