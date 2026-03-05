import { useState, useMemo, useEffect, lazy, Suspense } from "react";

// Constants
import {
  DEFAULT_JAREN,
  DEFAULT_REND_ETF,
  DEFAULT_REND_CRYPTO,
  DEFAULT_REND_SPAAR,
  DEFAULT_START_ETF,
  DEFAULT_START_CRYPTO,
  DEFAULT_START_SPAAR,
  DEFAULT_START_PENSIOEN,
  DEFAULT_BIJ_ETF,
  DEFAULT_BIJ_CRYPTO,
  DEFAULT_BIJ_SPAAR,
  DEFAULT_BIJ_PENSIOEN,
  DEFAULT_FISCAAL_PARTNER,
  DEFAULT_BETAAL_UIT_SPAAR,
} from "./constants/tax";

// Hooks
import { useTheme } from "./hooks/useTheme";
import { simulate, generateMCScenarios, runPairedMonteCarlo } from "./hooks/useSimulation";

// Scenario data
import { getScenario, getScenarioIds, SCENARIOS } from "./data/scenarios";

// Utils
import { readStateFromUrl, getShareUrl, encodeState, copyToClipboard } from "./utils/shareState";

// Page Components (non-lazy)
import {
  LandingPage,
  Wizard,
  InfoPage,
  CustomScenarioModal,
} from "./components/pages";

// Lazy load Dashboard (contains Recharts ~400KB)
const Dashboard = lazy(() => import("./components/pages/Dashboard").then(m => ({ default: m.Dashboard })));

// Loading fallback for dashboard
function DashboardLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen text-mist-500 text-sm">
      Laden...
    </div>
  );
}

/**
 * Main application component
 */
