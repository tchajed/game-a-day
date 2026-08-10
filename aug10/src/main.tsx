import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type AppName = 'browser' | 'passwords' | 'mail' | 'photos';
type Layout = 'float' | 'left' | 'right';
type Placement = { x:number; y:number; width:number; height:number };
type FormData = Record<string, string>;
type WindowProps = {
  app: AppName;
  layout: Layout;
  setLayout: (layout:Layout)=>void;
  close: ()=>void;
  focus: ()=>void;
  startMove: (event:React.PointerEvent<HTMLDivElement>)=>void;
};

const identity = [
  ['Given name', 'MAYA'], ['Family name', 'BENNETT'], ['Date of birth', '17 SEP 1993'],
  ['Email', 'maya.bennett@postbox.test'], ['Phone', '+1 415 555 0142'],
  ['Home address', '84 JUNIPER STREET'], ['City', 'SAN FRANCISCO'], ['Postcode', '94107'],
];
const passport = [
  ['Passport number', '572091384'], ['Issuing country', 'UNITED STATES'],
  ['Date issued', '04 NOV 2021'], ['Date of expiry', '03 NOV 2031'],
  ["Mother's maiden name", 'QUINTERO']
];
const expected: Record<string,string> = {
  email:'maya.bennett@postbox.test', code:'817204', first:'MAYA', last:'BENNETT', dob:'17 SEP 1993',
  phone:'+1 415 555 0142', address:'84 JUNIPER STREET', city:'SAN FRANCISCO', postcode:'94107',
  passport:'572091384', issued:'04 NOV 2021', expires:'03 NOV 2031', maiden:'QUINTERO', arrival:'22 OCT 2026'
};
const moralAnswers:Record<string,string>={purpose:'YES',communist:'NO',partiful:'NO',jar:'NO',overthrow:'NO',truthful:'YES'};

function Icon({name}:{name:AppName}) {
  if (name === 'browser') return <span className="safari">◉</span>;
  if (name === 'passwords') return <span className="key">●</span>;
  if (name === 'mail') return <span className="envelope">✉</span>;
  return <span className="flower">✤</span>;
}

function WindowTitle({title,win}:{title:string;win:WindowProps}){
  return <div className="titlebar" onPointerDown={win.startMove}>
    <div className="lights"><button onPointerDown={e=>e.stopPropagation()} onClick={win.close} title={`Close ${title}`}/><i/><i/></div><span>{title}</span>
    <div className="layout-controls">
      <button className={win.layout==='left'?'selected':''} onPointerDown={e=>e.stopPropagation()} onClick={()=>win.setLayout('left')} title="Tile left">◧</button>
      <button className={win.layout==='float'?'selected':''} onPointerDown={e=>e.stopPropagation()} onClick={()=>win.setLayout('float')} title="Float large">▣</button>
      <button className={win.layout==='right'?'selected':''} onPointerDown={e=>e.stopPropagation()} onClick={()=>win.setLayout('right')} title="Tile right">◨</button>
    </div>
  </div>
}

