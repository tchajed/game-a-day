import Phaser from 'phaser';
import { carShapeAt, CONE_LOCAL_SHAPE, shapesIntersect, transformShape, type CompoundShape } from './carCollision';

type Held = { left:boolean; right:boolean; gas:boolean; brake:boolean };
type Level = { name:string; subtitle:string; player:{x:number;y:number;a:number}; bay:Phaser.Geom.Rectangle; parked:{x:number;y:number;color:number}[]; cones?:{x:number;y:number}[] };

const W=960,H=600, ROAD_TOP=0, ROAD_BOTTOM=600;
const PIXELS_PER_MPH=6, MAX_DRIVE_SPEED=12*PIXELS_PER_MPH, MAX_REVERSE_SPEED=5*PIXELS_PER_MPH;
const NORTH=-Math.PI/2;
const levels:Level[]=[
  {name:'THE CLASSIC',subtitle:'',player:{x:510,y:520,a:NORTH},bay:new Phaser.Geom.Rectangle(168,198,84,206),parked:[{x:210,y:108,color:0x3a6f7d},{x:210,y:496,color:0xd96745}]},
  {name:'TIGHT FIT',subtitle:'',player:{x:520,y:520,a:NORTH},bay:new Phaser.Geom.Rectangle(168,211,84,174),parked:[{x:210,y:124,color:0x566b45},{x:210,y:472,color:0xd6a53d}]},
  {name:'CONE ALLEY',subtitle:'',player:{x:520,y:520,a:NORTH},bay:new Phaser.Geom.Rectangle(168,206,84,184),parked:[{x:210,y:114,color:0x735479},{x:210,y:482,color:0x346b82}],cones:[{x:278,y:206},{x:278,y:390},{x:142,y:206},{x:142,y:390}]}
];

