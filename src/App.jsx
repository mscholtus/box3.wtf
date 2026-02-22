import { useState, useMemo, useEffect, lazy, Suspense } from "react";

// Constants
import {
  DEFAULT_JAREN,
  DEFAULT_REND_ETF,
  DEFAULT_REND_CRYPTO,
  DEFAULT_REND_SPAAR,
  DEFAULT_VOL_ETF,
  DEFAULT_VOL_CRYPTO,
  DEFAULT_START_ETF,
  DEFAULT_START_CRYPTO,
  DEFAULT_START_SPAAR,
  DEFAULT_START_PENSIOEN,
  DEFAULT_BIJ_ETF,
  DEFAULT_BIJ_CRYPTO,
  DEFAULT_BIJ_PENSIOEN,
  DEFAULT_FISCAAL_PARTNER,
  DEFAULT_BETAAL_UIT_SPAAR,
  DEFAULT_ADVANCED_MODE,
  DEFAULT_MC_SEED,
} from "./constants/tax";

// Hooks
import { useTheme } from "./hooks/useTheme";
import { simulate, runMonteCarlo } from "./hooks/useSimulation";

// Utils
import { resetSessionSeed, setSessionSeed } from "./utils/tax";
import { readStateFromUrl, getShareUrl, encodeState, copyToClipboard } from "./utils/shareState";

// Page Components (non-lazy)
import {
  LandingPage,
  Wizard,
  InfoPage,
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
  const [bijPensioen, setBijPensioen] = useState(urlState?.bijPensioen ?? DEFAULT_BIJ_PENSIOEN);

  // Return inputs
  const [rendEtf, setRendEtf] = useState(urlState?.rendEtf ?? DEFAULT_REND_ETF);
  const [rendCrypto, setRendCrypto] = useState(urlState?.rendCrypto ?? DEFAULT_REND_CRYPTO);
  const [rendSpaar, setRendSpaar] = useState(urlState?.rendSpaar ?? DEFAULT_REND_SPAAR);

  // Situation inputs
  const [jaren, setJaren] = useState(urlState?.jaren ?? DEFAULT_JAREN);
  const [fiscaalPartner, setFiscaalPartner] = useState(urlState?.fiscaalPartner ?? DEFAULT_FISCAAL_PARTNER);
  const [betaalUitSpaar, setBetaalUitSpaar] = useState(urlState?.betaalUitSpaar ?? DEFAULT_BETAAL_UIT_SPAAR);

  // Advanced mode settings
  const [advancedMode, setAdvancedMode] = useState(urlState?.advancedMode ?? DEFAULT_ADVANCED_MODE);
  const [volEtf, setVolEtf] = useState(urlState?.volEtf ?? DEFAULT_VOL_ETF);
  const [volCrypto, setVolCrypto] = useState(urlState?.volCrypto ?? DEFAULT_VOL_CRYPTO);
  const [mcPercentile, setMcPercentile] = useState(50);
  const [mcSeed, setMcSeed] = useState(urlState?.mcSeed ?? DEFAULT_MC_SEED);

  // Initialize seed from URL on mount (separate effect to avoid side effects in useState)
  useEffect(() => {
    if (urlState?.mcSeed) {
      setSessionSeed(urlState.mcSeed);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate new Monte Carlo simulation with new random seed
  const regenerateMC = () => {
    const newSeed = resetSessionSeed();
    setMcSeed(newSeed);
  };

  // Share current state (including mcSeed for reproducible MC)
  const shareState = {
    startEtf, startCrypto, startSpaar, startPensioen,
    bijEtf, bijCrypto, bijPensioen,
    rendEtf, rendCrypto, rendSpaar,
    jaren, fiscaalPartner, betaalUitSpaar,
    advancedMode, volEtf, volCrypto, mcSeed,
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
    bijEtf, bijCrypto, bijPensioen,
    rendEtf, rendCrypto, rendSpaar,
    jaren, fiscaalPartner,
  };
  const paramsKey = JSON.stringify(params);

  // Run simulations (only when on dashboard to avoid unnecessary computation)
  const fMet = useMemo(
    () => view === "dashboard" ? simulate(params, "forfaitair", true, betaalUitSpaar, null) : { data: [] },
    [view === "dashboard" ? paramsKey : null, betaalUitSpaar, view]
  );

  const wMet = useMemo(
    () => view === "dashboard" ? simulate(params, "werkelijk", true, betaalUitSpaar, null) : { data: [] },
    [view === "dashboard" ? paramsKey : null, betaalUitSpaar, view]
  );

  // Monte Carlo for both tax systems (only when advancedMode is on)
  const mcKeyBase = JSON.stringify({ paramsKey, betaalUitSpaar, volEtf, volCrypto, mcSeed });
  const mcDataForfaitair = useMemo(
    () => (view === "dashboard" && advancedMode) ? runMonteCarlo(params, "forfaitair", betaalUitSpaar, volEtf, volCrypto) : [],
    [(view === "dashboard" && advancedMode) ? mcKeyBase : null, view, advancedMode]
  );
  const mcDataWerkelijk = useMemo(
    () => (view === "dashboard" && advancedMode) ? runMonteCarlo(params, "werkelijk", betaalUitSpaar, volEtf, volCrypto) : [],
    [(view === "dashboard" && advancedMode) ? mcKeyBase : null, view, advancedMode]
  );

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
          startPensioen={startPensioen} setStartPensioen={setStartPensioen}
          bijPensioen={bijPensioen} setBijPensioen={setBijPensioen}
          rendEtf={rendEtf} setRendEtf={setRendEtf}
          rendCrypto={rendCrypto} setRendCrypto={setRendCrypto}
          rendSpaar={rendSpaar} setRendSpaar={setRendSpaar}
          jaren={jaren} setJaren={setJaren}
          fiscaalPartner={fiscaalPartner} setFiscaalPartner={setFiscaalPartner}
          advancedMode={advancedMode} setAdvancedMode={setAdvancedMode}
          theme={theme}
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

  // Dashboard view (lazy loaded)
  return (
    <div className={pageClass}>
      <Suspense fallback={<DashboardLoader />}>
        <Dashboard
          jaren={jaren}
          fiscaalPartner={fiscaalPartner}
          setFiscaalPartner={setFiscaalPartner}
          advancedMode={advancedMode}
          setAdvancedMode={setAdvancedMode}
          mcPercentile={mcPercentile}
          setMcPercentile={setMcPercentile}
          fMet={fMet}
          wMet={wMet}
          mcDataForfaitair={mcDataForfaitair}
          mcDataWerkelijk={mcDataWerkelijk}
          regenerateMC={regenerateMC}
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
    </div>
  );
}