function AdArt({variant,frame}:{variant:number;frame:number}){
 if(variant===0)return <svg className="art-frame" viewBox="0 0 100 62" aria-hidden="true"><rect x="5" y="35" width="67" height="18" fill="#fff" stroke="#111" strokeWidth="3"/><path d="M7 35V20H67V35" fill="#77d6ff" stroke="#111" strokeWidth="3"/><circle cx={25+frame*3} cy="34" r="9" fill="#ffb18c" stroke="#111" strokeWidth="3"/><text x="72" y={33-frame*3} fontSize={12+frame*2} fontWeight="bold">{'Z'.repeat(Math.max(1,4-frame))}</text></svg>;
 if(variant===1)return <svg className="art-frame" viewBox="0 0 100 62" aria-hidden="true"><rect x="22" y="3" width="42" height="56" rx="6" fill="#dce6ea" stroke="#111" strokeWidth="3"/><circle cx="43" cy="44" r="10" fill="#f33" stroke="#111" strokeWidth="3"/><text x="43" y="48" textAnchor="middle" fontSize="11" fontWeight="bold">!</text><path d={`M92 ${58-frame*9} L67 ${49-frame*5} L70 ${59-frame*5} Z`} fill="#ffb18c" stroke="#111" strokeWidth="3"/><path d="M30 12H56" stroke="#111" strokeWidth="3"/></svg>;
 return <svg className="art-frame" viewBox="0 0 100 62" aria-hidden="true"><circle cx="22" cy="18" r="10" fill="#ffb18c" stroke="#111" strokeWidth="3"/><path d="M8 59V35Q22 25 36 35V59" fill="#2d72a9" stroke="#111" strokeWidth="3"/><path d="M45 51H92" stroke="#111" strokeWidth="5"/><rect x="47" y="12" width="10" height={9+frame*10} fill="#111"/><rect x="60" y="12" width="10" height={frame>0?19+frame*7:4} fill="#111"/><rect x="73" y="12" width="10" height={frame>1?24+frame*5:4} fill="#111"/><path d="M15 15Q22 20 29 15" fill="none" stroke="#111" strokeWidth="2"/></svg>
}
function GovAd({variant}:{variant:number}){const copy=[['IS YOUR NEIGHBOR TOO WELL RESTED?','Fatigue is civic participation.'],['REPORT SUSPICIOUS NAPPING','Department of Wakefulness'],['STAY ALERT. STAY PRODUCTIVE.','Learn more at REST.GOV.NO']][variant];return <aside className={`gov-ad ad-${variant}`} aria-label="Advertisement"><small>ADVERTISEMENT • A MESSAGE FROM YOUR GOVERNMENT</small><div className="ad-copy"><b>{copy[0]}</b><span>{copy[1]}</span></div><div className="ad-art">{[0,1,2,3].map(frame=><AdArt key={frame} variant={variant} frame={frame}/>)}</div><i>AD</i></aside>}
function GovAds({page}:{page:number}){const sets=[[0,1],[1,2],[2,0],[0,2],[1,0],[2,1],[0,1]];return <div className="gov-ads">{sets[page%sets.length].map(variant=><GovAd key={variant} variant={variant}/>)}</div>}

