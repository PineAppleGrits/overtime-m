import Link from "next/link";

// TODO: Replace mock data with real API calls
// const match = await MatchService.getMatch(matchId);
// const tournament = await TournamentService.getTournamentBySlug(tournamentSlug);
// const category = tournament.categories.find(c => c.slug === categorySlug);

type Player = {
  id: string;
  name: string;
  picture: string | null;
  captain: boolean;
  mvp: boolean;
  totalScore: number;
  pt1: number;
  pt2: number;
  pt3: number;
  fouls: number;
  steals: number;
  rebounds: number;
  assists: number;
};

type Team = {
  id: string;
  name: string;
  badge: string | null;
  delegatePicture: string | null;
  score: number;
  players: Player[];
};

const MOCK_MATCH = {
  id: "match-001",
  date: "2025-11-15T21:00:00.000Z",
  matchType: "Cuartos de Final",
  location: "Polideportivo Sur",
  videoUrl: "https://youtube.com",
  driveFolder: null as string | null,
  team1: {
    id: "team-1",
    name: "Los Tigres",
    badge: null,
    delegatePicture: null,
    score: 78,
    players: [
      { id: "p1", name: "Lucas Pérez", picture: null, captain: true, mvp: true, totalScore: 24, pt1: 2, pt2: 8, pt3: 2, fouls: 3, steals: 4, rebounds: 7, assists: 5 },
      { id: "p2", name: "Marcos Díaz", picture: null, captain: false, mvp: false, totalScore: 18, pt1: 4, pt2: 6, pt3: 1, fouls: 2, steals: 1, rebounds: 3, assists: 6 },
      { id: "p3", name: "Nicolás García", picture: null, captain: false, mvp: false, totalScore: 14, pt1: 0, pt2: 5, pt3: 1, fouls: 4, steals: 2, rebounds: 8, assists: 1 },
      { id: "p4", name: "Rodrigo Sosa", picture: null, captain: false, mvp: false, totalScore: 12, pt1: 2, pt2: 4, pt3: 0, fouls: 1, steals: 3, rebounds: 5, assists: 2 },
      { id: "p5", name: "Fabio Torres", picture: null, captain: false, mvp: false, totalScore: 10, pt1: 0, pt2: 3, pt3: 1, fouls: 2, steals: 0, rebounds: 2, assists: 4 },
    ],
  } as Team,
  team2: {
    id: "team-2",
    name: "Panthers",
    badge: null,
    delegatePicture: null,
    score: 71,
    players: [
      { id: "p6", name: "Ezequiel Romero", picture: null, captain: true, mvp: false, totalScore: 22, pt1: 2, pt2: 7, pt3: 2, fouls: 3, steals: 2, rebounds: 6, assists: 3 },
      { id: "p7", name: "Iván Martínez", picture: null, captain: false, mvp: false, totalScore: 16, pt1: 4, pt2: 4, pt3: 1, fouls: 5, steals: 1, rebounds: 4, assists: 7 },
      { id: "p8", name: "Bruno López", picture: null, captain: false, mvp: false, totalScore: 15, pt1: 1, pt2: 5, pt3: 1, fouls: 2, steals: 3, rebounds: 5, assists: 2 },
      { id: "p9", name: "Mateo Fernández", picture: null, captain: false, mvp: false, totalScore: 10, pt1: 0, pt2: 4, pt3: 0, fouls: 3, steals: 1, rebounds: 3, assists: 1 },
      { id: "p10", name: "Agustín Ruiz", picture: null, captain: false, mvp: false, totalScore: 8, pt1: 2, pt2: 2, pt3: 0, fouls: 1, steals: 2, rebounds: 2, assists: 0 },
    ],
  } as Team,
};

const MOCK_TOURNAMENT_NAME = "Liga Overtime 2025";
const MOCK_CATEGORY_NAME = "Categoría A";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TeamBadge({
  team,
  href,
  className = "",
}: {
  team: Team;
  href: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`relative inline-block ${className}`}>
      {team.badge ? (
        <img
          src={team.badge}
          alt={team.name}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="relative w-full h-full">
          <img
            src="/badge-placeholder.png"
            alt={team.name}
            className="w-full h-full object-contain"
          />
          <span className="absolute inset-0 flex items-center justify-center font-din-display font-bold text-ot-blanco text-xl drop-shadow-md">
            {getInitials(team.name)}
          </span>
        </div>
      )}
    </Link>
  );
}