class ParkingScene extends Phaser.Scene {
  level=0; car!:Phaser.GameObjects.Container; body!:Phaser.GameObjects.Graphics; wheels:Phaser.GameObjects.Rectangle[]=[];
  x=0;y=0;a=0;speed=0;gear:1|-1=1;controlMode:'drive'|'tank'='drive';held:Held={left:false,right:false,gas:false,brake:false}; injected:Partial<Held>={};
  keys!:Record<string,Phaser.Input.Keyboard.Key>; obstacles:CompoundShape[]=[]; bay!:Phaser.Geom.Rectangle;
  speedText!:Phaser.GameObjects.Text; gearText!:Phaser.GameObjects.Text; levelText!:Phaser.GameObjects.Text; statusText!:Phaser.GameObjects.Text;
  parkingTime=0; completed=false; bumps=0; startTime=0; lastGear=false;
  constructor(){super('parking')}
  create(){
    this.cameras.main.setBackgroundColor('#1b292c');
    this.drawWorld();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,R,SPACE,N') as Record<string,Phaser.Input.Keyboard.Key>;
    this.createHud(); this.bindTouch(); this.loadLevel(0);
    (window as any).parkingGame={
      getState:()=>({level:this.level,x:this.x,y:this.y,angle:this.a,speed:this.speed,gear:this.gear,controlMode:this.controlMode,completed:this.completed,bumps:this.bumps,bay:{x:this.bay.x,y:this.bay.y,width:this.bay.width,height:this.bay.height}}),
      setInput:(v:Partial<Held>)=>{this.injected=v}, toggleGear:()=>this.toggleGear(),setControlMode:(mode:'drive'|'tank')=>{this.controlMode=mode},
      setPose:(x:number,y:number,angle=0)=>{this.x=x;this.y=y;this.a=angle;this.speed=0},
      reset:()=>this.loadLevel(this.level), next:()=>this.loadLevel((this.level+1)%levels.length)
    };
  }
  drawWorld(){
    const g=this.add.graphics();
    // A portrait-oriented street: the player drives north, from bottom to top.
    g.fillStyle(0x768d5b).fillRect(0,0,118,H);
    for(let y=22;y<H;y+=72){g.fillStyle(0x8ca568,.35).fillCircle(55+(y%3)*8,y,18)}
    g.fillStyle(0xddd5bd).fillRect(118,0,8,H);g.fillStyle(0xb8b29f).fillRect(126,0,28,H);
    g.fillStyle(0x303b3c).fillRect(154,0,672,H);
    g.fillStyle(0xffffff,.025);for(let i=0;i<160;i++)g.fillCircle(154+((i*83)%670),(i*47)%H,1+(i%2));
    g.fillStyle(0xe8dfc5,.38);for(let y=-20;y<H;y+=92)g.fillRoundedRect(586,y,3,54,2);
    g.fillStyle(0xd7d0bd).fillRect(826,0,8,H);g.fillStyle(0x243a3c).fillRect(834,0,126,H);
    for(let y=20;y<H;y+=108){g.fillStyle(y%216?0x315154:0x29464a).fillRoundedRect(852,y,90,76,4);g.fillStyle(0xe7bb63,.35).fillRect(864,y+14,18,13).fillRect(910,y+14,18,13)}
  }
  createHud(){
    const mono={fontFamily:'Courier New, monospace',color:'#f5f0e5'};
    this.levelText=this.add.text(34,40,'',{fontFamily:'Arial, sans-serif',fontSize:'22px',fontStyle:'bold',color:'#fff'}).setDepth(20);
    this.statusText=this.add.text(W/2,558,'',{...mono,fontSize:'14px'}).setOrigin(.5).setDepth(20);
    const panel=this.add.graphics().setDepth(19);panel.fillStyle(0x172226,.88).fillRoundedRect(764,30,164,70,12);panel.lineStyle(1,0xffffff,.12).strokeRoundedRect(764,30,164,70,12);
    this.gearText=this.add.text(784,45,'D',{...mono,fontSize:'32px',fontStyle:'bold',color:'#f2b84b'}).setDepth(20);
    this.speedText=this.add.text(840,49,'00',{...mono,fontSize:'24px'}).setDepth(20);
    this.add.text(840,76,'MPH',{...mono,fontSize:'9px',color:'#aeb8b5'}).setDepth(20);
  }
  bindTouch(){
    document.querySelectorAll<HTMLButtonElement>('.touchbtn').forEach(btn=>{
      const k=btn.dataset.key!;
      const set=(on:boolean)=>{btn.classList.toggle('active',on);if(k==='gear'&&on)this.toggleGear();else if(k!=='gear')(this.held as any)[k]=on};
      btn.addEventListener('pointerdown',e=>{e.preventDefault();set(true)});['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,()=>set(false)));
    });
  }
  loadLevel(i:number){
    this.level=i; const L=levels[i]; this.completed=false;this.bumps=0;this.parkingTime=0;this.speed=0;this.gear=1;this.startTime=this.time.now;
    this.x=L.player.x;this.y=L.player.y;this.a=L.player.a;this.bay=L.bay;
    this.car?.destroy();this.children.list.filter(o=>o.getData('level')).forEach(o=>o.destroy());this.obstacles=[];
    const pg=this.add.graphics().setData('level',true).setDepth(2);
    pg.fillStyle(0x4fb87c,.13).fillRoundedRect(L.bay.x,L.bay.y,L.bay.width,L.bay.height,8);
    pg.lineStyle(3,0x76d69c,.82);pg.strokeRoundedRect(L.bay.x,L.bay.y,L.bay.width,L.bay.height,8);
    pg.lineStyle(2,0xffffff,.42);pg.lineBetween(L.bay.x,L.bay.y,L.bay.x+16,L.bay.y);pg.lineBetween(L.bay.right-16,L.bay.y,L.bay.right,L.bay.y);
    L.parked.forEach(p=>{this.makeCar(p.x,p.y,p.color,false).setRotation(NORTH).setData('level',true);this.obstacles.push(carShapeAt({x:p.x,y:p.y,angle:NORTH}))});
    L.cones?.forEach(c=>{this.makeCone(c.x,c.y).setData('level',true);this.obstacles.push(transformShape(CONE_LOCAL_SHAPE,{x:c.x,y:c.y,angle:0}))});
    this.car=this.makeCar(this.x,this.y,0xf0ede4,true);this.car.setRotation(this.a);this.levelText.setText(`${String(i+1).padStart(2,'0')}  ${L.name}`);
    this.statusText.setText('');
  }
  makeCone(x:number,y:number){const c=this.add.container(x,y).setDepth(8);const sh=this.add.ellipse(2,7,20,8,0x000000,.25);const tri=this.add.triangle(0,0,0,12,8,-10,16,12,0xf07943);const stripe=this.add.rectangle(0,3,12,4,0xf5e7c8);c.add([sh,tri, stripe]);return c}
  makeCar(x:number,y:number,color:number,player:boolean){
    const c=this.add.container(x,y).setDepth(player?10:7);
    const shadow=this.add.graphics();shadow.fillStyle(0x000000,.28).fillRoundedRect(-74,-30,154,66,20);
    const g=this.add.graphics();g.fillStyle(0x161b1c).fillRoundedRect(-73,-35,146,70,19);g.fillStyle(color).fillRoundedRect(-69,-32,138,64,17);
    // bumpers, lights, body highlights
    g.fillStyle(0xd8dad5).fillRoundedRect(-72,-22,5,44,2).fillRoundedRect(67,-22,5,44,2);
    g.fillStyle(0xffe89e).fillRoundedRect(61,-24,8,13,3).fillRoundedRect(61,11,8,13,3);g.fillStyle(0xd94e3e).fillRoundedRect(-69,-24,7,13,3).fillRoundedRect(-69,11,7,13,3);
    g.fillStyle(0x21333a).fillRoundedRect(-35,-27,74,54,13);g.fillStyle(0x85a3aa,.72).fillRoundedRect(-30,-24,27,48,8).fillRoundedRect(8,-24,26,48,8);
    g.fillStyle(0xffffff,.22).fillRoundedRect(-22,-21,8,40,4).fillRoundedRect(15,-21,6,40,4);g.lineStyle(1,0xffffff,.28).strokeRoundedRect(-69,-32,138,64,17);
    const wheelPositions=[[-43,-35],[-43,35],[43,-35],[43,35]];const ws:Phaser.GameObjects.Rectangle[]=[];
    wheelPositions.forEach(([wx,wy])=>{const w=this.add.rectangle(wx,wy,24,8,0x0c1011).setAngle(0);ws.push(w);c.add(w)});
    c.addAt(shadow,0);c.add(g); if(player)this.wheels=ws; return c;
  }
  toggleGear(){
    if(this.controlMode!=='drive')return;
    this.gear=this.gear===1?-1:1;
    if(Math.abs(this.speed)<8)this.speed=0;
  }
  update(_:number,dtMs:number){
    if(!this.car)return;const dt=Math.min(dtMs/1000,.035);
    if(Phaser.Input.Keyboard.JustDown(this.keys.R))this.toggleGear();
    if(Phaser.Input.Keyboard.JustDown(this.keys.N)){this.loadLevel((this.level+1)%levels.length);return}
    const left=this.held.left||this.keys.A.isDown||this.keys.LEFT.isDown||!!this.injected.left;
    const right=this.held.right||this.keys.D.isDown||this.keys.RIGHT.isDown||!!this.injected.right;
    const gas=this.held.gas||this.keys.W.isDown||this.keys.UP.isDown||!!this.injected.gas;
    const brake=this.held.brake||this.keys.S.isDown||this.keys.DOWN.isDown||this.keys.SPACE.isDown||!!this.injected.brake;
    if(this.controlMode==='tank'){
      const direction=(gas?1:0)-(brake?1:0);
      if(direction){
        // Brake through zero when changing direction, rather than approaching zero forever.
        this.speed+=direction*(this.speed&&Math.sign(this.speed)!==direction?60:36)*dt;
        this.gear=direction<0?-1:1;
      }else this.speed*=Math.pow(.975,dt*60);
    }else{
      if(gas)this.speed+=this.gear*36*dt; else this.speed*=Math.pow(.985,dt*60);
      if(brake){const decel=60*dt;if(Math.abs(this.speed)<=decel)this.speed=0;else this.speed-=Math.sign(this.speed)*decel}
    }
    this.speed=Phaser.Math.Clamp(this.speed,-MAX_REVERSE_SPEED,MAX_DRIVE_SPEED);
    const steer=(right?1:0)-(left?1:0);const steerPower=Phaser.Math.Clamp(Math.abs(this.speed)/15,0,1)*1.28;
    const oldX=this.x,oldY=this.y,oldA=this.a;
    if(steer&&Math.abs(this.speed)>.25)this.a+=steer*steerPower*Math.sign(this.speed)*dt;
    this.wheels.forEach(w=>w.setAngle(steer*22));
    this.x+=Math.cos(this.a)*this.speed*dt;this.y+=Math.sin(this.a)*this.speed*dt;
    this.x=Phaser.Math.Clamp(this.x,190,790);this.y=Phaser.Math.Clamp(this.y,60,H-60);
    if(this.collides()){this.x=oldX;this.y=oldY;this.a=oldA;this.speed*=-.18;this.bumps++;playCrash();this.cameras.main.shake(100,.004);this.statusText.setText('BUMP').setColor('#f39a76');this.time.delayedCall(500,()=>!this.completed&&this.statusText.setText(''))}
    this.car.setPosition(this.x,this.y).setRotation(this.a);
    const mph=Math.round(Math.abs(this.speed)/PIXELS_PER_MPH);this.speedText.setText(String(mph).padStart(2,'0'));this.gearText.setText(this.gear===1?'D':'R');
    this.checkParking(dt);
  }
  collides(){
    const playerShape=carShapeAt({x:this.x,y:this.y,angle:this.a});
    return this.obstacles.some(obstacle=>shapesIntersect(playerShape,obstacle));
  }
  checkParking(dt:number){
    if(this.completed)return;const marginX=27,marginY=58;const inBay=this.x-marginX>this.bay.x&&this.x+marginX<this.bay.right&&this.y-marginY>this.bay.y&&this.y+marginY<this.bay.bottom;
    const angle=Math.abs(Phaser.Math.Angle.Wrap(this.a-NORTH));const aligned=Math.min(angle,Math.abs(Math.PI-angle))<.16;
    if(inBay&&aligned&&Math.abs(this.speed)<2){this.parkingTime+=dt;if(this.parkingTime>1.15)this.win()}else{this.parkingTime=Math.max(0,this.parkingTime-dt*2)}
  }
  win(){
    this.completed=true;this.speed=0;const secs=((this.time.now-this.startTime)/1000).toFixed(1);this.statusText.setText(`PERFECT FIT  •  ${secs}s  •  ${this.bumps===0?'CLEAN RUN':`${this.bumps} BUMP${this.bumps>1?'S':''}`}  —  N FOR NEXT`).setColor('#f2b84b');
    const ring=this.add.graphics().setDepth(15).setData('level',true);ring.lineStyle(4,0xf2b84b,.8).strokeCircle(this.x,this.y,80);this.tweens.add({targets:ring,alpha:0,scale:1.8,duration:900,ease:'Cubic.easeOut'});
  }
}

const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:W,height:H,backgroundColor:'#182528',scene:ParkingScene,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true}});

