import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourceDir = join(root, 'artwork-src/night-garden');
const buildDir = join(root, '.art-build/night-garden');
const outputDir = join(root, 'public/art');
const mode = process.argv[2] ?? '--all';

mkdirSync(sourceDir, { recursive: true });
mkdirSync(buildDir, { recursive: true });
mkdirSync(outputDir, { recursive: true });

const petalRing = (count, path, fill, cx, cy) => Array.from({ length: count }, (_, i) =>
  `<path d="${path}" fill="${fill}" transform="rotate(${i * 360 / count} ${cx} ${cy})"/>`
).join('');

const stars = (seed, color = '#f6d98d', count = 44) => {
  let state = seed;
  const random = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: count }, () => {
    const x = 55 + random() * 790;
    const y = 55 + random() * 760;
    const r = .8 + random() * 3.1;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${(.3 + random() * .65).toFixed(2)}"/>`;
  }).join('');
};

const svg = (id, defs, scene) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" width="900" height="1200" role="img" aria-labelledby="title desc">
  <title id="title">${id}</title>
  <desc id="desc">A clean vector study for the Night Garden collection.</desc>
  <defs>
    ${defs}
    <clipPath id="field"><rect x="24" y="24" width="852" height="1152" rx="7"/></clipPath>
  </defs>
  <g clip-path="url(#field)">${scene}</g>
  <rect x="24" y="24" width="852" height="1152" rx="7" fill="none" stroke="#e8d8ad" stroke-width="5" opacity=".72"/>
  <rect x="38" y="38" width="824" height="1124" rx="4" fill="none" stroke="#e8d8ad" stroke-width="1.5" opacity=".35"/>