export default function App() {
  const { darkMode, setDarkMode, theme } = useTheme();

  // Check for shared state in URL on mount
  const [urlState] = useState(() => readStateFromUrl());
  const hasUrlState = urlState !== null;

  // View state - go directly to dashboard if URL has state
  const [view, setView] = useState(hasUrlState ? "dashboard" : "landing");
  const [previousView, setPreviousView] = useState("landing");
  const [wizardStep, setWizardStep] = useState(1);
  const [showCopied, setShowCopied] = useState(false);

  // Scenario state (Phase 1: Scenario Uncertainty)
  const [selectedScenario, setSelectedScenario] = useState('verwacht');
  const [customReturns, setCustomReturns] = useState(null);
  const [customVolatility, setCustomVolatility] = useState(null);
  const [customMCEnabled, setCustomMCEnabled] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Monte Carlo is now configured via custom scenario modal

  // Helper to navigate to info page while remembering where we came from
  const goToInfo = () => {
    setPreviousView(view);
    setView("info");
  };

  // Asset inputs (CBS/DNB-gebaseerde standaardwaarden voor typische box 3-plichtige)
  const [startEtf, setStartEtf] = useState(urlState?.startEtf ?? DEFAULT_START_ETF);
  const [startCrypto, setStartCrypto] = useState(urlState?.startCrypto ?? DEFAULT_START_CRYPTO);
  const [startSpaar, setStartSpaar] = useState(urlState?.startSpaar ?? DEFAULT_START_SPAAR);
  const [startPensioen, setStartPensioen] = useState(urlState?.startPensioen ?? DEFAULT_START_PENSIOEN);

  // Contribution inputs
  const [bijEtf, setBijEtf] = useState(urlState?.bijEtf ?? DEFAULT_BIJ_ETF);
  const [bijCrypto, setBijCrypto] = useState(urlState?.bijCrypto ?? DEFAULT_BIJ_CRYPTO);
  const [bijSpaar, setBijSpaar] = useState(urlState?.bijSpaar ?? DEFAULT_BIJ_SPAAR);
  const [bijPensioen, setBijPensioen] = useState(urlState?.bijPensioen ?? DEFAULT_BIJ_PENSIOEN);

  // Return inputs
  const [rendEtf, setRendEtf] = useState(urlState?.rendEtf ?? DEFAULT_REND_ETF);
  const [rendCrypto, setRendCrypto] = useState(urlState?.rendCrypto ?? DEFAULT_REND_CRYPTO);
  const [rendSpaar, setRendSpaar] = useState(urlState?.rendSpaar ?? DEFAULT_REND_SPAAR);

  // Situation inputs
  const [jaren, setJaren] = useState(urlState?.jaren ?? DEFAULT_JAREN);
  const [fiscaalPartner, setFiscaalPartner] = useState(urlState?.fiscaalPartner ?? DEFAULT_FISCAAL_PARTNER);
  const [betaalUitSpaar] = useState(urlState?.betaalUitSpaar ?? DEFAULT_BETAAL_UIT_SPAAR);

  // Share current state
  const shareState = {
    startEtf, startCrypto, startSpaar, startPensioen,
    bijEtf, bijCrypto, bijSpaar, bijPensioen,
    rendEtf, rendCrypto, rendSpaar,
    jaren, fiscaalPartner, betaalUitSpaar,
  };

  const handleShare = async () => {
    const url = getShareUrl(shareState);
    const success = await copyToClipboard(url);
    if (success) {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  // Auto-update URL when on dashboard so users can copy-paste directly
  const shareStateKey = JSON.stringify(shareState);
  useEffect(() => {
    if (view === "dashboard") {
      const encoded = encodeState(shareState);
      const newUrl = encoded
        ? `${window.location.pathname}?d=${encoded}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else {
      // Clear URL when not on dashboard
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [view, shareStateKey]);

  // Simulation parameters object
  const params = {
    startEtf, startCrypto, startSpaar, startPensioen,
    bijEtf, bijCrypto, bijSpaar, bijPensioen,
    rendEtf, rendCrypto, rendSpaar,
    jaren, fiscaalPartner,
  };
  const paramsKey = JSON.stringify(params);

  // Run simulations (only when on dashboard to avoid unnecessary computation)
  const fMet = useMemo(
    () => view === "dashboard" ? simulate(params, "forfaitair", true, betaalUitSpaar, null) : { data: [] },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramsKey, betaalUitSpaar, view]
  );

  const wMet = useMemo(
    () => view === "dashboard" ? simulate(params, "werkelijk", true, betaalUitSpaar, null) : { data: [] },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramsKey, betaalUitSpaar, view]
  );

  // Run simulations for all scenarios (Phase 1: Scenario Uncertainty)
  const scenarioResults = useMemo(() => {
    if (view !== "dashboard") return {};

    const scenarioIds = getScenarioIds();
    const results = {};

    scenarioIds.forEach(id => {
      const scenario = getScenario(id, jaren, { rendEtf, rendCrypto, rendSpaar }, customReturns);

      // Run simulations for both tax systems with scenario returns
      const forfaitairResult = simulate(params, "forfaitair", true, betaalUitSpaar, scenario.returns);
      const werkelijkResult = simulate(params, "werkelijk", true, betaalUitSpaar, scenario.returns);

      results[id] = {
        ...scenario,
        forfaitair: forfaitairResult,
        werkelijk: werkelijkResult,
      };
    });

    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, betaalUitSpaar, view, customReturns]);

  // Monte Carlo simulation for selected scenario (Phase 4: Monte Carlo Uncertainty)
  const mcResults = useMemo(() => {
    if (view !== "dashboard") return null;

    // Check if MC should be enabled
    // MC is only enabled if user activated it via modal (customMCEnabled)
    // Works for both 'verwacht' and 'custom' scenarios
    const shouldEnableMC = (selectedScenario === 'verwacht' || selectedScenario === 'custom') && customMCEnabled;

    if (!shouldEnableMC) return null;

    // Get volatility (custom from modal, or default for verwacht)
    const scenario = SCENARIOS[selectedScenario];
    const volatility = customVolatility || scenario?.volatility;

    if (!volatility) return null;

    // Generate MC scenarios with scenario-specific volatility
    const mcScenarios = generateMCScenarios(
      params,
      volatility.etf,
      volatility.crypto,
      1000
    );

    // Run paired Monte Carlo simulation
    const results = runPairedMonteCarlo(params, betaalUitSpaar, mcScenarios);

    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, betaalUitSpaar, selectedScenario, view, customMCEnabled, customVolatility?.etf, customVolatility?.crypto]);

  // Common page wrapper class (body handles bg/text via CSS)
  const pageClass = "min-h-screen";

  // Apply a preset and go directly to dashboard
  const applyPreset = (preset) => {
    setStartEtf(preset.startEtf);
    setStartCrypto(preset.startCrypto);
    setStartSpaar(preset.startSpaar);
    setStartPensioen(preset.startPensioen);
    setBijEtf(preset.bijEtf);
    setBijCrypto(preset.bijCrypto);
    setBijPensioen(preset.bijPensioen);
    setView("dashboard");
  };

  // Landing page
  if (view === "landing") {
    return (
      <div className={pageClass}>
        <LandingPage
          onStartWizard={() => { setWizardStep(1); setView("wizard"); }}
          onStartWithPreset={applyPreset}
          onShowInfo={goToInfo}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          theme={theme}
        />
      </div>
    );
  }

  // Wizard
  if (view === "wizard") {
    return (
      <div className={pageClass}>
        <Wizard
          step={wizardStep}
          setStep={setWizardStep}
          onComplete={() => setView("dashboard")}
          onBack={() => setView("landing")}
          startEtf={startEtf} setStartEtf={setStartEtf}
          bijEtf={bijEtf} setBijEtf={setBijEtf}
          startCrypto={startCrypto} setStartCrypto={setStartCrypto}
          bijCrypto={bijCrypto} setBijCrypto={setBijCrypto}
          startSpaar={startSpaar} setStartSpaar={setStartSpaar}
          bijSpaar={bijSpaar} setBijSpaar={setBijSpaar}
          startPensioen={startPensioen} setStartPensioen={setStartPensioen}
          bijPensioen={bijPensioen} setBijPensioen={setBijPensioen}
          rendEtf={rendEtf}
          rendCrypto={rendCrypto}
          rendSpaar={rendSpaar}
          jaren={jaren} setJaren={setJaren}
          fiscaalPartner={fiscaalPartner} setFiscaalPartner={setFiscaalPartner}
        />
      </div>
    );
  }

  // Info page
  if (view === "info") {
    return (
      <div className={pageClass}>
        <InfoPage
          onBack={() => setView(previousView)}
          onStartWizard={() => { setWizardStep(1); setView("wizard"); }}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          theme={theme}
        />
      </div>
    );
  }

  // Navigate to wizard with current values pre-filled
  const goToWizard = () => {
    setWizardStep(1);
    setView("wizard");
  };

  // Navigate back to landing page
  const goToLanding = () => setView("landing");

  // Handle scenario change - reset MC state when switching scenarios
  const handleScenarioChange = (newScenario) => {
    // Reset MC state when switching away from verwacht/custom
    if (newScenario !== 'verwacht' && newScenario !== 'custom') {
      setCustomReturns(null);
      setCustomVolatility(null);
      setCustomMCEnabled(false);
    }
    setSelectedScenario(newScenario);
  };

  // Custom scenario handlers
  const handleCustomScenarioClick = () => {
    setShowCustomModal(true);
  };

  const handleCustomScenarioSave = (returns, volatility) => {
    setCustomReturns(returns);
    setCustomVolatility(volatility);
    setCustomMCEnabled(!!volatility); // Enable MC if volatility is provided
    // Only switch to 'custom' if returns are actually different from defaults
    // Otherwise keep 'verwacht' but with MC enabled
    const isDefaultReturns = returns.etf === rendEtf && returns.crypto === rendCrypto && returns.spaar === rendSpaar;
    if (!isDefaultReturns) {
      setSelectedScenario('custom');
    }
    // If returns are default, stay on 'verwacht' but MC will be enabled via customMCEnabled
  };

  // Dashboard view (lazy loaded)
  return (
    <div className={pageClass}>
      <Suspense fallback={<DashboardLoader />}>
        <Dashboard
          jaren={jaren}
          bijPensioen={bijPensioen}
          bijSpaar={bijSpaar}
          fiscaalPartner={fiscaalPartner}
          setFiscaalPartner={setFiscaalPartner}
          fMet={fMet}
          wMet={wMet}
          selectedScenario={selectedScenario}
          setSelectedScenario={handleScenarioChange}
          scenarioResults={scenarioResults}
          startSpaar={startSpaar}
          onCustomScenarioClick={handleCustomScenarioClick}
          mcResults={mcResults}
          handleShare={handleShare}
          showCopied={showCopied}
          goToInfo={goToInfo}
          goToWizard={goToWizard}
          goToLanding={goToLanding}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          theme={theme}
        />
      </Suspense>

      {/* Custom Scenario Modal */}
      <CustomScenarioModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSave={handleCustomScenarioSave}
        defaultReturns={{ etf: rendEtf, crypto: rendCrypto, spaar: rendSpaar }}
        defaultVolatility={{ etf: 0.15, crypto: 0.40 }}
      />
    </div>
  );
}
