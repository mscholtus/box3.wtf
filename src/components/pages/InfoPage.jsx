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
      <InfoBlock title="Wat is het forfaitaire stelsel?">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          <p className="mb-3">
            In het huidige stelsel (tot en met 2027) gaat de Belastingdienst uit van een{" "}
            <strong className="text-mist-950 dark:text-mist-50">fictief rendement</strong> op je vermogen,
            ongeacht wat je echt hebt verdiend. Voor beleggingen (ETFs, aandelen, crypto) is
            dat forfait 6%, voor spaargeld 1,3%.
          </p>
          <p className="mb-3">
            Je betaalt 36% belasting over dat fictieve rendement, na aftrek van het
            heffingsvrij vermogen (€61.000 per persoon, €122.000 met fiscaal partner).
          </p>
          <p className="p-3 bg-mist-100 dark:bg-mist-800 rounded-xl border border-mist-200 dark:border-mist-700">
            <strong className="text-mist-950 dark:text-mist-50">Rekenvoorbeeld:</strong> €100.000 in ETFs,
            geen partner. Forfaitair inkomen: €100.000 × 6% = €6.000. Na heffingsvrij:
            (€100.000 − €61.000) / €100.000 × €6.000 = €2.340. Belasting: €2.340 × 36% ={" "}
            <strong className="text-accent">€842</strong>.
          </p>
        </div>
      </InfoBlock>

      <InfoBlock title="Wat verandert er met werkelijk rendement (2028+)?">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          <p className="mb-3">
            In het nieuwe stelsel wordt belasting geheven over je{" "}
            <strong className="text-mist-950 dark:text-mist-50">daadwerkelijke rendement</strong>: rente,
            dividend, huurinkomsten en — cruciaal — ook{" "}
            <strong className="text-mist-950 dark:text-mist-50">ongerealiseerde koerswinsten</strong>. Dat
            zijn stijgingen in de waarde van je beleggingen die je nog niet hebt verkocht.
          </p>
          <p className="mb-3">
            Het heffingsvrij inkomen wordt naar verwachting ~€1.800 per persoon (dit is een
            schatting — het wetsvoorstel is nog in behandeling bij de Eerste Kamer).
          </p>
          <p>
            Bij rendement boven de 6% (het huidige forfait) betaal je onder werkelijk
            rendement <strong className="text-mist-950 dark:text-mist-50">meer</strong> belasting. Bij
            rendement onder de 6% juist <strong className="text-mist-950 dark:text-mist-50">minder</strong>.
            Dit is het kantelpunt.
          </p>
        </div>
      </InfoBlock>

      <InfoBlock title="Waarom ongerealiseerde winst?">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          <p className="mb-3">
            De Hoge Raad oordeelde in 2021 dat het forfaitaire stelsel in strijd was met het
            eigendomsrecht wanneer het werkelijke rendement structureel lager lag dan het
            forfait. Daarom moest er een nieuwe basis voor box 3 belastingheffing gevonden worden.
          </p>
          <p className="mb-3">
            Belasting op alleen <em>gerealiseerde</em> winst (bij verkoop) zou vereisen dat
            financiële instellingen per transactie aankoopprijs en verkoopprijs rapporteren aan de Belastingdienst. De keuze voor
            ongerealiseerde koerswinst sluit aan bij de bestaande datastroom: banken
            rapporteren nu al saldo begin jaar en saldo eind jaar. Mogelijk is het beleid hier ingegeven door de realiteit van wat haalbaar is in de uitvoering.
          </p>
          <p>
            Nederland wordt hiermee een van de weinige landen die ongerealiseerde
            koerswinst als jaarlijks inkomen belast. Dat is internationaal opvallend — maar
            het is context, geen aanklacht.
          </p>
        </div>
      </InfoBlock>

      <InfoBlock title="Praktische gevolgen: voorspelbaarheid vs. onzekerheid">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          <p className="mb-3">
            Beide stelsels hebben fundamentele nadelen voor verschillende groepen belastingplichtigen.
          </p>

          <div className="mb-4 p-3 bg-forfaitair/10 rounded-xl border border-forfaitair/30">
            <div className="text-xs font-bold text-forfaitair uppercase tracking-wide mb-2">
              Forfaitair stelsel (huidige situatie)
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-sm">
              <li><strong className="text-mist-950 dark:text-mist-50">Voorspelbaar</strong>: je weet van tevoren precies wat je betaalt</li>
              <li><strong className="text-mist-950 dark:text-mist-50">Eenvoudig</strong>: geen discussie over kostprijs of waardering</li>
              <li><strong className="text-red-600 dark:text-red-400">Oneerlijk bij lage rendementen</strong>: spaarders en voorzichtige beleggers betalen te veel</li>
              <li><strong className="text-red-600 dark:text-red-400">Juridisch kwetsbaar</strong>: Hoge Raad oordeelde dat dit stelsel eigendomsrecht kan schenden</li>
            </ul>
          </div>

          <div className="mb-4 p-3 bg-werkelijk/10 rounded-xl border border-werkelijk/30">
            <div className="text-xs font-bold text-werkelijk uppercase tracking-wide mb-2">
              Werkelijk rendement (vanaf 2028)
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-sm">
              <li><strong className="text-mist-950 dark:text-mist-50">Eerlijker bij lage rendementen</strong>: spaarders betalen minder</li>
              <li><strong className="text-mist-950 dark:text-mist-50">Verliesverrekening</strong>: slechte jaren kunnen gecompenseerd worden</li>
              <li><strong className="text-red-600 dark:text-red-400">Onvoorspelbaar</strong>: je belastingschuld hangt af van marktschommelingen</li>
              <li><strong className="text-red-600 dark:text-red-400">Complexe administratie</strong>: kostprijs, waardering en verliezen bijhouden</li>
              <li><strong className="text-red-600 dark:text-red-400">Liquiditeitsproblemen</strong>: belasting betalen over winst die je niet hebt gerealiseerd</li>
            </ul>
          </div>

          <p className="mb-3">
            <strong className="text-mist-950 dark:text-mist-50">Voor langetermijnbeleggers</strong> betekent werkelijk rendement dat je belastingaanslag
            elk jaar sterk kan fluctueren. In een goed beursjaar betaal je fors meer, in een slecht jaar
            mogelijk niets (maar je bouwt ook verliesverrekening op). Dit maakt financiële planning complexer.
          </p>

          <p className="mb-3">
            <strong className="text-mist-950 dark:text-mist-50">Voor de Belastingdienst</strong> betekent dit systeem
            een enorme toename in complexiteit: kostprijsberekeningen voor DCA-strategieën, waardering van
            illiquide assets, verificatie van buitenlandse brokers en crypto-exchanges, en behandeling van
            geschillen over verliesverrekening. Dit vergroot het risico op fouten en langdurige bezwaarprocedures.
          </p>

          <p className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/30 text-sm">
            <strong className="text-amber-700 dark:text-amber-400">Let op:</strong> Gebruik verschillende marktscenario's
            (bull market, crash, volatiel) om te zien hoe je belastingschuld varieert bij verschillende marktomstandigheden.
            De geavanceerde analyse toont cash buffer impacts en mogelijke gedwongen verkoop van beleggingen.
          </p>
        </div>
      </InfoBlock>

      <InfoBlock title="Wat berekent deze calculator?">
        <div className="text-[15px] text-mist-600 dark:text-mist-300 leading-relaxed">
          <p className="mb-3 font-semibold text-mist-950 dark:text-mist-50">
            Ondersteunde scenario's:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-1.5">
            <li>Spaargeld, ETFs/aandelen en crypto</li>
            <li>Jaarlijkse bijstortingen</li>
            <li>Fiscaal partnerschap (verdubbeling vrijstellingen)</li>
            <li>
              <strong className="text-mist-950 dark:text-mist-50">Verliesverrekening</strong>: verliezen
              boven €500 worden onbeperkt voorwaarts verrekend met toekomstige winsten
            </li>
            <li>
              <strong className="text-mist-950 dark:text-mist-50">Marktscenario's</strong>: bull market, crash (2029),
              volatiel en stagnatie voor verschillende marktomstandigheden
            </li>
            <li>
              <strong className="text-mist-950 dark:text-mist-50">Geavanceerde analyse</strong>: cash buffer impact,
              gedwongen verkoop van beleggingen en belastingonzekerheid
            </li>
            <li>Tijdshorizon van 5 tot 40 jaar</li>
          </ul>

          <p className="mb-3 font-semibold text-mist-950 dark:text-mist-50">
            Niet ondersteund (buiten scope):
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Vastgoed (box 3): andere regels voor waardering en realisatie</li>
            <li>Investeringen in startups: winst wordt pas belast bij verkoop</li>
            <li>Uitgeleend geld en schulden</li>
            <li>Groene beleggingen (vrijstellingen vervallen in 2028)</li>
            <li>Achterwaartse verliesverrekening (niet toegestaan onder de wet)</li>
          </ul>
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
