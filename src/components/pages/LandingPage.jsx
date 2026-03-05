import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import {
  DEFAULT_START_ETF,
  DEFAULT_START_CRYPTO,
  DEFAULT_START_SPAAR,
  DEFAULT_START_PENSIOEN,
  DEFAULT_BIJ_ETF,
  DEFAULT_BIJ_CRYPTO,
  DEFAULT_BIJ_PENSIOEN,
} from '../../constants/tax';

// CBS/DNB-gebaseerde presets
const PRESETS = {
  mediaan: {
    label: "Mediaan box 3",
    description: "€75k vermogen",
    startEtf: DEFAULT_START_ETF,
    startCrypto: DEFAULT_START_CRYPTO,
    startSpaar: DEFAULT_START_SPAAR,
    startPensioen: DEFAULT_START_PENSIOEN,
    bijEtf: DEFAULT_BIJ_ETF,
    bijCrypto: DEFAULT_BIJ_CRYPTO,
    bijPensioen: DEFAULT_BIJ_PENSIOEN,
  },
  gemiddeld: {
    label: "Gemiddeld box 3",
    description: "€165k vermogen",
    startEtf: 110000,
    startCrypto: 5000,
    startSpaar: 50000,
    startPensioen: 40000,
    bijEtf: 6000,
    bijCrypto: 0,
    bijPensioen: 4000,
  },
};

export function LandingPage({ onStartWizard, onStartWithPreset, onShowInfo, darkMode, setDarkMode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="max-w-xl">
        {/* News banner */}
        <a
          href="https://fd.nl/politiek/1587585/heinen-gaat-wetsvoorstel-box-3-toch-aanpassen-na-verzet-senaat"
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            "block mb-6 px-4 py-3 rounded-xl",
            "bg-amber-50 dark:bg-amber-900/30",
            "border border-amber-200 dark:border-amber-700/50",
            "text-amber-800 dark:text-amber-200",
            "hover:bg-amber-100 dark:hover:bg-amber-900/50",
            "transition-colors duration-150"
          )}
        >
          <div className="text-sm font-medium">
            <span className="font-bold">Nieuws:</span> Minister Heinen gaat wetsvoorstel box 3 aanpassen na verzet Eerste Kamer
          </div>
          <div className="text-xs mt-1 text-amber-600 dark:text-amber-300">
            Lees meer op FD.nl →
          </div>
        </a>

        {/* Hero heading */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-mist-950 dark:text-mist-50 mb-5 leading-tight">
          Wat betekent het nieuwe box 3-stelsel voor jou?
        </h1>

        {/* Subheading */}
        <p className="text-lg text-mist-600 dark:text-mist-300 leading-relaxed mb-3">
          Vanaf 2028 wordt vermogen in box 3 belast op basis van{" "}
          <strong className="text-mist-950 dark:text-mist-50">werkelijk rendement</strong> —
          inclusief ongerealiseerde koerswinst. Deze calculator laat zien wat het
          verschil is met het huidige forfaitaire stelsel.
        </p>
        <p className="text-base text-mist-500 dark:text-mist-400 leading-relaxed mb-10">
          Vul je vermogen en verwachte rendementen in, en zie direct de impact over
          jouw tijdshorizon.
        </p>

        {/* CTA buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={onStartWizard}
            className={clsx(
              "px-8 py-4 text-base font-bold rounded-xl",
              "bg-accent text-white",
              "shadow-lg shadow-accent/30",
              "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/40",
              "transition-all duration-150",
              "cursor-pointer"
            )}
          >
            Begin met invullen
          </button>
          <button
            onClick={onShowInfo}
            className={clsx(
              "px-8 py-4 text-base font-bold rounded-xl",
              "bg-transparent text-mist-600 dark:text-mist-300",
              "border-2 border-mist-200 dark:border-mist-700",
              "hover:border-accent hover:text-accent dark:hover:border-accent dark:hover:text-accent",
              "transition-colors duration-150",
              "cursor-pointer"
            )}
          >
            Meer informatie
          </button>
        </div>

        {/* Preset shortcuts */}
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <div className="w-full text-sm text-mist-500 dark:text-mist-400 mb-1">
            Of begin met een voorbeeldprofiel:
          </div>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => onStartWithPreset(preset)}
              className={clsx(
                "px-5 py-3 text-sm font-semibold rounded-xl text-left",
                "bg-white dark:bg-mist-900",
                "border border-mist-200 dark:border-mist-700",
                "text-mist-950 dark:text-mist-50",
                "hover:border-accent hover:bg-mist-50 dark:hover:bg-mist-800",
                "transition-colors duration-150",
                "cursor-pointer"
              )}
            >
              <div className="font-bold">{preset.label}</div>
              <div className="text-xs text-mist-500 dark:text-mist-400 mt-0.5">
                {preset.description}
              </div>
            </button>
          ))}
        </div>

        {/* Trust badge */}
        <div className="mt-12 text-sm text-mist-500 dark:text-mist-400 flex items-center justify-center gap-2">
          <span className="text-base">🔒</span>
          Geen cookies. Geen trackers. Alles blijft in je browser.
        </div>

        {/* Disclaimer */}
        <div className="mt-6 text-sm text-mist-500 dark:text-mist-400 max-w-md mx-auto">
          Deze calculator is voor informatieve doeleinden en niet gelieerd aan de Nederlandse overheid of enig andere instelling. Er kunnen aan de uitkomsten geen rechten worden ontleend.
        </div>

        {/* Theme toggle */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setDarkMode(darkMode === "dark" ? "light" : darkMode === "light" ? "system" : "dark")}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5",
              "bg-white dark:bg-mist-900",
              "border border-mist-200 dark:border-mist-700",
              "rounded-xl text-sm text-mist-600 dark:text-mist-300",
              "hover:border-mist-300 dark:hover:border-mist-600",
              "transition-colors duration-150",
              "cursor-pointer"
            )}
          >
            {darkMode === "dark" ? "🌙" : darkMode === "light" ? "☀️" : "💻"}
            <span>
              {darkMode === "dark" ? "Donker" : darkMode === "light" ? "Licht" : "Systeem"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

LandingPage.propTypes = {
  onStartWizard: PropTypes.func.isRequired,
  onStartWithPreset: PropTypes.func.isRequired,
  onShowInfo: PropTypes.func.isRequired,
  darkMode: PropTypes.string.isRequired,
  setDarkMode: PropTypes.func.isRequired,
};
