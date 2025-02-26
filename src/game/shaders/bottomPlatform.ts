const bottomPlatformFragShader = `
  precision mediump float;

  uniform float time;
  uniform vec2 resolution;

  void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      
      // Create multiple wave layers
      float wave1 = sin(uv.x * 10.0 + time * 2.0) * 0.03;
      float wave2 = sin(uv.x * 20.0 - time * 1.5) * 0.02;
      float wave3 = sin(uv.x * 5.0 + time * 1.0) * 0.01;
      
      // Combine waves and adjust UV
      float waves = wave1 + wave2 + wave3;
      uv.y += waves;

      // Create water color gradient
      vec3 waterColor = mix(
          vec3(0.0, 0.05, 0.5),  // Deeper water color
          vec3(0.2, 0.4, 1.0),   // Surface water color
          uv.y + waves
      );

      // Add highlights
      float highlight = pow(waves + 0.5, 3.0) * 0.3;
      waterColor += vec3(highlight);

      // Create wavy edge by adjusting alpha
      float edgeWidth = 0.5;  // Controls the thickness of the wavy edge
      float edgePosition = 0.9;  // Position of the edge from bottom (0.0) to top (1.0)
      float edge = smoothstep(edgePosition + waves - edgeWidth, edgePosition + waves, uv.y);
      float alpha = 1.0 - edge;

      gl_FragColor = vec4(waterColor, alpha);
  }
`;

export const bottomPlatformShader = new Phaser.Display.BaseShader("bottomPlatformShader", bottomPlatformFragShader, undefined, {
  time: { type: "1f", value: 0.0 },
  resolution: { type: "2f", value: { x: 400.0, y: 20.0 } },
});
