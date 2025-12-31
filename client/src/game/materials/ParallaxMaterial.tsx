import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { extend } from "@react-three/fiber";

export const ParallaxMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorA: new THREE.Color("#0a1020"),
    uColorB: new THREE.Color("#1a2b6a"),
    uNoise: 0.25,
    uBands: 4.0,
    uGlow: 0.12,
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uNoise;
  uniform float uBands;
  uniform float uGlow;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }

  void main(){
    float y=vUv.y;
    vec3 grad=mix(uColorA, uColorB, smoothstep(0.0,1.0,y));
    float n=noise(vUv*vec2(6.0,3.0)+vec2(uTime*0.03,uTime*0.01));
    float bands=smoothstep(0.0,1.0,sin((y+n*uNoise)*uBands*3.14159)*0.5+0.5);
    float fog= smoothstep(0.0,1.0,y)*0.25;
    vec3 col=grad*(0.86+bands*0.22) + vec3(uGlow)*(bands*0.35+fog);
    gl_FragColor=vec4(col,1.0);
  }
  `
);

extend({ ParallaxMaterial });