function AccessibilityPage({back}:{back:()=>void}){return <div className="policy-page inaccessible"><p className="crumb">HOME &gt; ACCESSIBILITY (BEST VIEWED AT 100%)</p><h1>Accessibility Compliance Information</h1><div className="marquee"><span>Accessibility is everybody's responsibility. Thank you for doing your part.</span></div><h2>Supported assistive technologies</h2><table><tbody><tr><th>Technology</th><th>Support level</th></tr><tr><td>JAWS 6.0 / Windows XP</td><td>Certified*</td></tr><tr><td>Keyboard</td><td>Press TAB until the desired item is selected</td></tr><tr><td>Screen magnification</td><td>Not recommended; page elements may move</td></tr><tr><td>Other</td><td>Please print this website and ask a trusted person for help</td></tr></tbody></table><small>* Certification performed internally at 800 × 600 resolution. Results are no longer available.</small><h2>Alternative access request</h2><p>To request this page in an accessible format, download Form A-11, print it, and fax it to the number printed on Form A-11. Allow 90 business days.</p><label className="contrast"><input type="checkbox" disabled/> Enable high contrast (temporarily unavailable)</label><div className="actions"><button onClick={back}>&lt;&lt; Return to application</button></div></div>}

function PrivacyPage({back,marketing,setMarketing}:{back:()=>void;marketing:boolean;setMarketing:(v:boolean)=>void}){return <div className="policy-page privacy-page"><p className="crumb">HOME &gt; PRIVACY, COOKIES &amp; OTHER SMALL FILES</p><h1>Your privacy options</h1><div className="warning"><b>Your privacy matters.</b> This statement is 14,892 words long. Continued use may constitute enthusiastic consent in some jurisdictions.</div><h2>Cookie preference centre centre</h2><label className="privacy-choice"><span><b>Strictly necessary surveillance</b><small>Required to remember that you rejected being remembered.</small></span><input type="checkbox" checked disabled/></label><label className="privacy-choice"><span><b>Performance and administrative analytics</b><small>Helps us measure how slowly pages load.</small></span><input type="checkbox" checked disabled/></label><label className="privacy-choice"><span><b>Government marketing and partner messages</b><small>Personalized public-service advertising and mandatory opportunities.</small></span><input type="checkbox" checked={marketing} onChange={e=>setMarketing(e.target.checked)}/></label><h2>Information we may collect</h2><p className="legalese">Device identifiers, approximate location, exact location, emotional posture, cursor hesitation, printer ownership, household flagpole status, and any information that is technically visible from a sufficiently tall government building. We retain this data for the longer of: operational necessity; archival interest; or forever.</p><div className="actions"><button onClick={back}>&lt;&lt; Return to application</button></div></div>}

function CharacterQuestions({data,errors,answer,finish,back}:{data:FormData;errors:Record<string,string>;answer:(id:string,value:string)=>void;finish:()=>void;back:()=>void}){
 const questions=[
  ['purpose','Is the sole purpose of this application to request lawful entry for the trip described above?'],
  ['communist','Are you, or have you ever been, a member of the Communist Party?'],
  ['partiful','Have you ever responded “Maybe” to a Partiful invitation solely to view the guest list?'],
  ['jar',"Have you ever broken a jar in someone’s house to steal a few rupees from them?"],
  ['overthrow','Do you intend to overthrow any government through force, sabotage, or an unusually persuasive group chat?'],
  ['truthful','Are all statements in this application true, even the parts the website changed to uppercase?']
 ];
 return <><p className="crumb">FORM DS-404 &gt; ELIGIBILITY &amp; MORAL CHARACTER</p><h1>Security and background</h1><div className="warning"><b>WARNING:</b> An inadmissible response will result in an immediate and final decision.</div><h2>Step 4 of 5 — Purpose and eligibility</h2><div className="questions">{questions.map(([id,text],index)=><fieldset key={id}><legend>{index+1}. {text}</legend><label><input type="radio" name={id} checked={data[id]==='YES'} onChange={()=>answer(id,'YES')}/> Yes</label><label><input type="radio" name={id} checked={data[id]==='NO'} onChange={()=>answer(id,'NO')}/> No</label>{errors[id]&&<small className="error">⚠ {errors[id]}</small>}</fieldset>)}</div><div className="actions"><button onClick={back}>Go Back</button><button className="continue" onClick={finish}>Review application &gt;&gt;</button></div></>
}

function ApplicationPreview({data,selectedPhoto,edit,submit}:{data:FormData;selectedPhoto:boolean;edit:(page:number)=>void;submit:()=>void}){
 const Row=({label,value}:{label:string;value:string})=><div className="pdf-row"><span>{label}</span><b>{value||'—'}</b></div>;
 return <><p className="crumb">FORM DS-404 &gt; REVIEW &gt; GENERATED DOCUMENT</p><h1>Review application</h1><div className="warning blue"><b>Review carefully.</b> Submission is final. Use “Correct this section” to return; information entered on every later page will be discarded.</div><div className="pdf-preview"><header><span className="seal">⚭</span><div><b>FORM DS-404</b><small>ELECTRONIC VISA PRE-APPLICATION</small></div><em>DRAFT • NOT FOR TRAVEL</em></header><section><h3>1. APPLICANT INFORMATION</h3><button onClick={()=>edit(2)}>Correct this section</button><div className="pdf-grid"><Row label="Family name" value={data.last}/><Row label="Given name(s)" value={data.first}/><Row label="Email address" value={data.email}/><Row label="Date of birth" value={data.dob}/><Row label="Telephone" value={data.phone}/><Row label="Address" value={`${data.address}, ${data.city} ${data.postcode}`}/></div></section><section><h3>2. TRAVEL DOCUMENT</h3><button onClick={()=>edit(3)}>Correct this section</button><div className="pdf-grid"><Row label="Passport number" value={data.passport}/><Row label="Mother's maiden name" value={data.maiden}/><Row label="Date issued" value={data.issued}/><Row label="Date of expiry" value={data.expires}/><Row label="Intended arrival" value={data.arrival}/><Row label="Photograph" value={selectedPhoto?'visa-photo.jpg attached':'NOT ATTACHED'}/></div></section><section><h3>3. ELIGIBILITY DECLARATION</h3><button onClick={()=>edit(4)}>Correct this section</button><div className="pdf-grid"><Row label="Purpose is lawful entry" value={data.purpose}/><Row label="Communist Party member" value={data.communist}/><Row label="Partiful guest-list misuse" value={data.partiful}/><Row label="Jar broken for rupees" value={data.jar}/><Row label="Intent to overthrow government" value={data.overthrow}/><Row label="Declaration is truthful" value={data.truthful}/></div></section><footer>Generated electronically • Ref. pending • Page 1 of 1</footer></div><div className="actions"><button onClick={()=>edit(4)}>Go Back</button><button className="continue submit-final" onClick={submit}>I HAVE REVIEWED — SUBMIT FINAL APPLICATION</button></div></>
}

function App(){
  const debug=new URLSearchParams(location.search).get('debug')==='true';
  const saved=useMemo(()=>{
    try{return JSON.parse(localStorage.getItem('ds404-saved-application')||'null') as {data:FormData;page:number;selectedPhoto:boolean;submissionDenied?:boolean;denialReason?:string}|null}catch{return null}
  },[]);
  const [active,setActive]=useState<AppName>('browser');
  const [page,setPage]=useState(saved?.page??0);
  const [data,setData]=useState<FormData>(saved?.data??{});
  const [seconds,setSeconds]=useState(300);
  const [account,setAccount]=useState(Boolean(saved));
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [selectedPhoto,setSelectedPhoto]=useState(saved?.selectedPhoto??false);
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [lost,setLost]=useState(false);
  const [submissionDenied,setSubmissionDenied]=useState(saved?.submissionDenied??false);
  const [denialReason,setDenialReason]=useState(saved?.denialReason??'records');
  const [layouts,setLayouts]=useState<Record<AppName,Layout>>({browser:'float',passwords:'float',mail:'float',photos:'float'});
  const [placements,setPlacements]=useState<Partial<Record<AppName,Placement>>>({});
  const [openWindows,setOpenWindows]=useState<Record<AppName,boolean>>({browser:true,passwords:false,mail:false,photos:false});
  const [otp,setOtp]=useState('');
  const [mailDelivered,setMailDelivered]=useState(false);
  const [marketingAds,setMarketingAds]=useState(()=>localStorage.getItem('ds404-marketing')!=='false');
  const deliveryTimer=useRef<number|undefined>(undefined);

  useEffect(()=>{ const t=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000); return()=>clearInterval(t)},[]);
  useEffect(()=>()=>window.clearTimeout(deliveryTimer.current),[]);
  useEffect(()=>{
    if(account)localStorage.setItem('ds404-saved-application',JSON.stringify({data,page,selectedPhoto,submissionDenied,denialReason}));
  },[account,data,page,selectedPhoto,submissionDenied,denialReason]);
  useEffect(()=>{ if(seconds===0 && !account && page<6) setLost(true)},[seconds,account,page]);
  const time=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  const copy=async(value:string)=>{ await navigator.clipboard?.writeText(value); setNotice('Copied to clipboard'); setTimeout(()=>setNotice(''),1300)};
  const field=(id:string,label:string,opts:{placeholder?:string,noPaste?:boolean,wide?:boolean}={})=><label className={opts.wide?'wide':''}>
    <span>{label}</span><input value={data[id]||''} placeholder={opts.placeholder||''} autoComplete="off" spellCheck={false} data-1p-ignore="true" data-lpignore="true" data-protonpass-ignore="true" onChange={e=>{
      const value=['email','code','phone'].includes(id)?e.target.value:e.target.value.toUpperCase();
      const nextErrors={...errors}; delete nextErrors[id];
      setData({...data,[id]:value}); setErrors(nextErrors);
    }}
      onPaste={e=>{if(opts.noPaste){e.preventDefault();setNotice('Pasting is not permitted in this field.');setTimeout(()=>setNotice(''),1800)}}}/>
    {errors[id]&&<small className="error">⚠ {errors[id]}</small>}
  </label>;
  const proceed=(target:number, ids:string[])=>{
    const bad:Record<string,string>={}; ids.forEach(id=>{if(!data[id])bad[id]='This question is mandatory'});
    setErrors(bad); if(Object.keys(bad).length)return;
    setBusy(true); setTimeout(()=>{setBusy(false);setPage(target)}, (target>2?1800:900)+(marketingAds?1400:0));
  };
  const sendVerificationCode=()=>{
    if(!data.email){setErrors({email:'This question is mandatory'});return}
    const nextCode=String(Math.floor(100000+Math.random()*900000));
    setOtp(nextCode); setMailDelivered(false); setErrors({}); setBusy(true);
    window.clearTimeout(deliveryTimer.current);
    deliveryTimer.current=window.setTimeout(()=>setMailDelivered(true),3000);
    window.setTimeout(()=>{setBusy(false);setPage(1)},700+(marketingAds?1400:0));
  };
  const submitApplication=()=>{
    const ids=['first','last','dob','phone','address','city','postcode','passport','maiden','issued','expires','arrival'];
    const bad:Record<string,string>={};
    ids.forEach(id=>{if(!data[id])bad[id]='This question is mandatory';else if(data[id]!==expected[id])bad[id]='Does not match supporting records'});
    if(!selectedPhoto)bad.photo='Applicant photograph is mandatory';
    setErrors(bad);
    if(Object.keys(bad).length){setDenialReason('records');setSubmissionDenied(true);setPage(6);return}
    setSubmissionDenied(false); proceed(6,ids);
  };
  const answerQuestion=(id:string,value:string)=>{
    setData(current=>({...current,[id]:value}));
    if(value!==moralAnswers[id]){setDenialReason('character');setSubmissionDenied(true);setPage(6)}
  };
  const finishQuestions=()=>{
    const missing=Object.keys(moralAnswers).filter(id=>!data[id]);
    if(missing.length){setErrors(Object.fromEntries(missing.map(id=>[id,'You must answer this question'])));return}
    if(Object.entries(moralAnswers).some(([id,value])=>data[id]!==value)){setDenialReason('character');setSubmissionDenied(true);setPage(6);return}
    setErrors({});proceed(5,Object.keys(moralAnswers));
  };
  const editFromPreview=(target:number)=>{
    const next={...data};
    if(target===2){['passport','maiden','issued','expires','arrival',...Object.keys(moralAnswers)].forEach(id=>delete next[id]);setSelectedPhoto(false)}
    if(target===3)Object.keys(moralAnswers).forEach(id=>delete next[id]);
    setData(next);setErrors({});setPage(target);
  };
  const reset=()=>{setLost(false);setSeconds(300);setPage(0);setData({});setErrors({})};
  const fillCurrentScreen=()=>{
    if(page===0)setData(current=>({...current,email:expected.email}));
    if(page===1)setData(current=>({...current,code:otp}));
    if(page===2)setData(current=>({...current,...Object.fromEntries(['first','last','dob','phone','address','city','postcode'].map(id=>[id,expected[id]]))}));
    if(page===3){setData(current=>({...current,...Object.fromEntries(['passport','maiden','issued','expires','arrival'].map(id=>[id,expected[id]]))}));setSelectedPhoto(true)}
    if(page===4)setData(current=>({...current,...moralAnswers}));
    setErrors({});
  };
  const updateMarketing=(enabled:boolean)=>{setMarketingAds(enabled);localStorage.setItem('ds404-marketing',String(enabled))};
  const closeWindow=(app:AppName)=>{
    const next={...openWindows,[app]:false};
    setOpenWindows(next);
    const fallback=(['browser','passwords','mail','photos'] as AppName[]).find(name=>next[name]);
    if(fallback) setActive(fallback);
  };
  const windowProps=(app:AppName):WindowProps=>({
    app, layout:layouts[app], close:()=>closeWindow(app), focus:()=>setActive(app),
    setLayout:(layout)=>setLayouts(current=>({...current,[app]:layout})),
    startMove:(event)=>{
      if(layouts[app]!=='float' || (event.target as HTMLElement).closest('button')) return;
      const el=event.currentTarget.parentElement!;
      const rect=el.getBoundingClientRect();
      const offsetX=event.clientX-rect.left, offsetY=event.clientY-rect.top;
      const move=(e:PointerEvent)=>setPlacements(current=>({...current,[app]:{
        x:Math.max(0,Math.min(innerWidth-220,e.clientX-offsetX)),
        y:Math.max(30,Math.min(innerHeight-90,e.clientY-offsetY)),
        width:rect.width,height:rect.height
      }}));
      const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up)};
      document.addEventListener('pointermove',move); document.addEventListener('pointerup',up);
    }
  });
  const windowStyle=(app:AppName):React.CSSProperties=>({
    zIndex:active===app?15:(app==='browser'?2:10),
    ...(layouts[app]==='float'&&placements[app]?{
      left:placements[app]!.x,top:placements[app]!.y,width:placements[app]!.width,height:placements[app]!.height,
      right:'auto',bottom:'auto',transform:'none'
    }:{})
  });

  return <main className="desktop">
    <div className="wallpaper"><div className="orb o1"/><div className="orb o2"/><div className="orb o3"/></div>
    <header className="menubar"><b>◆</b><strong>{active==='browser'?'Navigator':active==='passwords'?'Vault':active==='mail'?'Post': 'Photos'}</strong><span>File</span><span>Edit</span><span>Window</span><aside>⌁ &nbsp; ▰ &nbsp; Sun 10 Aug&nbsp; 10:24</aside></header>
    {openWindows.browser&&<Browser page={page} data={data} setData={setData} errors={errors} setErrors={setErrors} time={time} seconds={seconds} account={account} setAccount={setAccount} setPage={setPage} field={field} proceed={proceed} sendVerificationCode={sendVerificationCode} otp={otp} submitApplication={submitApplication} submissionDenied={submissionDenied} denialReason={denialReason} answerQuestion={answerQuestion} finishQuestions={finishQuestions} editFromPreview={editFromPreview} marketingAds={marketingAds} setMarketingAds={updateMarketing} selectedPhoto={selectedPhoto} setActive={(app:AppName)=>{setActive(app);setOpenWindows(current=>({...current,[app]:true}))}} win={windowProps('browser')} style={windowStyle('browser')}/>}
    {openWindows.passwords&&<Passwords copy={copy} win={windowProps('passwords')} style={windowStyle('passwords')}/>}
    {openWindows.mail&&<Mail copy={copy} delivered={mailDelivered} code={otp} recipient={data.email} win={windowProps('mail')} style={windowStyle('mail')}/>}
    {openWindows.photos&&<Photos selected={selectedPhoto} choose={()=>{setSelectedPhoto(true);setNotice('visa-photo.jpg ready to upload');setTimeout(()=>setNotice(''),1600)}} win={windowProps('photos')} style={windowStyle('photos')}/>}
    <nav className="dock">
      {(['browser','passwords','mail','photos'] as AppName[]).map(a=><button key={a} className={`${openWindows[a]?'open':''} ${active===a&&openWindows[a]?'active':''}`} onClick={()=>{setActive(a);setOpenWindows(current=>({...current,[a]:true}))}}><Icon name={a}/><i>{a==='passwords'?'Vault':a[0].toUpperCase()+a.slice(1)}</i></button>)}
    </nav>
    {notice&&<div className="toast">{notice}</div>}
    {busy&&<div className="blocker"><div className="oldmodal"><b>Processing request</b><div className="bar"><i/></div><span>Please do not refresh your browser.</span></div></div>}
    {lost&&<div className="blocker"><div className="oldmodal expired"><b>Your session has expired</b><p>For your protection, all information entered has been removed.</p><button onClick={reset}>Return to start</button></div></div>}
    {debug&&<button className="debug" onClick={fillCurrentScreen}>DEBUG: fill current screen</button>}
  </main>
}

