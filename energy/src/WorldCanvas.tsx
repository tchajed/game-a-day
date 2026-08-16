import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import type { BuildingType, GameState } from './game'

type Props = { state: GameState; onPad: (i: number) => void; onSelect: (i: number | null) => void }
type Bridge = { state: GameState; onPad: (i: number) => void; onSelect: (i: number | null) => void }
const TW=82,TH=41
const iso=(x:number,y:number,cx:number,oy:number)=>({x:cx+(x-y)*TW/2,y:oy+(x+y)*TH/2})

class GridScene extends Phaser.Scene {
  bridge!: Bridge
  gfx!: Phaser.GameObjects.Graphics
  labels: Phaser.GameObjects.Text[]=[]
  padHits:{x:number;y:number;i:number}[]=[]
  constructor(){super('grid')}
  create(){
    this.gfx=this.add.graphics()
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{let best=this.padHits[0],d=Infinity;for(const hit of this.padHits){const n=Math.hypot(p.x-hit.x,p.y-hit.y);if(n<d){best=hit;d=n}}if(best&&d<48)this.bridge.state.buildMode?this.bridge.onPad(best.i):this.bridge.onSelect(best.i);else this.bridge.onSelect(null)})
    this.draw()
  }
  text(x:number,y:number,value:string,size=10,color='#dffbf5') { const t=this.add.text(x,y,value,{fontFamily:'Chakra Petch, monospace',fontSize:`${size}px`,fontStyle:'bold',color}).setOrigin(.5);this.labels.push(t) }
  diamond(x:number,y:number,color:number,stroke=0x72a9a3){this.gfx.fillStyle(color,1);this.gfx.lineStyle(1,stroke,1);this.gfx.beginPath();this.gfx.moveTo(x,y-TH/2);this.gfx.lineTo(x+TW/2,y);this.gfx.lineTo(x,y+TH/2);this.gfx.lineTo(x-TW/2,y);this.gfx.closePath();this.gfx.fillPath();this.gfx.strokePath()}
  building(type:BuildingType|'hub'|'startwind',x:number,y:number,t:number,fault=false){
    const g=this.gfx
    if(type==='wind'||type==='startwind'){
      g.fillStyle(0xb8d5d5);g.fillRect(x-3,y-54,6,55);g.fillStyle(0xeaf8f2);g.fillCircle(x,y-54,7);g.lineStyle(4,fault?0xff4f64:0xe9f6ed,1)
      for(let i=0;i<3;i++){const a=t*1.8+i*Math.PI*2/3;g.lineBetween(x,y-54,x+Math.cos(a)*29,y-54+Math.sin(a)*29)}
    }else if(type==='solar'){
      g.fillStyle(0x172d43);g.lineStyle(2,0x43e1ed);g.beginPath();g.moveTo(x-28,y-15);g.lineTo(x+12,y-32);g.lineTo(x+31,y-20);g.lineTo(x-10,y-3);g.closePath();g.fillPath();g.strokePath();g.lineStyle(1,0x5a8191);g.lineBetween(x-7,y-7,x+14,y-1)
    }else if(type==='battery'){
      g.fillStyle(0xdcebe4);g.fillRect(x-18,y-35,36,36);g.fillStyle(0x1b5868);g.fillRect(x-11,y-28,22,20);g.fillStyle(0xffe066);g.fillRect(x-7,y-24,14,12)
    }else if(type==='flywheel'){
      g.fillStyle(0xdcebe4);g.fillEllipse(x,y-12,50,32);g.lineStyle(5,0x27d8e5);g.beginPath();g.arc(x,y-12,15,t*5,t*5+Math.PI*1.6);g.strokePath()
    }else{
      g.fillStyle(0xdcebe4);g.beginPath();g.moveTo(x-28,y-5);g.lineTo(x-28,y-38);g.lineTo(x,y-54);g.lineTo(x+29,y-38);g.lineTo(x+29,y-5);g.lineTo(x,y+12);g.closePath();g.fillPath();g.fillStyle(0x173849);g.fillRect(x-16,y-34,32,20);g.fillStyle(0xffe066);g.fillRect(x-11,y-29,22,10);g.lineStyle(2,0x27d8e5);g.strokeRect(x-19,y-37,38,26)
    }
  }
  draw(){
    if(!this.gfx||!this.bridge)return
    const s=this.bridge.state,g=this.gfx,w=this.scale.width,h=this.scale.height,cx=w*.48,oy=Math.max(55,h*.08)
    g.clear();this.labels.forEach(t=>t.destroy());this.labels=[]
    g.fillGradientStyle(s.storm?0x344b62:0x9adbd4,s.storm?0x344b62:0x9adbd4,0x183542,0x183542,1);g.fillRect(0,0,w,h)
    g.fillStyle(0xffffff,.1);for(let i=0;i<12;i++)g.fillCircle((i*191+s.elapsed*4)%w,35+(i%4)*44,32+i%3*18)
    for(let y=0;y<9;y++)for(let x=0;x<10;x++){const p=iso(x,y,cx,oy);this.diamond(p.x,p.y,(x+y)%2?0x487e79:0x4f8982)}
    const left=iso(0,8,cx,oy),bottom=iso(9,8,cx,oy),right=iso(9,0,cx,oy)
    g.fillStyle(0x254e58);g.beginPath();g.moveTo(left.x,left.y);g.lineTo(bottom.x,bottom.y);g.lineTo(bottom.x,bottom.y+23);g.lineTo(left.x,left.y+23);g.closePath();g.fillPath();g.beginPath();g.moveTo(bottom.x,bottom.y);g.lineTo(right.x,right.y);g.lineTo(right.x,right.y+23);g.lineTo(bottom.x,bottom.y+23);g.closePath();g.fillPath()
    const hub=iso(5,4,cx,oy);g.lineStyle(3,0xffe066,.75)
    const sources=[iso(2,2,cx,oy),iso(7,6,cx,oy),...s.pads.filter(p=>p.building).map(p=>iso(p.x,p.y,cx,oy))]
    sources.forEach((p,i)=>{const pulse=(s.elapsed*60+i*22)%60;g.lineBetween(p.x,p.y,hub.x,hub.y);g.fillStyle(0xffffaa);g.fillCircle(Phaser.Math.Linear(p.x,hub.x,pulse/60),Phaser.Math.Linear(p.y,hub.y,pulse/60),3)})
    this.padHits=s.pads.map((pad,i)=>{const p=iso(pad.x,pad.y,cx,oy);if(!pad.building){this.diamond(p.x,p.y,0x173b46,s.buildMode?0xffe066:0x69b9bd);this.text(p.x,p.y+1,s.buildMode?'DEPLOY':'BUILD PAD',11,s.buildMode?'#ffe066':'#9bc7c5')}else this.building(pad.building,p.x,p.y,s.elapsed,s.windFault&&pad.building==='wind');if(s.selected===i){g.lineStyle(2,0x27d8e5);g.strokeRect(p.x-35,p.y-55,70,70)}return{x:p.x,y:p.y,i}})
    const wind=iso(2,2,cx,oy),battery=iso(7,6,cx,oy);this.building('startwind',wind.x,wind.y,s.elapsed,s.windFault);this.building('battery',battery.x,battery.y,s.elapsed);this.building('hub',hub.x,hub.y,s.elapsed);this.text(hub.x,hub.y+32,'GRID INTERTIE')
    if(s.windFault)this.text(wind.x,wind.y-89,'! YAW DRIFT',12,'#ff4f64')
  }
}

export default function WorldCanvas(props:Props){
  const host=useRef<HTMLDivElement>(null),game=useRef<Phaser.Game|null>(null),scene=useRef<GridScene|null>(null),bridge=useRef<Bridge>(props);bridge.current={...props}
  useEffect(()=>{
    const currentScene=new GridScene();currentScene.bridge=bridge.current;scene.current=currentScene
    game.current=new Phaser.Game({type:Phaser.AUTO,parent:host.current!,backgroundColor:'#183542',transparent:false,scene:currentScene,scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},render:{antialias:true,pixelArt:false}})
    return()=>{game.current?.destroy(true);game.current=null}
  },[])
  useEffect(()=>{if(scene.current){scene.current.bridge=bridge.current;if(scene.current.gfx)scene.current.draw()}},[props.state,props.onPad,props.onSelect])
  return <div ref={host} className="phaser-world" data-testid="game-canvas"/>
}
