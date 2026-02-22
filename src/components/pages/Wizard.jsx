import { useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import {
  FORFAIT_OVERIG,
  FORFAIT_SPAAR,
  FORFAIT_TARIEF,
  HEFFINGSVRIJ_F,
  HEFFINGSVRIJ_W,
} from '../../constants/tax';
import { formatCurrency, formatNumber, parseNumber } from '../../utils/format';

const fmt = formatCurrency;

/**
 * Large input field for wizard steps
 */
function WizardInput({ label, hint, value, onChange, step = 1000 }) {
  const [raw, setRaw] = useState(String(value));
  const [focus, setFocus] = useState(false);

  // When not focused, show formatted value; when focused, show raw for editing
  const displayValue = focus ? raw : formatNumber(value);

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-mist-600 dark:text-mist-300 mb-2">
        {label}
        {hint && (
          <span className="font-normal text-mist-500 dark:text-mist-400 ml-2">
            ({hint})
          </span>
        )}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500 dark:text-mist-400 text-lg pointer-events-none">
          €
        </span>
        <input
          type={focus ? "number" : "text"}
          value={displayValue}
          step={step}
          min={0}
          onChange={(e) => {
            setRaw(e.target.value);
            const n = parseFloat(e.target.value);
            if (!isNaN(n) && n >= 0) onChange(n);
          }}
          onFocus={(e) => {
            setFocus(true);
            setRaw(String(value));
            setTimeout(() => e.target.select(), 0);
          }}
          onBlur={() => {
            setFocus(false);
            const n = parseNumber(raw);
            const c = n < 0 ? 0 : n;
            onChange(c);
          }}
          className={clsx(
            "w-full py-4 px-4 pl-9",
            "bg-white dark:bg-mist-800",
            "border-2 border-mist-300 dark:border-mist-700",
            "rounded-xl text-xl text-mist-950 dark:text-mist-50",
            "outline-none transition-colors",
            "focus:border-accent"
          )}
        />
      </div>
    </div>
  );
}

WizardInput.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  step: PropTypes.number,
};

/**
 * Slider input for wizard steps
 */
function WizardSlider({ label, value, min, max, step, onChange, format }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2.5">
        <span className="text-sm font-semibold text-mist-600 dark:text-mist-300">{label}</span>
        <span className="text-base font-extrabold text-accent">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 cursor-pointer accent-accent"
      />
      <div className="flex justify-between text-xs text-mist-500 dark:text-mist-400 mt-1.5">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

WizardSlider.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  format: PropTypes.func.isRequired,
};

/**
 * First year tax preview shown during wizard
 */
