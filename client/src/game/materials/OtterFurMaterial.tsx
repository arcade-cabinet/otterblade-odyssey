import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { extend } from "@react-three/fiber";

export const OtterFurMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#38bdf8"),
    uRimColor: new THREE.Color("#e0f2fe"),
    uWindDir: new THREE.Vector2(1.0, 0.2),
    uWindStrength: 0.08,
  },
  // Vertex Shader
  `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vFuzz;
  uniform float uTime;
  uniform vec2 uWindDir;
  uniform float uWindStrength;

  float hash(float n){ return fract(sin(n) * 43758.5453); }
  float noise(vec3 x){
    vec3 p=floor(x);
    vec3 f=fract(x);
    f=f*f*(3.0-2.0*f);
    float n=p.x + p.y*57.0 + p.z*113.0;
    return mix(
      mix(mix(hash(n+0.0), hash(n+1.0), f.x),
          mix(hash(n+57.0), hash(n+58.0), f.x), f.y),
      mix(mix(hash(n+113.0), hash(n+114.0), f.x),
          mix(hash(n+170.0), hash(n+171.0), f.x), f.y),
      f.z
    );
  }

  void main(){
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = -normalize(mvPosition.xyz);

    float n1 = noise(position * 7.5 + uTime * 1.4);
    float n2 = noise(position * 12.0 + vec3(uTime * 2.2, uTime * 1.3, uTime * 1.7));
    float fluff = (n1*0.6 + n2*0.4);

    float ripple = sin((position.x*uWindDir.x + position.y*uWindDir.y)*9.0 + uTime*5.0);
    float w = ripple * 0.5 + 0.5;

    float disp = (fluff*0.055 + w*uWindStrength) * 0.85;
    vFuzz = fluff;

    vec3 newPos = position + normal * disp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
  `,
  // Fragment Shader
  `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vFuzz;
  uniform vec3 uColor;
  uniform vec3 uRimColor;

  void main(){
    float rim = 1.0 - max(dot(vViewDir, vNormal), 0.0);
    rim = smoothstep(0.25, 1.0, rim);

    float sheen = smoothstep(0.25, 0.9, vFuzz);
    vec3 base = mix(uColor*0.85, uColor*1.12, sheen*0.35);
    vec3 finalColor = mix(base, uRimColor, rim*0.55);

    gl_FragColor = vec4(finalColor, 1.0);
  }
  `
);

extend({ OtterFurMaterial });
