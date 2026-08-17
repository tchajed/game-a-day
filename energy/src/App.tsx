import { useCallback, useEffect, useRef, useState } from 'react'
import WorldCanvas from './WorldCanvas'
import { BUILDINGS, formatMoney, initialState, stepGame, type BuildingType, type GameState } from './game'
import './styles.css'

const debug = new URLSearchParams(location.search).get('debug') === 'true'
const musicOff = new URLSearchParams(location.search).get('music') === 'off'

function useSimulation() {
  const [state,setState]=useState<GameState>(()=>initialState(debug)); const ref=useRef(state); ref.current=state
  const mutate=useCallback((fn:(s:GameState)=>GameState)=>setState(s=>{const n=fn(s);ref.current=n;return n}),[])
  useEffect(()=>{let frame=0,last=performance.now(),acc=0;const loop=(now:number)=>{acc+=Math.min(250,now-last);last=now;while(acc>=100){mutate(s=>stepGame(s,.1));acc-=100}frame=requestAnimationFrame(loop)};frame=requestAnimationFrame(loop);return()=>cancelAnimationFrame(frame)},[mutate])
  return {state,mutate,ref}
}

function Gauge({state}:{state:GameState}) {
  const error=state.exportMW-state.target, angle=Math.max(-62,Math.min(62,error/7*62)); const good=Math.abs(error)<=1
  return <div className={`gauge ${good?'good':Math.abs(error)>4?'bad':''}`}>
    <div className="gauge-label"><span>EXPORT</span><b data-testid="export">{state.exportMW.toFixed(1)}</b><small> / <span data-testid="target">{state.target}</span> MW</small></div>
    <div className="arc"><div className="needle" style={{transform:`rotate(${angle}deg)`}}/><i/></div>
    <div className="gauge-scale"><span>DEFICIT</span><strong>{good?'ON CONTRACT':error>0?'CURTAIL / CHARGE':'DISCHARGE'}</strong><span>EXCESS</span></div>
  </div>
}