function getDate(date: Date) {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTime(date: Date) {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ScoreTable({
  players,
  naranja = true,
}: {
  players: Player[];
  naranja?: boolean;
}) {
  if (!players.length) return <div className="w-full max-w-sm" />;

  return (
    <div className="p-1 w-full rounded-md max-w-sm">
      {/* Header */}
      <div
        className={
          "text-ot-blanco flex items-center text-[0.65rem] font-bold py-2 rounded-t-md font-din-display" +
          (naranja ? " bg-ot-orange" : " bg-ot-violeta")
        }
      >
        <div className="w-1/3" />
        <div className="uppercase px-3">jugador</div>
      </div>

      {/* Player rows */}
      {players.map((player, index) => {
        const ultimaFila = index + 1 === players.length;

        return (
          <div
            className={
              "flex w-full" +
              (naranja ? " bg-ot-box-naranja" : " bg-ot-negro-texto") +
              (ultimaFila ? " rounded-br-md" : "")
            }
            key={player.id}
          >
            {/* Player picture */}
            {/* TODO: Replace with real player picture from API */}
            <img
              src={
                player.picture ??
                (naranja
                  ? "/images/player-placeholder-orange.png"
                  : "/images/player-placeholder-blue.png")
              }
              alt={player.name}
              className={
                "w-1/3 object-cover z-10" +
                (ultimaFila ? " rounded-bl-md" : "")
              }
            />

            <div className="flex-1 flex flex-col">
              {/* Name + captain + MVP */}
              <div className="flex w-full gap-3 px-3 py-2">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-din-display text-xs pl-0.5 lg:pl-1.5 text-ot-blanco">
                      {player.name}
                    </span>
                    {player.captain && (
                      <div className="border border-ot-blanco h-4 px-2.5 flex items-center">
                        <div className="font-946-latin text-xs mb-0.5 text-ot-blanco">
                          c
                        </div>
                      </div>
                    )}
                  </div>
                  {player.mvp && (
                    <img
                      src="/logos-iconos/Jugador del partido.png"
                      alt="MVP"
                      className="w-4 h-4 mr-1 lg:mr-3"
                    />
                  )}
                </div>
              </div>

              {/* Row 1: PTS / TL / TC 2P / TC 3P */}
              <div
                className={
                  "flex h-full" +
                  (naranja
                    ? " gradient-naranja-opacity"
                    : " gradient-violeta-opacity") +
                  (ultimaFila ? " rounded-br-md" : "")
                }
              >
                {/* PTS with skew accent */}
                <div className="flex flex-col justify-center items-center py-1 w-1/4 text-[0.65rem] relative">
                  <div
                    className={
                      "uppercase font-din-display font-bold z-10" +
                      (naranja
                        ? " text-ot-orange"
                        : " text-ot-newvioleta-claro")
                    }
                  >
                    pts
                  </div>
                  <div className="font-946-latin opacity-80 z-10 text-ot-blanco">
                    {player.totalScore || "-"}
                  </div>
                  <div
                    className={
                      "absolute pts w-[150%] h-full top-0 -left-6 z-0" +
                      (naranja
                        ? " gradient-naranja-opacity-invert"
                        : " gradient-violeta-opacity-invert")
                    }
                  />
                </div>

                <div className="text-[0.65rem] flex flex-1">
                  <div className="flex flex-col justify-center items-center py-1 w-1/3">
                    <div
                      className={
                        "uppercase font-din-display font-bold" +
                        (naranja
                          ? " text-ot-orange"
                          : " text-ot-newvioleta-claro")
                      }
                    >
                      TL
                    </div>
                    <div className="font-946-latin opacity-80 text-ot-blanco">
                      {player.pt1 || "-"}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-center py-1 w-1/3">
                    <div
                      className={
                        "uppercase font-din-display font-bold" +
                        (naranja
                          ? " text-ot-orange"
                          : " text-ot-newvioleta-claro")
                      }
                    >
                      TC 2P
                    </div>
                    <div className="font-946-latin opacity-80 text-ot-blanco">
                      {player.pt2 || "-"}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-center py-1 w-1/3">
                    <div
                      className={
                        "uppercase font-din-display font-bold" +
                        (naranja
                          ? " text-ot-orange"
                          : " text-ot-newvioleta-claro")
                      }
                    >
                      TC 3P
                    </div>
                    <div className="font-946-latin opacity-80 text-ot-blanco">
                      {player.pt3 || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: FAL / ROB / REB / AS */}
              <div
                className={
                  "flex h-full" +
                  (naranja
                    ? " gradient-naranja-opacity-invert"
                    : " gradient-violeta-opacity-invert") +
                  (ultimaFila ? " rounded-br-md" : "")
                }
              >
                <div className="text-[0.65rem] flex flex-1">
                  <div className="flex flex-col justify-center items-center py-1 px-2 w-1/4">
                    <div
                      className={
                        "uppercase font-din-display font-bold" +
                        (naranja
                          ? " text-ot-orange"
                          : " text-ot-newvioleta-claro")
                      }
                    >
                      fal
                    </div>
                    <div className="font-946-latin opacity-80 text-ot-blanco">
                      {player.fouls || "-"}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-center py-1 px-2 w-1/4">
                    <div
                      className={
                        "uppercase font-din-display font-bold" +
                        (naranja
                          ? " text-ot-orange"
                          : " text-ot-newvioleta-claro")
                      }
                    >
                      rob
                    </div>
                    <div className="font-946-latin opacity-80 text-ot-blanco">
                      {player.steals || "-"}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-center py-1 px-2 w-1/4">
                    <div
                      className={
                        "uppercase font-din-display font-bold" +
                        (naranja
                          ? " text-ot-orange"
                          : " text-ot-newvioleta-claro")
                      }
                    >
                      reb
                    </div>
                    <div className="font-946-latin opacity-80 text-ot-blanco">
                      {player.rebounds || "-"}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-center py-1 px-2 w-1/4">
                    <div
                      className={
                        "uppercase font-din-display font-bold" +
                        (naranja
                          ? " text-ot-orange"
                          : " text-ot-newvioleta-claro")
                      }
                    >
                      as
                    </div>
                    <div className="font-946-latin opacity-80 text-ot-blanco">
                      {player.assists || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DatosPartidoTexto() {
  return (
    <p className="text-[0.68rem] text-center font-din-display px-2">
      <span className="opacity-70 text-ot-blanco">PTS: </span>
      <span className="opacity-50 text-ot-blanco">Puntos</span>
      <span className="opacity-70 text-ot-blanco"> TL: </span>
      <span className="opacity-50 text-ot-blanco">Tiros Libres -</span>
      <span className="opacity-70 text-ot-blanco"> TC 2P: </span>
      <span className="opacity-50 text-ot-blanco"> Tiro de Campo Doble - </span>{" "}
      <span className="opacity-70 text-ot-blanco"> TC 3P: </span>
      <span className="opacity-50 text-ot-blanco">
        {" "}
        Tiro de Campo <br /> Triple -{" "}
      </span>{" "}
      <span className="opacity-70 text-ot-blanco"> FAL: </span>
      <span className="opacity-50 text-ot-blanco"> Faltas - </span>{" "}
      <span className="opacity-70 text-ot-blanco"> ROB: </span>
      <span className="opacity-50 text-ot-blanco"> Robos - </span>
      <span className="opacity-70 text-ot-blanco"> REB: </span>
      <span className="opacity-50 text-ot-blanco"> Rebotes - </span>
      <span className="opacity-70 text-ot-blanco"> ASIS: </span>
      <span className="opacity-50 text-ot-blanco"> Asistencias </span>
    </p>
  );
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{
    tournamentSlug: string;
    categorySlug: string;
    matchId: string;
  }>;
}) {
  const { tournamentSlug, categorySlug } = await params;

  // TODO: Replace with real API data fetching
  const match = MOCK_MATCH;
  const tournamentName = MOCK_TOURNAMENT_NAME;
  const subtournamentName = MOCK_CATEGORY_NAME;

  return (
    <div className="w-full bg-ot-background overflow-x-hidden overflow-y-hidden min-h-[170vh] max-w-[100vw]">
      {/* Big orange gradient background — desktop only */}
      <div className="overflow-hidden absolute max-h-[170vh]">
        <img
          src="/gradients/big-gradient-naranja.png"
          alt=""
          className="hidden lg:block w-[170vw] h-[2000px] -mt-[740px] -ml-[52vw] overflow-hidden"
        />
      </div>

      {/* Mobile header bar */}
      <h1 className="bg-ot-negro-texto text-center uppercase w-full py-5 font-din-display font-bold text-sm text-ot-orange lg:hidden">
        ESTADÍSTICAS DE PARTIDO
      </h1>

      {/* Triangle decorations — pointer-events-none so content below is interactive */}
      <div className="absolute w-full flex flex-col items-center z-0 min-h-screen overflow-x-hidden pointer-events-none">
        {/* Big triangle — mobile */}
        <img
          src="/gradients/triangulo-big.png"
          alt=""
          className="absolute lg:hidden w-[357vw] h-[600px] max-w-none -top-12 left-1/2 -translate-x-1/2"
        />

        {/* Small triangles — mobile */}
        <div className="flex top-0 w-[218px] h-[100px]">
          <div className="lg:hidden w-1/2 z-20" />
          <div className="lg:hidden w-1/2 z-10" />
        </div>

        {/* Big triangle — desktop */}
        <div className="hidden lg:block absolute border-gradient top-0 w-0 h-0 border-l-[400px] border-l-transparent border-r-[400px] border-r-transparent border-t-[360px] z-10 border-t-ot-negro-texto left-1/2 -translate-x-1/2 gradient-negro-texto-dark-up" />
        {/* Small triangle — desktop */}
        <div className="hidden lg:block absolute border-gradient top-0 w-0 h-0 border-l-[80px] border-l-transparent border-r-[80px] border-r-transparent border-t-[75px] border-t-ot-dark-blue left-1/2 -translate-x-1/2 z-20" />

        {/* Mini triangle image — mobile */}
        <img
          src="/gradients/triangulo-mini.png"
          alt=""
          className="absolute lg:hidden w-52 left-1/2 -translate-x-1/2 -top-2 z-10"
        />
      </div>

      {/* Tournament + Category name */}
      <div className="justify-center flex mt-28 z-10 relative text-md">
        <p className="text-xl uppercase inline-block py-5 font-din-display text-ot-orange">
          {tournamentName} {" "} - {" "}
          <span className="font-bold">
            {subtournamentName}
          </span>
        </p>
      </div>

      {/* Match meta: date / type / location */}
      <div className="flex items-center justify-center gap-4 z-10 relative">
        <div className="text-sm font-din-display z-20 grow basis-0 mr-0 text-right">
          {match.date && (
            <>
              <span className="z-20 opacity-60 inline text-ot-blanco">
                {" "}
                {getDate(new Date(match.date))}{" "}
              </span>
              <span className="z-20 inline text-ot-blanco">
                {getTime(new Date(match.date))}
              </span>
            </>
          )}
        </div>
        <div className="z-20 bg-ot-violeta font-din-display text-xs uppercase py-2 px-5 rounded-sm">
          <span className="z-20 opacity-80 text-ot-blanco">
            {match.matchType}
          </span>
        </div>
        <span className="font-din-display opacity-60 grow basis-0 text-ot-blanco">
          {match.location || "-"}
        </span>
      </div>

      {/* ==================== SCORE — MOBILE ==================== */}
      <div className="lg:hidden relative">
        <div>
          <div className="z-20 flex justify-center gap-8 mt-10 font-din-display">
            <div className="z-20 w-full">
              {/* Team badges — link to team page */}
              <div className="z-20 flex justify-evenly w-full gap-5">
                <TeamBadge
                  team={match.team1}
                  href={`/equipos/${match.team1.id}`}
                  className="z-20 w-28 m-auto aspect-square"
                />
                <TeamBadge
                  team={match.team2}
                  href={`/equipos/${match.team2.id}`}
                  className="z-20 w-28 m-auto aspect-square"
                />
              </div>

              {/* Team names */}
              <div className="z-20 flex justify-evenly items-center mt-3">
                <span className="z-20 uppercase text-center text-sm font-thin w-1/3 leading-none text-ot-blanco">
                  {match.team1.name}
                </span>
                <div className="z-20 font-thin text-ot-blanco">vs</div>
                <span className="z-20 uppercase text-center text-sm font-thin w-1/3 leading-none text-ot-blanco">
                  {match.team2.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Score numbers — mobile */}
        <div className="z-20 flex justify-center gap-2 mt-12 relative">
          <img
            src="/gradients/gradient-naranja-puntaje-mobile.png"
            alt=""
            className="absolute lg:hidden -left-40 top-0 h-16"
          />
          <img
            src="/gradients/gradient-violeta-puntaje-mobile.png"
            alt=""
            className="absolute lg:hidden -right-40 top-0 h-16"
          />
          <img
            src="/gradients/gradient-naranja-puntaje-mobile-arriba.png"
            alt=""
            className="absolute lg:hidden -left-64 -top-12 h-10"
          />
          <img
            src="/gradients/gradient-violeta-puntaje-mobile-arriba.png"
            alt=""
            className="absolute lg:hidden -right-64 -top-12 h-10"
          />

          <div className="z-20 font-946-latin text-ot-orange text-6xl font-bold w-1/2 text-center relative">
            {match.team1.score}
          </div>
          <div className="z-20 h-0.5 w-0.5 rounded-full bg-ot-violeta self-center absolute left-1/2 -translate-x-1/2" />
          <div className="z-20 font-946-latin text-ot-blanco text-6xl font-bold w-1/2 text-center relative">
            {match.team2.score}
          </div>
        </div>
      </div>

      {/* ==================== SCORE — DESKTOP ==================== */}
      <div className="hidden lg:block relative z-10">
        <div>
          <div className="z-20 font-din-display">
            <div className="z-20 flex justify-center m-auto max-w-[1200px] items-center w-full gap-6 relative">
              {/* Gradient glows */}
              <div className="flex gap-40 justify-center absolute m-auto">
                <img
                  src="/gradients/gradient-naranja-puntaje-desktop.png"
                  alt=""
                  className="hidden lg:block w-[420px] h-[100px] top-6 left-20"
                />
                <img
                  src="/gradients/gradient-violeta-puntaje-desktop.png"
                  alt=""
                  className="hidden lg:block w-[420px] h-[100px] top-6 right-20"
                />
              </div>

              <TeamBadge
                team={match.team1}
                href={`/equipos/${match.team1.id}`}
                className="z-20 w-36 h-36 aspect-square"
              />
              <div className="z-20 font-946-latin text-ot-orange text-6xl font-bold text-center w-40 relative">
                {match.team1.score}
              </div>
              <div className="z-20 h-1 w-1 rounded-full bg-ot-violeta self-center" />
              <div className="z-20 font-946-latin text-ot-blanco text-6xl font-bold text-center w-40">
                {match.team2.score}
              </div>
              <TeamBadge
                team={match.team2}
                href={`/equipos/${match.team2.id}`}
                className="z-20 w-36 h-36 aspect-square"
              />
            </div>

            {/* Team names — desktop */}
            <div className="z-20 flex justify-center items-center gap-10 mt-3 max-w-sm m-auto relative">
              <img
                src="/gradients/gradient-violeta-puntaje-desktop-arriba.png"
                alt=""
                className="absolute hidden lg:block w-[450px] h-[50px] -top-3 left-52"
              />
              <span className="z-20 uppercase text-center text-sm font-thin w-full leading-none text-ot-blanco">
                {match.team1.name}
              </span>
              <div className="z-20 font-thin font-946-latin text-ot-blanco">
                vs
              </div>
              <img
                src="/gradients/gradient-naranja-puntaje-desktop-arriba.png"
                alt=""
                className="absolute hidden lg:block w-[450px] h-[50px] -top-3 right-56"
              />
              <span className="z-20 uppercase text-center text-sm font-thin w-full leading-none text-ot-blanco">
                {match.team2.name}
              </span>
            </div>
          </div>
        </div>
        <div className="z-20 flex justify-center gap-2 mt-6" />
      </div>

      {/* ==================== ACTION BUTTONS — MOBILE ==================== */}
      <div className="lg:hidden gap-1.5 z-[70] relative lg:mt-0 mt-12 flex flex-col items-center">
        {match.videoUrl && (
          <a
            className="flex gap-1.5 items-center justify-center"
            target="_blank"
            rel="noopener noreferrer"
            href={match.videoUrl}
          >
            <span className="uppercase font-din-display font-bold text-sm text-ot-orange">
              ver partido{" "}
            </span>
            <img
              src="/logos-iconos/Youtube.png"
              alt="YouTube"
              className="w-8"
            />
          </a>
        )}
        {match.driveFolder && (
          <div className="flex gap-1.5 justify-center w-44 h-12 top-5">
            <Link
              href={`https://drive.google.com/drive/folders/${match.driveFolder}`}
              className="uppercase bg-ot-orange text-center text-ot-negro-texto w-32 rounded-sm font-din-display font-bold py-2 text-sm m-auto"
              target="_blank"
            >
              ver fotos
            </Link>
          </div>
        )}
      </div>

      {/* ==================== STATS TABLES ==================== */}
      <div className="lg:flex items-center lg:items-start justify-center mb-12 relative z-[65]">
        {/* ===== Team 1 stats ===== */}
        <div className="relative mt-44 lg:mt-0 lg:flex">
          {/* Delegate picture — desktop */}
          {/* TODO: Replace with real delegate picture from API */}
          <img
            src={
              match.team1.delegatePicture ??
              "/logos-iconos/Default - Delegado.png"
            }
            alt={match.team1.name}
            className="max-w-[330px] hidden lg:block lg:absolute -left-[58%] -top-56 z-20 w-[330px] h-[576px] object-cover"
          />

          {/* Orange glow — mobile */}
          <img
            src="/gradients/gradient-naranja.png"
            alt=""
            className="absolute lg:hidden -top-96 -left-24"
          />
          {/* Delegate picture — mobile */}
          <img
            src={
              match.team1.delegatePicture ??
              "/logos-iconos/Default - Delegado.png"
            }
            alt={match.team1.name}
            className="w-[247px] lg:hidden absolute max-h-96 -top-36 left-1/2 -translate-x-1/2 object-cover"
          />

          <div className="flex justify-center">
            <div className="p-2 top-40 z-30 flex flex-col gap-4 mb-12 lg:mb-0">
              <ScoreTable players={match.team1.players} naranja={true} />
              <DatosPartidoTexto />
            </div>
          </div>
        </div>

        {/* ===== Center: video + photos — desktop ===== */}
        {match.videoUrl && (
          <a
            className="absolute z-40 bottom-0 hidden lg:block"
            href={match.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="w-44 h-12 top-5 mt-12 lg:mt-0 flex gap-1.5 items-center justify-center self-end">
              <p className="uppercase font-din-display font-bold text-sm text-ot-orange">
                ver partido{" "}
              </p>
              <img
                src="/logos-iconos/Youtube.png"
                alt="YouTube"
                className="w-8"
              />
            </div>
          </a>
        )}

        {/* ===== Team 2 stats ===== */}
        <div className="relative mt-44 lg:mt-0 lg:flex">
          <div className="flex justify-center">
            <div className="p-2 top-44 z-30 flex flex-col gap-4 mb-12 lg:mb-0">
              <ScoreTable players={match.team2.players} naranja={false} />
              <DatosPartidoTexto />
            </div>
          </div>

          {/* Drive photos button — desktop */}
          {match.driveFolder && (
            <Link
              href={`https://drive.google.com/drive/folders/${match.driveFolder}`}
              className="hidden lg:block text-center absolute uppercase font-din-display font-bold text-sm text-ot-orange z-30 border-ot-orange rounded-sm border-2 py-2 w-32 -top-56"
              style={{ right: "65px" }}
              target="_blank"
            >
              ver fotos
            </Link>
          )}

          {/* Delegate picture — mobile */}
          <img
            src={
              match.team2.delegatePicture ??
              "/logos-iconos/Default - Delegado.png"
            }
            alt={match.team2.name}
            className="w-[247px] lg:hidden absolute h-96 -top-36 left-1/2 -translate-x-1/2 object-cover"
          />
          {/* Violet glow — mobile */}
          <img
            src="/gradients/gradient-violeta.png"
            alt=""
            className="absolute lg:hidden -top-96 -right-24"
          />
          {/* Delegate picture — desktop */}
          <img
            src={
              match.team2.delegatePicture ??
              "/logos-iconos/Default - Delegado.png"
            }
            alt={match.team2.name}
            className="hidden lg:block lg:absolute left-[320px] -top-56 z-20 w-[330px] h-[576px] object-cover"
          />
        </div>
      </div>
    </div>
  );
}
