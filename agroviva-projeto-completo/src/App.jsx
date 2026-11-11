/**
 * AGROVIVA — vitrine institucional + console operacional Campo Vivo
 * Arquivo único React. Dependências: react 18+, framer-motion 11+, Tailwind CSS 3.4+ ou 4.
 * A marca abaixo é um redesenho vetorial aproximado. Troque LogoSymbol e Wordmark pelo SVG oficial quando disponível.
 */
import { createContext, memo, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'

/* ──────────────────────────────── Tokens ──────────────────────────────── */

const BRAND = {
  broto: '#9BA657',
  oliva: '#3E5622',
  mata: '#172815',
  algodao: '#FFFFFF',
  terra: '#594433',
  canvas: '#050b07',
  textSecondary: '#C9D0C1',
  hover: '#B7BF86',
  attention: '#F4D18C',
  error: '#FFB9A3',
}

const PLATFORM = {
  bg: '#080E14',
  bgAlt: '#0B141C',
  mint: '#10b981',
  acid: '#a3e635',
  water: '#38bdf8',
  amber: '#f59e0b',
  text: '#EAF2EE',
  muted: '#8FA3AE',
}

const FONT_TEXT = "'Myriad Pro', myriad-pro, 'Inter', system-ui, sans-serif"
const FONT_DISPLAY = "'Arista Pro', 'Plus Jakarta Sans', system-ui, sans-serif"
const DISPLAY_FONT_CLASS = "font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]"
const FONT_WORDMARK = "'Arista Pro', 'Comfortaa', 'Source Sans 3', system-ui, sans-serif"
const FONT_STYLESHEET = 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap'

const TAP_SNAP = { type: 'tween', duration: 0.15, ease: [0.16, 1, 0.3, 1] }
const SPRING_CARD = { type: 'spring', stiffness: 260, damping: 20 }
const SPRING_CAMERA = { stiffness: 150, damping: 15 }
const SPRING_MAGNET = { stiffness: 400, damping: 25, mass: 0.8 }
const EASE_REVEAL = [0.16, 1, 0.3, 1]
const CARD_SWAP = { duration: 0.18, ease: EASE_REVEAL }

const GRAIN_IMAGE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

const STORAGE_KEY = 'agroviva-campo-vivo-v2'
const VWC_SCALE_MAX = 50
const IRRIGATION_CYCLE_MINUTES = 15

/* ──────────────────────────────── Dados ──────────────────────────────── */

const BEDS = [
  { bedId: 'C01', crop: 'crespa', cropName: 'Alface crespa', scientificName: 'Lactuca sativa', sector: 'Norte', moisture: 31, rootTemperature: 19.8, conductivity: 1.4, stage: 'Crescimento vegetativo', stageDays: 23, lastReading: '10h27', note: 'Solo mais fresco no centro do canteiro. Folhas novas firmes.', noteAt: '9h48' },
  { bedId: 'C02', crop: 'rucula', cropName: 'Rúcula', scientificName: 'Eruca sativa', sector: 'Norte', moisture: 19, rootTemperature: 22.1, conductivity: 1.1, stage: 'Expansão foliar', stageDays: 19, lastReading: '10h28', note: 'A ponta do canteiro estava mais seca que o centro. Conferir a linha de gotejo.', noteAt: '10h12' },
  { bedId: 'C03', crop: 'couve', cropName: 'Couve-manteiga', scientificName: 'Brassica oleracea var. acephala', sector: 'Norte', moisture: 24, rootTemperature: 21.2, conductivity: 1.8, stage: 'Colheita escalonada', stageDays: 65, lastReading: '10h26', note: 'Retirei duas folhas inferiores rasgadas e registrei a inspeção.', noteAt: '9h55' },
  { bedId: 'C04', crop: 'espinafre', cropName: 'Espinafre', scientificName: 'Tetragonia tetragonioides', sector: 'Sul', moisture: 33, rootTemperature: 19.4, conductivity: 1.6, stage: 'Crescimento de ramos', stageDays: 35, lastReading: '10h29', note: 'Sensor recolocado na zona das raízes após a capina.', noteAt: '10h17' },
  { bedId: 'C05', crop: 'americana', cropName: 'Alface americana', scientificName: 'Lactuca sativa', sector: 'Sul', moisture: 21, rootTemperature: 20.3, conductivity: 1.3, stage: 'Formação de cabeça', stageDays: 36, lastReading: '10h29', note: 'Gotejadores da ponta conferidos. Cabeças fechando bem.', noteAt: '10h24' },
  { bedId: 'C06', crop: 'chicoria', cropName: 'Chicória lisa', scientificName: 'Cichorium endivia', sector: 'Sul', moisture: 40, rootTemperature: 18.9, conductivity: 2.1, stage: 'Formação de roseta', stageDays: 30, lastReading: '10h25', note: 'Água acumulada na borda mais baixa depois da chuva. Rega adiada.', noteAt: '9h40' },
]

const MOISTURE_ALERT_THRESHOLD = 22
const isBedInAttention = (bed) => bed.moisture < MOISTURE_ALERT_THRESHOLD
const getBed = (bedId) => BEDS.find((bed) => bed.bedId === bedId) ?? BEDS[0]
const averageMoisture = Math.round(BEDS.reduce((sum, bed) => sum + bed.moisture, 0) / BEDS.length)
const bedsInAttention = BEDS.filter(isBedInAttention)

const SERIES_HOURS = ['22h', '23h', '0h', '1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', '10h']

const buildMoistureSeries = (bed) =>
  SERIES_HOURS.map((hour, index) => {
    const progress = index / (SERIES_HOURS.length - 1)
    const drop = isBedInAttention(bed) ? 8.4 : 4.2
    const curve = progress ** 1.8
    const ripple = Math.sin(index * 1.7 + bed.moisture) * 0.35
    return { hour, value: Number((bed.moisture + drop * (1 - curve) + ripple).toFixed(1)) }
  })

const PILLARS = [
  {
    id: 'pulse',
    name: 'Pulse',
    signature: 'pulse',
    isEnglishName: true,
    subtitle: 'Monitoramento do solo e irrigação assistida',
    color: '#9BA657',
    description: [
      'Reúne umidade, temperatura e condutividade do solo com o horário de cada leitura e o estado do sensor.',
      'Aplica as regras configuradas para o lote, considerando cultura, fase, solo e limites de operação.',
      'Mostra o motivo de cada alerta e registra a rega com hora, duração e responsável.',
    ],
    metrics: [
      { value: '6 de 6', label: 'Sensores com leitura atualizada' },
      { value: '2', label: 'Lotes com rega recomendada' },
      { value: '28%', label: 'Umidade média em VWC' },
    ],
    action: { label: 'Abrir leituras e regas', bedId: 'C02' },
    orbit: { major: 236, minor: 224, tilt: [0, 0, 0], speed: 0.3, phase: 0.5 },
  },
  {
    id: 'twin',
    name: 'Twin',
    signature: 'twin',
    isEnglishName: true,
    subtitle: 'Mapa dos canteiros',
    color: '#ADBD9D',
    description: [
      'Organiza a propriedade em um mapa com canteiros, setores, sensores, válvulas e reservatório.',
      'Cada lote reúne cultura, fase, leitura atual, fotos e histórico de cuidados no mesmo ponto.',
      'Quem chega ao canteiro leva a informação certa até a linha de gotejo.',
    ],
    metrics: [
      { value: '6', label: 'Canteiros mapeados' },
      { value: '2', label: 'Setores de irrigação' },
      { value: '1', label: 'Reservatório compartilhado' },
    ],
    action: { label: 'Abrir mapa dos canteiros', bedId: 'C01' },
    orbit: { major: 214, minor: 202, tilt: [0.95, 0.2, 0.5], speed: 0.26, phase: 1.9 },
  },
  {
    id: 'vision',
    name: 'Vision',
    signature: 'vision',
    isEnglishName: true,
    subtitle: 'Inspeção foliar por imagem',
    color: '#DBE2C5',
    description: [
      'Guarda fotos datadas de cada lote e orienta a repetir enquadramento, distância e luz.',
      'Compara registros do mesmo trecho e marca lesões, clorose e área afetada em percentual.',
      'Uma marcação pode ser conferida no canteiro ou encaminhada à assistência técnica.',
    ],
    metrics: [
      { value: '12', label: 'Fotos vinculadas na semana' },
      { value: '2', label: 'Alterações marcadas' },
      { value: '1', label: 'Inspeção pendente' },
    ],
    action: { label: 'Abrir inspeção do canteiro', bedId: 'C03' },
    orbit: { major: 226, minor: 214, tilt: [-0.85, 0.3, -0.45], speed: 0.28, phase: 3.3 },
  },
  {
    id: 'local',
    name: 'Local',
    signature: 'local',
    isEnglishName: false,
    subtitle: 'Operação com internet instável',
    color: '#B9CA8A',
    description: [
      'O controlador da propriedade guarda as leituras e executa só as regras já autorizadas.',
      'Durante uma queda de internet, a coleta continua e os eventos ficam registrados localmente.',
      'Quando a conexão volta, o histórico sincroniza e comandos expirados seguem bloqueados.',
    ],
    metrics: [
      { value: '60 min', label: 'Autonomia testada sem internet' },
      { value: '72', label: 'Leituras sincronizadas depois' },
      { value: '0', label: 'Comandos expirados executados' },
    ],
    action: { label: 'Ver estado da conexão', bedId: 'C04' },
    orbit: { major: 188, minor: 178, tilt: [0.4, -1.05, 1.1], speed: 0.32, phase: 4.6 },
  },
  {
    id: 'compartilha',
    name: 'Compartilha',
    signature: 'share',
    isEnglishName: false,
    subtitle: 'Acesso coletivo a serviços e equipamentos',
    color: '#C8B6A2',
    description: [
      'Permite pedir assistência, reservar recursos móveis e acompanhar o atendimento pela cooperativa.',
      'Cada pedido reúne o lote, o motivo, os horários disponíveis e o responsável antes da confirmação.',
      'A devolutiva do técnico entra no histórico do mesmo canteiro.',
    ],
    metrics: [
      { value: '3', label: 'Visitas solicitadas' },
      { value: '2', label: 'Visitas confirmadas' },
      { value: '1', label: 'Aguardando agendamento' },
    ],
    action: { label: 'Solicitar avaliação', bedId: 'C06' },
    orbit: { major: 248, minor: 206, tilt: [-0.35, 0.75, 2.1], speed: 0.23, phase: 5.6 },
  },
]

/* ──────────────────────────────── Utilidades ──────────────────────────────── */

const cx = (...classNames) => classNames.filter(Boolean).join(' ')
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const formatDecimal = (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const getCurrentHourLabel = () => {
  const now = new Date()
  return `${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}`
}

const useSvgId = (prefix) => `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

const buildSmoothPath = (points) =>
  points.reduce((path, point, index, allPoints) => {
    if (index === 0) return `M${point.x.toFixed(1)},${point.y.toFixed(1)}`
    const previous = allPoints[index - 1]
    const beforePrevious = allPoints[index - 2] ?? previous
    const next = allPoints[index + 1] ?? point
    const c1x = previous.x + (point.x - beforePrevious.x) / 6
    const c1y = previous.y + (point.y - beforePrevious.y) / 6
    const c2x = point.x - (next.x - previous.x) / 6
    const c2y = point.y - (next.y - previous.y) / 6
    return `${path} C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`
  }, '')

const readStoredNotes = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const writeStoredNotes = (notesByBed) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notesByBed))
    return true
  } catch {
    return false
  }
}

/* ──────────────────────────────── Ícones ──────────────────────────────── */

const ICON_PATHS = {
  arrow: ['M5 12h14', 'M13 6l6 6-6 6'],
  arrowLeft: ['M19 12H5', 'M11 6l-6 6 6 6'],
  arrowUpRight: ['M7 17L17 7', 'M9 7h8v8'],
  drop: ['M12 3.5c3.5 4.2 6 7.5 6 10.5a6 6 0 0 1-12 0c0-3 2.5-6.3 6-10.5z'],
  eye: ['M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z', 'M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z'],
  clock: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 7.5V12l3 2'],
  alert: ['M12 3.5L21 19.5H3z', 'M12 10v4', 'M12 16.8v.2'],
  wifi: ['M3 9a13 13 0 0 1 18 0', 'M6 12.5a8.5 8.5 0 0 1 12 0', 'M9 16a4 4 0 0 1 6 0', 'M12 19.2v.1'],
  sync: ['M4 12a8 8 0 0 1 14-5.3', 'M20 12a8 8 0 0 1-14 5.3', 'M18 3v4h-4', 'M6 21v-4h4'],
  pause: ['M8 5v14', 'M16 5v14'],
  play: ['M7 5l12 7-12 7z'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  thermometer: ['M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z', 'M12 9v7'],
  bolt: ['M13 2L4 14h7l-1 8 9-12h-7z'],
  layers: ['M12 3l9 5-9 5-9-5z', 'M3 13l9 5 9-5'],
  plus: ['M12 5v14', 'M5 12h14'],
  sensor: ['M12 20v-6', 'M12 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6.5 5.5a8 8 0 0 1 11 0', 'M4 20h16'],
  notebook: ['M6 3h12v18H6z', 'M9 7h6', 'M9 11h6', 'M9 15h4'],
  sun: ['M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z', 'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'],
  moon: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
}

const Icon = ({ name, className = 'h-4 w-4', strokeWidth = 1.7, style }) => (
  <svg style={style} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={cx('shrink-0', className)} aria-hidden="true" focusable="false">
    {ICON_PATHS[name].map((path) => (
      <path key={path} d={path} />
    ))}
  </svg>
)

/* ──────────────────────────────── Marca em SVG ──────────────────────────────── */

const LogoSymbol = ({ className = 'h-10 w-10', color = BRAND.algodao }) => (
  <svg viewBox="0 0 120 132" preserveAspectRatio="xMidYMid meet" className={className} aria-hidden="true">
    <path d="M57 64C38 62 15 47 9 9c30 4 47 23 48 55z" fill={color} />
    <path d="M63 64c19-2 42-17 48-55-30 4-47 23-48 55z" fill={color} />
    <path fillRule="evenodd" d="M60 54c3 0 5 1.6 6.4 4.4l32.4 63c1.6 3.2-.6 6.6-4.2 6.6H82.4c-2.2 0-4-1.2-4.9-3.2L74.9 119H45.1l-2.6 5.8c-.9 2-2.7 3.2-4.9 3.2H25.4c-3.6 0-5.8-3.4-4.2-6.6l32.4-63C55 55.6 57 54 60 54zm0 32.5L51 104h18z" fill={color} />
  </svg>
)

const LeafDot = ({ color }) => (
  <svg viewBox="0 0 40 48" className="absolute -top-[0.62em] left-1/2 h-[0.62em] w-[0.52em] -translate-x-[35%]" aria-hidden="true">
    <path d="M6 46C4 24 16 6 38 2c2 22-10 40-32 44z" fill={color} />
  </svg>
)

const Wordmark = ({ color = BRAND.algodao, withLeaf = true, className = 'text-2xl' }) => (
  <span className={cx('relative inline-flex items-baseline font-bold leading-none tracking-[-0.03em]', className)} style={{ color, fontFamily: FONT_WORDMARK }} aria-hidden="true">
    <span>agrov</span>
    <span className="relative">
      {withLeaf ? 'ı' : 'i'}
      {withLeaf && <LeafDot color={color} />}
    </span>
    <span>va</span>
  </span>
)

const LogoCompact = ({ color = BRAND.algodao, className = 'text-[1.7rem]' }) => (
  <span className="inline-flex items-end pt-2">
    <Wordmark color={color} className={className} />
  </span>
)

const LogoVertical = ({ color = BRAND.algodao, className = '' }) => (
  <span className={cx('flex flex-col items-center gap-1', className)} aria-hidden="true">
    <LogoSymbol className="h-[3.4rem] w-[3.1rem]" color={color} />
    <Wordmark color={color} withLeaf={false} className="text-[1.15rem]" />
  </span>
)

const ModuleSignature = ({ signature }) => (
  <span className="inline-flex items-end gap-2 pt-2" aria-hidden="true">
    <Wordmark className="text-[1.35rem]" />
    <span className="text-[1.35rem] font-bold leading-none tracking-[-0.03em] font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]" style={{ color: BRAND.broto, fontFamily: FONT_WORDMARK }}>
      {signature}
    </span>
  </span>
)

/* ──────────────────────────────── Atmosfera ──────────────────────────────── */

const GrainOverlay = () => <div className="pointer-events-none fixed inset-0 z-[60] opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN_IMAGE }} aria-hidden="true" />

const SectionLight = ({ className }) => (
  <div className={cx('pointer-events-none absolute rounded-full blur-3xl', className)} style={{ background: `radial-gradient(circle, ${BRAND.oliva}66 0%, ${BRAND.mata}00 70%)` }} aria-hidden="true" />
)

/* ──────────────────────────────── Folha do hero ──────────────────────────────── */

const LEAF_PATH =
  'M300 690C296 640 292 600 286 560C220 558 150 520 118 450C96 404 114 372 92 330C70 284 98 248 96 206C94 160 132 132 150 96C170 58 214 52 246 34C272 20 300 26 318 18C352 6 388 34 414 46C452 64 478 92 486 132C494 172 524 196 516 240C508 284 532 312 518 356C502 404 516 440 484 478C452 516 384 552 318 560C314 600 310 640 306 690Z'

const LEAF_VEINS = [
  'M303 560C304 420 306 260 312 40',
  'M303 486C252 458 192 428 140 386',
  'M304 410C244 372 184 316 132 262',
  'M305 330C262 290 226 232 196 160',
  'M307 250C280 200 262 140 246 84',
  'M303 486C356 458 418 428 472 386',
  'M304 410C364 372 424 316 474 262',
  'M305 330C350 290 392 232 424 168',
  'M307 250C334 200 356 142 372 86',
]

const LeafArtwork = ({ className }) => {
  const fillId = useSvgId('leaf-fill')
  const lightId = useSvgId('leaf-light')
  const glowId = useSvgId('leaf-glow')
  const clipId = useSvgId('leaf-clip')
  const rimId = useSvgId('leaf-rim')

  return (
    <svg viewBox="0 0 600 720" preserveAspectRatio="xMidYMid meet" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="0.2" y1="1" x2="0.75" y2="0">
          <stop offset="0" stopColor={BRAND.mata} />
          <stop offset="0.45" stopColor={BRAND.oliva} />
          <stop offset="1" stopColor={BRAND.broto} />
        </linearGradient>
        <radialGradient id={lightId} cx="0.72" cy="0.18" r="0.7">
          <stop offset="0" stopColor="#DBE2C5" stopOpacity="0.55" />
          <stop offset="0.5" stopColor={BRAND.broto} stopOpacity="0.12" />
          <stop offset="1" stopColor={BRAND.mata} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={rimId} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9EED8" stopOpacity="0.95" />
          <stop offset="0.55" stopColor={BRAND.broto} stopOpacity="0.5" />
          <stop offset="1" stopColor={BRAND.broto} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="22" />
        </filter>
        <clipPath id={clipId}>
          <path d={LEAF_PATH} />
        </clipPath>
      </defs>
      <path d={LEAF_PATH} fill={BRAND.broto} filter={`url(#${glowId})`} opacity="0.5" />
      <path d={LEAF_PATH} fill={`url(#${fillId})`} />
      <g clipPath={`url(#${clipId})`}>
        <rect width="600" height="720" fill={`url(#${lightId})`} />
        {LEAF_VEINS.map((vein) => (
          <path key={vein} d={vein} fill="none" stroke="#E9EED8" strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round" />
        ))}
        <path d={LEAF_PATH} fill="none" stroke={`url(#${rimId})`} strokeWidth="14" />
      </g>
      <path d={LEAF_PATH} fill="none" stroke="#E9EED8" strokeOpacity="0.35" strokeWidth="1.2" />
    </svg>
  )
}

/* ──────────────────────────────── Gráfico de umidade ──────────────────────────────── */

const MoistureChart = ({ series, width = 320, height = 96, min = 14, max = 50, accent = BRAND.broto, isStill, label, showAxis = false }) => {
  const areaId = useSvgId('chart-area')
  const paddingLeft = showAxis ? 26 : 4
  const paddingBottom = showAxis ? 16 : 6
  const points = series.map((point, index) => ({
    x: paddingLeft + (index / (series.length - 1)) * (width - paddingLeft - 4),
    y: 6 + (1 - (point.value - min) / (max - min)) * (height - paddingBottom - 6),
  }))
  const linePath = buildSmoothPath(points)
  const areaPath = `${linePath} L${points[points.length - 1].x},${height - paddingBottom} L${points[0].x},${height - paddingBottom} Z`
  const lastPoint = points[points.length - 1]
  const thresholdY = 6 + (1 - (MOISTURE_ALERT_THRESHOLD - min) / (max - min)) * (height - paddingBottom - 6)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="h-auto w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.32" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showAxis && (
        <g fill={PLATFORM.muted} fontSize="9" fontWeight="600">
          {[20, 30, 40, 50].map((tick) => (
            <text key={tick} x="0" y={6 + (1 - (tick - min) / (max - min)) * (height - paddingBottom - 6) + 3}>
              {tick}%
            </text>
          ))}
          {series.map((point, index) => (index % 3 === 0 ? (
            <text key={point.hour} x={points[index].x} y={height - 3} textAnchor="middle">
              {point.hour}
            </text>
          ) : null))}
        </g>
      )}
      <line x1={paddingLeft} x2={width - 4} y1={thresholdY} y2={thresholdY} stroke={accent} strokeOpacity="0.35" strokeDasharray="3 4" />
      <path d={areaPath} fill={`url(#${areaId})`} />
      <motion.path d={linePath} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" initial={{ pathLength: isStill ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: isStill ? 0 : 0.9, ease: EASE_REVEAL }} />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="3.5" fill={accent} />
    </svg>
  )
}

