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

function App(){
  const debug=new URLSearchParams(location.search).get('debug')==='true';
  const saved=useMemo(()=>{
    try{return JSON.parse(localStorage.getItem('ds404-saved-application')||'null') as {data:FormData;page:number;selectedPhoto:boolean}|null}catch{return null}
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
  const [layouts,setLayouts]=useState<Record<AppName,Layout>>({browser:'float',passwords:'float',mail:'float',photos:'float'});
  const [placements,setPlacements]=useState<Partial<Record<AppName,Placement>>>({});
  const [openWindows,setOpenWindows]=useState<Record<AppName,boolean>>({browser:true,passwords:false,mail:false,photos:false});
  const [otp,setOtp]=useState('');
  const [mailDelivered,setMailDelivered]=useState(false);
  const deliveryTimer=useRef<number|undefined>(undefined);

  useEffect(()=>{ const t=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000); return()=>clearInterval(t)},[]);
  useEffect(()=>()=>window.clearTimeout(deliveryTimer.current),[]);
  useEffect(()=>{
    if(account)localStorage.setItem('ds404-saved-application',JSON.stringify({data,page,selectedPhoto}));
  },[account,data,page,selectedPhoto]);
  useEffect(()=>{ if(seconds===0 && !account && page<4) setLost(true)},[seconds,account,page]);
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
    setBusy(true); setTimeout(()=>{setBusy(false);setPage(target)}, target>2?1800:900);
  };
  const sendVerificationCode=()=>{
    if(!data.email){setErrors({email:'This question is mandatory'});return}
    const nextCode=String(Math.floor(100000+Math.random()*900000));
    setOtp(nextCode); setMailDelivered(false); setErrors({}); setBusy(true);
    window.clearTimeout(deliveryTimer.current);
    deliveryTimer.current=window.setTimeout(()=>setMailDelivered(true),3000);
    window.setTimeout(()=>{setBusy(false);setPage(1)},700);
  };
  const submitApplication=()=>{
    const ids=['first','last','dob','phone','address','city','postcode','passport','maiden','issued','expires','arrival'];
    const bad:Record<string,string>={};
    ids.forEach(id=>{if(!data[id])bad[id]='This question is mandatory';else if(data[id]!==expected[id])bad[id]='Does not match supporting records'});
    setErrors(bad);
    if(Object.keys(bad).length){
      const personal=['first','last','dob','phone','address','city','postcode'].some(id=>bad[id]);
      setNotice('Final validation failed. Review the highlighted information.'); setTimeout(()=>setNotice(''),2500);
      if(personal)setPage(2);
      return;
    }
    proceed(4,ids);
  };
  const reset=()=>{setLost(false);setSeconds(300);setPage(0);setData({});setErrors({})};
  const fillCurrentScreen=()=>{
    if(page===0)setData(current=>({...current,email:expected.email}));
    if(page===1)setData(current=>({...current,code:otp}));
    if(page===2)setData(current=>({...current,...Object.fromEntries(['first','last','dob','phone','address','city','postcode'].map(id=>[id,expected[id]]))}));
    if(page===3){setData(current=>({...current,...Object.fromEntries(['passport','maiden','issued','expires','arrival'].map(id=>[id,expected[id]]))}));setSelectedPhoto(true)}
    setErrors({});
  };
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
    {openWindows.browser&&<Browser page={page} data={data} setData={setData} setErrors={setErrors} time={time} seconds={seconds} account={account} setAccount={setAccount} setPage={setPage} field={field} proceed={proceed} sendVerificationCode={sendVerificationCode} otp={otp} submitApplication={submitApplication} selectedPhoto={selectedPhoto} setActive={(app:AppName)=>{setActive(app);setOpenWindows(current=>({...current,[app]:true}))}} win={windowProps('browser')} style={windowStyle('browser')}/>}
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

function Browser({page,data,setData,setErrors,time,seconds,account,setAccount,setPage,field,proceed,sendVerificationCode,otp,submitApplication,selectedPhoto,setActive,win,style}:any){
 return <section className={`browser window layout-${win.layout}`} style={style} onPointerDown={()=>setActive('browser')}>
  <WindowTitle title="Travel Authorization — Navigator" win={win}/>
  <div className="toolbar"><button>‹</button><button>›</button><div className="address">🔒 &nbsp; visa-services.gov.example/application/DS-404</div><button>↻</button></div>
  <div className="site">
   <div className="govbar"><span className="seal">⚭</span><div><b>OFFICIAL PORTAL</b><small>Department of Entry and Administrative Affairs</small></div><em>FORM DS-404 • REV. 03/1998</em></div>
   {page<4&&<div className={`session ${!account&&seconds<=60?'urgent':''}`}><b>{account?'✓ APPLICATION SAVED':seconds<=60?'⚠ SESSION EXPIRES':'UNSAVED APPLICATION'} </b><span>{account?'Account verified':seconds<=60?time:'Verify your email to enable saving'}</span></div>}
   <div className="formbody">
    {page===0&&<><p className="crumb">HOME &gt; NON-IMMIGRANT ENTRY &gt; FORM DS-404</p><h1>Electronic Visa Pre-Application</h1><div className="warning"><b>NOTICE:</b> Information is not saved until your email address is verified.</div><h2>Step 1 of 4 — Begin application</h2><p>Enter the email address associated with the applicant.</p>{field('email','E-mail address',{wide:true})}<div className="actions"><button className="continue" onClick={sendVerificationCode}>Send verification code &gt;&gt;</button></div><p className="help">Required information may be found in applications on this computer.</p></>}
    {page===1&&<><p className="crumb">FORM DS-404 &gt; VERIFY APPLICANT</p><h1>Email verification</h1><div className="warning blue">A six-digit access code has been sent. It should arrive in Post shortly.</div><h2>Step 1 of 4 — Verify email</h2>{field('code','Access code',{placeholder:'6 digits'})}<div className="actions"><button onClick={()=>setPage(0)}>Go Back</button><button className="continue" onClick={()=>{if(!otp||data.code!==otp){setErrors({code:'Code not recognized'});return}setAccount(true);proceed(2,['code'])}}>Verify and continue &gt;&gt;</button></div></>}
    {page===2&&<><p className="crumb">FORM DS-404 &gt; APPLICANT DETAILS</p><h1>Applicant information</h1><p className="tiny">Use UPPERCASE English letters. Dates must use format DD MMM YYYY. Do not use punctuation except where required.</p><h2>Step 2 of 4 — Personal details</h2><div className="grid">{field('first','Given name(s)')}{field('last','Family name')}{field('dob','Date of birth *',{placeholder:'DD MMM YYYY',noPaste:true})}{field('phone','Telephone number')}{field('address','Street address',{wide:true})}{field('city','City')}{field('postcode','ZIP / postal code')}</div><div className="actions"><button onClick={()=>setPage(1)}>Go Back</button><button className="continue" onClick={()=>proceed(3,['first','last','dob','phone','address','city','postcode'])}>Save and continue &gt;&gt;</button></div></>}
    {page===3&&<><p className="crumb">FORM DS-404 &gt; DOCUMENT INFORMATION</p><h1>Travel document</h1><div className="warning"><b>Important:</b> Copy and paste is disabled for secure document fields.</div><h2>Step 3 of 4 — Passport and travel</h2><div className="grid">{field('passport','Passport number',{noPaste:true})}{field('maiden',"Mother's maiden name",{noPaste:true})}{field('issued','Date issued',{placeholder:'DD MMM YYYY'})}{field('expires','Date of expiry',{placeholder:'DD MMM YYYY'})}{field('arrival','Intended arrival',{placeholder:'DD MMM YYYY'})}<label className="wide"><span>Applicant photograph</span><div className={selectedPhoto?'upload chosen':'upload'}>{selectedPhoto?'✓ visa-photo.jpg':'No file selected'}<button onClick={()=>setActive('photos')}>Choose from Photos…</button></div></label></div><div className="actions"><button onClick={()=>setPage(2)}>Go Back</button><button className="continue" onClick={()=>{if(!selectedPhoto)return alert('A photograph is required.');submitApplication()}}>SUBMIT APPLICATION &gt;&gt;</button></div></>}
    {page===4&&<div className="success"><div className="stamp">RECEIVED</div><h1>Application transmitted</h1><p>Reference number</p><strong>DS404-8391-XQ</strong><div className="warning blue">Your application will be processed in approximately 8–14 months. This receipt does not constitute a visa.</div><button onClick={()=>{localStorage.removeItem('ds404-saved-application');location.reload()}}>New application</button></div>}
   </div>
   <footer>Accessibility &nbsp;|&nbsp; Privacy &nbsp;|&nbsp; Browser requirements: Internet Explorer 8+</footer>
  </div>
 </section>
}

function Passwords({copy,win,style}:{copy:(s:string)=>void;win:WindowProps;style:React.CSSProperties}){const [tab,setTab]=useState(0);const rows=tab===0?identity:passport;return <section className={`utility window layout-${win.layout}`} style={style} onPointerDown={win.focus}><WindowTitle title="Vault" win={win}/><div className="vaulttop"><span className="key">●</span><div><b>Maya Bennett</b><small>Personal Identity</small></div></div><div className="tabs"><button className={tab===0?'sel':''} onClick={()=>setTab(0)}>Contact card</button><button className={tab===1?'sel':''} onClick={()=>setTab(1)}>Passport</button></div><div className="records">{rows.map(([k,v])=><button key={k} onClick={()=>copy(v)}><span>{k}</span><b>{v}</b><i>⧉</i></button>)}</div><p className="copyhint">Click any row to copy</p></section>}
function Mail({copy,delivered,code,recipient,win,style}:{copy:(s:string)=>void;delivered:boolean;code:string;recipient:string;win:WindowProps;style:React.CSSProperties}){return <section className={`utility window mail layout-${win.layout}`} style={style} onPointerDown={win.focus}><WindowTitle title="Post" win={win}/><div className="mailcols"><aside><b>Inbox {delivered?'1':''}</b><span>Sent</span><span>Archive</span><span>Trash</span></aside>{delivered?<div><div className="messageitem"><b>Visa Services</b><span>Your verification code</span><time>Now</time></div><article><small>From: no-reply@visa-services.gov.example<br/>To: {recipient}</small><h3>Your verification code</h3><p>Use the following code to continue your application:</p><button className="code" onClick={()=>copy(code)}>{code.slice(0,3)} {code.slice(3)} <i>copy</i></button><p>This code expires in 5 minutes. Do not reply to this automatically generated message.</p></article></div>:<div className="empty-inbox"><span>✉</span><b>Inbox is empty</b><p>New messages will appear here.</p></div>}</div></section>}
function Photos({selected,choose,win,style}:{selected:boolean;choose:()=>void;win:WindowProps;style:React.CSSProperties}){const pics=useMemo(()=>['mountains','portrait','cat','beach','receipt','city'],[]);return <section className={`utility window photos layout-${win.layout}`} style={style} onPointerDown={win.focus}><WindowTitle title="Photos" win={win}/><div className="photobody"><aside><b>Library</b><span>Favorites</span><span>Recents</span><span>Documents</span></aside><div><h3>Recent photos</h3><div className="photoGrid">{pics.map((p,i)=><button key={p} className={`${p} ${p==='portrait'&&selected?'picked':''}`} onClick={p==='portrait'?choose:undefined}><div>{p==='portrait'?<><span className="head"/><span className="body"/></>:<span>{['◒','', '●','≈','▤','▥'][i]}</span>}</div><b>{p==='portrait'?'visa-photo.jpg':p+'-'+(401+i)+'.jpg'}</b></button>)}</div><p>Select a passport-style photograph to attach it.</p></div></div></section>}

createRoot(document.getElementById('root')!).render(<App/>);