function FirstYearPreview({
  startEtf, startCrypto, startSpaar,
  rendEtf, rendCrypto, rendSpaar,
  fiscaalPartner
}) {
  const overige = startEtf + startCrypto;
  const totaalB3 = overige + startSpaar;
  const hvF = fiscaalPartner ? HEFFINGSVRIJ_F * 2 : HEFFINGSVRIJ_F;
  const hvW = fiscaalPartner ? HEFFINGSVRIJ_W * 2 : HEFFINGSVRIJ_W;

  // Forfaitair
  const fictief = startSpaar * FORFAIT_SPAAR + overige * FORFAIT_OVERIG;
  const grondslag = Math.max(0, totaalB3 - hvF);
  const factor = totaalB3 > 0 ? grondslag / totaalB3 : 0;
  const belastingF = Math.max(0, fictief * factor * FORFAIT_TARIEF);

  // Werkelijk
  const etfGr = startEtf * rendEtf;
  const cryptoGr = startCrypto * rendCrypto;
  const spaarGr = startSpaar * rendSpaar;
  const werkelijkInkomen = etfGr + cryptoGr + spaarGr;
  const belastingW = Math.max(0, werkelijkInkomen - hvW) * FORFAIT_TARIEF;

  const diff = belastingF - belastingW;
  const werkelijkBetter = diff > 0;

  if (totaalB3 === 0) {
    return (
      <div className="p-6 bg-white dark:bg-mist-900 rounded-2xl border border-mist-200 dark:border-mist-700 text-center">
        <div className="text-base text-mist-500 dark:text-mist-400">
          Vul eerst je vermogen in om de belasting te berekenen.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-mist-900 rounded-2xl border border-mist-200 dark:border-mist-700">
      <div className="text-xs font-bold text-mist-500 dark:text-mist-400 tracking-wider uppercase mb-5">
        Belasting eerste jaar (2028)
      </div>

      <div className="flex gap-5 flex-wrap mb-5">
        <div className="flex-1 min-w-[140px]">
          <div className="text-xs font-semibold text-forfaitair uppercase mb-1">
            Forfaitair
          </div>
          <div className="text-3xl font-black text-mist-950 dark:text-mist-50">
            {fmt(Math.round(belastingF))}
          </div>
        </div>
        <div className="flex-1 min-w-[140px]">
          <div className="text-xs font-semibold text-purple-500 uppercase mb-1">
            Werkelijk
          </div>
          <div className="text-3xl font-black text-mist-950 dark:text-mist-50">
            {fmt(Math.round(belastingW))}
          </div>
        </div>
      </div>

      <div className={clsx(
        "p-3.5 rounded-xl text-sm font-semibold",
        werkelijkBetter
          ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
          : "bg-amber-50 dark:bg-amber-950/30 text-accent"
      )}>
        {werkelijkBetter
          ? `Je betaalt ${fmt(Math.round(Math.abs(diff)))} minder onder werkelijk rendement.`
          : diff < 0
            ? `Je betaalt ${fmt(Math.round(Math.abs(diff)))} meer onder werkelijk rendement.`
            : "De belasting is gelijk onder beide stelsels."
        }
      </div>

      <div className="mt-4 text-xs text-mist-500 dark:text-mist-400 leading-relaxed">
        Dit is op basis van je huidige vermogen en verwachte rendementen.
        Op de volgende stap kun je de lange termijn impact bekijken.
      </div>
    </div>
  );
}

FirstYearPreview.propTypes = {
  startEtf: PropTypes.number.isRequired,
  startCrypto: PropTypes.number.isRequired,
  startSpaar: PropTypes.number.isRequired,
  rendEtf: PropTypes.number.isRequired,
  rendCrypto: PropTypes.number.isRequired,
  rendSpaar: PropTypes.number.isRequired,
  fiscaalPartner: PropTypes.bool.isRequired,
};

/**
 * Step-by-step wizard for entering asset information
 */
export function Wizard({
  step, setStep, onComplete, onBack,
  startEtf, setStartEtf, bijEtf, setBijEtf,
  startCrypto, setStartCrypto, bijCrypto, setBijCrypto,
  startSpaar, setStartSpaar,
  startPensioen, setStartPensioen, bijPensioen, setBijPensioen,
  rendEtf, rendCrypto, rendSpaar,
  jaren, setJaren, fiscaalPartner, setFiscaalPartner,
  advancedMode, setAdvancedMode,
}) {
  const totalSteps = 7;
  const progress = (step / totalSteps) * 100;

  const stepConfig = {
    1: { icon: "📈", title: "ETFs / Aandelen", description: "Hoeveel heb je belegd in ETFs of aandelen, en hoeveel leg je jaarlijks in?" },
    2: { icon: "🪙", title: "Crypto", description: "Hoeveel heb je in cryptocurrency, en hoeveel leg je jaarlijks bij?" },
    3: { icon: "💶", title: "Spaargeld", description: "Hoeveel spaargeld heb je op je spaarrekening(en)?" },
    4: { icon: "🏦", title: "Pensioenbeleggen", description: "Hoeveel heb je belegd via pensioenbeleggen? Dit vermogen is vrijgesteld van box 3." },
    5: { icon: "📊", title: "Eerste jaar verschil", description: "Dit is het verschil in belasting voor het eerste jaar, op basis van je vermogen." },
    6: { icon: "⏱️", title: "Tijdshorizon", description: "Over hoeveel jaar wil je het verschil berekenen?" },
    7: { icon: "🎯", title: "Berekeningswijze", description: "Kies hoe gedetailleerd je de resultaten wilt zien." },
  };

  const config = stepConfig[step];

  const handleNext = () => step < totalSteps ? setStep(step + 1) : onComplete();
  const handleBack = () => step > 1 ? setStep(step - 1) : onBack();

  const handleSkip = () => {
    if (step === 1) { setStartEtf(0); setBijEtf(0); }
    if (step === 2) { setStartCrypto(0); setBijCrypto(0); }
    if (step === 3) { setStartSpaar(0); }
    if (step === 4) { setStartPensioen(0); setBijPensioen(0); }
    handleNext();
  };

  const canSkip = step <= 4;

  const skipLabels = {
    1: "Ik heb geen ETFs of aandelen",
    2: "Ik heb geen crypto",
    3: "Ik heb geen spaargeld",
    4: "Ik heb geen pensioenbeleggingen",
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-xl">
        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-mist-500 dark:text-mist-400">
              Stap {step} van {totalSteps}
            </span>
            <span className="text-sm text-mist-500 dark:text-mist-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 bg-mist-200 dark:bg-mist-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8">
          <div className="text-4xl mb-4">{config.icon}</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-mist-950 dark:text-mist-50 mb-3 tracking-tight">
            {config.title}
          </h2>
          <p className="text-base text-mist-500 dark:text-mist-400 leading-relaxed mb-8">
            {config.description}
          </p>

          {step === 1 && (
            <>
              <WizardInput label="Huidig vermogen" value={startEtf} onChange={setStartEtf} />
              <WizardInput label="Jaarlijkse inleg" value={bijEtf} onChange={setBijEtf} step={500} />
            </>
          )}

          {step === 2 && (
            <>
              <WizardInput label="Huidig vermogen" value={startCrypto} onChange={setStartCrypto} />
              <WizardInput label="Jaarlijkse inleg" value={bijCrypto} onChange={setBijCrypto} step={500} />
            </>
          )}

          {step === 3 && (
            <WizardInput label="Spaargeld" value={startSpaar} onChange={setStartSpaar} />
          )}

          {step === 4 && (
            <>
              <WizardInput label="Huidig vermogen" hint="vrijgesteld" value={startPensioen} onChange={setStartPensioen} />
              <WizardInput label="Jaarlijkse inleg" value={bijPensioen} onChange={setBijPensioen} step={500} />
            </>
          )}

          {step === 5 && (
            <>
              <FirstYearPreview
                startEtf={startEtf}
                startCrypto={startCrypto}
                startSpaar={startSpaar}
                rendEtf={rendEtf}
                rendCrypto={rendCrypto}
                rendSpaar={rendSpaar}
                fiscaalPartner={fiscaalPartner}
              />
              <div className="mt-5">
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-mist-900 rounded-xl border border-mist-200 dark:border-mist-700">
                  <button
                    onClick={() => setFiscaalPartner(!fiscaalPartner)}
                    className={clsx(
                      "w-12 h-6.5 rounded-full relative shrink-0 transition-colors cursor-pointer border-none",
                      fiscaalPartner ? "bg-accent" : "bg-mist-300 dark:bg-mist-600"
                    )}
                  >
                    <div className={clsx(
                      "w-5 h-5 rounded-full bg-white absolute top-0.75 transition-[left]",
                      fiscaalPartner ? "left-6" : "left-0.75"
                    )} />
                  </button>
                  <div>
                    <div className="text-sm text-mist-950 dark:text-mist-50 font-semibold">
                      Fiscaal partner
                    </div>
                    <div className="text-sm text-mist-500 dark:text-mist-400">
                      Verdubbelt heffingsvrij vermogen
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[10, 25, 40].map((y) => (
                  <button
                    key={y}
                    onClick={() => setJaren(y)}
                    className={clsx(
                      "py-5 px-4 text-lg font-bold rounded-xl transition-all cursor-pointer",
                      jaren === y
                        ? "bg-accent text-white border-2 border-accent"
                        : "bg-white dark:bg-mist-900 text-mist-950 dark:text-mist-50 border-2 border-mist-200 dark:border-mist-700 hover:border-accent"
                    )}
                  >
                    {y} jaar
                  </button>
                ))}
              </div>
              <WizardSlider
                label="Of kies zelf"
                value={jaren}
                min={5}
                max={40}
                step={1}
                onChange={setJaren}
                format={(v) => `${v} jaar`}
              />
            </>
          )}

          {step === 7 && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setAdvancedMode(false)}
                className={clsx(
                  "p-6 rounded-2xl cursor-pointer text-left border-2 transition-colors",
                  !advancedMode
                    ? "bg-accent/10 border-accent"
                    : "bg-white dark:bg-mist-900 border-mist-200 dark:border-mist-700"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📊</span>
                  <span className={clsx(
                    "text-lg font-bold",
                    !advancedMode ? "text-accent" : "text-mist-950 dark:text-mist-50"
                  )}>
                    Eenvoudig
                  </span>
                  {!advancedMode && (
                    <span className="text-xs font-bold px-2.5 py-1 bg-accent text-white rounded-full">
                      Aanbevolen
                    </span>
                  )}
                </div>
                <div className="text-sm text-mist-500 dark:text-mist-400 leading-relaxed">
                  Duidelijk overzicht van eindvermogen en belastingverschil. Geschikt voor de meeste situaties.
                </div>
              </button>

              <button
                onClick={() => setAdvancedMode(true)}
                className={clsx(
                  "p-6 rounded-2xl cursor-pointer text-left border-2 transition-colors",
                  advancedMode
                    ? "bg-accent/10 border-accent"
                    : "bg-white dark:bg-mist-900 border-mist-200 dark:border-mist-700"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🎲</span>
                  <span className={clsx(
                    "text-lg font-bold",
                    advancedMode ? "text-accent" : "text-mist-950 dark:text-mist-50"
                  )}>
                    Geavanceerd
                  </span>
                </div>
                <div className="text-sm text-mist-500 dark:text-mist-400 leading-relaxed">
                  Inclusief Monte Carlo simulaties, volatiliteit instellingen, en gedetailleerde scenario-analyse.
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleBack}
            className={clsx(
              "py-3.5 px-6 text-base font-semibold rounded-xl cursor-pointer",
              "bg-transparent text-mist-600 dark:text-mist-300",
              "border-2 border-mist-200 dark:border-mist-700",
              "hover:border-mist-300 dark:hover:border-mist-600",
              "transition-colors"
            )}
          >
            Terug
          </button>

          {canSkip && (
            <button
              onClick={handleSkip}
              className="py-3.5 px-6 text-base font-semibold text-mist-500 dark:text-mist-400 border-none bg-transparent cursor-pointer hover:text-mist-700 dark:hover:text-mist-300 transition-colors"
            >
              {skipLabels[step]}
            </button>
          )}

          <button
            onClick={handleNext}
            className={clsx(
              "py-3.5 px-8 text-base font-bold rounded-xl cursor-pointer ml-auto",
              "bg-accent text-white",
              "shadow-lg shadow-accent/30",
              "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/40",
              "transition-all duration-150"
            )}
          >
            {step === totalSteps ? "Bekijk resultaten" : "Volgende"}
          </button>
        </div>
      </div>
    </div>
  );
}

Wizard.propTypes = {
  step: PropTypes.number.isRequired,
  setStep: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  startEtf: PropTypes.number.isRequired,
  setStartEtf: PropTypes.func.isRequired,
  bijEtf: PropTypes.number.isRequired,
  setBijEtf: PropTypes.func.isRequired,
  startCrypto: PropTypes.number.isRequired,
  setStartCrypto: PropTypes.func.isRequired,
  bijCrypto: PropTypes.number.isRequired,
  setBijCrypto: PropTypes.func.isRequired,
  startSpaar: PropTypes.number.isRequired,
  setStartSpaar: PropTypes.func.isRequired,
  startPensioen: PropTypes.number.isRequired,
  setStartPensioen: PropTypes.func.isRequired,
  bijPensioen: PropTypes.number.isRequired,
  setBijPensioen: PropTypes.func.isRequired,
  rendEtf: PropTypes.number.isRequired,
  rendCrypto: PropTypes.number.isRequired,
  rendSpaar: PropTypes.number.isRequired,
  jaren: PropTypes.number.isRequired,
  setJaren: PropTypes.func.isRequired,
  fiscaalPartner: PropTypes.bool.isRequired,
  setFiscaalPartner: PropTypes.func.isRequired,
  advancedMode: PropTypes.bool.isRequired,
  setAdvancedMode: PropTypes.func.isRequired,
};
