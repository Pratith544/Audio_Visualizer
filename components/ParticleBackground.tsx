'use client';

import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute float a_size;
      attribute vec3 a_color;
      attribute float a_alpha;
      
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      
      varying vec3 v_color;
      varying float v_alpha;
      
      void main() {
        vec2 position = a_position;
        
        // Slow rotation
        float angle = u_time * 0.1;
        float s = sin(angle);
        float c = cos(angle);
        position = vec2(
          position.x * c - position.y * s,
          position.x * s + position.y * c
        );
        
        // Gentle mouse influence
        vec2 mouseInfluence = (u_mouse - u_resolution * 0.5) * 0.0001;
        position += mouseInfluence;
        
        // Convert to clip space
        vec2 clipSpace = ((position / u_resolution) * 2.0) - 1.0;
        clipSpace.y *= -1.0;
        
        gl_Position = vec4(clipSpace, 0, 1);
        gl_PointSize = a_size;
        
        v_color = a_color;
        v_alpha = a_alpha;
      }
    `;

    // Fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec3 v_color;
      varying float v_alpha;
      
      void main() {
        float dist = distance(gl_PointCoord, vec2(0.5));
        float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * v_alpha;
        gl_FragColor = vec4(v_color, alpha);
      }
    `;

    // Compile shader
    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Get attribute/uniform locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const sizeLocation = gl.getAttribLocation(program, 'a_size');
    const colorLocation = gl.getAttribLocation(program, 'a_color');
    const alphaLocation = gl.getAttribLocation(program, 'a_alpha');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');

    // Create particles
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 2);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);

    const colorPalette = [
      [34, 211, 238],   // cyan
      [168, 85, 247],   // purple
      [255, 255, 255],  // white
    ];

    for (let i = 0; i < particleCount; i++) {
      // Random positions
      positions[i * 2] = (Math.random() - 0.5) * canvas.width * 2;
      positions[i * 2 + 1] = (Math.random() - 0.5) * canvas.height * 2;
      
      // Random sizes (2-6px)
      sizes[i] = 2 + Math.random() * 4;
      
      // Random color from palette
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color[0] / 255;
      colors[i * 3 + 1] = color[1] / 255;
      colors[i * 3 + 2] = color[2] / 255;
      
      // Low opacity
      alphas[i] = 0.1 + Math.random() * 0.2;
    }

    // Create buffers
    const positionBuffer = gl.createBuffer();
    const sizeBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();
    const alphaBuffer = gl.createBuffer();

    // Mouse position
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.016; // ~60fps

      // Update particle positions (slow floating)
      for (let i = 0; i < particleCount; i++) {
        positions[i * 2] += Math.sin(time + i) * 0.2;
        positions[i * 2 + 1] += Math.cos(time + i * 0.5) * 0.2;
        
        // Wrap around
        if (Math.abs(positions[i * 2]) > canvas.width) {
          positions[i * 2] = -canvas.width * Math.sign(positions[i * 2]);
        }
        if (Math.abs(positions[i * 2 + 1]) > canvas.height) {
          positions[i * 2 + 1] = -canvas.height * Math.sign(positions[i * 2 + 1]);
        }
      }

      // Clear
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Enable blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Update buffers
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(sizeLocation);
      gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(alphaLocation);
      gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

      // Set uniforms
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(mouseLocation, mouseX, mouseY);

      // Draw
      gl.drawArrays(gl.POINTS, 0, particleCount);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