/* ──────────────────────────────── Botão magnético ──────────────────────────────── */

const MagneticButton = ({ onClick, children, isStill }) => {
  const buttonRef = useRef(null)
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const springX = useSpring(offsetX, SPRING_MAGNET)
  const springY = useSpring(offsetY, SPRING_MAGNET)

  const handlePointerMove = (event) => {
    if (isStill || event.pointerType !== 'mouse' || !buttonRef.current) return
    const bounds = buttonRef.current.getBoundingClientRect()
    offsetX.set(clamp((event.clientX - (bounds.left + bounds.width / 2)) * 0.32, -40, 40))
    offsetY.set(clamp((event.clientY - (bounds.top + bounds.height / 2)) * 0.45, -20, 20))
  }

  const handlePointerLeave = () => {
    offsetX.set(0)
    offsetY.set(0)
  }

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.94 }}
      transition={TAP_SNAP}
      className="group relative inline-flex min-h-[3.75rem] items-center gap-4 rounded-[999px] bg-[#9BA657] py-3 pl-7 pr-3 text-left text-[#172815] shadow-[0_18px_60px_-18px_rgba(155,166,87,0.65)] transition-colors duration-200 hover:bg-[#B7BF86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
    >
      <span className="text-base font-bold tracking-tight sm:text-lg font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]">{children}</span>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#172815] text-[#9BA657]">
        <Icon name="arrow" className="h-5 w-5" strokeWidth={2} />
      </span>
    </motion.button>
  )
}

/* ──────────────────────────────── Cabeçalho da vitrine ──────────────────────────────── */

