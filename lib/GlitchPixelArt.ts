/**
 * GlitchPixelArt.ts - Open Source Glitch Avatar Generator
 * License: MIT
 * Style: Hardcore / Synthwave / Internet Bizarre
 */

export interface GlitchOptions {
  size: number;
  glitchLevel: number; // 0 - 10
  mirror: boolean;
}

export class GlitchPixelGenerator {
  private colors = ['#00f3ff', '#ff00ff', '#ffffff', '#2a0845', '#000000'];

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  public generatePixels(seed: string, options: GlitchOptions): string[][] {
    const hash = this.hashString(seed);
    const { size, glitchLevel, mirror } = options;
    const grid: string[][] = [];

    for (let y = 0; y < size; y++) {
      grid[y] = [];
      const half = Math.ceil(size / 2);
      
      for (let x = 0; x < size; x++) {
        // Deterministic noise
        const val = this.hashString(seed + x + y * size);
        const isVisible = (val % 10) > (4 + (glitchLevel / 2));
        
        let colorIndex = (val + hash) % this.colors.length;
        
        // Mirror logic
        if (mirror && x >= half) {
          grid[y][x] = grid[y][size - 1 - x];
        } else {
          grid[y][x] = isVisible ? this.colors[colorIndex] : 'transparent';
        }

        // Glitch injection: random row shifting
        if (glitchLevel > 5 && (hash + y) % 7 === 0) {
           const shift = (hash >> y) % 3;
           if (grid[y][x - shift]) {
             grid[y][x] = grid[y][x - shift];
           }
        }
      }
    }
    return grid;
  }

  public generateDataUrl(grid: string[][], pixelSize: number = 10): string {
    const canvas = document.createElement('canvas');
    const size = grid.length * pixelSize;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    grid.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      });
    });

    return canvas.toDataURL('image/png');
  }
}

export const glitchLib = new GlitchPixelGenerator();