// Procedural audio: an anxious pulse plus a speed-reactive engine and reverse alarm.
let audio:AudioContext|null=null,musicTimer=0,engineTimer=0,musicOn=!new URLSearchParams(location.search).has('mute');
let engineOsc:OscillatorNode|null=null,engineOsc2:OscillatorNode|null=null,engineGain:GainNode|null=null,engineFilter:BiquadFilterNode|null=null,step=0,accentBeats=0,lastBeep=0;
const musicBtn=document.querySelector<HTMLButtonElement>('#music')!;
function blip(freq:number,duration:number,gain:number,type:OscillatorType='square',delay=0){
  if(!audio)return;const now=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(gain,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(audio.destination);o.start(now);o.stop(now+duration);
}
function reverseHonk(){
  if(!audio)return;const now=audio.currentTime,filter=audio.createBiquadFilter(),g=audio.createGain();filter.type='bandpass';filter.frequency.value=1160;filter.Q.value=3.8;g.gain.setValueAtTime(.0001,now);g.gain.linearRampToValueAtTime(.055,now+.018);g.gain.setValueAtTime(.055,now+.095);g.gain.exponentialRampToValueAtTime(.0001,now+.16);filter.connect(g).connect(audio.destination);
  [1080,1240].forEach((frequency,i)=>{const o=audio!.createOscillator();o.type=i?'triangle':'sawtooth';o.frequency.value=frequency;o.connect(filter);o.start(now);o.stop(now+.17)});
}
function musicStep(){
  if(!audio||!musicOn)return;const notes=[110,130.81,155.56,130.81,116.54,155.56,174.61,146.83];blip(notes[step++%notes.length],.19,.018,'triangle');
  if(step%2===0){blip(55,.16,.045,'sine');blip(880,.035,.006,'square')}
  // Reuse the old reverse tone for four beats, locked to the music clock.
  if(step%12===7)accentBeats=4;
  if(accentBeats>0){blip(740,.09,.024,'sine');accentBeats--}
}
function initAudio(){
  if(audio){audio.resume();return}audio=new AudioContext();engineOsc=audio.createOscillator();engineOsc2=audio.createOscillator();engineGain=audio.createGain();engineFilter=audio.createBiquadFilter();
  engineOsc.type='triangle';engineOsc2.type='sine';engineOsc.frequency.value=32;engineOsc2.frequency.value=48;engineOsc2.detune.value=-9;engineFilter.type='lowpass';engineFilter.frequency.value=150;engineFilter.Q.value=1.4;engineGain.gain.value=.018;
  engineOsc.connect(engineFilter);engineOsc2.connect(engineFilter);engineFilter.connect(engineGain).connect(audio.destination);engineOsc.start();engineOsc2.start();
  engineTimer=window.setInterval(()=>{const s=(window as any).parkingGame?.getState?.();if(!s||!audio||!engineOsc||!engineOsc2||!engineGain||!engineFilter)return;const v=Math.abs(s.speed),now=audio.currentTime;engineOsc.frequency.setTargetAtTime(31+v*.8,now,.08);engineOsc2.frequency.setTargetAtTime(46+v*1.15,now,.08);engineFilter.frequency.setTargetAtTime(135+v*2.1,now,.1);engineGain.gain.setTargetAtTime((.016+Math.min(v/4000,.018))*(.86+Math.random()*.18),now,.04);if(s.gear===-1&&v>1&&now-lastBeep>.68){lastBeep=now;reverseHonk()}},80);
  updateMusic();
}
function updateMusic(){musicBtn.textContent=musicOn?'♫':'♩';musicBtn.style.opacity=musicOn?'1':'.55';clearInterval(musicTimer);if(musicOn&&audio){musicStep();musicTimer=window.setInterval(musicStep,240)}}
function playCrash(){if(!audio)return;const length=Math.floor(audio.sampleRate*.18),buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const src=audio.createBufferSource(),g=audio.createGain();g.gain.value=.18;src.buffer=buffer;src.connect(g).connect(audio.destination);src.start()}
musicBtn.addEventListener('click',()=>{initAudio();musicOn=!musicOn;updateMusic()});
const unlock=()=>initAudio();window.addEventListener('pointerdown',unlock,{once:true});window.addEventListener('keydown',unlock,{once:true});updateMusic();

const help=document.querySelector<HTMLDivElement>('#help-panel')!,helpBtn=document.querySelector<HTMLButtonElement>('#help')!;
helpBtn.addEventListener('click',()=>help.classList.add('open'));help.querySelector('.close')!.addEventListener('click',()=>help.classList.remove('open'));help.addEventListener('click',e=>{if(e.target===help)help.classList.remove('open')});
help.querySelectorAll<HTMLButtonElement>('.mode').forEach(button=>button.addEventListener('click',()=>{
  const mode=button.dataset.mode as 'drive'|'tank';(window as any).parkingGame.setControlMode(mode);help.querySelectorAll('.mode').forEach(b=>b.classList.toggle('active',b===button));
  (document.querySelector('#drive-controls') as HTMLElement).hidden=mode!=='drive';(document.querySelector('#tank-controls') as HTMLElement).hidden=mode!=='tank';
  document.querySelector<HTMLButtonElement>('[data-key="gas"]')!.textContent=mode==='tank'?'UP':'GAS';document.querySelector<HTMLButtonElement>('[data-key="brake"]')!.textContent=mode==='tank'?'DOWN':'BRAKE';
}));
void game;void engineTimer;
