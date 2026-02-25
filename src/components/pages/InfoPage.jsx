import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { InfoBlock } from '../ui';

/**
 * Information page explaining Box 3 tax changes
 */
export function InfoPage({ onBack, onStartWizard, darkMode, setDarkMode }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button
          onClick={onBack}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5",
            "bg-white dark:bg-mist-900",
            "border border-mist-200 dark:border-mist-700",
            "rounded-lg text-sm text-mist-950 dark:text-mist-50",
            "hover:border-mist-300 dark:hover:border-mist-600",
            "transition-colors cursor-pointer"
          )}
        >
          ← Terug
        </button>
        <button
          onClick={() => setDarkMode(darkMode === "dark" ? "light" : darkMode === "light" ? "system" : "dark")}
          className={clsx(
            "w-10 h-10 rounded-xl",
            "bg-white dark:bg-mist-900",
            "border border-mist-200 dark:border-mist-700",
            "flex items-center justify-center text-lg",
            "hover:border-mist-300 dark:hover:border-mist-600",
            "transition-colors cursor-pointer"
          )}
        >
          {darkMode === "dark" ? "🌙" : darkMode === "light" ? "☀️" : "💻"}
        </button>
      </div>

      {/* Intro section */}
      <div className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-mist-950 dark:text-mist-50 mb-3">
          Wat verandert er in box 3?
        </h1>
        <p className="text-base text-mist-600 dark:text-mist-300 leading-relaxed mb-4">
          Vanaf 2028 wil de overheid vermogen in box 3 belasten op basis van{" "}
          <strong className="text-mist-950 dark:text-mist-50">werkelijk rendement</strong> in plaats van het
          huidige <strong className="text-mist-950 dark:text-mist-50">forfait</strong>. Dat betekent dat niet
          langer een fictief percentage, maar je daadwerkelijke koerswinsten, dividenden en
          rente de grondslag vormen — inclusief{" "}
          <strong className="text-mist-950 dark:text-mist-50">ongerealiseerde koerswinst</strong>.
        </p>
        <p className="text-base text-mist-600 dark:text-mist-300 leading-relaxed mb-4">
          Deze calculator laat zien wat het verschil is tussen beide stelsels over een
          zelfgekozen tijdshorizon van 5 tot 40 jaar voor Nederlandse belastingbetalers met spaargeld, beleggingen en/of crypto.
        </p>
        <p className="text-base text-mist-600 dark:text-mist-300 leading-relaxed">
          Er bestaan verschillende uitzonderingen in het wetvoorstel voor vastgoed (naast de eigen woning in box 1), investeringen in startups en uitgeleend geld. Die situaties hebben we buiten beschouwing gelaten om deze calculator niet nodeloos ingewikkeld te maken.
        </p>
      </div>

      {/* InfoBlocks */}
      <InfoBlock title="Forfaitair vs Werkelijk rendement">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          <p className="mb-4">
            Nederland schakelt in 2028 over van het <strong>forfaitaire stelsel</strong> (fictief rendement) naar
            <strong> werkelijk rendement</strong> (daadwerkelijke opbrengsten).
          </p>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-forfaitair/10 rounded-xl border border-forfaitair/30">
              <div className="text-xs font-bold text-forfaitair uppercase tracking-wide mb-2">Forfaitair (t/m 2027)</div>
              <div className="text-sm space-y-1.5">
                <div>• <strong>Fictief rendement:</strong> 6% beleggingen, 1,3% spaargeld</div>
                <div>• <strong>Heffingsvrij:</strong> €61k vermogen/persoon</div>
                <div>• <strong>Tarief:</strong> 36% over fictief rendement</div>
              </div>
            </div>
            <div className="p-3 bg-werkelijk/10 rounded-xl border border-werkelijk/30">
              <div className="text-xs font-bold text-werkelijk uppercase tracking-wide mb-2">Werkelijk rendement (2028+)</div>
              <div className="text-sm space-y-1.5">
                <div>• <strong>Daadwerkelijk rendement:</strong> rente, dividend, <span className="text-red-600 dark:text-red-400">ongerealiseerde winst</span></div>
                <div>• <strong>Heffingsvrij:</strong> ~€1,8k inkomen/persoon</div>
                <div>• <strong>Tarief:</strong> 36% over werkelijk rendement</div>
                <div>• <strong>Verliesverrekening:</strong> &gt;€500 voorwaarts</div>
              </div>
            </div>
          </div>

          {/* Example calculation */}
          <div className="mb-3 p-3 bg-mist-100 dark:bg-mist-800 rounded-xl border border-mist-200 dark:border-mist-700">
            <div className="text-sm font-semibold text-mist-950 dark:text-mist-50 mb-2">Rekenvoorbeeld: €100k ETFs, 7% rendement (€7k winst)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <strong className="text-forfaitair">Forfaitair:</strong> 6% forfait = €6k → Na heffingsvrij (€39k × 6%) = €2.340 → <strong>€842 belasting</strong>
              </div>
              <div>
                <strong className="text-werkelijk">Werkelijk:</strong> €7k winst → Na heffingsvrij (€7k - €1,8k) = €5,2k → <strong>€1.872 belasting</strong>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/30 text-sm">
            <strong className="text-amber-700 dark:text-amber-400">Kantelpunt ~6%:</strong> Werkelijk rendement &gt;6% = meer belasting,
            &lt;6% = minder belasting dan forfaitair
          </div>
        </div>
      </InfoBlock>

      <InfoBlock title="Waarom ongerealiseerde winst?">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">⚖️ Hoge Raad 2021</div>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              Forfaitair stelsel in strijd met eigendomsrecht als werkelijk rendement structureel lager ligt.
              Nieuwe basis voor box 3 nodig.
            </div>
          </div>
          <p className="mb-3 text-sm">
            <strong>Gerealiseerde winst (bij verkoop)?</strong> Zou vereisen dat banken per transactie aan-/verkoopprijs
            rapporteren. <strong>Ongerealiseerde winst?</strong> Banken rapporteren al saldo begin/eind jaar — praktischer uitvoerbaar.
          </p>
          <p className="text-sm text-mist-500 dark:text-mist-400">
            Nederland wordt hiermee een van de weinige landen die ongerealiseerde koerswinst jaarlijks belast. Internationaal opvallend.
          </p>
        </div>
      </InfoBlock>

      <InfoBlock title="Voorspelbaarheid vs. onzekerheid">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-forfaitair/10 rounded-xl border border-forfaitair/30">
              <div className="text-xs font-bold text-forfaitair mb-2">✅ Forfaitair</div>
              <div className="text-sm space-y-1">
                <div>• Voorspelbaar tarief</div>
                <div>• Geen administratie</div>
                <div className="text-red-600 dark:text-red-400">• Oneerlijk bij &lt;6% rendement</div>
                <div className="text-red-600 dark:text-red-400">• Juridisch kwetsbaar</div>
              </div>
            </div>
            <div className="p-3 bg-werkelijk/10 rounded-xl border border-werkelijk/30">
              <div className="text-xs font-bold text-werkelijk mb-2">✅ Werkelijk rendement</div>
              <div className="text-sm space-y-1">
                <div>• Eerlijk voor spaarders</div>
                <div>• Verliesverrekening</div>
                <div className="text-red-600 dark:text-red-400">• Onvoorspelbaar (markt)</div>
                <div className="text-red-600 dark:text-red-400">• Complexe administratie</div>
                <div className="text-red-600 dark:text-red-400">• Liquiditeitsproblemen</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm mb-3">
            <div>
              <strong className="text-mist-950 dark:text-mist-50">Beleggers:</strong> Belastingaanslag fluctueert sterk per jaar.
              Goed beursjaar = fors meer, slecht jaar = mogelijk niets + verliesverrekening.
            </div>
            <div>
              <strong className="text-mist-950 dark:text-mist-50">Belastingdienst:</strong> Enorme complexiteit: DCA-kostprijs,
              waardering illiquide assets, buitenlandse brokers, crypto, verliesverrekening → meer fouten en bezwaarprocedures.
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/30 text-sm">
            💡 Gebruik marktscenario's (bull, crash, volatiel) om belastingvariatie te zien.
            Geavanceerde analyse toont cash buffer impact en gedwongen verkoop.
          </div>
        </div>
      </InfoBlock>

      <InfoBlock title="Wat berekent deze calculator?">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          <div className="mb-3 p-3 bg-werkelijk/10 rounded-xl border border-werkelijk/30">
            <div className="text-xs font-bold text-werkelijk uppercase tracking-wide mb-2">✓ Ondersteund</div>
            <div className="text-sm space-y-1">
              <div>• Spaargeld, ETFs/aandelen, crypto</div>
              <div>• Jaarlijkse bijstortingen</div>
              <div>• Fiscaal partnerschap (2× vrijstellingen)</div>
              <div>• Verliesverrekening (&gt;€500, voorwaarts)</div>
              <div>• Marktscenario's: bull, crash 2029, volatiel, stagnatie</div>
              <div>• Geavanceerde analyse: cash buffer, gedwongen verkoop</div>
              <div>• Tijdshorizon: 5-40 jaar</div>
            </div>
          </div>

          <div className="p-3 bg-mist-100 dark:bg-mist-800 rounded-xl border border-mist-200 dark:border-mist-700">
            <div className="text-xs font-bold text-mist-950 dark:text-mist-50 uppercase tracking-wide mb-2">✗ Niet ondersteund</div>
            <div className="text-sm space-y-1">
              <div>• Vastgoed (box 3): andere waarderingsregels</div>
              <div>• Startups: winst pas bij verkoop belast</div>
              <div>• Uitgeleend geld en schulden</div>
              <div>• Groene beleggingen (vrijstellingen vervallen 2028)</div>
              <div>• Achterwaartse verliesverrekening</div>
            </div>
          </div>
        </div>
      </InfoBlock>

      <InfoBlock title="Box 2 (BV) vs Box 3: wat is gunstiger?">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          <p className="mb-4">
            Met het nieuwe werkelijk rendement stelsel wordt beleggen via een BV (box 2) relatief aantrekkelijker
            dan privé beleggen (box 3), omdat box 3 nu ook ongerealiseerde winsten jaarlijks belast à 36%.
          </p>

          {/* Simplified comparison */}
          <div className="mb-4 p-4 bg-mist-100 dark:bg-mist-800 rounded-xl border border-mist-200 dark:border-mist-700">
            <div className="text-sm font-bold text-mist-950 dark:text-mist-50 mb-3">Het verschil in één oogopslag</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-forfaitair mb-1.5">📊 Box 2 (BV)</div>
                <div className="space-y-1">
                  <div>• <strong>19%</strong> VPB over winst (t/m €200k)</div>
                  <div>• Alleen bij realisatie</div>
                  <div>• <strong>+26,9%</strong> bij uitkering</div>
                  <div className="text-xs text-mist-500 dark:text-mist-400 mt-1">BV-kosten: ~€2k/jaar</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-werkelijk mb-1.5">💰 Box 3 (privé)</div>
                <div className="space-y-1">
                  <div>• <strong>36%</strong> over werkelijk rendement</div>
                  <div>• Ook ongerealiseerde winst</div>
                  <div>• Direct beschikbaar</div>
                  <div className="text-xs text-mist-500 dark:text-mist-400 mt-1">Geen extra kosten</div>
                </div>
              </div>
            </div>
          </div>

          {/* Single year calculation */}
          <div className="mb-4">
            <div className="text-sm font-bold text-mist-950 dark:text-mist-50 mb-2">Per jaar: €100k belegd, 7% rendement (€7k winst)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-forfaitair/10 rounded-xl border border-forfaitair/30">
                <div className="text-xs font-semibold text-forfaitair mb-1">BV (binnen houden)</div>
                <div className="text-sm">VPB 19%: <strong>€1.330</strong></div>
                <div className="text-xs text-mist-500 dark:text-mist-400 mt-1">Netto: €5.670 herbeleggen</div>
              </div>
              <div className="p-3 bg-werkelijk/10 rounded-xl border border-werkelijk/30">
                <div className="text-xs font-semibold text-werkelijk mb-1">Box 3 (privé)</div>
                <div className="text-sm">Box 3 36%: <strong>€2.520</strong></div>
                <div className="text-xs text-mist-500 dark:text-mist-400 mt-1">Netto: €4.480 direct beschikbaar</div>
              </div>
            </div>
          </div>

          {/* Break-even */}
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
            <div className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2">⚖️ Break-even: ~12 jaar</div>
            <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1.5">
              <div>
                <strong>Na 10 jaar</strong> (mét uitkering): BV €154k vs Box 3 €155k → Box 3 nog €900 voordeliger
              </div>
              <div>
                <strong>Na 12+ jaar</strong> (mét uitkering): BV wordt voordeliger door compound effect (19% VPB laat meer kapitaal over dan 36% box 3)
              </div>
              <div className="text-xs pt-1">
                💡 BV loont pas bij 15+ jaar horizon én als je kapitaal niet nodig hebt. BV-kosten (~€2k/jaar)
                eten fiscaal voordeel op bij &lt;€200k vermogen.
              </div>
            </div>
          </div>

          <p className="text-sm text-mist-700 dark:text-mist-300">
            <strong>Conclusie:</strong> Box 2 (BV) is fiscaal gunstiger op lange termijn als je winst binnen de BV houdt.
            Box 3 is eenvoudiger en geeft directe toegang tot kapitaal. Het nieuwe werkelijk rendement stelsel
            (36% op ongerealiseerde winst) maakt BV relatief aantrekkelijker.
          </p>
        </div>
      </InfoBlock>

      {/* Disclaimer */}
      <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30">
        <div className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2">
          Disclaimer
        </div>
        <div className="text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed">
          Het heffingsvrij inkomen onder werkelijk rendement (~€1.800) is een{" "}
          <strong>schatting</strong> op basis van het wetsvoorstel. De wet is aangenomen
          door de Tweede Kamer en ligt momenteel ter behandeling bij de Eerste Kamer. Alle
          berekeningen zijn indicatief en vormen geen financiëel advies. Deze tool is niet
          geaffilieerd met de overheid of enige andere instelling.
        </div>
      </div>

      {/* Privacy */}
      <div className="mb-4 p-4 rounded-xl bg-white dark:bg-mist-900 border border-mist-200 dark:border-mist-700">
        <div className="text-sm font-bold text-mist-950 dark:text-mist-50 mb-2">
          Jouw gegevens blijven bij jou
        </div>
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          Alles wat je invult blijft in je eigen browser. Wij slaan niets op, loggen niets
          en sturen niets door. Er zijn geen cookies, geen trackers en geen account nodig.
        </div>
      </div>

      <InfoBlock title="Standaardwaarden in de calculator">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          <p className="mb-3">
            De standaardwaarden zijn gebaseerd op CBS- en DNB-cijfers. We gebruiken de{" "}
            <strong className="text-mist-950 dark:text-mist-50">mediaan</strong> als uitgangspunt, niet het gemiddelde.
            Waarom? Het gemiddelde vermogen in Nederland (€333.500) wordt sterk omhoog getrokken door
            de allerrijksten. De mediaan (€135.500) geeft een realistischer beeld van de "typische"
            Nederlander.
          </p>

          {/* Mediaan vs Gemiddeld comparison */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="flex-1 min-w-[200px] p-3.5 bg-accent/10 rounded-xl border border-accent/30">
              <div className="text-xs font-bold text-accent uppercase tracking-wide mb-2">
                Mediaan box 3 (standaard)
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
                <span>ETF/aandelen</span>
                <span className="text-mist-950 dark:text-mist-50 font-semibold text-right">€50.000</span>
                <span>Spaargeld</span>
                <span className="text-mist-950 dark:text-mist-50 font-semibold text-right">€25.000</span>
                <span>Crypto</span>
                <span className="text-mist-950 dark:text-mist-50 font-semibold text-right">€0</span>
                <span>Pensioenbeleggen</span>
                <span className="text-mist-950 dark:text-mist-50 font-semibold text-right">€20.000</span>
                <span className="font-bold mt-1">Totaal</span>
                <span className="font-bold mt-1 text-accent text-right">€75.000</span>
              </div>
            </div>

            <div className="flex-1 min-w-[200px] p-3.5 bg-mist-100 dark:bg-mist-800 rounded-xl border border-mist-200 dark:border-mist-700">
              <div className="text-xs font-bold text-mist-500 dark:text-mist-400 uppercase tracking-wide mb-2">
                Gemiddeld box 3
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
                <span>ETF/aandelen</span>
                <span className="text-mist-950 dark:text-mist-50 font-semibold text-right">€110.000</span>
                <span>Spaargeld</span>
                <span className="text-mist-950 dark:text-mist-50 font-semibold text-right">€50.000</span>
                <span>Crypto</span>
                <span className="text-mist-950 dark:text-mist-50 font-semibold text-right">€5.000</span>
                <span>Pensioenbeleggen</span>
                <span className="text-mist-950 dark:text-mist-50 font-semibold text-right">€40.000</span>
                <span className="font-bold mt-1">Totaal</span>
                <span className="font-bold mt-1 text-right">€165.000</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-mist-500 dark:text-mist-400">
            CBS cijfers 2024: mediaan spaargeld €21.500 (gemiddelde €54.700), mediaan effecten €15.000
            (gemiddelde €108.800). Box 3-plichtigen hebben per definitie meer vermogen dan het heffingsvrij
            vermogen van €57.684. Slechts ~14% van Nederlanders bezit crypto, met een gemiddelde investering
            onder €1.000 — daarom staat crypto bij de mediaan op €0.
          </p>
        </div>
      </InfoBlock>

      <InfoBlock title="Bronnen">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-loose">
          <div className="font-semibold text-mist-950 dark:text-mist-50 mb-1 mt-2">Wetgeving</div>
          <div>
            <a
              href="https://www.eerstekamer.nl/wetsvoorstel/36748_wet_werkelijk_rendement_box"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Wet werkelijk rendement box 3 (36748)
            </a>
            {" "}— eerstekamer.nl
          </div>
          <div>
            <a
              href="https://www.tweedekamer.nl/kamerstukken/wetsvoorstellen/detail?id=2025Z09723&dossier=36748"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Wetsvoorstel werkelijk rendement box 3
            </a>
            {" "}— tweedekamer.nl
          </div>
          <div>
            <a
              href="https://www.rijksoverheid.nl/onderwerpen/inkomstenbelasting/plannen-werkelijk-rendement-box-3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Plannen werkelijk rendement box 3
            </a>
            {" "}— rijksoverheid.nl
          </div>
          <div>
            <a
              href="https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/met-welke-percentages-is-het-fictief-rendement-berekend"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Forfaitaire rendementspercentages
            </a>
            {" "}— belastingdienst.nl
          </div>
          <div className="font-semibold text-mist-950 dark:text-mist-50 mb-1 mt-4">Statistieken</div>
          <div>
            <a
              href="https://longreads.cbs.nl/materiele-welvaart-in-nederland-2024/vermogen-van-huishoudens/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Vermogen van huishoudens 2024
            </a>
            {" "}— cbs.nl
          </div>
          <div>
            <a
              href="https://www.dnb.nl/statistieken/dashboards/effectenbezit-nederlandse-huishoudens/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Effectenbezit Nederlandse huishoudens
            </a>
            {" "}— dnb.nl
          </div>
          <div>
            <a
              href="https://www.dnb.nl/algemeen-nieuws/statistiek/2026/waarde-nederlandse-indirecte-cryptobeleggingen-groeit-tot-ruim-1-miljard/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Cryptobeleggingen Nederlandse huishoudens
            </a>
            {" "}— dnb.nl
          </div>
        </div>
      </InfoBlock>

      {/* CTA button */}
      <button
        onClick={onStartWizard}
        className={clsx(
          "inline-flex items-center gap-2",
          "px-7 py-3.5 mt-2 mb-6",
          "bg-accent text-white",
          "rounded-xl text-base font-bold",
          "shadow-lg shadow-accent/30",
          "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/40",
          "transition-all duration-150",
          "cursor-pointer"
        )}
      >
        Begin met invullen →
      </button>
    </div>
  );
}

InfoPage.propTypes = {
  onBack: PropTypes.func.isRequired,
  onStartWizard: PropTypes.func.isRequired,
  darkMode: PropTypes.string.isRequired,
  setDarkMode: PropTypes.func.isRequired,
};