const SiteHeader = ({ isMotionPaused, onToggleMotion, onOpenPlatform, onOpenLogin, isLoggedIn }) => (
  <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#050b07]/75 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-[94rem] items-center justify-between gap-4 px-5 sm:px-8 lg:px-16">
      <a href="#inicio" className="flex min-h-[44px] items-center rounded-[0.25rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9BA657]" aria-label="AGROVIVA, início">
        <LogoCompact />
      </a>
      <nav aria-label="Seções" className="hidden items-center gap-1 md:flex">
        {[
          { href: '#contexto', label: 'Contexto' },
          { href: '#projeto', label: 'O projeto' },
        ].map((link) => (
          <a key={link.href} href={link.href} className="flex min-h-[44px] items-center rounded-[0.25rem] px-3 text-sm font-semibold text-[#C9D0C1] transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9BA657]">
            {link.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onToggleMotion} aria-pressed={isMotionPaused} aria-label={isMotionPaused ? 'Retomar movimento' : 'Pausar movimento'} className="flex h-11 w-11 items-center justify-center rounded-[0.25rem] border border-white/[0.1] text-[#C9D0C1] transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9BA657]">
          <Icon name={isMotionPaused ? 'play' : 'pause'} />
        </button>
        <button type="button" onClick={isLoggedIn ? onOpenPlatform : onOpenLogin} className="flex min-h-[44px] items-center gap-2 rounded-[999px] px-3 text-sm font-semibold text-[#C9D0C1] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9BA657]">
          <Icon name="user" />
          {isLoggedIn ? 'Operador ativo' : 'Entrar'}
        </button>
        <button type="button" onClick={onOpenPlatform} className="flex min-h-[44px] items-center gap-2 rounded-[999px] bg-[#9BA657] px-4 text-sm font-bold text-[#172815] transition-colors duration-200 hover:bg-[#B7BF86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <span className="hidden lg:inline">Acessar monitoramento do campo</span>
          <span className="lg:hidden">Monitoramento</span>
          <Icon name="arrow" strokeWidth={2} />
        </button>
      </div>
    </div>
  </header>
)

/* ──────────────────────────────── Hero ──────────────────────────────── */

const PeekCard = ({ onOpenPlatform, isStill, pointerX, pointerY }) => {
  const bed = getBed('C02')
  const rotateX = useTransform(pointerY, [-1, 1], [16, 6])
  const rotateY = useTransform(pointerX, [-1, 1], [-24, -12])
  const series = useMemo(() => buildMoistureSeries(bed), [bed])
  const handleOpen = () => onOpenPlatform(bed.bedId)

  return (
    <div className="[perspective:1200px]">
      <motion.button
        type="button"
        onClick={handleOpen}
        aria-label={`Abrir o canteiro ${bed.bedId}, ${bed.cropName}, no console. Umidade ${bed.moisture}% VWC, rega recomendada.`}
        style={isStill ? undefined : { rotateX, rotateY, rotateZ: 2 }}
        whileHover={isStill ? undefined : { scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={TAP_SNAP}
        className="relative block w-[19.5rem] max-w-full rounded-[0.5rem] border border-white/[0.1] bg-white/[0.04] p-5 text-left shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md [transform-style:preserve-3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9BA657]"
      >
        <span className="flex items-start justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-[#C9D0C1]">{bed.bedId} · Setor {bed.sector}</span>
            <span className="mt-1 block text-2xl font-bold tracking-tight text-white font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]">{bed.cropName}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#C9D0C1]">
            <span className="relative flex h-2 w-2">
              {!isStill && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9BA657] opacity-60" />}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9BA657]" />
            </span>
            {bed.lastReading}
          </span>
        </span>
        <span className="mt-5 grid grid-cols-3 gap-3">
          {[
            { icon: 'drop', label: 'Umidade', value: String(bed.moisture), unit: '% VWC' },
            { icon: 'thermometer', label: 'Raiz', value: formatDecimal(bed.rootTemperature), unit: '°C' },
            { icon: 'bolt', label: 'Condut.', value: formatDecimal(bed.conductivity), unit: 'mS/cm' },
          ].map((metric) => (
            <span key={metric.label}>
              <span className="flex items-center gap-1 text-xs font-semibold text-[#C9D0C1]">
                <Icon name={metric.icon} className="h-3.5 w-3.5" /> {metric.label}
              </span>
              <span className="mt-1 block text-2xl font-bold tracking-tight text-white font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]">
                {metric.value}
                <span className="ml-0.5 text-[0.7rem] font-semibold text-[#C9D0C1]">{metric.unit}</span>
              </span>
            </span>
          ))}
        </span>
        <span className="mt-4 block">
          <MoistureChart series={series} height={64} isStill={isStill} label={`Umidade do ${bed.bedId} nas últimas 12 horas`} />
        </span>
        <span className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F4D18C]">
            <Icon name="alert" className="h-3.5 w-3.5" /> Rega recomendada
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-[#9BA657]">
            Abrir console <Icon name="arrowUpRight" className="h-4 w-4" />
          </span>
        </span>
      </motion.button>
    </div>
  )
}

const HERO_LINES = ['O campo fala.', 'A gente ajuda a ouvir.']

const Hero = ({ onOpenPlatform, isStill }) => {
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, { stiffness: 62, damping: 13, mass: 1.08 })
  const springY = useSpring(pointerY, { stiffness: 62, damping: 13, mass: 1.08 })
  const leafRotate = useTransform(springX, [-1, 1], [-4, 4])
  const leafX = useTransform(springX, [-1, 1], [-18, 18])
  const leafY = useTransform(springY, [-1, 1], [-14, 14])

  const handlePointerMove = (event) => {
    if (isStill || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set(clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1))
    pointerY.set(clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1))
  }

  const handlePointerLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  const handleOpen = () => onOpenPlatform('C02')

  return (
    <section id="inicio" aria-labelledby="hero-title" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} className="relative isolate overflow-hidden pt-16">
      <SectionLight className="-right-40 top-10 h-[46rem] w-[46rem]" />
      <SectionLight className="-left-60 bottom-0 h-[30rem] w-[30rem] opacity-60" />
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[94rem] grid-cols-1 items-center gap-12 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-12 lg:px-16 lg:pb-24">
        <div className="relative z-10 lg:col-span-7">
          <h1 id="hero-title" className="text-[clamp(2.75rem,6.6vw,6.75rem)] font-extrabold leading-[0.92] tracking-[-0.035em] text-white font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]">
            {HERO_LINES.map((line, index) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <motion.span className={cx('block', index === 1 && 'text-[#9BA657]')} initial={isStill ? false : { y: '105%' }} animate={{ y: '0%' }} transition={{ duration: 0.86, delay: 0.1 * index, ease: EASE_REVEAL }}>
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={isStill ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: EASE_REVEAL }} className="mt-8 max-w-[36rem] text-lg leading-relaxed text-[#C9D0C1] sm:text-xl">
            Veja o que mudou no solo, decida onde a rega é necessária e registre o que foi feito em cada canteiro.
          </motion.p>
          <motion.div initial={isStill ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.42, ease: EASE_REVEAL }} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <MagneticButton onClick={handleOpen} isStill={isStill}>
              Acessar monitoramento do campo
            </MagneticButton>
            <a href="#projeto" className="flex min-h-[44px] items-center gap-2 rounded-[0.25rem] px-1 text-base font-semibold text-white underline decoration-[#9BA657]/50 underline-offset-[6px] transition-colors duration-200 hover:decoration-[#9BA657] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9BA657]">
              Conhecer o projeto
            </a>
          </motion.div>
        </div>
        <div className="relative min-h-[34rem] lg:col-span-5 lg:min-h-[44rem]">
          <motion.div className="pointer-events-none absolute -right-16 -top-10 w-[118%] max-w-[44rem] sm:-right-24 lg:-right-40 lg:-top-16 lg:w-[150%]" style={isStill ? undefined : { rotate: leafRotate, x: leafX, y: leafY }}>
            <motion.div animate={isStill ? { y: 0 } : { y: [0, -12, 0] }} transition={{ duration: 7.4, repeat: Infinity, ease: 'easeInOut' }}>
              <LeafArtwork className="h-auto w-full -rotate-[14deg]" />
            </motion.div>
          </motion.div>
          <div className="absolute bottom-0 left-0 z-10 sm:left-6 lg:-left-10 lg:bottom-8">
            <PeekCard onOpenPlatform={onOpenPlatform} isStill={isStill} pointerX={springX} pointerY={springY} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────── Barra de telemetria ──────────────────────────────── */

const DockIndicator = ({ icon, label, value, detail, tone, isStill }) => (
  <div className="flex gap-3 py-5 lg:px-6 lg:py-6">
    <span className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
      {!isStill && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ background: tone }} />}
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: tone }} />
    </span>
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-[#C9D0C1]">
        <Icon name={icon} className="h-4 w-4" /> {label}
      </p>
      <p className="mt-1 text-xl font-bold tracking-tight text-white font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]">{value}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#C9D0C1]">{detail}</p>
    </div>
  </div>
)

const FieldDock = ({ isStill }) => {
  const series = useMemo(() => buildMoistureSeries(getBed('C02')), [])
  return (
    <section aria-label="Telemetria do campo" className="relative border-y border-white/[0.07] bg-[#172815]/70 backdrop-blur-md">
      <div className="mx-auto grid max-w-[94rem] grid-cols-1 divide-y divide-white/[0.07] px-5 sm:px-8 lg:grid-cols-12 lg:divide-x lg:divide-y-0 lg:px-16">
        <div className="lg:col-span-3 lg:pl-0">
          <DockIndicator icon="drop" label="Umidade média dos lotes" value={`${averageMoisture}% VWC`} detail={`${bedsInAttention.length} canteiros abaixo de ${MOISTURE_ALERT_THRESHOLD}%.`} tone={BRAND.attention} isStill={isStill} />
        </div>
        <div className="lg:col-span-3">
          <DockIndicator icon="thermometer" label="Microclima" value="21 °C · estável" detail="Sem risco de geada nas próximas 12 h." tone={BRAND.broto} isStill={isStill} />
        </div>
        <div className="lg:col-span-3">
          <DockIndicator icon="wifi" label="Conexão local" value="Sincronizado" detail="Controlador pronto para operar sem internet." tone={BRAND.broto} isStill={isStill} />
        </div>
        <div className="py-5 lg:col-span-3 lg:px-6 lg:py-6 lg:pr-0">
          <p className="flex items-center justify-between gap-2 text-sm font-semibold text-[#C9D0C1]">
            <span>Pulso hídrico · C02 Rúcula</span>
            <span className="text-white">19% VWC</span>
          </p>
          <div className="mt-2 max-w-[22rem]">
            <MoistureChart series={series} height={56} accent={BRAND.attention} isStill={isStill} label="Umidade do C02 nas últimas 12 horas" />
          </div>
          <p className="mt-1 text-xs text-[#C9D0C1]">Últimas 12 h</p>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────── Contexto ──────────────────────────────── */

const ContextSection = () => (
  <section id="contexto" aria-labelledby="contexto-title" className="relative overflow-hidden py-24 lg:py-36">
    <SectionLight className="-left-40 top-20 h-[36rem] w-[36rem] opacity-70" />
    <div className="relative mx-auto grid max-w-[94rem] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-16">
      <div className="lg:col-span-5">
        <h2 id="contexto-title" className="text-[clamp(2.4rem,5vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-white font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]">
          Quando o tempo muda, a decisão é por canteiro
        </h2>
        <div className="mt-10 rounded-[0.5rem] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#F4D18C]">
            <Icon name="alert" className="h-4 w-4" /> Agora no C02
          </p>
          <p className="mt-3 text-base leading-relaxed text-[#C9D0C1]">
            A rúcula registra <strong className="text-white">19% de umidade</strong> às <strong className="text-white">10h28</strong>, abaixo do limite do lote. A nota das 10h12 pede conferir a linha de gotejo na ponta do canteiro. No mapa, o trecho aparece marcado; no console, a rega de 15 minutos está a um toque.
          </p>
        </div>
      </div>
      <div className="space-y-8 text-base leading-relaxed text-[#C9D0C1] lg:col-span-6 lg:col-start-7">
        <p className="text-lg text-[#E4E8DC]">
          A chuva pode chegar depois de uma rega planejada ou atingir os canteiros de forma desigual. O calor e os intervalos secos aceleram a perda de água. Depois de chuva forte, um trecho fica encharcado enquanto outro já está drenando. A previsão regional ajuda a planejar o dia; a decisão de manejo depende do que aconteceu naquele canteiro.
        </p>
        <p>
          Quando leituras, fotos, anotações e conversas ficam espalhadas, fica difícil recuperar o motivo de uma decisão ou explicar ao técnico o que mudou. A AGROVIVA reúne tudo isso por lote: a leitura com horário e validade, a foto do mesmo trecho, a regra que gerou o alerta e o registro do que foi feito.
        </p>
        <p>
          O controlador instalado na propriedade segue coletando e executando as regras autorizadas mesmo sem internet. Quando a conexão volta, o histórico sincroniza e nada que expirou é executado.
        </p>
      </div>
    </div>
  </section>
)

/* ──────────────────────────────── Projeção orbital ──────────────────────────────── */

const STAGE_WIDTH = 640
const STAGE_HEIGHT = 600
const STAGE_CENTER = { x: STAGE_WIDTH / 2, y: STAGE_HEIGHT / 2 }
const FOCAL_LENGTH = 1200
const DEPTH_RANGE = 250
const CAMERA_BASE = { pitch: (55 * Math.PI) / 180, yaw: (-20 * Math.PI) / 180 }
const CAMERA_SWAY = { pitch: (9 * Math.PI) / 180, yaw: (12 * Math.PI) / 180 }
const ORBIT_SAMPLES = 120

const rotatePoint = ({ x, y, z }, [rotationX, rotationY, rotationZ]) => {
  const yAfterX = y * Math.cos(rotationX) - z * Math.sin(rotationX)
  const zAfterX = y * Math.sin(rotationX) + z * Math.cos(rotationX)
  const xAfterY = x * Math.cos(rotationY) + zAfterX * Math.sin(rotationY)
  const zAfterY = -x * Math.sin(rotationY) + zAfterX * Math.cos(rotationY)
  return { x: xAfterY * Math.cos(rotationZ) - yAfterX * Math.sin(rotationZ), y: xAfterY * Math.sin(rotationZ) + yAfterX * Math.cos(rotationZ), z: zAfterY }
}

const projectOrbitPoint = (orbit, angle, camera) => {
  const tilted = rotatePoint({ x: orbit.major * Math.cos(angle), y: orbit.minor * Math.sin(angle), z: 0 }, orbit.tilt)
  const world = rotatePoint(tilted, [camera.pitch, camera.yaw, 0])
  const perspective = FOCAL_LENGTH / (FOCAL_LENGTH - world.z)
  return { x: world.x * perspective, y: world.y * perspective, z: world.z }
}

const getDepthStyle = (depth) => {
  const ratio = clamp((depth + DEPTH_RANGE) / (DEPTH_RANGE * 2), 0, 1)
  return { ratio, scale: 0.65 + ratio * 0.6, opacity: 0.5 + ratio * 0.5, blur: ratio < 0.45 ? (0.45 - ratio) * 3.2 : 0, glow: 8 + ratio * 34 }
}

const buildOrbitPaths = (orbit, camera) => {
  const projected = Array.from({ length: ORBIT_SAMPLES + 1 }, (_, index) => projectOrbitPoint(orbit, (index / ORBIT_SAMPLES) * Math.PI * 2, camera))
  const toStage = (point) => `${(STAGE_CENTER.x + point.x).toFixed(1)},${(STAGE_CENTER.y + point.y).toFixed(1)}`
  const fullPath = projected.map((point, index) => `${index === 0 ? 'M' : 'L'}${toStage(point)}`).join(' ')
  const frontPath = projected
    .map((point, index) => {
      if (point.z < 0) return ''
      const previous = projected[index - 1]
      return `${!previous || previous.z < 0 ? 'M' : 'L'}${toStage(point)}`
    })
    .filter(Boolean)
    .join(' ')
  return { fullPath, frontPath }
}

const useOrbitClock = (isStill, targetSpeedRef) => {
  const [elapsed, setElapsed] = useState(0)
  const speedRef = useRef(1)
  useEffect(() => {
    if (isStill) return undefined
    let frameId = 0
    let lastTime = performance.now()
    const handleFrame = (now) => {
      const delta = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now
      speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.06
      setElapsed((previous) => previous + delta * speedRef.current)
      frameId = window.requestAnimationFrame(handleFrame)
    }
    frameId = window.requestAnimationFrame(handleFrame)
    return () => window.cancelAnimationFrame(frameId)
  }, [isStill, targetSpeedRef])
  return elapsed
}

const useElementSize = (elementRef) => {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = elementRef.current
    if (!element) return undefined
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [elementRef])
  return size
}

const useIsWide = () => {
  const [isWide, setIsWide] = useState(false)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleChange = () => setIsWide(mediaQuery.matches)
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  return isWide
}

const OrbitSphere = ({ pillar, position, depth, isActive, onSelect }) => {
  const [isPressed, setIsPressed] = useState(false)
  const depthStyle = getDepthStyle(depth)
  const handleClick = () => onSelect(pillar.id)
  const handlePointerDown = () => setIsPressed(true)
  const handlePointerRelease = () => setIsPressed(false)

  return (
    <>
      <span
        className="pointer-events-none absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        style={{ left: position.x, top: position.y, zIndex: depth >= 0 ? 30 + Math.round(depthStyle.ratio * 10) : 5 }}
        aria-hidden="true"
      >
        <span
          className="flex items-center justify-center"
          style={{ transform: `scale(${depthStyle.scale * (isActive ? 1.12 : 1)})`, opacity: depthStyle.opacity, filter: depthStyle.blur > 0 ? `blur(${depthStyle.blur.toFixed(2)}px)` : 'none' }}
        >
          <motion.span
            className="block h-11 w-11 rounded-full"
            animate={{ scale: isPressed ? 0.88 : 1 }}
            transition={TAP_SNAP}
            style={{
              background: `radial-gradient(circle at 32% 28%, #FFFFFF 0%, ${pillar.color} 34%, ${BRAND.oliva} 78%, ${BRAND.mata} 100%)`,
              boxShadow: `0 0 ${depthStyle.glow}px ${pillar.color}${isActive ? 'CC' : '66'}, inset -6px -8px 14px rgba(23,40,21,0.55)`,
            }}
          />
          {isActive && <span className="absolute h-[3.4rem] w-[3.4rem] rounded-full border" style={{ borderColor: `${pillar.color}AA` }} />}
        </span>
        <span
          lang={pillar.isEnglishName ? 'en' : undefined}
          className={cx('absolute left-1/2 top-[calc(100%+0.35rem)] -translate-x-1/2 whitespace-nowrap rounded-[0.25rem] px-1.5 text-sm font-semibold', isActive && 'bg-[#172815]/80 text-white', !isActive && 'text-[#C9D0C1]')}
          style={{ opacity: 0.55 + depthStyle.ratio * 0.45 }}
        >
          {pillar.name}
        </span>
      </span>
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerRelease}
        onPointerLeave={handlePointerRelease}
        onPointerCancel={handlePointerRelease}
        aria-pressed={isActive}
        aria-controls="painel-pilar"
        aria-label={`${pillar.name}: ${pillar.subtitle}`}
        className="pointer-events-auto absolute z-50 h-16 w-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9BA657]"
        style={{ left: position.x, top: position.y }}
      />
    </>
  )
}

const AtomCore = ({ isStill }) => (
  <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex h-[9.5rem] w-[9.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center" aria-hidden="true">
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{ background: `radial-gradient(circle at 34% 26%, rgba(255,255,255,0.32) 0%, rgba(155,166,87,0.28) 26%, ${BRAND.oliva}CC 58%, ${BRAND.mata} 100%)`, boxShadow: `0 0 80px ${BRAND.broto}55, inset 0 0 34px rgba(255,255,255,0.12), inset -14px -18px 30px rgba(10,17,9,0.7)` }}
      animate={isStill ? { scale: 1 } : { scale: [1, 1.035, 1] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
    />
    <div className="absolute inset-[6%] rounded-full border border-white/[0.14]" />
    <div className="absolute left-[18%] top-[10%] h-[24%] w-[42%] rotate-[-24deg] rounded-full bg-white/[0.16] blur-[6px]" />
    <LogoVertical className="relative w-[60%]" />
  </div>
)

/* ──────────────────────────────── Visualizações dos pilares ──────────────────────────────── */

const PulseVisual = ({ isStill }) => {
  const trackStart = 44
  const trackWidth = 214
  return (
    <figure>
      <svg viewBox="0 0 320 168" preserveAspectRatio="xMidYMid meet" className="h-auto w-full" role="img" aria-label="Umidade do solo dos seis canteiros em % VWC">
        {BEDS.map((bed, index) => {
          const rowY = 10 + index * 24
          const barWidth = (bed.moisture / VWC_SCALE_MAX) * trackWidth
          const color = isBedInAttention(bed) ? BRAND.attention : BRAND.broto
          return (
            <g key={bed.bedId}>
              <text x="0" y={rowY + 10} fill={BRAND.textSecondary} fontSize="11" fontWeight="600">{bed.bedId}</text>
              <rect x={trackStart} y={rowY} width={trackWidth} height="13" rx="2" fill="#FFFFFF" fillOpacity="0.05" />
              <motion.rect x={trackStart} y={rowY} height="13" rx="2" fill={color} fillOpacity="0.85" initial={{ width: isStill ? barWidth : 0 }} animate={{ width: barWidth }} transition={{ duration: isStill ? 0 : 0.6, delay: index * 0.04, ease: EASE_REVEAL }} />
              <text x="316" y={rowY + 10.5} textAnchor="end" fill="#FFFFFF" fontSize="11.5" fontWeight="700">{bed.moisture}%</text>
            </g>
          )
        })}
        <line x1={trackStart + (MOISTURE_ALERT_THRESHOLD / VWC_SCALE_MAX) * trackWidth} x2={trackStart + (MOISTURE_ALERT_THRESHOLD / VWC_SCALE_MAX) * trackWidth} y1="6" y2="150" stroke={BRAND.attention} strokeOpacity="0.5" strokeDasharray="3 3" />
        {[0, 10, 20, 30, 40, 50].map((tick) => (
          <text key={tick} x={trackStart + (tick / VWC_SCALE_MAX) * trackWidth} y="163" textAnchor="middle" fill={BRAND.textSecondary} fontSize="9">{tick}</text>
        ))}
      </svg>
      <figcaption className="mt-2 text-xs leading-relaxed text-[#C9D0C1]">Escala de 0 a 50% VWC. Linha tracejada: limite de rega do lote ({MOISTURE_ALERT_THRESHOLD}%).</figcaption>
    </figure>
  )
}

const MAP_VIEWBOX = { width: 640, height: 400 }
const BED_LAYOUT = { C01: 56, C02: 104, C03: 152, C04: 246, C05: 294, C06: 342 }
const BED_SIZE = { x: 230, width: 350, height: 36 }

const PropertyMap = ({ selectedBedId, onSelectBed, isInteractive = true, accent = BRAND.broto, alert = BRAND.attention, textColor = BRAND.textSecondary }) => {
  const handleKeyDown = (bedId) => (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelectBed(bedId)
  }
  const handleClick = (bedId) => () => {
    if (isInteractive) onSelectBed(bedId)
  }
  return (
    <svg viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`} preserveAspectRatio="xMidYMid meet" className="h-auto w-full" role={isInteractive ? 'group' : 'img'} aria-label="Mapa da propriedade com reservatório, válvulas e canteiros C01 a C06">
      <text x="230" y="40" fill={textColor} fontSize="13" fontWeight="700">Setor Norte</text>
      <text x="230" y="232" fill={textColor} fontSize="13" fontWeight="700">Setor Sul</text>
      <circle cx="76" cy="200" r="34" fill={accent} fillOpacity="0.14" stroke={accent} strokeOpacity="0.7" />
      <path d="M54 206q11-8 22 0t22 0" stroke={accent} strokeOpacity="0.8" fill="none" />
      <text x="76" y="254" textAnchor="middle" fill={textColor} fontSize="11.5" fontWeight="600">Reservatório</text>
      <path d="M110 200H140V112H190M140 200V304H190" fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="2.5" />
      {[{ label: 'Válvula N', y: 112 }, { label: 'Válvula S', y: 304 }].map((valve) => (
        <g key={valve.label}>
          <rect x="186" y={valve.y - 9} width="18" height="18" rx="3" fill="none" stroke={accent} strokeWidth="1.5" />
          <path d={`M190 ${valve.y - 5}l10 10M200 ${valve.y - 5}l-10 10`} stroke={accent} strokeWidth="1.3" />
          <text x="195" y={valve.y + 26} textAnchor="middle" fill={textColor} fontSize="10">{valve.label}</text>
        </g>
      ))}
      <path d="M204 112H216V74M216 112V170" fill="none" stroke={accent} strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M204 304H216V264M216 304V360" fill="none" stroke={accent} strokeOpacity="0.45" strokeWidth="1.5" />
      {BEDS.map((bed) => {
        const y = BED_LAYOUT[bed.bedId]
        const tone = isBedInAttention(bed) ? alert : accent
        const isSelected = bed.bedId === selectedBedId
        return (
          <g key={bed.bedId} role={isInteractive ? 'button' : undefined} tabIndex={isInteractive ? 0 : undefined} aria-label={isInteractive ? `${bed.bedId}, ${bed.cropName}, ${bed.moisture}% VWC` : undefined} aria-pressed={isInteractive ? isSelected : undefined} onClick={handleClick(bed.bedId)} onKeyDown={isInteractive ? handleKeyDown(bed.bedId) : undefined} className={cx(isInteractive && 'cursor-pointer outline-none [&:focus-visible>rect:first-child]:stroke-white')}>
            <rect x={BED_SIZE.x} y={y} width={BED_SIZE.width} height={BED_SIZE.height} rx="4" fill={tone} fillOpacity={isSelected ? 0.3 : 0.12} stroke={isSelected ? '#FFFFFF' : tone} strokeOpacity={isSelected ? 1 : 0.6} strokeWidth={isSelected ? 2 : 1} />
            <line x1={BED_SIZE.x - 14} y1={y + 18} x2={BED_SIZE.x + BED_SIZE.width - 10} y2={y + 18} stroke={accent} strokeOpacity="0.3" strokeDasharray="1 5" strokeLinecap="round" />
            <text x={BED_SIZE.x + 12} y={y + 23} fill="#FFFFFF" fontSize="13" fontWeight="700">{bed.bedId}</text>
            <text x={BED_SIZE.x + 48} y={y + 23} fill={textColor} fontSize="12.5">{bed.cropName}</text>
            <circle cx={BED_SIZE.x + BED_SIZE.width - 66} cy={y + 18} r="4" fill={tone} />
            <text x={BED_SIZE.x + BED_SIZE.width - 10} y={y + 23} textAnchor="end" fill="#FFFFFF" fontSize="13" fontWeight="700">{bed.moisture}%</text>
          </g>
        )
      })}
    </svg>
  )
}

const LEAF_INSPECTION_PATH = 'M160 22C118 40 74 78 62 128c-10 42 6 86 44 110 20 13 38 18 54 20 16-2 34-7 54-20 38-24 54-68 44-110-12-50-56-88-98-106z'
const LEAF_INSPECTION_VEINS = ['M160 258V30', 'M160 92c-28 10-56 28-78 54', 'M160 92c28 10 56 28 78 54', 'M160 150c-26 8-50 24-70 46', 'M160 150c26 8 50 24 70 46', 'M160 200c-18 6-34 16-48 30', 'M160 200c18 6 34 16 48 30']
const LESIONS = [
  { x: 118, y: 150, r: 9 },
  { x: 128, y: 172, r: 6 },
  { x: 104, y: 176, r: 4.5 },
]

const BIOMETRIC_LANDMARKS = [
  { id: 1, x: 130, y: 22 },
  { id: 2, x: 130, y: 258 },
  { id: 3, x: 28, y: 150 },
  { id: 4, x: 232, y: 150 },
  { id: 5, x: 62, y: 70 },
  { id: 6, x: 198, y: 70 },
]

const BIOMETRIC_READINGS = [
  { label: 'Comprimento', value: '18,4 cm' },
  { label: 'Largura', value: '12,1 cm' },
  { label: 'Área foliar', value: '164 cm²' },
  { label: 'Razão C/L', value: '1,52' },
  { label: 'Índice de verde', value: '0,71' },
  { label: 'Lesões', value: '3 · 4,8%', isAlert: true },
]

const VisionVisual = () => {
  const gridId = useSvgId('vision-grid')
  const leafId = useSvgId('vision-leaf')
  const clipId = useSvgId('vision-clip')
  const arrowId = useSvgId('vision-arrow')

  return (
    <figure>
      <svg viewBox="0 0 360 300" preserveAspectRatio="xMidYMid meet" className="h-auto w-full" role="img" aria-label="Análise biométrica foliar: comprimento 18,4 cm, largura 12,1 cm, área foliar 164 cm², três lesões ocupando 4,8% da área">
        <defs>
          <pattern id={gridId} width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M12 0H0V12" fill="none" stroke={BRAND.broto} strokeOpacity="0.12" strokeWidth="0.6" />
          </pattern>
          <linearGradient id={leafId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={BRAND.oliva} stopOpacity="0.6" />
            <stop offset="1" stopColor={BRAND.mata} stopOpacity="0.95" />
          </linearGradient>
          <clipPath id={clipId}>
            <path d={LEAF_INSPECTION_PATH} transform="translate(-30 0)" />
          </clipPath>
          <marker id={arrowId} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L8 4L0 8z" fill={BRAND.textSecondary} />
          </marker>
        </defs>
        <rect width="244" height="300" fill={`url(#${gridId})`} />
        <g transform="translate(-30 0)">
          <path d={LEAF_INSPECTION_PATH} fill={`url(#${leafId})`} stroke={BRAND.broto} strokeWidth="1.2" />
        </g>
        <g clipPath={`url(#${clipId})`}>
          <g transform="translate(-30 0)">
            {LEAF_INSPECTION_VEINS.map((vein) => (
              <path key={vein} d={vein} fill="none" stroke="#DBE2C5" strokeOpacity="0.45" strokeWidth="1" />
            ))}
          </g>
          {LESIONS.map((lesion) => (
            <g key={`${lesion.x}-${lesion.y}`}>
              <circle cx={lesion.x - 30} cy={lesion.y} r={lesion.r} fill={BRAND.terra} fillOpacity="0.9" />
              <circle cx={lesion.x - 30} cy={lesion.y} r={lesion.r + 3} fill="none" stroke={BRAND.attention} strokeWidth="1" strokeDasharray="2 2" />
            </g>
          ))}
        </g>
        <rect x="58" y="130" width="60" height="62" fill="none" stroke={BRAND.attention} strokeWidth="1.2" />
        <line x1="10" y1="22" x2="10" y2="258" stroke={BRAND.textSecondary} strokeWidth="1" markerStart={`url(#${arrowId})`} markerEnd={`url(#${arrowId})`} />
        <text x="6" y="140" fill="#FFFFFF" fontSize="10" fontWeight="700" transform="rotate(-90 6 140)" textAnchor="middle">C 18,4 cm</text>
        <line x1="28" y1="282" x2="232" y2="282" stroke={BRAND.textSecondary} strokeWidth="1" markerStart={`url(#${arrowId})`} markerEnd={`url(#${arrowId})`} />
        <text x="130" y="296" fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle">L 12,1 cm</text>
        <line x1="28" y1="150" x2="232" y2="150" stroke={BRAND.broto} strokeOpacity="0.6" strokeDasharray="3 3" />
        <line x1="130" y1="22" x2="130" y2="258" stroke={BRAND.broto} strokeOpacity="0.6" strokeDasharray="3 3" />
        {BIOMETRIC_LANDMARKS.map((landmark) => (
          <g key={landmark.id}>
            <circle cx={landmark.x} cy={landmark.y} r="7" fill={BRAND.mata} stroke={BRAND.broto} strokeWidth="1.2" />
            <text x={landmark.x} y={landmark.y + 3.2} textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="700">{landmark.id}</text>
          </g>
        ))}
        <g transform="translate(252 20)">
          <text fill={BRAND.broto} fontSize="10.5" fontWeight="700">Biometria foliar</text>
          <text y="14" fill={BRAND.textSecondary} fontSize="9">C03 · registro 9h40</text>
          {BIOMETRIC_READINGS.map((reading, index) => (
            <g key={reading.label} transform={`translate(0 ${36 + index * 38})`}>
              <line x1="0" x2="100" y1="-12" y2="-12" stroke="#FFFFFF" strokeOpacity="0.08" />
              <text fill={BRAND.textSecondary} fontSize="9" fontWeight="600">{reading.label}</text>
              <text y="15" fill={reading.isAlert ? BRAND.attention : '#FFFFFF'} fontSize="13" fontWeight="700">{reading.value}</text>
            </g>
          ))}
        </g>
      </svg>
      <figcaption className="mt-2 text-xs leading-relaxed text-[#C9D0C1]">Seis marcos anatômicos calculam dimensões e área. A marcação de lesões orienta a inspeção; a causa depende de confirmação técnica.</figcaption>
    </figure>
  )
}

const LocalVisual = () => {
  const toX = (minute) => 30 + ((minute - 480) / 150) * 280
  return (
    <figure>
      <svg viewBox="0 0 320 168" preserveAspectRatio="xMidYMid meet" className="h-auto w-full" role="img" aria-label="Linha do tempo da operação sem internet entre 8h35 e 9h35 com 72 leituras guardadas localmente">
        <rect x={toX(515)} y="6" width={toX(575) - toX(515)} height="140" fill={BRAND.attention} fillOpacity="0.07" />
        <line x1={toX(515)} y1="6" x2={toX(515)} y2="146" stroke={BRAND.attention} strokeOpacity="0.5" strokeDasharray="3 3" />
        <line x1={toX(575)} y1="6" x2={toX(575)} y2="146" stroke={BRAND.broto} strokeOpacity="0.8" />
        <text x={(toX(515) + toX(575)) / 2} y="18" textAnchor="middle" fill={BRAND.attention} fontSize="9.5" fontWeight="600">sem internet · 60 min</text>
        {BEDS.map((bed, rowIndex) => {
          const rowY = 34 + rowIndex * 18
          return (
            <g key={bed.bedId}>
              <text x="0" y={rowY + 3.5} fill={BRAND.textSecondary} fontSize="9.5" fontWeight="600">{bed.bedId}</text>
              {Array.from({ length: 31 }, (_, tick) => 480 + tick * 5).map((minute) => {
                const isOffline = minute > 515 && minute <= 575
                return <rect key={minute} x={toX(minute) - 1} y={rowY - 4} width="2" height="8" rx="1" fill={isOffline ? BRAND.attention : BRAND.broto} fillOpacity={isOffline ? 0.9 : 0.55} />
              })}
            </g>
          )
        })}
        {['8h', '8h30', '9h', '9h30', '10h', '10h30'].map((label, index) => (
          <text key={label} x={toX(480 + index * 30)} y="162" textAnchor="middle" fill={BRAND.textSecondary} fontSize="9">{label}</text>
        ))}
      </svg>
      <figcaption className="mt-2 text-xs leading-relaxed text-[#C9D0C1]">Em amarelo, as 72 leituras guardadas pelo controlador durante a queda e sincronizadas às 9h35.</figcaption>
    </figure>
  )
}

const SHARE_STEPS = ['Adesão', 'Visita inicial', 'Pedido', 'Confirmação', 'Atendimento', 'Devolutiva']
const SHARE_VISITS = [
  { label: 'Visita 1', state: 'Confirmada', detail: 'Horário e responsável definidos', icon: 'check', tone: BRAND.broto },
  { label: 'Visita 2', state: 'Confirmada', detail: 'Horário e responsável definidos', icon: 'check', tone: BRAND.broto },
  { label: 'Visita 3', state: 'Aguardando agendamento', detail: 'Pedido registrado, ainda sem horário', icon: 'clock', tone: BRAND.attention },
]

const ShareVisual = () => (
  <figure>
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs font-semibold text-[#C9D0C1]" aria-label="Fluxo do atendimento">
      {SHARE_STEPS.map((step, index) => (
        <li key={step} className="flex items-center gap-1.5">
          <span className="rounded-[0.25rem] border border-white/[0.1] px-2 py-1">{step}</span>
          {index < SHARE_STEPS.length - 1 && <Icon name="arrow" className="h-3 w-3 text-[#9BA657]" />}
        </li>
      ))}
    </ol>
    <ul className="mt-4 divide-y divide-white/[0.07] rounded-[0.25rem] border border-white/[0.08]">
      {SHARE_VISITS.map((visit) => (
        <li key={visit.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
          <span>
            <span className="block text-sm font-semibold text-white">{visit.label}</span>
            <span className="block text-xs text-[#C9D0C1]">{visit.detail}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: visit.tone }}>
            <Icon name={visit.icon} className="h-3.5 w-3.5" /> {visit.state}
          </span>
        </li>
      ))}
    </ul>
  </figure>
)

const PillarVisual = ({ pillarId, isStill }) => {
  if (pillarId === 'pulse') return <PulseVisual isStill={isStill} />
  if (pillarId === 'twin') return <PropertyMap selectedBedId="C02" onSelectBed={() => {}} isInteractive={false} />
  if (pillarId === 'vision') return <VisionVisual />
  if (pillarId === 'local') return <LocalVisual />
  return <ShareVisual />
}

const PillarCard = memo(({ pillar, onAction, isStill }) => {
  const handleAction = () => onAction(pillar)
  return (
    <motion.article
      initial={isStill ? false : { opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={CARD_SWAP}
      className="relative rounded-[0.5rem] border bg-white/[0.035] p-6 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-8"
      style={{ borderColor: `${pillar.color}40` }}
      aria-labelledby={`pilar-${pillar.id}-titulo`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, ${pillar.color}00, ${pillar.color}, ${pillar.color}00)` }} aria-hidden="true" />
      <ModuleSignature signature={pillar.signature} />
      <h3 id={`pilar-${pillar.id}-titulo`} className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]">
        <span lang={pillar.isEnglishName ? 'en' : undefined}>{pillar.name}</span>
        <span className="mt-1 block text-lg font-semibold tracking-normal text-[#C9D0C1] sm:text-xl">{pillar.subtitle}</span>
      </h3>
      <div className="mt-5 space-y-2 text-base leading-relaxed text-[#E4E8DC]">
        {pillar.description.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div className="mx-auto mt-6 max-w-[34rem] rounded-[0.25rem] border border-white/[0.07] bg-[#050b07]/60 p-4">
        <PillarVisual pillarId={pillar.id} isStill={isStill} />
      </div>
      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {pillar.metrics.map((metric) => (
          <div key={metric.label} className="border-l pl-3" style={{ borderColor: `${pillar.color}66` }}>
            <dd className="text-2xl font-bold tracking-tight text-white font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]">{metric.value}</dd>
            <dt className="mt-1 text-sm text-[#C9D0C1]">{metric.label}</dt>
          </div>
        ))}
      </dl>
      <motion.button type="button" onClick={handleAction} whileTap={{ scale: 0.96 }} transition={TAP_SNAP} className="mt-6 inline-flex min-h-[48px] items-center gap-3 rounded-[999px] bg-[#9BA657] px-6 text-base font-bold text-[#172815] transition-colors duration-200 hover:bg-[#B7BF86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
        {pillar.action.label}
        <Icon name="arrow" className="h-5 w-5" strokeWidth={2} />
      </motion.button>
    </motion.article>
  )
})

/* ──────────────────────────────── Seção O projeto ──────────────────────────────── */

const ProjectSection = ({ activePillarId, onSelectPillar, onPillarAction, isStill }) => {
  const layoutRef = useRef(null)
  const stageRef = useRef(null)
  const cardSlotRef = useRef(null)
  const targetSpeedRef = useRef(1)
  const isWide = useIsWide()
  const layoutSize = useElementSize(layoutRef)
  const stageSize = useElementSize(stageRef)
  const cardSize = useElementSize(cardSlotRef)
  const elapsed = useOrbitClock(isStill, targetSpeedRef)

  const cameraTargetX = useMotionValue(0)
  const cameraTargetY = useMotionValue(0)
  const cameraX = useSpring(cameraTargetX, SPRING_CAMERA)
  const cameraY = useSpring(cameraTargetY, SPRING_CAMERA)

  const stageScale = stageSize.width ? Math.min(1, stageSize.width / STAGE_WIDTH) : 1
  const camera = { pitch: CAMERA_BASE.pitch + cameraY.get() * CAMERA_SWAY.pitch, yaw: CAMERA_BASE.yaw + cameraX.get() * CAMERA_SWAY.yaw }
  const orbitScene = PILLARS.map((pillar) => ({ pillar, point: projectOrbitPoint(pillar.orbit, pillar.orbit.phase + elapsed * pillar.orbit.speed, camera), paths: buildOrbitPaths(pillar.orbit, camera) }))
  const activeScene = orbitScene.find((entry) => entry.pillar.id === activePillarId) ?? orbitScene[0]
  const activePillar = activeScene.pillar

  const getLayoutOffset = (element) => {
    if (!element || !layoutRef.current) return { left: 0, top: 0 }
    const layoutBounds = layoutRef.current.getBoundingClientRect()
    const elementBounds = element.getBoundingClientRect()
    return { left: elementBounds.left - layoutBounds.left, top: elementBounds.top - layoutBounds.top }
  }

  const stageOffset = getLayoutOffset(stageRef.current)
  const cardOffset = getLayoutOffset(cardSlotRef.current)
  const hasBeam = isWide && layoutSize.width > 0 && cardSize.width > 0
  const beamStart = { x: stageOffset.left + (STAGE_CENTER.x + activeScene.point.x) * stageScale, y: stageOffset.top + (STAGE_CENTER.y + activeScene.point.y) * stageScale }
  const beamEnd = { x: cardOffset.left + 2, y: cardOffset.top + 64 }
  const beamPath = `M${beamStart.x.toFixed(1)},${beamStart.y.toFixed(1)} C${(beamStart.x + (beamEnd.x - beamStart.x) * 0.45).toFixed(1)},${(beamStart.y - 70).toFixed(1)} ${(beamEnd.x - (beamEnd.x - beamStart.x) * 0.3).toFixed(1)},${beamEnd.y.toFixed(1)} ${beamEnd.x.toFixed(1)},${beamEnd.y.toFixed(1)}`

  const handlePointerMove = (event) => {
    if (isStill || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    cameraTargetX.set(clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1))
    cameraTargetY.set(clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1))
  }
  const handlePointerLeave = () => {
    cameraTargetX.set(0)
    cameraTargetY.set(0)
  }
  const handleStageEnter = () => {
    targetSpeedRef.current = 0.12
  }
  const handleStageLeave = () => {
    targetSpeedRef.current = 1
  }
  const handleStageFocus = () => {
    targetSpeedRef.current = 0
  }

  return (
    <section id="projeto" aria-labelledby="projeto-title" className="relative overflow-hidden border-t border-white/[0.06] py-24 lg:py-36" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <SectionLight className="left-[10%] top-[30%] h-[44rem] w-[44rem]" />
      <div className="relative mx-auto max-w-[94rem] px-5 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="projeto-title" className="text-[clamp(2.6rem,6vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.035em] text-white lg:col-span-5 font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]">O projeto</h2>
          <div className="space-y-4 text-base leading-relaxed text-[#C9D0C1] lg:col-span-6 lg:col-start-7">
            <p className="text-lg text-[#E4E8DC]">A AGROVIVA conecta monitoramento, mapa, inspeção por imagem, operação local e acesso coletivo em um caderno de campo para quem cultiva hortaliças em canteiros.</p>
            <p>Cada esfera é um módulo. Toque em uma delas para ver como ela funciona na rotina e o atalho para o console.</p>
          </div>
        </div>
        <div ref={layoutRef} className="relative mt-14 grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-6">
          {hasBeam && (
            <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible" viewBox={`0 0 ${layoutSize.width} ${layoutSize.height}`} preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <filter id="feixe-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" />
                </filter>
              </defs>
              <path d={beamPath} fill="none" stroke={activePillar.color} strokeOpacity="0.6" strokeWidth="6" filter="url(#feixe-glow)" />
              <path d={beamPath} fill="none" stroke={activePillar.color} strokeWidth="1.5" />
              <circle cx={beamEnd.x} cy={beamEnd.y} r="4" fill={activePillar.color} />
            </svg>
          )}
          <div className="relative lg:sticky lg:top-24 lg:col-span-6" onPointerEnter={handleStageEnter} onPointerLeave={handleStageLeave} onFocusCapture={handleStageFocus} onBlurCapture={handleStageLeave}>
            <div ref={stageRef} className="relative mx-auto w-full max-w-[40rem]" style={{ height: STAGE_HEIGHT * stageScale }} role="group" aria-label="Átomo dos cinco módulos da AGROVIVA">
              <div className="absolute left-0 top-0 origin-top-left" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${stageScale})` }}>
                <svg viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute inset-0 z-[4] h-full w-full" aria-hidden="true">
                  {orbitScene.map(({ pillar, paths }) => (
                    <path key={pillar.id} d={paths.fullPath} fill="none" stroke={pillar.color} strokeOpacity={pillar.id === activePillar.id ? 0.4 : 0.16} strokeWidth="1" />
                  ))}
                </svg>
                <AtomCore isStill={isStill} />
                <svg viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute inset-0 z-[25] h-full w-full" aria-hidden="true">
                  {orbitScene.map(({ pillar, paths }) => (
                    <path key={pillar.id} d={paths.frontPath} fill="none" stroke={pillar.color} strokeOpacity={pillar.id === activePillar.id ? 0.85 : 0.38} strokeWidth={pillar.id === activePillar.id ? 1.6 : 1.1} />
                  ))}
                </svg>
                {orbitScene.map(({ pillar, point }) => (
                  <OrbitSphere key={pillar.id} pillar={pillar} position={{ x: STAGE_CENTER.x + point.x, y: STAGE_CENTER.y + point.y }} depth={point.z} isActive={pillar.id === activePillar.id} onSelect={onSelectPillar} />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 lg:pl-10 xl:pl-16">
            <div ref={cardSlotRef} id="painel-pilar" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <PillarCard key={activePillar.id} pillar={activePillar} onAction={onPillarAction} isStill={isStill} />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────── Convite final + rodapé ──────────────────────────────── */

const PlatformInvite = ({ onOpenPlatform }) => {
  const handleOpen = () => onOpenPlatform('C02')
  return (
    <section aria-labelledby="convite-title" className="relative overflow-hidden border-t border-white/[0.06] py-24 lg:py-32">
      <SectionLight className="right-[10%] top-0 h-[32rem] w-[32rem]" />
      <div className="relative mx-auto max-w-[94rem] px-5 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 items-center gap-10 rounded-[0.75rem] border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-md lg:grid-cols-12 lg:p-12">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#9BA657]">
              <Icon name="sensor" /> Campo Vivo · console operacional
            </p>
            <h2 id="convite-title" className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1] tracking-[-0.03em] text-white font-['Arista_Pro','Plus_Jakarta_Sans',system-ui,sans-serif]">
              Seis canteiros, uma tela. Veja o que precisa de água agora.
            </h2>
            <p className="mt-4 max-w-[34rem] text-base leading-relaxed text-[#C9D0C1]">Umidade, temperatura da raiz, condutividade, curva das últimas 12 horas, rega a um toque e o caderno de campo do lote.</p>
          </div>
          <div className="flex flex-col gap-4 lg:col-span-5 lg:items-end">
            <ul className="grid w-full grid-cols-3 gap-3 text-center">
              {[
                { value: '6', label: 'canteiros' },
                { value: `${bedsInAttention.length}`, label: 'em atenção' },
                { value: `${averageMoisture}%`, label: 'VWC médio' },
              ].map((item) => (
                <li key={item.label} className="rounded-[0.5rem] border border-white/[0.08] px-3 py-3">
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                  <p className="text-xs text-[#C9D0C1]">{item.label}</p>
                </li>
              ))}
            </ul>
            <motion.button type="button" onClick={handleOpen} whileTap={{ scale: 0.96 }} transition={TAP_SNAP} className="inline-flex min-h-[3.5rem] w-full items-center justify-center gap-3 rounded-[999px] bg-[#9BA657] px-7 text-base font-bold text-[#172815] transition-colors duration-200 hover:bg-[#B7BF86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:w-auto">
              Abrir a plataforma completa
              <Icon name="arrow" className="h-5 w-5" strokeWidth={2} />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}

const SiteFooter = () => (
  <footer className="border-t border-white/[0.06] bg-[#050b07]">
    <div className="mx-auto flex max-w-[94rem] flex-col gap-6 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-16">
      <LogoCompact />
      <p className="text-sm text-[#C9D0C1]">Caderno de campo, monitoramento do solo e irrigação assistida para hortaliças em canteiros.</p>
    </div>
  </footer>
)

/* ──────────────────────────────── Login ──────────────────────────────── */

const LoginModal = ({ isOpen, onClose, onSubmit, isStill }) => {
  const dialogRef = useRef(null)
  const firstFieldRef = useRef(null)
  const returnFocusRef = useRef(null)
  const [identifier, setIdentifier] = useState('')
  const [accessKey, setAccessKey] = useState('')
  const [errorText, setErrorText] = useState('')
  const identifierId = useSvgId('login-id')
  const keyId = useSvgId('login-chave')
  const errorId = useSvgId('login-erro')

  useEffect(() => {
    if (!isOpen) return undefined
    returnFocusRef.current = document.activeElement
    const timerId = window.setTimeout(() => firstFieldRef.current?.focus(), 30)
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll('input, button')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
        return
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(timerId)
      document.removeEventListener('keydown', handleKeyDown)
      returnFocusRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  const handleIdentifierChange = (event) => setIdentifier(event.target.value)
  const handleKeyChange = (event) => setAccessKey(event.target.value)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!identifier.trim() || !accessKey.trim()) {
      setErrorText('Preencha o identificador da fazenda e a chave de acesso.')
      return
    }
    setErrorText('')
    setAccessKey('')
    onSubmit()
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose()
  }

  const fieldClass = 'mt-1.5 min-h-[48px] w-full rounded-xl border border-white/[0.12] bg-[#050b07]/70 px-4 text-base text-white placeholder:text-[#C9D0C1]/50 focus-visible:border-[#9BA657] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#9BA657]'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#050b07]/70 px-4 backdrop-blur-sm"
          onMouseDown={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: isStill ? 0 : 0.18 }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-titulo"
            initial={isStill ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE_REVEAL }}
            className="relative w-full max-w-[26rem] rounded-2xl border border-white/[0.1] bg-white/[0.06] p-7 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          >
            <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-[#C9D0C1] transition-colors duration-150 hover:bg-white/[0.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9BA657]">
              <Icon name="close" className="h-5 w-5" />
            </button>
            <LogoSymbol className="h-10 w-9" color={BRAND.broto} />
            <h2 id="login-titulo" className={cx(DISPLAY_FONT_CLASS, 'mt-4 text-3xl font-extrabold tracking-tight text-white')}>Acesso ao Campo Vivo</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#C9D0C1]">Entre com o identificador da propriedade para abrir o console operacional.</p>
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label htmlFor={identifierId} className="text-sm font-semibold text-white">Identificador ou e-mail da fazenda</label>
                <input ref={firstFieldRef} id={identifierId} type="text" inputMode="email" autoComplete="username" value={identifier} onChange={handleIdentifierChange} placeholder="fazenda@exemplo.com" className={fieldClass} aria-invalid={Boolean(errorText) && !identifier.trim()} aria-describedby={errorText ? errorId : undefined} />
              </div>
              <div>
                <label htmlFor={keyId} className="text-sm font-semibold text-white">Chave de acesso</label>
                <input id={keyId} type="password" autoComplete="current-password" value={accessKey} onChange={handleKeyChange} placeholder="••••••••" className={fieldClass} aria-invalid={Boolean(errorText) && !accessKey.trim()} aria-describedby={errorText ? errorId : undefined} />
              </div>
              {errorText && <p id={errorId} role="alert" className="text-sm font-semibold text-[#FFB9A3]">{errorText}</p>}
              <motion.button type="submit" whileTap={{ scale: 0.97 }} transition={TAP_SNAP} className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#9BA657] px-5 text-base font-bold text-[#172815] transition-colors duration-150 hover:bg-[#B7BF86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Acessar console operacional
                <Icon name="arrow" className="h-5 w-5" strokeWidth={2} />
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ──────────────────────────────── Vitrine ──────────────────────────────── */

const LandingView = ({ onOpenPlatform, onOpenLogin, isLoggedIn, isStill, isMotionPaused, onToggleMotion }) => {
  const [activePillarId, setActivePillarId] = useState('pulse')
  const handlePillarAction = (pillar) => onOpenPlatform(pillar.action.bedId)
  return (
    <div className="min-h-screen bg-[#050b07] text-white antialiased selection:bg-[#9BA657] selection:text-[#172815]" style={{ fontFamily: FONT_TEXT }}>
      <GrainOverlay />
      <SiteHeader isMotionPaused={isMotionPaused} onToggleMotion={onToggleMotion} onOpenPlatform={() => onOpenPlatform('C02')} onOpenLogin={onOpenLogin} isLoggedIn={isLoggedIn} />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Hero onOpenPlatform={onOpenPlatform} isStill={isStill} />
        <FieldDock isStill={isStill} />
        <ContextSection />
        <ProjectSection activePillarId={activePillarId} onSelectPillar={setActivePillarId} onPillarAction={handlePillarAction} isStill={isStill} />
        <PlatformInvite onOpenPlatform={onOpenPlatform} />
      </main>
      <SiteFooter />
    </div>
  )
}

/* ──────────────────────────────── Plataforma: Campo Vivo ──────────────────────────────── */

const PLATFORM_THEMES = {
  light: {
    id: 'light',
    root: "bg-[#F1F5F9] text-slate-900 bg-[linear-gradient(to_right,#0f172a0a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a0a_1px,transparent_1px)] bg-[size:24px_24px]",
    glow: 'bg-[radial-gradient(ellipse_at_top_left,rgba(22,163,74,0.06),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(8,145,178,0.06),transparent_50%)]',
    topBar: 'border-slate-200/80 bg-white/85',
    card: 'rounded-2xl border border-slate-200/80 bg-white shadow-sm',
    inset: 'border-slate-200 bg-slate-50',
    title: 'text-slate-900',
    muted: 'text-slate-600',
    subtle: 'text-slate-500',
    chip: 'border-slate-200 bg-white text-slate-600',
    selectorActive: 'border-[#16a34a] bg-[#16a34a]/[0.06] ring-1 ring-[#16a34a]/30',
    selectorIdle: 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
    iconTile: 'border-slate-200 bg-[#F0FDF4]',
    input: 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-[#16a34a]',
    primaryButton: 'bg-[#16a34a] text-white shadow-sm hover:bg-[#15803d]',
    secondaryButton: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
    segmented: 'border-slate-200 bg-slate-100',
    segmentedActive: 'bg-white text-slate-900 shadow-sm',
    segmentedIdle: 'text-slate-600 hover:text-slate-900',
    track: 'bg-slate-200',
    focus: 'focus-visible:outline-[#16a34a]',
    colors: {
      accent: '#16a34a',
      accentStrong: '#15803d',
      water: '#0891b2',
      amber: '#d97706',
      text: '#0f172a',
      muted: '#475569',
      surface: '#FFFFFF',
      outline: '#0f172a',
      outlineOpacity: 0.22,
      tubeShadow: '#a5f3fc',
      groundShadow: 0.12,
      stake: '#64748b',
    },
  },
  dark: {
    id: 'dark',
    root: "bg-[#080E14] text-[#EAF2EE] bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]",
    glow: 'bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.08),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.07),transparent_50%)]',
    topBar: 'border-white/[0.06] bg-[#080E14]/85',
    card: 'rounded-2xl border border-white/[0.08] bg-[#0F1C24]/80 shadow-2xl backdrop-blur-xl',
    inset: 'border-white/[0.06] bg-white/[0.02]',
    title: 'text-[#EAF2EE]',
    muted: 'text-[#9FB2BC]',
    subtle: 'text-[#8FA3AE]',
    chip: 'border-white/[0.08] bg-white/[0.03] text-[#9FB2BC]',
    selectorActive: 'border-[#a3e635]/70 bg-[#a3e635]/[0.07]',
    selectorIdle: 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]',
    iconTile: 'border-white/[0.06] bg-[#0B141C]',
    input: 'border-white/[0.1] bg-[#080E14] text-[#EAF2EE] placeholder:text-[#8FA3AE]/60 focus-visible:border-[#a3e635]',
    primaryButton: 'bg-[#a3e635] text-[#0B141C] hover:brightness-110',
    secondaryButton: 'border border-white/[0.12] bg-white/[0.03] text-[#EAF2EE] hover:bg-white/[0.08]',
    segmented: 'border-white/[0.08] bg-white/[0.03]',
    segmentedActive: 'bg-[#a3e635] text-[#0B141C]',
    segmentedIdle: 'text-[#9FB2BC] hover:text-[#EAF2EE]',
    track: 'bg-white/[0.06]',
    focus: 'focus-visible:outline-[#a3e635]',
    colors: {
      accent: '#a3e635',
      accentStrong: '#bef264',
      water: '#38bdf8',
      amber: '#f59e0b',
      text: '#EAF2EE',
      muted: '#9FB2BC',
      surface: '#0B141C',
      outline: '#FFFFFF',
      outlineOpacity: 0.2,
      tubeShadow: '#0e3a4f',
      groundShadow: 0.35,
      stake: '#94a3b8',
    },
  },
}

const PlatformThemeContext = createContext(PLATFORM_THEMES.light)
const usePlatformTheme = () => useContext(PlatformThemeContext)

const PLANT_TONES = {
  healthy: { light: '#bef264', mid: '#4ade80', dark: '#16a34a', deep: '#065f46', vein: '#ecfccb' },
  stressed: { light: '#e2e87a', mid: '#bfc957', dark: '#8f9d35', deep: '#4d5a1a', vein: '#fef3c7' },
}

const CHICORY_ANGLES = [-44, -22, 0, 22, 44]

const BotanicalGlyph = ({ crop, tone }) => {
  if (crop === 'crespa') {
    return (
      <g>
        <path d="M24 41c-9.5 0-16.5-5.2-17.5-12.4 2.6 1 4-1.6 6.6-.6-.8-3 1.4-5.6 4.2-5.4-.6-3.2 2.2-5.8 5.4-4.8 1.6-2.8 5-2.8 6.6 0 3.2-1 6 1.6 5.4 4.8 2.8-.2 5 2.4 4.2 5.4 2.6-1 4 1.6 6.6.6C40.5 35.8 33.5 41 24 41z" fill={tone.dark} />
        <path d="M24 37c-6.4 0-11-3.4-11.6-8 1.8.6 2.8-1 4.6-.4-.4-2 1-3.8 2.8-3.6-.2-2.2 1.6-3.8 3.6-3.2 1.2-1.8 3.4-1.8 4.6 0 2-.6 3.8 1 3.6 3.2 1.8-.2 3.2 1.6 2.8 3.6 1.8-.6 2.8 1 4.6.4C35 33.6 30.4 37 24 37z" fill={tone.mid} />
        <path d="M24 33c-3.4 0-6-1.8-6.4-4.2 1.4.2 2-.8 3.2-.4 0-1.6 1.6-2.6 3.2-2.2 1.6-.4 3.2.6 3.2 2.2 1.2-.4 1.8.6 3.2.4C30 31.2 27.4 33 24 33z" fill={tone.light} />
        <path d="M24 41V27M24 37l-7-6M24 37l7-6M24 39l-11-5M24 39l11-5" stroke={tone.vein} strokeOpacity="0.5" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  if (crop === 'rucula') {
    return (
      <g>
        <path d="M24 42c-3-7-9.5-10-13-19 2.6.4 3.4-1.4 5.4-.2-.8-2.6.8-4.4 2.8-3.2-.2-2.8 1.6-4 3.6-2.6.6 8 1.6 16 1.2 25z" fill={tone.dark} />
        <path d="M24 42c3-7 9.5-10 13-19-2.6.4-3.4-1.4-5.4-.2.8-2.6-.8-4.4-2.8-3.2.2-2.8-1.6-4-3.6-2.6-.6 8-1.6 16-1.2 25z" fill={tone.mid} />
        <path d="M24 42c-1.6-6-3.4-11-1.8-17-1.8-.6-2.4-2.8-.8-4-1.4-1.4-.8-3.6 1-3.8-.6-2.2.6-4.6 1.6-6 1 1.4 2.2 3.8 1.6 6 1.8.2 2.4 2.4 1 3.8 1.6 1.2 1 3.4-.8 4 1.6 6-.2 11-1.8 17z" fill={tone.light} />
        <path d="M24 42V12M24 30l-6-6M24 30l6-6M24 36l-9-8M24 36l9-8" stroke={tone.vein} strokeOpacity="0.45" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  if (crop === 'couve') {
    return (
      <g>
        <path d="M24 44v-11" stroke={tone.deep} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M24 34C12.5 33 7 22.5 11.5 13.5 15 6.5 33 6.5 36.5 13.5 41 22.5 35.5 33 24 34z" fill={tone.dark} />
        <path d="M24 31c-8.5-.8-12.4-8.4-9.2-14.8 2.6-5 15.8-5 18.4 0 3.2 6.4-.7 14-9.2 14.8z" fill={tone.mid} />
        <path d="M24 34V9M24 15l-6-3M24 15l6-3M24 21l-9-4M24 21l9-4M24 27l-8-3M24 27l8-3" stroke={tone.vein} strokeOpacity="0.55" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  if (crop === 'espinafre') {
    return (
      <g>
        <path d="M24 44c.6-8-2.6-14-1.2-22 .8-4.4 2.8-8 2.8-12" stroke={tone.deep} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M23.4 36c-6.8.6-12-2.4-13.4-6.8 5.4-1.6 10.4.4 13.4 6.8z" fill={tone.dark} />
        <path d="M23.6 30c6.4-1.4 11.6.4 13.6 4.6-5.2 1.8-10.4.2-13.6-4.6z" fill={tone.mid} />
        <path d="M23 22.4c-5.6-.6-9.6-3.8-10-8.4 4.8-.4 8.8 3 10 8.4z" fill={tone.mid} />
        <path d="M23.6 18c4.6-3 9.6-3.4 12.6-.8-3 3.2-8 3.6-12.6.8z" fill={tone.light} />
        <path d="M25.6 10c-1.4-3.2-.4-6 2.4-7.2 1.2 3-.2 5.8-2.4 7.2z" fill={tone.light} />
      </g>
    )
  }
  if (crop === 'americana') {
    return (
      <g>
        <path d="M9 31c-1.6-8.4 3.4-15.2 10.4-16.6M39 31c1.6-8.4-3.4-15.2-10.4-16.6" stroke={tone.dark} strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="24" cy="28" r="13" fill={tone.mid} />
        <path d="M12.4 25.6c3.8-5.4 19.4-5.4 23.2 0M13.6 31.4c3.8-3.8 17-3.8 20.8 0M16.4 36.4c3-2.2 12.2-2.2 15.2 0" stroke={tone.light} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <ellipse cx="24" cy="21" rx="6" ry="3.2" fill={tone.light} opacity="0.85" />
      </g>
    )
  }
  return (
    <g>
      {CHICORY_ANGLES.map((angle, index) => (
        <path key={angle} d="M24 42C19.5 32 19.5 18 24 8c4.5 10 4.5 24 0 34z" transform={`rotate(${angle} 24 42)`} fill={index % 2 === 0 ? tone.dark : tone.mid} />
      ))}
      <path d="M24 42C21.5 34 21.5 24 24 16c2.5 8 2.5 18 0 26z" fill={tone.light} />
    </g>
  )
}

const BotanicalIcon = ({ crop, isStressed = false, className = 'h-10 w-10' }) => (
  <svg viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet" className={className} aria-hidden="true">
    <BotanicalGlyph crop={crop} tone={isStressed ? PLANT_TONES.stressed : PLANT_TONES.healthy} />
  </svg>
)

const getBedState = (bed, irrigation, colors) => {
  if (irrigation?.isRunning) return { key: 'irrigating', label: `Regando · ${irrigation.remaining} min`, color: colors.water, gradient: `linear-gradient(90deg, ${colors.water}, #67e8f9)` }
  if (isBedInAttention(bed)) return { key: 'attention', label: 'IRRIGAR', color: colors.amber, gradient: `linear-gradient(90deg, ${colors.amber}, #fbbf24)` }
  return { key: 'stable', label: 'Estável', color: colors.accent, gradient: `linear-gradient(90deg, #10b981, ${colors.accent})` }
}

const StatusDot = ({ color, isPulsing = false }) => (
  <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
    {isPulsing && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: color }} />}
    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
  </span>
)

const TopBarBadge = ({ dotColor, children, isPulsing = false }) => {
  const theme = usePlatformTheme()
  return (
    <span className={cx('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold', theme.chip)}>
      <StatusDot color={dotColor} isPulsing={isPulsing} />
      {children}
    </span>
  )
}

const ThemeToggle = ({ onToggle }) => {
  const theme = usePlatformTheme()
  const isLight = theme.id === 'light'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isLight ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
      className={cx('inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3 text-xs font-bold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2', theme.chip, theme.focus)}
    >
      <Icon name={isLight ? 'sun' : 'moon'} className="h-4 w-4" />
      {isLight ? 'Claro' : 'Escuro'}
    </button>
  )
}

const OperatorPill = ({ onLogout }) => {
  const theme = usePlatformTheme()
  return (
    <span className={cx('inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-1', theme.chip)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill={theme.colors.accent} />
        <circle cx="16" cy="12.5" r="5" fill={theme.id === 'light' ? '#FFFFFF' : '#0B141C'} fillOpacity="0.9" />
        <path d="M6.5 27c1.6-5 5.2-7.5 9.5-7.5s7.9 2.5 9.5 7.5" fill={theme.id === 'light' ? '#FFFFFF' : '#0B141C'} fillOpacity="0.9" />
      </svg>
      <span className={cx('hidden text-xs font-semibold md:inline', theme.title)}>Operador ativo · Canteiros Norte</span>
      <button type="button" onClick={onLogout} className={cx('inline-flex min-h-[32px] items-center rounded-full px-3 text-xs font-bold transition-colors duration-150 focus-visible:outline focus-visible:outline-2', theme.secondaryButton, theme.focus)}>
        Sair
      </button>
    </span>
  )
}

const PlatformTopBar = ({ onExit, onLogout, onToggleTheme }) => {
  const theme = usePlatformTheme()
  return (
    <header className={cx('sticky top-0 z-40 border-b backdrop-blur-xl', theme.topBar)}>
      <div className="mx-auto flex min-h-16 max-w-[110rem] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <LogoCompact color={theme.id === 'light' ? BRAND.mata : BRAND.algodao} className="text-[1.45rem]" />
          <span className="hidden rounded-full border px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.18em] sm:inline" style={{ borderColor: `${theme.colors.accent}55`, color: theme.colors.accentStrong }}>
            Campo Vivo // Console operacional
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TopBarBadge dotColor={theme.colors.accent} isPulsing>Sincronização: Local (Offline Ready)</TopBarBadge>
          <TopBarBadge dotColor={theme.colors.accent}>Sensores: 6/6 conectados</TopBarBadge>
          <TopBarBadge dotColor={theme.colors.water}>Microclima: 21 °C · estável</TopBarBadge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle onToggle={onToggleTheme} />
          <OperatorPill onLogout={onLogout} />
          <button
            type="button"
            onClick={onExit}
            className={cx('inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-bold transition-[filter,background-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2', theme.primaryButton, theme.focus)}
          >
            <Icon name="arrowLeft" strokeWidth={2} /> Voltar ao site institucional
          </button>
        </div>
      </div>
    </header>
  )
}

const KpiModule = ({ icon, iconColor, label, value, detail, badge }) => {
  const theme = usePlatformTheme()
  return (
    <div className={cx(theme.card, 'flex items-center gap-4 px-5 py-4')}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `${iconColor}1A`, color: iconColor }}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className={cx('text-xs font-semibold uppercase tracking-[0.14em]', theme.subtle)}>{label}</p>
        <p className={cx(DISPLAY_FONT_CLASS, 'mt-0.5 text-2xl font-bold tracking-tight', theme.title)}>{value}</p>
        <p className={cx('mt-0.5 flex flex-wrap items-center gap-2 text-sm', theme.muted)}>
          {detail}
          {badge && <span className="rounded-full px-2 py-0.5 text-[0.7rem] font-bold" style={{ background: `${theme.colors.water}1F`, color: theme.colors.water }}>{badge}</span>}
        </p>
      </div>
    </div>
  )
}

const BedSelectorCard = ({ bed, isSelected, irrigation, onSelect }) => {
  const theme = usePlatformTheme()
  const state = getBedState(bed, irrigation, theme.colors)
  const handleClick = () => onSelect(bed.bedId)
  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isSelected}
        className={cx('flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2', theme.focus, isSelected && theme.selectorActive, !isSelected && theme.selectorIdle)}
      >
        <span className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border', theme.iconTile)}>
          <BotanicalIcon crop={bed.crop} isStressed={isBedInAttention(bed)} className="h-10 w-10" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cx('truncate text-sm font-bold', theme.title)}>
              <span className={cx('mr-1.5 text-xs font-semibold', theme.subtle)}>{bed.bedId}</span>
              {bed.cropName}
            </span>
            <span className={cx(DISPLAY_FONT_CLASS, 'text-sm font-bold tabular-nums', theme.title)}>{bed.moisture}%</span>
          </span>
          <span className={cx('mt-2 block h-1 w-full overflow-hidden rounded-full', theme.track)}>
            <span className="block h-full rounded-full" style={{ width: `${(bed.moisture / VWC_SCALE_MAX) * 100}%`, background: state.gradient }} />
          </span>
          <span className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]" style={{ color: state.color }}>
            <StatusDot color={state.color} isPulsing={state.key !== 'stable'} />
            {state.label}
          </span>
        </span>
      </button>
    </li>
  )
}

const TelemetryValue = ({ icon, label, value, unit, color }) => {
  const theme = usePlatformTheme()
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}1A`, color }}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <p className={cx('text-xs font-semibold uppercase tracking-[0.12em]', theme.subtle)}>{label}</p>
        <p className={cx(DISPLAY_FONT_CLASS, 'text-[2rem] font-extrabold leading-none tracking-tight tabular-nums', theme.title)}>
          {value}<span className={cx('ml-1 text-sm font-semibold', theme.muted)}>{unit}</span>
        </p>
      </div>
    </div>
  )
}

/* Canteiro elevado em projeção oblíqua */

const BED_VIEW = { width: 720, height: 380 }
const BED_TOP = { left: 70, width: 540, frontY: 214, depthX: 64, depthY: -70, faceHeight: 92 }
const PLANT_ROWS = [
  { depth: 0.72, scale: 0.9 },
  { depth: 0.32, scale: 1.08 },
]
const PLANT_POSITIONS = [0.1, 0.26, 0.42, 0.58, 0.74, 0.9]
const DRIP_CONNECTORS = [0.18, 0.34, 0.5, 0.66, 0.82]

const getTopPoint = (along, depth) => ({ x: BED_TOP.left + BED_TOP.width * along + BED_TOP.depthX * depth, y: BED_TOP.frontY + BED_TOP.depthY * depth })
const toPolygon = (points) => points.map((point) => `${point.x},${point.y}`).join(' ')

const BED_CORNERS = {
  frontLeft: getTopPoint(0, 0),
  frontRight: getTopPoint(1, 0),
  backRight: getTopPoint(1, 1),
  backLeft: getTopPoint(0, 1),
}
const TOP_FACE = [BED_CORNERS.frontLeft, BED_CORNERS.frontRight, BED_CORNERS.backRight, BED_CORNERS.backLeft]
const FRONT_FACE = [
  BED_CORNERS.frontLeft,
  BED_CORNERS.frontRight,
  { x: BED_CORNERS.frontRight.x, y: BED_CORNERS.frontRight.y + BED_TOP.faceHeight },
  { x: BED_CORNERS.frontLeft.x, y: BED_CORNERS.frontLeft.y + BED_TOP.faceHeight },
]
const SIDE_FACE = [
  BED_CORNERS.frontRight,
  BED_CORNERS.backRight,
  { x: BED_CORNERS.backRight.x, y: BED_CORNERS.backRight.y + BED_TOP.faceHeight },
  { x: BED_CORNERS.frontRight.x, y: BED_CORNERS.frontRight.y + BED_TOP.faceHeight },
]
const SUPPLY_BACK = getTopPoint(0.02, 0.72)
const SUPPLY_FRONT = getTopPoint(0.02, 0.32)
const TUBE_LIFT = 12

const SENSOR_PROBES = [
  { id: 's2', label: 'Sonda S2 · raiz', along: 0.24, depth: 0.55, marker: { x: 140, y: 30 }, kind: 'temperature' },
  { id: 's1', label: 'Sonda S1 · 0–15 cm', along: 0.6, depth: 0, marker: { x: 330, y: 30 }, kind: 'moisture' },
  { id: 's3', label: 'Sonda S3 · solução', along: 0.84, depth: 0.5, marker: { x: 540, y: 30 }, kind: 'conductivity' },
]

const DripLine = ({ depth, isIrrigating, isStill, colors }) => {
  const start = getTopPoint(0.02, depth)
  const end = getTopPoint(0.98, depth)
  return (
    <g>
      {DRIP_CONNECTORS.map((along) => {
        const point = getTopPoint(along, depth)
        return <line key={`stake-${along}`} x1={point.x} y1={point.y - TUBE_LIFT} x2={point.x} y2={point.y + 1} stroke={colors.stake} strokeOpacity="0.6" strokeWidth="1" />
      })}
      <line x1={start.x} y1={start.y - TUBE_LIFT} x2={end.x} y2={end.y - TUBE_LIFT} stroke={colors.tubeShadow} strokeWidth="5" strokeLinecap="round" />
      <motion.line
        x1={start.x}
        y1={start.y - TUBE_LIFT}
        x2={end.x}
        y2={end.y - TUBE_LIFT}
        stroke={colors.water}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={isIrrigating ? '6 8' : '0'}
        strokeOpacity={isIrrigating ? 1 : 0.6}
        animate={isIrrigating && !isStill ? { strokeDashoffset: [0, -28] } : { strokeDashoffset: 0 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      {DRIP_CONNECTORS.map((along, index) => {
        const point = getTopPoint(along, depth)
        return (
          <g key={`drip-${along}`}>
            <rect x={point.x - 3.5} y={point.y - TUBE_LIFT - 3.5} width="7" height="7" rx="1.5" fill={colors.surface} stroke={colors.water} strokeWidth="1.2" />
            {isIrrigating && (
              <motion.path
                d={`M${point.x} ${point.y - TUBE_LIFT + 5}c-2 3-2.6 4.6-2.6 5.6a2.6 2.6 0 0 0 5.2 0c0-1-.6-2.6-2.6-5.6z`}
                fill={colors.water}
                initial={false}
                animate={isStill ? { opacity: 1, y: 0, scale: 1 } : { opacity: [0, 1, 0], y: [0, 6, 10], scale: [0.8, 1.15, 0.9] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.18, ease: 'easeIn' }}
              />
            )}
          </g>
        )
      })}
    </g>
  )
}

const SensorMarker = ({ probe, value, unit, color, colors }) => {
  const head = getTopPoint(probe.along, probe.depth)
  const headTop = head.y - 26
  const probeBottom = head.y + (probe.depth === 0 ? 48 : 4)
  return (
    <g>
      <path d={`M${head.x} ${headTop}V${probe.marker.y + 44}L${probe.marker.x + 60} ${probe.marker.y + 30}`} fill="none" stroke={color} strokeOpacity="0.7" strokeWidth="1" strokeDasharray="3 3" />
      <rect x={probe.marker.x} y={probe.marker.y} width="120" height="30" rx="15" fill={colors.surface} stroke={color} strokeOpacity="0.8" />
      <circle cx={probe.marker.x + 15} cy={probe.marker.y + 15} r="4" fill={color} />
      <text x={probe.marker.x + 26} y={probe.marker.y + 20} fill={colors.text} fontSize="14" fontWeight="800" fontFamily={FONT_DISPLAY}>
        {value}
        <tspan fill={colors.muted} fontSize="11" fontWeight="600"> {unit}</tspan>
      </text>
      <text x={probe.marker.x + 60} y={probe.marker.y - 6} textAnchor="middle" fill={colors.muted} fontSize="10" fontWeight="600">{probe.label}</text>
      <rect x={head.x - 5} y={headTop} width="10" height="16" rx="3" fill={colors.surface} stroke={color} strokeWidth="1.4" />
      <circle cx={head.x} cy={headTop + 5} r="1.8" fill={color} />
      <line x1={head.x - 2.5} y1={headTop + 16} x2={head.x - 2.5} y2={probeBottom} stroke="#cbd5e1" strokeWidth="1.2" />
      <line x1={head.x + 2.5} y1={headTop + 16} x2={head.x + 2.5} y2={probeBottom} stroke="#cbd5e1" strokeWidth="1.2" />
    </g>
  )
}

const BedIllustration = ({ bed, isIrrigating, isStill, layer }) => {
  const { colors } = usePlatformTheme()
  const soilId = useSvgId('soil-dots')
  const gravelId = useSvgId('gravel')
  const frontClipId = useSvgId('front-clip')
  const moistureId = useSvgId('moisture-front')
  const surfaceGlowId = useSvgId('surface-glow')
  const tone = isBedInAttention(bed) ? PLANT_TONES.stressed : PLANT_TONES.healthy
  const moistureHeight = (bed.moisture / VWC_SCALE_MAX) * BED_TOP.faceHeight
  const frontTop = BED_CORNERS.frontLeft.y
  const sensorValues = {
    temperature: { value: formatDecimal(bed.rootTemperature), unit: '°C', color: colors.amber },
    moisture: { value: String(bed.moisture), unit: '% VWC', color: colors.water },
    conductivity: { value: formatDecimal(bed.conductivity), unit: 'mS/cm', color: colors.accent },
  }

  return (
    <svg
      viewBox={`0 0 ${BED_VIEW.width} ${BED_VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-auto w-full"
      role="img"
      aria-label={`Ilustração do canteiro ${bed.bedId} com ${bed.cropName}, linhas de gotejo e três sondas: ${bed.moisture}% VWC, ${formatDecimal(bed.rootTemperature)} °C e ${formatDecimal(bed.conductivity)} mS/cm${isIrrigating ? ', rega em andamento' : ''}`}
    >
      <defs>
        <pattern id={soilId} width="9" height="9" patternUnits="userSpaceOnUse">
          <rect width="9" height="9" fill="#4a3a2c" />
          <circle cx="2" cy="3" r="0.9" fill="#6b5442" />
          <circle cx="6.5" cy="7" r="0.7" fill="#2f251c" />
        </pattern>
        <pattern id={gravelId} width="12" height="10" patternUnits="userSpaceOnUse">
          <rect width="12" height="10" fill="#26211d" />
          <ellipse cx="3" cy="4" rx="2.2" ry="1.6" fill="#3b342e" />
          <ellipse cx="9" cy="7.5" rx="1.8" ry="1.3" fill="#453d36" />
        </pattern>
        <linearGradient id={moistureId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.water} stopOpacity="0.45" />
          <stop offset="1" stopColor={colors.water} stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id={surfaceGlowId} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor={colors.water} stopOpacity="0.55" />
          <stop offset="1" stopColor={colors.water} stopOpacity="0" />
        </radialGradient>
        <clipPath id={frontClipId}>
          <polygon points={toPolygon(FRONT_FACE)} />
        </clipPath>
      </defs>

      <ellipse cx="372" cy="318" rx="330" ry="22" fill="#000000" opacity={colors.groundShadow} />
      <polygon points={toPolygon(SIDE_FACE)} fill="#2a211a" stroke={colors.outline} strokeOpacity={colors.outlineOpacity} />
      <polygon points={toPolygon(TOP_FACE)} fill={`url(#${soilId})`} stroke={colors.outline} strokeOpacity={colors.outlineOpacity} />

      {layer === 'moisture' && (
        <g>
          <polygon points={toPolygon(TOP_FACE)} fill={colors.water} fillOpacity={(bed.moisture / VWC_SCALE_MAX) * 0.45} />
          {SENSOR_PROBES.map((probe) => {
            const point = getTopPoint(probe.along, probe.depth === 0 ? 0.2 : probe.depth)
            return <ellipse key={probe.id} cx={point.x} cy={point.y} rx="90" ry="28" fill={`url(#${surfaceGlowId})`} />
          })}
          {[0.25, 0.5, 0.75].map((depth) => {
            const start = getTopPoint(0, depth)
            const end = getTopPoint(1, depth)
            return <line key={depth} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={colors.water} strokeOpacity="0.45" strokeDasharray="2 6" />
          })}
        </g>
      )}

      <g clipPath={`url(#${frontClipId})`}>
        <rect x={BED_CORNERS.frontLeft.x} y={frontTop} width={BED_TOP.width} height="32" fill="#5b4433" />
        <rect x={BED_CORNERS.frontLeft.x} y={frontTop + 32} width={BED_TOP.width} height="34" fill="#3f3024" />
        <rect x={BED_CORNERS.frontLeft.x} y={frontTop + 66} width={BED_TOP.width} height="26" fill={`url(#${gravelId})`} />
        <motion.rect
          x={BED_CORNERS.frontLeft.x}
          y={frontTop}
          width={BED_TOP.width}
          fill={`url(#${moistureId})`}
          initial={false}
          animate={{ height: isIrrigating ? Math.min(BED_TOP.faceHeight, moistureHeight + 26) : moistureHeight }}
          transition={{ duration: isStill ? 0 : 1.6, ease: EASE_REVEAL }}
        />
        {PLANT_POSITIONS.map((along) => {
          const x = BED_CORNERS.frontLeft.x + BED_TOP.width * along + 20
          return <path key={along} d={`M${x} ${frontTop}c-3 7 3 11-1 20M${x} ${frontTop + 2}c4 5 2 10 7 15M${x} ${frontTop + 2}c-5 4-4 9-9 12`} fill="none" stroke="#d6c3a5" strokeOpacity="0.45" strokeWidth="1" strokeLinecap="round" />
        })}
      </g>
      <polygon points={toPolygon(FRONT_FACE)} fill="none" stroke={colors.outline} strokeOpacity={colors.outlineOpacity} />
      <text x={BED_CORNERS.frontLeft.x + 10} y={frontTop + 84} fill="#d6c3a5" fillOpacity="0.75" fontSize="10" fontWeight="600">zona radicular · 0–15 cm</text>

      {TOP_FACE.map((corner) => (
        <path key={`${corner.x}-${corner.y}`} d={`M${corner.x - 7} ${corner.y}H${corner.x + 7}M${corner.x} ${corner.y - 7}V${corner.y + 7}`} stroke={colors.water} strokeOpacity="0.8" strokeWidth="1" />
      ))}

      <path d={`M10 ${SUPPLY_BACK.y - TUBE_LIFT}H${SUPPLY_BACK.x}`} stroke={colors.tubeShadow} strokeWidth="6" strokeLinecap="round" />
      <path d={`M10 ${SUPPLY_BACK.y - TUBE_LIFT}H${SUPPLY_BACK.x}`} stroke={colors.water} strokeWidth="2" strokeOpacity="0.75" />
      <line x1={SUPPLY_BACK.x} y1={SUPPLY_BACK.y - TUBE_LIFT} x2={SUPPLY_FRONT.x} y2={SUPPLY_FRONT.y - TUBE_LIFT} stroke={colors.tubeShadow} strokeWidth="5" strokeLinecap="round" />
      <line x1={SUPPLY_BACK.x} y1={SUPPLY_BACK.y - TUBE_LIFT} x2={SUPPLY_FRONT.x} y2={SUPPLY_FRONT.y - TUBE_LIFT} stroke={colors.water} strokeWidth="2" strokeOpacity="0.75" />
      <g transform={`translate(34 ${SUPPLY_BACK.y - TUBE_LIFT - 10})`}>
        <rect width="20" height="20" rx="4" fill={colors.surface} stroke={isIrrigating ? colors.water : colors.stake} strokeWidth="1.4" />
        <path d="M5 5l10 10M15 5L5 15" stroke={isIrrigating ? colors.water : colors.stake} strokeWidth="1.4" />
      </g>

      {PLANT_ROWS.map((row) => (
        <g key={row.depth}>
          <DripLine depth={row.depth} isIrrigating={isIrrigating} isStill={isStill} colors={colors} />
          {PLANT_POSITIONS.map((along) => {
            const point = getTopPoint(along, row.depth)
            const size = 74 * row.scale
            return (
              <svg key={along} x={point.x - size / 2} y={point.y - size * 0.9} width={size} height={size} viewBox="0 0 48 48" overflow="visible">
                <ellipse cx="24" cy="44" rx="14" ry="3" fill="#000000" opacity="0.3" />
                <BotanicalGlyph crop={bed.crop} tone={tone} />
              </svg>
            )
          })}
        </g>
      ))}

      {SENSOR_PROBES.map((probe) => (
        <SensorMarker key={probe.id} probe={probe} colors={colors} {...sensorValues[probe.kind]} />
      ))}
    </svg>
  )
}

/* Curva hídrica com cursor */

const HYDRO_CHART = { width: 460, height: 230, left: 36, right: 8, top: 14, bottom: 26, min: 10, max: 50 }

const HydroChart = ({ series, accent }) => {
  const { colors } = usePlatformTheme()
  const [hoverIndex, setHoverIndex] = useState(null)
  const areaId = useSvgId('hydro-area')
  const plotWidth = HYDRO_CHART.width - HYDRO_CHART.left - HYDRO_CHART.right
  const plotHeight = HYDRO_CHART.height - HYDRO_CHART.top - HYDRO_CHART.bottom
  const toY = (value) => HYDRO_CHART.top + (1 - (value - HYDRO_CHART.min) / (HYDRO_CHART.max - HYDRO_CHART.min)) * plotHeight
  const points = series.map((point, index) => ({ x: HYDRO_CHART.left + (index / (series.length - 1)) * plotWidth, y: toY(point.value) }))
  const linePath = buildSmoothPath(points)
  const baseY = HYDRO_CHART.top + plotHeight
  const areaPath = `${linePath} L${points[points.length - 1].x},${baseY} L${points[0].x},${baseY} Z`
  const thresholdY = toY(MOISTURE_ALERT_THRESHOLD)
  const hoverPoint = hoverIndex === null ? null : points[hoverIndex]

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const viewX = clamp(((event.clientX - bounds.left) / bounds.width) * HYDRO_CHART.width, HYDRO_CHART.left, HYDRO_CHART.width - HYDRO_CHART.right)
    setHoverIndex(Math.round(((viewX - HYDRO_CHART.left) / plotWidth) * (series.length - 1)))
  }
  const handlePointerLeave = () => setHoverIndex(null)

  return (
    <svg viewBox={`0 0 ${HYDRO_CHART.width} ${HYDRO_CHART.height}`} preserveAspectRatio="xMidYMid meet" className="h-auto w-full touch-none" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} role="img" aria-label={`Curva de umidade das últimas 12 horas, de ${series[0].value}% a ${series[series.length - 1].value}% VWC`}>
      <defs>
        <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.32" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[10, 20, 30, 40, 50].map((tick) => (
        <g key={tick}>
          <line x1={HYDRO_CHART.left} x2={HYDRO_CHART.width - HYDRO_CHART.right} y1={toY(tick)} y2={toY(tick)} stroke={colors.outline} strokeOpacity="0.07" />
          <text x="0" y={toY(tick) + 4} fill={colors.muted} fontSize="12" fontWeight="600">{tick}%</text>
        </g>
      ))}
      {series.map((point, index) => (index % 3 === 0 ? (
        <text key={point.hour} x={points[index].x} y={HYDRO_CHART.height - 6} textAnchor="middle" fill={colors.muted} fontSize="12" fontWeight="600">{point.hour}</text>
      ) : null))}
      <line x1={HYDRO_CHART.left} x2={HYDRO_CHART.width - HYDRO_CHART.right} y1={thresholdY} y2={thresholdY} stroke={colors.amber} strokeOpacity="0.7" strokeDasharray="4 5" />
      <text x={HYDRO_CHART.width - HYDRO_CHART.right} y={thresholdY - 6} textAnchor="end" fill={colors.amber} fontSize="12" fontWeight="700">limite de rega {MOISTURE_ALERT_THRESHOLD}%</text>
      <path d={areaPath} fill={`url(#${areaId})`} />
      <path d={linePath} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4.5" fill={accent} stroke={colors.surface} strokeWidth="2" />
      {hoverPoint && (
        <g pointerEvents="none">
          <line x1={hoverPoint.x} x2={hoverPoint.x} y1={HYDRO_CHART.top} y2={baseY} stroke={colors.outline} strokeOpacity="0.25" />
          <circle cx={hoverPoint.x} cy={hoverPoint.y} r="5" fill={accent} stroke={colors.surface} strokeWidth="2" />
          <g transform={`translate(${clamp(hoverPoint.x - 50, HYDRO_CHART.left, HYDRO_CHART.width - 108)} ${Math.max(HYDRO_CHART.top, hoverPoint.y - 48)})`}>
            <rect width="100" height="36" rx="8" fill={colors.surface} stroke={colors.outline} strokeOpacity="0.15" />
            <text x="10" y="15" fill={colors.muted} fontSize="11" fontWeight="600">{series[hoverIndex].hour}</text>
            <text x="10" y="29" fill={colors.text} fontSize="13" fontWeight="800" fontFamily={FONT_DISPLAY}>{formatDecimal(series[hoverIndex].value)}% VWC</text>
          </g>
        </g>
      )}
    </svg>
  )
}

const ConsoleButton = ({ onClick, children, variant = 'primary', isDisabled = false, type = 'button' }) => {
  const theme = usePlatformTheme()
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cx('inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-[filter,background-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50', theme.focus, variant === 'primary' && theme.primaryButton, variant === 'secondary' && theme.secondaryButton)}
    >
      {children}
    </button>
  )
}

const FieldNotebook = ({ bed, notes, onSaveNote }) => {
  const theme = usePlatformTheme()
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState(null)
  const fieldId = useSvgId('registro')
  const handleDraftChange = (event) => setDraft(event.target.value)

  const handleSubmit = (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) {
      setFeedback({ color: theme.colors.amber, text: 'Escreva o registro antes de salvar.' })
      return
    }
    if (!onSaveNote(bed.bedId, text)) {
      setFeedback({ color: theme.colors.amber, text: 'O navegador não permitiu salvar. Copie o registro antes de fechar.' })
      return
    }
    setDraft('')
    setFeedback({ color: theme.colors.accent, text: 'Registro salvo no caderno.' })
  }

  return (
    <div className={cx(theme.card, 'p-4 sm:p-5')}>
      <h3 className={cx(DISPLAY_FONT_CLASS, 'flex items-center gap-2 text-sm font-bold', theme.title)}>
        <Icon name="notebook" className="h-4 w-4" style={{ color: theme.colors.accent }} /> Caderno de campo
      </h3>
      <form onSubmit={handleSubmit} noValidate className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor={fieldId} className="sr-only">Registro de manejo para o {bed.bedId}</label>
        <input id={fieldId} type="text" value={draft} onChange={handleDraftChange} placeholder={`Registro de manejo para o ${bed.bedId}`} className={cx('min-h-[44px] flex-1 rounded-xl border px-3 text-sm focus-visible:outline-none', theme.input)} aria-describedby={feedback ? `${fieldId}-feedback` : undefined} />
        <ConsoleButton type="submit" variant="secondary">
          <Icon name="check" className="h-4 w-4" strokeWidth={2} /> Salvar registro
        </ConsoleButton>
      </form>
      {feedback && <p id={`${fieldId}-feedback`} role="status" className="mt-2 text-xs font-semibold" style={{ color: feedback.color }}>{feedback.text}</p>}
      <ol className="mt-3 space-y-2" aria-label="Últimas intervenções">
        {notes.slice(0, 4).map((entry) => (
          <li key={entry.id} className={cx('flex gap-3 rounded-xl border px-3 py-2 text-sm', theme.inset)}>
            <span className="shrink-0 font-bold tabular-nums" style={{ color: theme.colors.accentStrong }}>{entry.at}</span>
            <span className={theme.title}>{entry.text}</span>
            <span className={cx('ml-auto shrink-0 text-xs', theme.subtle)}>{entry.source}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

const LAYER_OPTIONS = [
  { id: 'plants', label: 'Plantas' },
  { id: 'moisture', label: 'Mapa de umidade' },
]

const BedWorkspace = ({ bed, irrigation, onStartIrrigation, onToggleAutomation, notes, onSaveNote, isStill }) => {
  const theme = usePlatformTheme()
  const [layer, setLayer] = useState('plants')
  const series = useMemo(() => buildMoistureSeries(bed), [bed])
  const state = getBedState(bed, irrigation, theme.colors)
  const isAttention = isBedInAttention(bed)
  const handleStart = () => onStartIrrigation(bed.bedId)
  const handleToggle = () => onToggleAutomation(bed.bedId)
  const handleLayerChange = (layerId) => () => setLayer(layerId)

  return (
    <section aria-labelledby="painel-titulo" className="space-y-4">
      <div className={cx(theme.card, 'p-5 sm:p-6')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className={cx('flex h-16 w-16 items-center justify-center rounded-2xl border', theme.iconTile)}>
              <BotanicalIcon crop={bed.crop} isStressed={isAttention} className="h-14 w-14" />
            </span>
            <div>
              <p className={cx('text-xs font-semibold uppercase tracking-[0.14em]', theme.subtle)}>{bed.bedId} · Setor {bed.sector} · {bed.stage}, {bed.stageDays} dias</p>
              <h2 id="painel-titulo" className={cx(DISPLAY_FONT_CLASS, 'mt-1 text-2xl font-bold tracking-tight sm:text-3xl', theme.title)}>
                {bed.cropName} <span className={cx('font-medium italic', theme.muted)}>· {bed.scientificName}</span>
              </h2>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em]" style={{ borderColor: `${state.color}66`, background: `${state.color}14`, color: state.color }}>
            <StatusDot color={state.color} isPulsing={state.key !== 'stable'} />
            {state.key === 'attention' ? 'Irrigação recomendada' : state.label}
            {irrigation.isAutomationPaused && ' · automação pausada'}
          </span>
        </div>
        <div className={cx('mt-6 grid grid-cols-1 gap-5 border-t pt-5 sm:grid-cols-3', theme.id === 'light' ? 'border-slate-200' : 'border-white/[0.06]')}>
          <TelemetryValue icon="drop" label="Umidade volumétrica" value={bed.moisture} unit="% VWC" color={isAttention ? theme.colors.amber : theme.colors.water} />
          <TelemetryValue icon="thermometer" label="Temperatura da raiz" value={formatDecimal(bed.rootTemperature)} unit="°C" color={theme.colors.amber} />
          <TelemetryValue icon="bolt" label="Condutividade" value={formatDecimal(bed.conductivity)} unit="mS/cm" color={theme.colors.accent} />
        </div>
      </div>

      <div className={cx(theme.card, 'overflow-hidden p-4 sm:p-5')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={cx(DISPLAY_FONT_CLASS, 'flex items-center gap-2 text-sm font-bold', theme.title)}>
            <Icon name="layers" className="h-4 w-4" style={{ color: theme.colors.water }} /> Canteiro {bed.bedId} · leitura das {bed.lastReading}
          </p>
          <div role="group" aria-label="Camada da ilustração" className={cx('flex rounded-full border p-1', theme.segmented)}>
            {LAYER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={handleLayerChange(option.id)}
                aria-pressed={layer === option.id}
                className={cx('min-h-[36px] rounded-full px-3 text-xs font-bold transition-colors duration-150 focus-visible:outline focus-visible:outline-2', theme.focus, layer === option.id && theme.segmentedActive, layer !== option.id && theme.segmentedIdle)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <BedIllustration bed={bed} isIrrigating={irrigation.isRunning} isStill={isStill} layer={layer} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className={cx(theme.card, 'p-4 sm:p-5 xl:col-span-7')}>
          <div className="flex items-center justify-between gap-3">
            <h3 className={cx(DISPLAY_FONT_CLASS, 'text-sm font-bold', theme.title)}>Curva hídrica · últimas 12 h</h3>
            <p className={cx('text-xs', theme.subtle)}>passe o cursor para ler cada hora</p>
          </div>
          <div className="mt-3">
            <HydroChart series={series} accent={isAttention ? theme.colors.amber : theme.colors.accent} />
          </div>
        </div>
        <div className="flex flex-col gap-4 xl:col-span-5">
          <div className={cx(theme.card, 'p-4 sm:p-5')}>
            <h3 className={cx(DISPLAY_FONT_CLASS, 'text-sm font-bold', theme.title)}>Ações imediatas</h3>
            <div className="mt-3 flex flex-col gap-2">
              <ConsoleButton onClick={handleStart} isDisabled={irrigation.isRunning}>
                <Icon name="drop" className="h-4 w-4" strokeWidth={2} />
                {irrigation.isRunning ? `Regando · ${irrigation.remaining} min` : `Iniciar ciclo de rega (${IRRIGATION_CYCLE_MINUTES} min)`}
              </ConsoleButton>
              <ConsoleButton onClick={handleToggle} variant="secondary">
                <Icon name={irrigation.isAutomationPaused ? 'play' : 'pause'} className="h-4 w-4" strokeWidth={2} />
                {irrigation.isAutomationPaused ? 'Retomar automação' : 'Pausar automação'}
              </ConsoleButton>
            </div>
            {irrigation.isRunning && (
              <div className="mt-3" aria-live="polite">
                <div className={cx('h-1.5 overflow-hidden rounded-full', theme.track)}>
                  <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${((IRRIGATION_CYCLE_MINUTES - irrigation.remaining) / IRRIGATION_CYCLE_MINUTES) * 100}%`, background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.water})` }} />
                </div>
                <p className="mt-1.5 text-xs font-semibold" style={{ color: theme.colors.water }}>Válvula {bed.sector === 'Norte' ? 'N' : 'S'} aberta · {irrigation.remaining} min restantes</p>
              </div>
            )}
          </div>
          <FieldNotebook key={bed.bedId} bed={bed} notes={notes} onSaveNote={onSaveNote} />
        </div>
      </div>
    </section>
  )
}

const IDLE_IRRIGATION = { isRunning: false, remaining: 0, isAutomationPaused: false }

const PlatformView = ({ initialBedId, onExit, onLogout, platformTheme, onToggleTheme, isStill }) => {
  const theme = PLATFORM_THEMES[platformTheme]
  const [selectedBedId, setSelectedBedId] = useState(initialBedId)
  const [irrigationByBed, setIrrigationByBed] = useState({})
  const [eventsByBed, setEventsByBed] = useState({})
  const [storedNotes, setStoredNotes] = useState({})
  const selectedBed = getBed(selectedBedId)
  const selectedIrrigation = irrigationByBed[selectedBedId] ?? IDLE_IRRIGATION
  const hasRunningIrrigation = Object.values(irrigationByBed).some((state) => state.isRunning)

  useEffect(() => {
    setStoredNotes(readStoredNotes())
  }, [])

  const addEvent = useCallback((bedId, text, source) => {
    setEventsByBed((events) => ({ ...events, [bedId]: [{ id: `${bedId}-${Date.now()}-${Math.random()}`, at: getCurrentHourLabel(), source, text }, ...(events[bedId] ?? [])] }))
  }, [])

  useEffect(() => {
    if (!hasRunningIrrigation) return undefined
    const timerId = window.setInterval(() => {
      setIrrigationByBed((previous) => {
        const next = { ...previous }
        Object.entries(previous).forEach(([bedId, state]) => {
          if (!state.isRunning) return
          const remaining = state.remaining - 1
          if (remaining > 0) {
            next[bedId] = { ...state, remaining }
            return
          }
          next[bedId] = { ...state, isRunning: false, remaining: 0 }
          addEvent(bedId, `Ciclo de rega concluído. Duração de ${IRRIGATION_CYCLE_MINUTES} min.`, 'Controlador')
        })
        return next
      })
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [hasRunningIrrigation, addEvent])

  const handleStartIrrigation = (bedId) => {
    setIrrigationByBed((previous) => ({ ...previous, [bedId]: { ...(previous[bedId] ?? IDLE_IRRIGATION), isRunning: true, remaining: IRRIGATION_CYCLE_MINUTES } }))
    addEvent(bedId, `Ciclo de rega iniciado. ${IRRIGATION_CYCLE_MINUTES} min por gotejamento.`, 'Controlador')
  }

  const handleToggleAutomation = (bedId) => {
    const current = irrigationByBed[bedId] ?? IDLE_IRRIGATION
    setIrrigationByBed((previous) => ({ ...previous, [bedId]: { ...current, isAutomationPaused: !current.isAutomationPaused } }))
    addEvent(bedId, current.isAutomationPaused ? 'Automação retomada.' : 'Automação pausada. Regas só por comando manual.', 'Operador')
  }

  const handleSaveNote = (bedId, text) => {
    const entry = { id: `${bedId}-${Date.now()}`, at: getCurrentHourLabel(), source: 'Operador', text }
    const nextNotes = { ...storedNotes, [bedId]: [entry, ...(storedNotes[bedId] ?? [])] }
    if (!writeStoredNotes(nextNotes)) return false
    setStoredNotes(nextNotes)
    return true
  }

  const notes = useMemo(
    () => [...(storedNotes[selectedBedId] ?? []), ...(eventsByBed[selectedBedId] ?? []), { id: `${selectedBedId}-base`, at: selectedBed.noteAt, source: 'Produtor', text: selectedBed.note }]
      .sort((first, second) => second.at.localeCompare(first.at, 'pt-BR', { numeric: true })),
    [storedNotes, eventsByBed, selectedBedId, selectedBed],
  )

  return (
    <PlatformThemeContext.Provider value={theme}>
      <div className={cx('min-h-screen antialiased transition-colors duration-200', theme.root)} style={{ fontFamily: FONT_TEXT }}>
        <div className={cx('pointer-events-none fixed inset-0', theme.glow)} aria-hidden="true" />
        <PlatformTopBar onExit={onExit} onLogout={onLogout} onToggleTheme={onToggleTheme} />
        <main id="conteudo" tabIndex={-1} className="relative mx-auto max-w-[110rem] px-4 py-6 outline-none sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <KpiModule icon="alert" iconColor={theme.colors.amber} label="Lotes em atenção" value={`${bedsInAttention.length} canteiros`} detail={`${bedsInAttention.map((bed) => bed.bedId).join(' e ')} exigem rega`} />
            <KpiModule icon="drop" iconColor={theme.colors.water} label="Volume hídrico" value="1.280 L" detail="no ciclo diário" badge="Irrigação de precisão" />
            <KpiModule icon="sensor" iconColor={theme.colors.accent} label="Umidade média" value={`${averageMoisture}% VWC`} detail="Faixa ideal para o ciclo" />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <aside className="lg:col-span-4 xl:col-span-3" aria-label="Seletor de canteiros">
              <div className={cx(theme.card, 'p-3')}>
                <h2 className={cx('px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em]', theme.subtle)}>Canteiros · {BEDS.length}</h2>
                <ul className="space-y-2">
                  {BEDS.map((bed) => (
                    <BedSelectorCard key={bed.bedId} bed={bed} isSelected={bed.bedId === selectedBedId} irrigation={irrigationByBed[bed.bedId]} onSelect={setSelectedBedId} />
                  ))}
                </ul>
              </div>
            </aside>
            <div className="lg:col-span-8 xl:col-span-9">
              <BedWorkspace bed={selectedBed} irrigation={selectedIrrigation} onStartIrrigation={handleStartIrrigation} onToggleAutomation={handleToggleAutomation} notes={notes} onSaveNote={handleSaveNote} isStill={isStill} />
            </div>
          </div>
        </main>
      </div>
    </PlatformThemeContext.Provider>
  )
}

/* ──────────────────────────────── App ──────────────────────────────── */

const useBrandFonts = () => {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_STYLESHEET}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_STYLESHEET
    document.head.appendChild(link)
  }, [])
}

const App = () => {
  const prefersReducedMotion = useReducedMotion()
  const [view, setView] = useState('landing')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [platformTheme, setPlatformTheme] = useState('light')
  const [platformBedId, setPlatformBedId] = useState('C02')
  const [pendingBedId, setPendingBedId] = useState('C02')
  const [isMotionPaused, setIsMotionPaused] = useState(false)
  const isStill = Boolean(prefersReducedMotion) || isMotionPaused

  useBrandFonts()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('conteudo')?.focus({ preventScroll: true })
  }, [view])

  const goToPlatform = useCallback((bedId) => {
    setPlatformBedId(bedId)
    setView('platform')
    window.scrollTo(0, 0)
  }, [])

  const handleOpenPlatform = useCallback(
    (bedId = 'C02') => {
      if (!isLoggedIn) {
        setPendingBedId(bedId)
        setShowLoginModal(true)
        return
      }
      goToPlatform(bedId)
    },
    [isLoggedIn, goToPlatform],
  )

  const handleOpenLogin = useCallback(() => {
    setPendingBedId('C02')
    setShowLoginModal(true)
  }, [])

  const handleCloseLogin = useCallback(() => setShowLoginModal(false), [])

  const handleLoginSubmit = useCallback(() => {
    setIsLoggedIn(true)
    setShowLoginModal(false)
    goToPlatform(pendingBedId)
  }, [goToPlatform, pendingBedId])

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false)
    setView('landing')
    window.scrollTo(0, 0)
  }, [])

  const handleExitPlatform = useCallback(() => {
    setView('landing')
    window.scrollTo(0, 0)
  }, [])

  const handleToggleTheme = useCallback(() => setPlatformTheme((previous) => (previous === 'light' ? 'dark' : 'light')), [])
  const handleToggleMotion = () => setIsMotionPaused((previous) => !previous)

  return (
    <div style={{ fontFamily: FONT_TEXT }}>
      <a href="#conteudo" className="sr-only z-[70] rounded-[0.25rem] bg-[#9BA657] px-4 py-3 font-bold text-[#172815] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Ir para o conteúdo</a>
      {view === 'platform' && isLoggedIn ? (
        <PlatformView key={platformBedId} initialBedId={platformBedId} onExit={handleExitPlatform} onLogout={handleLogout} platformTheme={platformTheme} onToggleTheme={handleToggleTheme} isStill={isStill} />
      ) : (
        <LandingView onOpenPlatform={handleOpenPlatform} onOpenLogin={handleOpenLogin} isLoggedIn={isLoggedIn} isStill={isStill} isMotionPaused={isMotionPaused} onToggleMotion={handleToggleMotion} />
      )}
      <LoginModal isOpen={showLoginModal} onClose={handleCloseLogin} onSubmit={handleLoginSubmit} isStill={isStill} />
    </div>
  )
}

export default App