</svg>`;

const fern = (x, y, scale, flip = 1) => {
  const leaves = Array.from({ length: 10 }, (_, i) => {
    const yy = y - i * 54 * scale;
    const xx = x + flip * (i * i * 1.75 * scale);
    const angle = flip * (-25 + i * 4);
    return `<ellipse cx="${xx}" cy="${yy}" rx="${52 * scale}" ry="${13 * scale}" fill="#5f8d62" transform="rotate(${angle} ${xx} ${yy})"/>
      <ellipse cx="${xx - flip * 12 * scale}" cy="${yy - 22 * scale}" rx="${43 * scale}" ry="${11 * scale}" fill="#8eb06e" transform="rotate(${-angle} ${xx - flip * 12 * scale} ${yy - 22 * scale})"/>`;
  }).join('');
  return `<g><path d="M ${x} ${y + 55 * scale} Q ${x + flip * 35 * scale} ${y - 230 * scale} ${x + flip * 190 * scale} ${y - 535 * scale}" fill="none" stroke="#d3be72" stroke-width="${10 * scale}" stroke-linecap="round"/>${leaves}</g>`;
};

// Two procedural paint recipes share the same clean-vector starting point:
// “graphic-impasto” uses bright pigment, dark contour and horizontal knife marks;
// “velatura” uses a dark ground, directional scumble and restrained edge relief.
// They draw on the material qualities in the supplied Thiebaud and Peto references,
// without sampling or shipping either reference image.
const works = [
  {
    file: 'night-garden-1', title: 'Moonflower Keeps the Hours', strategy: 'velatura',
    svg: svg('Moonflower Keeps the Hours', `
      <linearGradient id="bg" x2="0" y2="1"><stop stop-color="#101f3b"/><stop offset="1" stop-color="#352248"/></linearGradient>
      <radialGradient id="moon"><stop stop-color="#fff4c9"/><stop offset="1" stop-color="#cdb778"/></radialGradient>
      <linearGradient id="leaf" x2="1" y2="1"><stop stop-color="#296d62"/><stop offset="1" stop-color="#163f4b"/></linearGradient>`, `
      <rect width="900" height="1200" fill="url(#bg)"/>${stars(11, '#c9e4d0', 48)}
      <circle cx="685" cy="235" r="132" fill="url(#moon)" opacity=".94"/><circle cx="733" cy="202" r="132" fill="#18223e"/>
      <path d="M410 1210 C370 960 555 880 445 670 C350 490 390 310 505 90" fill="none" stroke="#7a9c72" stroke-width="25" stroke-linecap="round"/>
      <path d="M425 900 C290 790 195 840 135 950 C275 975 390 946 425 900Z" fill="url(#leaf)" stroke="#9bb181" stroke-width="5"/>
      <path d="M454 690 C565 575 685 620 760 735 C620 775 510 758 454 690Z" fill="url(#leaf)" stroke="#9bb181" stroke-width="5"/>
      <path d="M397 505 C280 415 197 470 145 565 C260 605 358 575 397 505Z" fill="url(#leaf)" stroke="#9bb181" stroke-width="5"/>
      ${petalRing(10, 'M450 560 C390 465 400 360 450 305 C500 360 510 465 450 560Z', '#f2e8c8', 450, 560)}
      ${petalRing(10, 'M450 548 C420 475 427 402 450 365 C473 402 480 475 450 548Z', '#b9c6cf', 450, 548)}
      <circle cx="450" cy="560" r="62" fill="#e0ae55"/><circle cx="450" cy="560" r="27" fill="#704450"/>
      <g fill="#f7d478">${Array.from({length:14},(_,i)=>`<circle cx="450" cy="560" r="8" transform="rotate(${i*25.7} 450 560) translate(0 -43)"/>`).join('')}</g>`)
  },
  {
    file: 'night-garden-2', title: 'Foxglove Broadcast', strategy: 'graphic-impasto',
    svg: svg('Foxglove Broadcast', `
      <linearGradient id="bg" x2="1" y2="1"><stop stop-color="#461e36"/><stop offset=".55" stop-color="#8d3d45"/><stop offset="1" stop-color="#db805e"/></linearGradient>
      <linearGradient id="bell"><stop stop-color="#ffcfb3"/><stop offset=".6" stop-color="#d66c83"/><stop offset="1" stop-color="#813a65"/></linearGradient>`, `
      <rect width="900" height="1200" fill="url(#bg)"/>
      <circle cx="450" cy="430" r="250" fill="none" stroke="#f2bd73" stroke-width="3" opacity=".42"/>
      <circle cx="450" cy="430" r="190" fill="none" stroke="#f2bd73" stroke-width="18" opacity=".18"/>
      ${stars(83, '#ffd397', 35)}
      <path d="M445 1200 C430 950 480 680 452 215" fill="none" stroke="#3d6855" stroke-width="28"/>
      <path d="M449 960 C330 850 220 875 132 1010 C285 1035 395 1012 449 960Z" fill="#426e59" stroke="#adc078" stroke-width="6"/>
      <path d="M456 820 C570 725 680 755 776 890 C630 915 512 886 456 820Z" fill="#426e59" stroke="#adc078" stroke-width="6"/>
      ${Array.from({length:8},(_,i)=>{const y=285+i*76;const side=i%2?-1:1;const x=452+side*18;return `<g transform="translate(${x} ${y}) scale(${side} 1)"><path d="M0 0 C48 -13 118 13 140 70 C105 118 39 122 4 80 C27 48 28 28 0 0Z" fill="url(#bell)" stroke="#ffd4b8" stroke-width="5"/><ellipse cx="111" cy="76" rx="18" ry="9" fill="#532744"/><g fill="#71304d"><circle cx="69" cy="56" r="6"/><circle cx="92" cy="40" r="5"/><circle cx="83" cy="77" r="4"/></g></g>`}).join('')}
      <path d="M452 228 C400 184 409 122 453 81 C497 126 510 185 452 228Z" fill="#e9a56f"/>`)
  },
  {
    file: 'night-garden-3', title: 'Blue Lotus, Tidal Clock', strategy: 'graphic-impasto',
    svg: svg('Blue Lotus, Tidal Clock', `
      <linearGradient id="bg" x2="0" y2="1"><stop stop-color="#092b3d"/><stop offset="1" stop-color="#0a5b65"/></linearGradient>
      <linearGradient id="petal" x2="0" y2="1"><stop stop-color="#b7e8df"/><stop offset=".6" stop-color="#5aa5b7"/><stop offset="1" stop-color="#265b8c"/></linearGradient>`, `
      <rect width="900" height="1200" fill="url(#bg)"/>
      <circle cx="450" cy="380" r="250" fill="#d5b560" opacity=".14"/><circle cx="450" cy="380" r="202" fill="none" stroke="#e1cb82" stroke-width="3" opacity=".55"/>
      ${Array.from({length:9},(_,i)=>`<path d="M60 ${760+i*38} Q 210 ${725+i*38} 360 ${760+i*38} T 660 ${760+i*38} T 960 ${760+i*38}" fill="none" stroke="${i%2?'#5ca5a0':'#d0b96e'}" stroke-width="${i%2?5:3}" opacity="${.25+i*.045}"/>`).join('')}
      ${petalRing(14, 'M450 655 C397 574 402 453 450 360 C498 453 503 574 450 655Z', 'url(#petal)', 450, 655)}
      ${petalRing(9, 'M450 655 C414 596 418 510 450 450 C482 510 486 596 450 655Z', '#91cfcc', 450, 655)}
      <circle cx="450" cy="655" r="72" fill="#d3ad4f"/>
      <circle cx="450" cy="655" r="35" fill="#69466e"/>
      ${Array.from({length:24},(_,i)=>`<circle cx="450" cy="655" r="7" fill="#f4d783" transform="rotate(${i*15} 450 655) translate(0 -52)"/>`).join('')}
      <path d="M110 1060 Q450 935 790 1060 Q450 1160 110 1060Z" fill="#104552" stroke="#6fa59d" stroke-width="5"/>
      ${stars(31, '#b8dfd3', 32)}`)
  },
  {
    file: 'night-garden-4', title: 'Ferns Remember Lightning', strategy: 'velatura',
    svg: svg('Ferns Remember Lightning', `
      <linearGradient id="bg" x2="1" y2="1"><stop stop-color="#172a27"/><stop offset="1" stop-color="#59412e"/></linearGradient>
      <linearGradient id="bolt" x2="0" y2="1"><stop stop-color="#fff1a0"/><stop offset="1" stop-color="#d57e3f"/></linearGradient>`, `
      <rect width="900" height="1200" fill="url(#bg)"/>${stars(61, '#c9d59c', 38)}
      <path d="M553 40 L354 436 L489 421 L302 766 L602 331 L466 343 L647 40Z" fill="url(#bolt)" opacity=".92"/>
      <circle cx="450" cy="470" r="305" fill="none" stroke="#bba865" stroke-width="2" opacity=".38"/>
      ${fern(185, 1180, 1.05, 1)}${fern(716, 1160, .96, -1)}${fern(340, 1280, .72, 1)}
      <path d="M70 1110 C270 1020 628 1020 850 1110 L850 1200 L70 1200Z" fill="#142f30" opacity=".82"/>
      <g fill="#d8c276" opacity=".85"><circle cx="145" cy="870" r="9"/><circle cx="758" cy="820" r="7"/><circle cx="672" cy="958" r="5"/></g>`)
  },
  {
    file: 'night-garden-5', title: 'Pomegranates after Midnight', strategy: 'graphic-impasto',
    svg: svg('Pomegranates after Midnight', `
      <linearGradient id="bg" x2="0" y2="1"><stop stop-color="#1d1835"/><stop offset="1" stop-color="#35204a"/></linearGradient>
      <radialGradient id="fruit"><stop offset="0" stop-color="#d95a4d"/><stop offset=".72" stop-color="#8f263a"/><stop offset="1" stop-color="#501c34"/></radialGradient>`, `
      <rect width="900" height="1200" fill="url(#bg)"/>${stars(101, '#e4c478', 50)}
      <circle cx="450" cy="340" r="270" fill="#d9ad55" opacity=".1"/>
      <path d="M85 880 C290 710 505 555 835 335" fill="none" stroke="#8a6644" stroke-width="39" stroke-linecap="round"/>
      <path d="M350 688 C240 530 122 560 79 700 C206 756 310 744 350 688Z" fill="#315d54" stroke="#94a76c" stroke-width="6"/>
      <path d="M528 552 C576 410 716 388 817 480 C721 572 625 599 528 552Z" fill="#315d54" stroke="#94a76c" stroke-width="6"/>
      <path d="M688 430 C646 310 735 218 849 232 C842 355 788 423 688 430Z" fill="#46735c" stroke="#94a76c" stroke-width="6"/>
      ${[[260,780,126],[500,640,150],[700,455,105]].map(([x,y,r])=>`<g><circle cx="${x}" cy="${y}" r="${r}" fill="url(#fruit)" stroke="#ee9a66" stroke-width="6"/><path d="M${x-40} ${y-r+12} L${x-57} ${y-r-48} L${x-13} ${y-r-25} L${x} ${y-r-73} L${x+23} ${y-r-26} L${x+61} ${y-r-51} L${x+45} ${y-r+14}Z" fill="#ad4a43" stroke="#ef9a68" stroke-width="5"/></g>`).join('')}
      <path d="M55 1015 Q450 920 845 1015 L845 1200 L55 1200Z" fill="#121b32"/>
      <g fill="#dbb857">${Array.from({length:18},(_,i)=>`<circle cx="${390+(i%6)*27}" cy="${1010+Math.floor(i/6)*28}" r="8"/>`).join('')}</g>`)
  },
  {
    file: 'night-garden-6', title: 'Moths Pollinate the Stars', strategy: 'velatura',
    svg: svg('Moths Pollinate the Stars', `
      <linearGradient id="bg" x2="1" y2="1"><stop stop-color="#211937"/><stop offset="1" stop-color="#633651"/></linearGradient>
      <linearGradient id="wing"><stop stop-color="#f1c477"/><stop offset="1" stop-color="#c56c66"/></linearGradient>`, `
      <rect width="900" height="1200" fill="url(#bg)"/>${stars(223, '#f3d58a', 72)}
      <circle cx="450" cy="625" r="290" fill="none" stroke="#e7bd6d" stroke-width="3" opacity=".25"/>
      ${petalRing(18, 'M450 970 C418 905 420 798 450 700 C480 798 482 905 450 970Z', '#c96863', 450, 970)}
      ${petalRing(13, 'M450 960 C427 910 430 836 450 770 C470 836 473 910 450 960Z', '#efb16b', 450, 960)}
      <circle cx="450" cy="970" r="78" fill="#6f394a"/>
      <g transform="translate(260 330) rotate(-18)"><path d="M0 0 C-145 -88 -190 62 -72 145 C-30 128 -5 84 0 0Z" fill="url(#wing)" stroke="#f5d59b" stroke-width="6"/><path d="M0 0 C145 -88 190 62 72 145 C30 128 5 84 0 0Z" fill="url(#wing)" stroke="#f5d59b" stroke-width="6"/><path d="M-8 -15 Q0 62 8 160" stroke="#51334c" stroke-width="24" stroke-linecap="round"/><circle cx="-80" cy="40" r="24" fill="#4f405f"/><circle cx="80" cy="40" r="24" fill="#4f405f"/><path d="M-4 -4 Q-50 -70 -82 -78 M4 -4 Q50 -70 82 -78" fill="none" stroke="#f3d18c" stroke-width="5"/></g>
      <g transform="translate(670 550) scale(.55) rotate(22)"><path d="M0 0 C-145 -88 -190 62 -72 145 C-30 128 -5 84 0 0Z" fill="#9eb29c" stroke="#f5d59b" stroke-width="8"/><path d="M0 0 C145 -88 190 62 72 145 C30 128 5 84 0 0Z" fill="#9eb29c" stroke="#f5d59b" stroke-width="8"/><path d="M-8 -15 Q0 62 8 160" stroke="#51334c" stroke-width="30" stroke-linecap="round"/></g>
      <path d="M450 1200 C458 1110 455 1030 450 970" stroke="#56705c" stroke-width="24"/><path d="M450 1120 C315 1050 240 1090 188 1180" fill="#31564f" stroke="#8ba477" stroke-width="6"/>`)
  }
];

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

function renderSources() {
  for (const work of works) {
    const source = join(sourceDir, `${work.file}.svg`);
    const render = join(buildDir, `${work.file}-source.png`);
    writeFileSync(source, work.svg);
    run('rsvg-convert', ['--width', '900', '--height', '1200', '--output', render, source]);
    const dimensions = execFileSync('identify', ['-format', '%wx%h %[colors]', render], { encoding: 'utf8' }).trim();
    const [size, colorCount] = dimensions.split(' ');
    if (size !== '900x1200' || Number(colorCount) < 200) throw new Error(`Source validation failed for ${work.file}: ${dimensions}`);
    console.log(`validated ${work.file}: ${dimensions}`);
  }
  const sourcePngs = works.map(work => join(buildDir, `${work.file}-source.png`));
  run('magick', [...sourcePngs, '-thumbnail', '270x360', '-background', '#171510', '-gravity', 'center', '-extent', '290x390', '+append', join(buildDir, 'source-contact-sheet.png')]);
  console.log(`Review clean vectors before transformation: ${join(buildDir, 'source-contact-sheet.png')}`);
}

function transformSources() {
  const available = new Set(readdirSync(buildDir));
  for (const [index, work] of works.entries()) {
    const sourceName = `${work.file}-source.png`;
    if (!available.has(sourceName)) throw new Error(`Run --render-only and review the contact sheet before transforming (${sourceName} missing).`);
    const input = join(buildDir, sourceName);
    const painted = join(buildDir, `${work.file}-painted.png`);
    const brush = join(buildDir, `${work.file}-brush.png`);
    const weave = join(buildDir, `${work.file}-weave.png`);
    const impasto = join(buildDir, `${work.file}-impasto.png`);
    const output = join(outputDir, `${work.file}.webp`);
    const seed = String(1701 + index * 97);
    const graphic = work.strategy === 'graphic-impasto';

    // 1. Break mechanically perfect gradients into clustered pigment shapes.
    // Bright works retain confectionery color; dark works receive a thin umber-like veil.
    run('magick', [input, '-paint', graphic ? '2.8' : '3.2', '-modulate', graphic ? '102,119,100' : '92,91,100', painted]);
    // 2. Lay a directional, seeded brush field over the clustered pigment.
    // Graphic works use Thiebaud-like horizontal knife drag; velatura follows the subject.
    const brushAngle = graphic ? '0' : String(28 + index * 19);
    run('magick', ['-seed', seed, '-size', '900x1200', 'xc:#808080', '+noise', 'Random', '-colorspace', 'gray',
      '-motion-blur', graphic ? `0x15+${brushAngle}` : `0x10+${brushAngle}`, '-auto-level', '-evaluate', 'multiply', graphic ? '.46' : '.31',
      '-evaluate', 'add', graphic ? '27%' : '34.5%', brush]);
    // 3. Build deterministic linen around neutral gray so blending changes texture, not exposure.
    const weaveSvg = join(buildDir, `${work.file}-weave.svg`);
    writeFileSync(weaveSvg, `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><defs><pattern id="w" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#808080"/><path d="M0 .7H7M0 4.2H7" stroke="#686868" stroke-width=".8" opacity=".55"/><path d="M.7 0V7M4.2 0V7" stroke="#9a9a9a" stroke-width=".7" opacity=".45"/></pattern><filter id="n"><feTurbulence seed="${seed}" baseFrequency=".12" numOctaves="2" result="noise"/><feBlend in="SourceGraphic" in2="noise" mode="soft-light"/></filter></defs><rect width="900" height="1200" fill="url(#w)" filter="url(#n)"/></svg>`);
    run('rsvg-convert', ['--width', '900', '--height', '1200', '--output', weave, weaveSvg]);
    // 4. Derive a raised-paint map from edges and illuminate it like shallow impasto.
    run('magick', [painted, '-colorspace', 'gray', '-edge', '1.2', '-blur', '0x1.1', '-shade', '118x34', impasto]);
    // 5. Composite brush direction, canvas tooth, and restrained impasto without washing out pigment.
    run('magick', [painted,
      '(', brush, '-alpha', 'set', '-channel', 'A', '-evaluate', 'set', graphic ? '52%' : '34%', '+channel', ')', '-compose', 'softlight', '-composite',
      '(', weave, '-alpha', 'set', '-channel', 'A', '-evaluate', 'set', graphic ? '10%' : '22%', '+channel', ')', '-compose', 'softlight', '-composite',
      '(', impasto, '-alpha', 'set', '-channel', 'A', '-evaluate', 'set', graphic ? '24%' : '9%', '+channel', ')', '-compose', 'overlay', '-composite',
      '-unsharp', '0x0.7+0.45+0', '-quality', '88', output]);
    console.log(`painted ${work.file} -> ${output}`);
  }
  const finals = works.map(work => join(outputDir, `${work.file}.webp`));
  run('magick', [...finals, '-thumbnail', '270x360', '-background', '#171510', '-gravity', 'center', '-extent', '290x390', '+append', join(buildDir, 'painted-contact-sheet.png')]);
  console.log(`Review transformed paintings: ${join(buildDir, 'painted-contact-sheet.png')}`);
}

if (mode === '--render-only' || mode === '--all') renderSources();
if (mode === '--transform' || mode === '--all') transformSources();
if (!['--render-only', '--transform', '--all'].includes(mode)) throw new Error('Use --render-only, --transform, or --all.');