function Browser({page,data,setData,errors,setErrors,time,seconds,account,setAccount,setPage,field,proceed,sendVerificationCode,otp,submitApplication,submissionDenied,denialReason,answerQuestion,finishQuestions,editFromPreview,marketingAds,setMarketingAds,selectedPhoto,setActive,win,style}:any){
 const [siteView,setSiteView]=useState<'form'|'privacy'|'accessibility'>('form');
 const [cookieWarning,setCookieWarning]=useState(false);
 const [draftMarketing,setDraftMarketing]=useState(marketingAds);
 const siteRef=useRef<HTMLDivElement>(null);
 const openPrivacy=()=>{setDraftMarketing(marketingAds);setSiteView('privacy');setCookieWarning(true)};
 useEffect(()=>{const target=siteRef.current;if(!target||!marketingAds||siteView!=='form')return;const slow=(event:WheelEvent)=>{event.preventDefault();const delta=event.deltaY;window.setTimeout(()=>target.scrollTop+=delta*.55,180)};target.addEventListener('wheel',slow,{passive:false});return()=>target.removeEventListener('wheel',slow)},[marketingAds,siteView]);
 return <section className={`browser window layout-${win.layout}`} style={style} onPointerDown={()=>setActive('browser')}>
  <WindowTitle title="Travel Authorization — Navigator" win={win}/>
  <div className="toolbar"><button>‹</button><button>›</button><div className="address">🔒 &nbsp; visa-services.gov.example/application/DS-404</div><button>↻</button></div>
  <div className="site" ref={siteRef}>
   <div className="govbar"><span className="seal">⚭</span><div><b>OFFICIAL PORTAL</b><small>Department of Entry and Administrative Affairs</small></div><em>FORM DS-404 • REV. 03/1998</em></div>
   {siteView==='form'&&page<6&&<div className={`session ${!account&&seconds<=60?'urgent':''}`}><b>{account?'✓ APPLICATION SAVED':seconds<=60?'⚠ SESSION EXPIRES':'UNSAVED APPLICATION'} </b><span>{account?'Account verified':seconds<=60?time:'Verify your email to enable saving'}</span></div>}
   {siteView==='form'&&marketingAds&&<GovAds page={page}/>}
   <div className="formbody">
    {siteView==='accessibility'&&<AccessibilityPage back={()=>setSiteView('form')}/>}
    {siteView==='privacy'&&<PrivacyPage back={()=>setSiteView('form')} marketing={draftMarketing} setMarketing={setDraftMarketing}/>}
    {siteView==='form'&&<>
    {page===0&&<><p className="crumb">HOME &gt; NON-IMMIGRANT ENTRY &gt; FORM DS-404</p><h1>Electronic Visa Pre-Application</h1><div className="warning"><b>NOTICE:</b> Information is not saved until your email address is verified.</div><h2>Step 1 of 5 — Begin application</h2><p>Enter the email address associated with the applicant.</p>{field('email','E-mail address',{wide:true})}<div className="actions"><button className="continue" onClick={sendVerificationCode}>Send verification code &gt;&gt;</button></div><p className="help">Required information may be found in applications on this computer.</p></>}
    {page===1&&<><p className="crumb">FORM DS-404 &gt; VERIFY APPLICANT</p><h1>Email verification</h1><div className="warning blue">A six-digit access code has been sent. It should arrive in Post shortly.</div><h2>Step 1 of 5 — Verify email</h2>{field('code','Access code',{placeholder:'6 digits'})}<div className="actions"><button onClick={()=>setPage(0)}>Go Back</button><button className="continue" onClick={()=>{if(!otp||data.code!==otp){setErrors({code:'Code not recognized'});return}setAccount(true);proceed(2,['code'])}}>Verify and continue &gt;&gt;</button></div></>}
    {page===2&&<><p className="crumb">FORM DS-404 &gt; APPLICANT DETAILS</p><h1>Applicant information</h1><p className="tiny">Use UPPERCASE English letters. Dates must use format DD MMM YYYY. Do not use punctuation except where required.</p><h2>Step 2 of 5 — Personal details</h2><div className="grid">{field('first','Given name(s)')}{field('last','Family name')}{field('dob','Date of birth *',{placeholder:'DD MMM YYYY',noPaste:true})}{field('phone','Telephone number')}{field('address','Street address',{wide:true})}{field('city','City')}{field('postcode','ZIP / postal code')}</div><div className="actions"><button onClick={()=>setPage(1)}>Go Back</button><button className="continue" onClick={()=>proceed(3,['first','last','dob','phone','address','city','postcode'])}>Save and continue &gt;&gt;</button></div></>}
    {page===3&&<><p className="crumb">FORM DS-404 &gt; DOCUMENT INFORMATION</p><h1>Travel document</h1><div className="warning"><b>Important:</b> Copy and paste is disabled for secure document fields.</div><h2>Step 3 of 5 — Passport and travel</h2><div className="grid">{field('passport','Passport number',{noPaste:true})}{field('maiden',"Mother's maiden name",{noPaste:true})}{field('issued','Date issued',{placeholder:'DD MMM YYYY'})}{field('expires','Date of expiry',{placeholder:'DD MMM YYYY'})}{field('arrival','Intended arrival',{placeholder:'DD MMM YYYY'})}<label className="wide"><span>Applicant photograph</span><div className={selectedPhoto?'upload chosen':'upload'}>{selectedPhoto?'✓ visa-photo.jpg':'No file selected'}<button onClick={()=>setActive('photos')}>Choose from Photos…</button></div>{errors.photo&&<small className="error">⚠ {errors.photo}</small>}</label></div><div className="actions"><button onClick={()=>setPage(2)}>Go Back</button><button className="continue" onClick={()=>{if(!selectedPhoto){setErrors({photo:'Applicant photograph is mandatory'});return}proceed(4,['passport','maiden','issued','expires','arrival'])}}>Save and continue &gt;&gt;</button></div></>}
    {page===4&&<CharacterQuestions data={data} errors={errors} answer={answerQuestion} finish={finishQuestions} back={()=>editFromPreview(3)}/>}
    {page===5&&<ApplicationPreview data={data} selectedPhoto={selectedPhoto} edit={editFromPreview} submit={submitApplication}/>}
    {page===6&&<div className={`success ${submissionDenied?'denied':''}`}><div className="stamp">{submissionDenied?'DENIED':'RECEIVED'}</div><h1>{submissionDenied?'Application denied':'Application transmitted'}</h1>{submissionDenied?<><p>{denialReason==='character'?'Your responses indicate that you are inadmissible on moral-character grounds.':'Your application contains information that could not be verified against the supporting records.'}</p><div className="warning"><b>Decision:</b> This decision is effective immediately and cannot be appealed online.</div></>:<><p>Reference number</p><strong>DS404-8391-XQ</strong><div className="warning blue">Your application will be processed in approximately 8–14 months. This receipt does not constitute a visa.</div></>}<button onClick={()=>{localStorage.removeItem('ds404-saved-application');location.reload()}}>New application</button></div>}
    {page===4&&<div className={`success ${submissionDenied?'denied':''}`}><div className="stamp">{submissionDenied?'DENIED':'RECEIVED'}</div><h1>{submissionDenied?'Application denied':'Application transmitted'}</h1>{submissionDenied?<><p>Your application contains information that could not be verified against the supporting records.</p><div className="warning"><b>Decision:</b> This decision is effective immediately and cannot be appealed online.</div></>:<><p>Reference number</p><strong>DS404-8391-XQ</strong><div className="warning blue">Your application will be processed in approximately 8–14 months. This receipt does not constitute a visa.</div></>}<button onClick={()=>{localStorage.removeItem('ds404-saved-application');location.reload()}}>New application</button></div>}
    </>}
   </div>
   <footer><button onClick={()=>setSiteView('accessibility')}>Accessibility</button><span>|</span><button onClick={openPrivacy}>Privacy</button><span>|</span> Browser requirements: Internet Explorer 8+</footer>
   {cookieWarning&&<div className="cookie-wall"><div className="cookie-box"><div className="cookie-icon">◉◉◉</div><h2>We value your choices!</h2><p>We and our 647 government partners use cookies to improve services, personalize mandatory content, and understand why you hesitate.</p><label className="cookie-marketing"><input type="checkbox" checked={draftMarketing} onChange={e=>setDraftMarketing(e.target.checked)}/><span><b>Government marketing</b><small>Show personalized public-service advertisements</small></span></label><div className="cookie-buttons"><button onClick={()=>{setDraftMarketing(true);setMarketingAds(true);setCookieWarning(false)}}>ALLOW ALL</button><button onClick={()=>{setMarketingAds(draftMarketing);setCookieWarning(false)}}>CONFIRM MY CHOICES</button></div><small>Closing this notice is not a choice.</small></div></div>}
  </div>
 </section>
}

