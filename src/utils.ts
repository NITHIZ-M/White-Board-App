import { Point, BoardElement, GridType } from './types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Utility for Euclidean distance
export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// Distance from point p to segment vw
function sqr(x: number) {
  return x * x;
}

function dist2(v: Point, w: Point) {
  return sqr(v.x - w.x) + sqr(v.y - w.y);
}

function distToSegmentSquared(p: Point, v: Point, w: Point) {
  const l2 = dist2(v, w);
  if (l2 === 0) return dist2(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y),
  });
}

export function distanceToSegment(p: Point, v: Point, w: Point): number {
  return Math.sqrt(distToSegmentSquared(p, v, w));
}

/**
 * Check if point is inside a rectangle
 */
export function isPointInRect(p: Point, rx: number, ry: number, rw: number, rh: number): boolean {
  const x1 = Math.min(rx, rx + rw);
  const x2 = Math.max(rx, rx + rw);
  const y1 = Math.min(ry, ry + rh);
  const y2 = Math.max(ry, ry + rh);
  return p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2;
}

/**
 * Check if click point matches element within tolerance
 */
export function isPointNearElement(point: Point, element: BoardElement, scale: number): boolean {
  const baseTolerance = 8;
  const tolerance = baseTolerance / scale; // adaptive tolerance depending on zoom level

  switch (element.type) {
    case 'pen':
    case 'highlighter': {
      if (!element.points || element.points.length === 0) return false;
      // Fast bounding box pre-check
      const minX = Math.min(...element.points.map(p => p.x)) - tolerance;
      const maxX = Math.max(...element.points.map(p => p.x)) + tolerance;
      const minY = Math.min(...element.points.map(p => p.y)) - tolerance;
      const maxY = Math.max(...element.points.map(p => p.y)) + tolerance;
      if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) {
        return false;
      }
      // Check segment-by-segment
      for (let i = 0; i < element.points.length - 1; i++) {
        const d = distanceToSegment(point, element.points[i], element.points[i + 1]);
        if (d <= tolerance + element.strokeWidth / 2) return true;
      }
      return false;
    }

    case 'line': {
      const start = { x: element.x, y: element.y };
      const end = { x: element.x + element.width, y: element.y + element.height };
      const d = distanceToSegment(point, start, end);
      return d <= tolerance + element.strokeWidth / 2;
    }

    case 'arrow': {
      const start = { x: element.x, y: element.y };
      const end = { x: element.x + element.width, y: element.y + element.height };
      const d = distanceToSegment(point, start, end);
      return d <= tolerance + element.strokeWidth / 2;
    }

    case 'rectangle': {
      // Check proximity to borders or check inside if filled
      const inRect = isPointInRect(point, element.x, element.y, element.width, element.height);
      if (element.fillColor && element.fillColor !== 'transparent') {
        return inRect;
      }
      // Outlined rect: check near 4 borders
      const borderTolerance = tolerance + element.strokeWidth / 2;
      const left = Math.min(element.x, element.x + element.width);
      const right = Math.max(element.x, element.x + element.width);
      const top = Math.min(element.y, element.y + element.height);
      const bottom = Math.max(element.y, element.y + element.height);

      const nearLeft = Math.abs(point.x - left) <= borderTolerance && point.y >= top && point.y <= bottom;
      const nearRight = Math.abs(point.x - right) <= borderTolerance && point.y >= top && point.y <= bottom;
      const nearTop = Math.abs(point.y - top) <= borderTolerance && point.x >= left && point.x <= right;
      const nearBottom = Math.abs(point.y - bottom) <= borderTolerance && point.x >= left && point.x <= right;

      return nearLeft || nearRight || nearTop || nearBottom;
    }

    case 'ellipse': {
      // Ellipse formula: (x - cx)^2/rx^2 + (y - cy)^2/ry^2 <= 1.05 for selection
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      const rx = Math.abs(element.width / 2);
      const ry = Math.abs(element.height / 2);
      if (rx === 0 || ry === 0) return false;

      const normX = (point.x - cx) / rx;
      const normY = (point.y - cy) / ry;
      const val = normX * normX + normY * normY;

      if (element.fillColor && element.fillColor !== 'transparent') {
        return val <= 1.02; // inside
      } else {
        // Outline check
        const strokeTol = (tolerance + element.strokeWidth / 2) / Math.max(rx, ry);
        return Math.abs(Math.sqrt(val) - 1) <= strokeTol;
      }
    }

    case 'text':
    case 'sticky':
    case 'image': {
      return isPointInRect(point, element.x, element.y, element.width, element.height);
    }

    default:
      return false;
  }
}

/**
 * Draws an elegant vector arrow on canvas
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  strokeWidth: number,
  color: string,
  style: 'solid' | 'dashed' | 'dotted'
) {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;

  if (style === 'dashed') {
    ctx.setLineDash([12, 6]);
  } else if (style === 'dotted') {
    ctx.setLineDash([3, 6]);
  } else {
    ctx.setLineDash([]);
  }

  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrow head
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLength = Math.max(12, strokeWidth * 3); // scaled with line width

  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.setLineDash([]); // Always solid head
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draws canvas backgrounds (Grid pattern or Dots matrix)
 * Handles infinite scrolling offset and scale appropriately
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  scale: number,
  gridType: GridType,
  isDarkMode: boolean
) {
  if (gridType === 'none') return;

  ctx.save();
  // Adjust grid density depending on zoom scale
  const defaultStep = 40;
  let gridStep = defaultStep * scale;

  // Prevent grid line density from becoming too high/low
  while (gridStep < 15) {
    gridStep *= 2;
  }
  while (gridStep > 120) {
    gridStep /= 2;
  }

  const startX = offsetX % gridStep;
  const startY = offsetY % gridStep;

  ctx.lineWidth = 1;
  ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';

  if (gridType === 'lines') {
    ctx.beginPath();
    // Vertical lines
    for (let x = startX; x < width; x += gridStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    // Horizontal lines
    for (let y = startY; y < height; y += gridStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else if (gridType === 'dots') {
    // Render a high-performance dot matrix
    for (let x = startX; x < width; x += gridStep) {
      for (let y = startY; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/**
 * Snaps a coordinate value to nearest grid threshold if flag active
 */
export function snapValue(value: number, snapToGrid: boolean): number {
  if (!snapToGrid) return value;
  const gridStep = 20; // Default logical grid coordinate step
  return Math.round(value / gridStep) * gridStep;
}

/**
 * Compresses and downscales a copied/uploaded picture to prevent severe performance lags and QuotaExceeded errors in localStorage
 */
export function compressImage(dataUrl: string, maxDimension = 900): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width <= maxDimension && height <= maxDimension) {
        // Already within efficient limits
        resolve(dataUrl);
        return;
      }

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const mimeMatch = dataUrl.match(/^data:([^;]+);/);
        const targetMimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        
        if (targetMimeType === 'image/jpeg' || targetMimeType === 'image/jpg') {
          ctx.fillStyle = '#ffffff'; // Fill white for JPEG to avoid black transparent boundaries
          ctx.fillRect(0, 0, width, height);
        } else {
          ctx.clearRect(0, 0, width, height); // Keep alpha channel clear for PNG / WebP
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Compress keeping original MIME type to support transparent files and vector attachments
        resolve(canvas.toDataURL(targetMimeType, targetMimeType === 'image/png' ? undefined : 0.8));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