export default function App(){
  const {state,mutate,ref}=useSimulation(); const [music,setMusic]=useState(false); const audio=useRef<AudioContext|null>(null)
  const build=(type:BuildingType)=>mutate(s=>({...s,buildMode:s.buildMode===type?null:type,toast:`SELECT AN OPEN PAD // ${BUILDINGS[type].name.toUpperCase()}`}))
  const place=(i:number)=>mutate(s=>{if(!s.buildMode||s.pads[i].building)return s;const item=BUILDINGS[s.buildMode];if(s.cash<item.cost)return{...s,toast:'INSUFFICIENT CAPITAL // BORROW OR EARN'};const pads=s.pads.map(p=>({...p}));pads[i].building=s.buildMode;return{...s,pads,cash:s.cash-item.cost,buildMode:null,selected:i,toast:`${item.name.toUpperCase()} ONLINE`}})
  const dispatch=(value:number)=>mutate(s=>({...s,intendedDispatch:value,toast:value>0?'STORAGE DISCHARGING':value<0?'STORAGE CHARGING':'STORAGE IDLE'}))
  const align=()=>mutate(s=>({...s,windFault:false,alignProgress:1,toast:'TURBINES ALIGNED // OUTPUT RESTORED'}))
  const toggleMusic=()=>{if(musicOff)return;if(music){audio.current?.close();audio.current=null;setMusic(false)}else{const a=new AudioContext();const osc=a.createOscillator(),gain=a.createGain();osc.type='sine';osc.frequency.value=52;gain.gain.value=.025;osc.connect(gain).connect(a.destination);osc.start();audio.current=a;setMusic(true)}}
  useEffect(()=>{if(!debug)return;(window as unknown as {__ENERGY__:unknown}).__ENERGY__={getState:()=>ref.current,step:(ms:number)=>mutate(s=>stepGame(s,ms/1000)),restart:()=>mutate(()=>initialState(true)),setCash:(cash:number)=>mutate(s=>({...s,cash})),forceFault:()=>mutate(s=>({...s,windFault:true,alignProgress:.38})),build}},[mutate,ref])
  const remaining=Math.max(0,300-state.elapsed), balance=state.elapsed?state.balancedSeconds/state.elapsed*100:0, equity=state.cash-state.debt
  return <main>
    <header>
      <div className="brand"><span className="brand-mark">G//S</span><div><b>GRID<span>SHIFT</span></b><small>AEOLUS DISTRICT 07</small></div></div>
      <div className="topstats"><Stat label="TIME" value={`${Math.floor(remaining/60)}:${String(Math.floor(remaining%60)).padStart(2,'0')}`} hot={remaining<45}/><Stat label="CONTRACT" value={`${state.target} MW`} test="target"/><Stat label="SPOT PRICE" value={`$${state.price}/MWh`} hot={state.price>200}/><Stat label="CASH" value={formatMoney(state.cash)} test="cash"/><Stat label="DEBT" value={formatMoney(state.debt)} /></div>
    </header>
    <section className="playfield"><WorldCanvas state={state} onPad={place} onSelect={i=>mutate(s=>({...s,selected:i}))}/><div className="scanlines"/>
      <aside className="right-panel">
        <Gauge state={state}/>
        <div className={`alert ${state.windFault?'critical':''}`}><span>{state.windFault?'MAINTENANCE REQUIRED':'SYSTEM FEED'}</span><p>{state.toast}</p>{state.windFault&&<button onClick={align}>RECALIBRATE TURBINES <kbd>A</kbd></button>}</div>
        <div className="objectives"><span>OPERATOR METRICS</span><p><i style={{width:`${balance}%`}}/>Balanced <b>{balance.toFixed(0)}%</b></p><p><i className="danger" style={{width:`${state.dangerSeconds/12*100}%`}}/>Collapse risk <b>{state.dangerSeconds.toFixed(1)} / 12s</b></p></div>
      </aside>
    </section>
    <section className="command-deck">
      <div className="build-group"><label>EXPANSION BAY <small>SELECT → PLACE</small></label><div>{(Object.keys(BUILDINGS) as BuildingType[]).map(t=>{const b=BUILDINGS[t];return <button key={t} data-testid={`build-${t}`} className={state.buildMode===t?'active':''} onClick={()=>build(t)}><i>{b.icon}</i><span><b>{b.name}</b><small>{b.note}</small></span><strong>{formatMoney(b.cost)}</strong></button>})}</div></div>
      <div className="dispatch"><label>STORAGE DISPATCH <small data-testid="storage">{state.stored.toFixed(1)} / {state.capacity} MWh</small></label><div className="dispatch-read"><b>{state.dispatch>0?'+':''}{state.dispatch.toFixed(1)}</b><span>MW</span></div><input aria-label="Storage dispatch" type="range" min="-8" max="8" step=".5" value={state.intendedDispatch} onChange={e=>dispatch(Number(e.target.value))}/><div className="range-label"><span>CHARGE</span><span>IDLE</span><span>EXPORT</span></div>{state.flywheelHeat>0&&<div className="heat">FLYWHEEL HEAT <i style={{width:`${state.flywheelHeat}%`}}/></div>}</div>
      <div className="finance"><label>CAPITAL</label><button data-testid="borrow" onClick={()=>mutate(s=>({...s,cash:s.cash+10000,debt:s.debt+10000,toast:'CREDIT LINE DRAWN // +$10,000'}))}>DRAW CREDIT <b>+$10K</b><small>Debt +$10K</small></button><button data-testid="music-toggle" className="sound" onClick={toggleMusic}>{musicOff?'AUDIO OFF':music?'◼ MUTE GRID':'▶ GRID HUM'}</button></div>
    </section>
    {state.finished&&<div className="result" data-testid="result"><div><small>FINAL OPERATOR REPORT</small><h1>{state.dangerSeconds>=12?'GRID COLLAPSE':equity>=20000?'GRID OPERATOR ELITE':equity>=0?'CONTRACT SECURED':'INSOLVENT'}</h1><p>Your clean-energy district delivered <b>{Math.round(state.score/1000)}k</b> in traded power.</p><section><Stat label="CASH" value={formatMoney(state.cash)}/><Stat label="DEBT" value={formatMoney(state.debt)}/><Stat label="EQUITY" value={formatMoney(equity)}/><Stat label="ON CONTRACT" value={`${balance.toFixed(0)}%`}/></section><button onClick={()=>mutate(()=>initialState(debug))}>RUN ANOTHER SHIFT</button></div></div>}
    {debug&&<button className="debug-skip" onClick={()=>mutate(s=>({...s,elapsed:295}))}>SKIP TO END</button>}
  </main>
}
function Stat({label,value,hot,test}:{label:string,value:string,hot?:boolean,test?:string}){return <div className={hot?'hot':''}><small>{label}</small><b data-testid={test}>{value}</b></div>}
