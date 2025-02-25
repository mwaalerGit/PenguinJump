import { GAME_WIDTH, GAME_HEIGHT } from "../utils";

const backgroundFragmentShader = `
  precision mediump float;

  uniform float cameraY;
  uniform float time;
  uniform vec2 resolution;

  // Pseudo-random function
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // 2D noise
  float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      // Four corners in 2D of a tile
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      // Smooth interpolation
      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) +
              (c - a)* u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
  }

  void main() {
      // Normalized coordinates
      vec2 uv = gl_FragCoord.xy/resolution.xy;
      float normalizedY = cameraY / 600.0;

      vec3 topColor = vec3(0.45, 0.5, 1.0);
      vec3 middleColor = vec3(0.3, 0.4, 0.6);
      vec3 bottomColor = vec3(0.1, 0.04, 0.08);
      
      // Add some moving noise
      float noiseScale = 4.0;
      float noiseMorphSpeed = time * 0.25;
      float timeScale = normalizedY * 0.5;
      float noiseIntensity = 0.4 - (1.0 - normalizedY) * 0.2;
      float noiseValue = noise(vec2(uv.x * noiseScale + noiseMorphSpeed, (uv.y + timeScale) * noiseScale + noiseMorphSpeed)) * noiseIntensity;
      
      vec3 color;
      if (normalizedY < 0.5) {
          color = mix(topColor, middleColor, normalizedY * 2.0);
      } else {
          color = mix(middleColor, bottomColor, (normalizedY - 0.5) * 2.0);
      }
      
      // Add noise to the final color
      color += vec3(noiseValue);
      
      gl_FragColor = vec4(color, 1.0);
  }
`;

export const backgroundShader = new Phaser.Display.BaseShader("bg1", backgroundFragmentShader, undefined, {
  cameraY: { type: "1f", value: 0.0 },
  resolution: { type: "2f", value: { x: GAME_WIDTH, y: GAME_HEIGHT } },
  time: { type: "1f", value: 0.0 },
});