function Passwords({copy,win,style}:{copy:(s:string)=>void;win:WindowProps;style:React.CSSProperties}){const [tab,setTab]=useState(0);const rows=tab===0?identity:passport;return <section className={`utility window layout-${win.layout}`} style={style} onPointerDown={win.focus}><WindowTitle title="Vault" win={win}/><div className="vaulttop"><span className="key">●</span><div><b>Maya Bennett</b><small>Personal Identity</small></div></div><div className="tabs"><button className={tab===0?'sel':''} onClick={()=>setTab(0)}>Contact card</button><button className={tab===1?'sel':''} onClick={()=>setTab(1)}>Passport</button></div><div className="records">{rows.map(([k,v])=><button key={k} onClick={()=>copy(v)}><span>{k}</span><b>{v}</b><i>⧉</i></button>)}</div><p className="copyhint">Click any row to copy</p></section>}
function Mail({copy,delivered,code,recipient,win,style}:{copy:(s:string)=>void;delivered:boolean;code:string;recipient:string;win:WindowProps;style:React.CSSProperties}){return <section className={`utility window mail layout-${win.layout}`} style={style} onPointerDown={win.focus}><WindowTitle title="Post" win={win}/><div className="mailcols"><aside><b>Inbox {delivered?'1':''}</b><span>Sent</span><span>Archive</span><span>Trash</span></aside>{delivered?<div><div className="messageitem"><b>Visa Services</b><span>Your verification code</span><time>Now</time></div><article><small>From: no-reply@visa-services.gov.example<br/>To: {recipient}</small><h3>Your verification code</h3><p>Use the following code to continue your application:</p><button className="code" onClick={()=>copy(code)}>{code.slice(0,3)} {code.slice(3)} <i>copy</i></button><p>This code expires in 5 minutes. Do not reply to this automatically generated message.</p></article></div>:<div className="empty-inbox"><span>✉</span><b>Inbox is empty</b><p>New messages will appear here.</p></div>}</div></section>}
function Photos({selected,choose,win,style}:{selected:boolean;choose:()=>void;win:WindowProps;style:React.CSSProperties}){const pics=useMemo(()=>['mountains','portrait','cat','beach','receipt','city'],[]);return <section className={`utility window photos layout-${win.layout}`} style={style} onPointerDown={win.focus}><WindowTitle title="Photos" win={win}/><div className="photobody"><aside><b>Library</b><span>Favorites</span><span>Recents</span><span>Documents</span></aside><div><h3>Recent photos</h3><div className="photoGrid">{pics.map((p,i)=><button key={p} className={`${p} ${p==='portrait'&&selected?'picked':''}`} onClick={p==='portrait'?choose:undefined}><div>{p==='portrait'?<><span className="head"/><span className="body"/></>:<span>{['◒','', '●','≈','▤','▥'][i]}</span>}</div><b>{p==='portrait'?'visa-photo.jpg':p+'-'+(401+i)+'.jpg'}</b></button>)}</div><p>Select a passport-style photograph to attach it.</p></div></div></section>}

createRoot(document.getElementById('root')!).render(<App/>);
