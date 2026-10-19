/** Self-contained procedural facility audio: no API costs, no copyrighted samples. */
type Cue = "activate"|"portal"|"terminal"|"error"|"success"|"footstep"|"warning"|"final";
let context: AudioContext | null = null;
let ambient: { stop: () => void; update: (x:number,z:number,yaw:number) => void } | null = null;
let disabled = false;

export function setFacilityMuted(value:boolean) { disabled=value; if(value) stopFacilityAmbience(); }
export function isFacilityMuted() { return disabled; }
function audio(): AudioContext | null {
  if (disabled || typeof window === 'undefined') return null;
  try { context ??= new AudioContext(); if(context.state==='suspended') void context.resume().catch(()=>{}); return context; } catch {return null;}
}
function osc(c:AudioContext, frequency:number, duration:number, type:OscillatorType="sine", gain=.12, destination?:AudioNode, shift=0) {
  const o=c.createOscillator(),v=c.createGain(),t=c.currentTime+shift;
  o.type=type;o.frequency.setValueAtTime(frequency,t);
  v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(Math.max(.001,gain),t+.03);
  v.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(v);v.connect(destination??c.destination);o.start(t);o.stop(t+duration+.02);
}
function noise(c:AudioContext,duration:number,gain=.03,low=1500){
  const n=Math.floor(c.sampleRate*duration),buf=c.createBuffer(1,n,c.sampleRate),s=buf.getChannelData(0);
  for(let i=0;i<n;i++)s[i]=(Math.random()*2-1)*.7;
  const src=c.createBufferSource(),f=c.createBiquadFilter(),v=c.createGain();src.buffer=buf;f.type='lowpass';f.frequency.value=low;
  const t=c.currentTime;v.gain.setValueAtTime(.0001,t);v.gain.linearRampToValueAtTime(gain,t+.04);v.gain.exponentialRampToValueAtTime(.0001,t+duration);
  src.connect(f);f.connect(v);v.connect(c.destination);src.start(t);src.stop(t+duration);
}
export function playFacilityCue(cue:Cue) {
  const c=audio();if(!c)return;
  switch(cue){
    case 'activate': {
      const o=c.createOscillator(),v=c.createGain(),f=c.createBiquadFilter(),t=c.currentTime;
      o.type='sawtooth';o.frequency.setValueAtTime(42,t);o.frequency.exponentialRampToValueAtTime(180,t+1.1);o.frequency.exponentialRampToValueAtTime(68,t+2.0);
      f.type='lowpass';f.frequency.setValueAtTime(250,t);f.frequency.exponentialRampToValueAtTime(2600,t+1.1);
      v.gain.setValueAtTime(.0001,t);v.gain.linearRampToValueAtTime(.085,t+.3);v.gain.setTargetAtTime(.0001,t+1.45,.20);
      o.connect(f);f.connect(v);v.connect(c.destination);o.start(t);o.stop(t+2.1);
      [0,.35,.7,1.05].forEach((dt,i)=>osc(c,240+i*65,.38,'triangle',.027,c.destination,dt));noise(c,1.75,.045,950);
      break;
    }
    case 'portal':osc(c,95,.75,'sawtooth',.047);osc(c,260,.50,'sine',.034,c.destination,.12);noise(c,.5,.018,3900);break;
    case 'terminal':osc(c,650,.15,'sine',.036);osc(c,920,.18,'sine',.024,c.destination,.12);break;
    case 'success':osc(c,440,.22,'sine',.05);osc(c,660,.4,'sine',.04,c.destination,.21);osc(c,980,.55,'sine',.028,c.destination,.44);break;
    case 'error':osc(c,178,.24,'square',.028);osc(c,112,.35,'square',.021,c.destination,.20);break;
    case 'warning':osc(c,110,.35,'sawtooth',.04);osc(c,110,.35,'sawtooth',.04,c.destination,.55);break;
    case 'footstep':noise(c,.095,.011,320);osc(c,85,.075,'sine',.014);break;
    case 'final':osc(c,65,3.1,'sawtooth',.065);for(let i=0;i<8;i++)osc(c,220*(1+i*.27),.75,'sine',.024,c.destination,i*.26);noise(c,2.2,.03,5000);break;
  }
}
export function startFacilityAmbience() {
  if(ambient||disabled)return;
  const c=audio();if(!c)return;
  const oscLow=c.createOscillator(),oscHigh=c.createOscillator(),filter=c.createBiquadFilter(),gain=c.createGain();
  oscLow.type='sawtooth';oscHigh.type='sine';oscLow.frequency.value=43;oscHigh.frequency.value=86.5;
  filter.type='lowpass';filter.frequency.value=185;gain.gain.value=.0001;
  const panner=c.createPanner();panner.panningModel='HRTF';panner.distanceModel='inverse';
  panner.refDistance=7;panner.rolloffFactor=.6;panner.maxDistance=65;
  panner.positionX.value=0;panner.positionY.value=5.5;panner.positionZ.value=0;
  oscLow.connect(filter);oscHigh.connect(filter);filter.connect(panner);panner.connect(gain);gain.connect(c.destination);
  // Hostile machinery is spatially tied to ULTRON's distant wing.
  const hostile=c.createOscillator(),hostileFilter=c.createBiquadFilter(),hostileGain=c.createGain(),hostilePanner=c.createPanner();
  hostile.type='sawtooth';hostile.frequency.value=46;hostileFilter.type='lowpass';hostileFilter.frequency.value=180;
  hostilePanner.panningModel='HRTF';hostilePanner.distanceModel='inverse';hostilePanner.refDistance=5;hostilePanner.rolloffFactor=1.7;hostilePanner.maxDistance=50;
  hostilePanner.positionX.value=Math.sin(4*Math.PI/3)*33;hostilePanner.positionY.value=4;hostilePanner.positionZ.value=Math.cos(4*Math.PI/3)*33;
  hostileGain.gain.value=.0001;hostile.connect(hostileFilter);hostileFilter.connect(hostilePanner);hostilePanner.connect(hostileGain);hostileGain.connect(c.destination);hostile.start();
  gain.gain.setTargetAtTime(.026,c.currentTime,.9);oscLow.start();oscHigh.start();
  const lfo=c.createOscillator(),lfog=c.createGain();lfo.frequency.value=.16;lfog.gain.value=13;lfo.connect(lfog);lfog.connect(filter.frequency);lfo.start();
  ambient={
    update:(x,z,yaw)=>{
      if(c.listener.positionX){c.listener.positionX.setTargetAtTime(x,c.currentTime,.06);c.listener.positionY.setTargetAtTime(1.74,c.currentTime,.06);c.listener.positionZ.setTargetAtTime(z,c.currentTime,.06);}
      if(c.listener.forwardX){c.listener.forwardX.setTargetAtTime(Math.sin(yaw),c.currentTime,.06);c.listener.forwardZ.setTargetAtTime(-Math.cos(yaw),c.currentTime,.06);}
      hostileGain.gain.setTargetAtTime(.035,c.currentTime,.35);
    },
    stop:()=>{gain.gain.setTargetAtTime(.0001,c.currentTime,.2);hostileGain.gain.setTargetAtTime(.0001,c.currentTime,.2);window.setTimeout(()=>{try{oscLow.stop();oscHigh.stop();hostile.stop();lfo.stop();}catch{};for(const item of [oscLow,oscHigh,hostile,lfo,filter,gain,lfog,panner,hostileFilter,hostileGain,hostilePanner])item.disconnect();},1250);}
  };
}
export function stopFacilityAmbience(){ambient?.stop();ambient=null;}

/** Update 3D audio listener as the visitor walks through the physical world. */
export function setFacilitySpatialMix(x:number,z:number,yaw:number){ambient?.update(x,z,yaw);}
