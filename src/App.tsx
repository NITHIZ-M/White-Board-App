import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HelpCircle,
  Menu,
  ChevronRight,
  Sun,
  Moon,
  Undo2,
  Redo2,
  Trash2,
  Image,
  Codepen,
  ZoomIn,
  ZoomOut,
  Sliders,
  Sparkles,
  Copy,
  Hand,
} from 'lucide-react';
import { NotePage, BoardElement, Tool, GridType, StrokeStyle, Point } from './types';
import {
  generateId,
  getDistance,
  isPointNearElement,
  isPointInRect,
  drawGrid,
  drawArrow,
  snapValue,
  compressImage,
} from './utils';
import Toolbar from './components/Toolbar';
import PageList from './components/PageList';
import ShortcutsModal from './components/ShortcutsModal';

const SAVE_KEY = 'ace_board_app_v1_pages';
const THEME_KEY = 'ace_board_theme';

const makeWelcomeElements = (): BoardElement[] => {
  return [
    {
      id: 'welcome-title',
      type: 'text',
      x: 100,
      y: 80,
      width: 550,
      height: 60,
      color: '#ec4899',
      strokeWidth: 2,
      strokeStyle: 'solid',
      opacity: 1,
      text: 'ACE Board',
      fontSize: 36,
      createdAt: Date.now(),
    },
    {
      id: 'welcome-subtitle',
      type: 'text',
      x: 105,
      y: 145,
      width: 500,
      height: 40,
      color: '#64748b',
      strokeWidth: 1,
      strokeStyle: 'solid',
      opacity: 1,
      text: 'Supercharged infinite zoom & pan vector sketchboard.',
      fontSize: 16,
      createdAt: Date.now(),
    },
    {
      id: 'welcome-rect-1',
      type: 'rectangle',
      x: 100,
      y: 220,
      width: 220,
      height: 140,
      color: '#9b30ff',
      fillColor: 'rgba(155, 48, 255, 0.08)',
      strokeWidth: 5,
      strokeStyle: 'dashed',
      opacity: 1,
      createdAt: Date.now(),
    },
    {
      id: 'welcome-ellipse-1',
      type: 'ellipse',
      x: 420,
      y: 220,
      width: 140,
      height: 140,
      color: '#3b82f6',
      fillColor: 'rgba(59, 130, 246, 0.08)',
      strokeWidth: 5,
      strokeStyle: 'dotted',
      opacity: 1,
      createdAt: Date.now(),
    },
    {
      id: 'welcome-arrow-1',
      type: 'arrow',
      x: 340,
      y: 290,
      width: 60,
      height: 0,
      color: '#f27a1a',
      strokeWidth: 5,
      strokeStyle: 'solid',
      opacity: 1,
      createdAt: Date.now(),
    },
    {
      id: 'welcome-sticky-1',
      type: 'sticky',
      x: 630,
      y: 130,
      width: 200,
      height: 200,
      color: '#f1f5f9',
      fillColor: 'rgba(242, 122, 26, 0.14)',
      strokeWidth: 1,
      strokeStyle: 'solid',
      opacity: 1,
      text: 'PRO TIPS:\n\n• Hold Space + Drag to pan across canvas\n• Pinch or scroll mousewheel to zoom infinitely\n• Turn on "SNAP" for crisp alignment',
      fontSize: 14,
      createdAt: Date.now(),
    },
    {
      id: 'welcome-pen-1',
      type: 'pen',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      color: '#10b981',
      strokeWidth: 6,
      strokeStyle: 'solid',
      opacity: 1,
      points: [
        { x: 100, y: 440 },
        { x: 120, y: 455 },
        { x: 151, y: 462 },
        { x: 185, y: 458 },
        { x: 210, y: 440 },
        { x: 225, y: 415 },
        { x: 250, y: 425 },
        { x: 282, y: 448 },
        { x: 310, y: 460 },
      ],
      createdAt: Date.now(),
    },
    {
      id: 'welcome-text-pen',
      type: 'text',
      x: 100,
      y: 490,
      width: 320,
      height: 30,
      color: '#10b981',
      strokeWidth: 1,
      strokeStyle: 'solid',
      opacity: 1,
      text: 'Smooth Freehand Pen Sketching',
      fontSize: 14,
      createdAt: Date.now(),
    },
  ];
};

const DEFAULT_PAGES: NotePage[] = [
  {
    id: 'default-onboarding',
    title: 'Welcome Board',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: makeWelcomeElements(),
    offsetX: 50,
    offsetY: 30,
    scale: 0.95,
    gridType: 'lines',
  },
  {
    id: 'empty-notes-ideas',
    title: 'Quick Brainstorm',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: [],
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    gridType: 'dots',
  },
];

export default function App() {
  // PAGES AND THEME STATE
  const [pages, setPages] = useState<NotePage[]>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_PAGES;
    } catch {
      return DEFAULT_PAGES;
    }
  });

  const [activePageId, setActivePageId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      }
    } catch {
      // fallback
    }
    return 'default-onboarding';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem(THEME_KEY);
      return s ? s === 'dark' : false;
    } catch {
      return false;
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && window.innerWidth > 768;
    } catch {
      return true;
    }
  });
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // CURRENT WHITEBOARD PREFS
  const [currentTool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#e23838'); // ACE Board default color
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>('solid');
  const [fontSize, setFontSize] = useState(24);
  const [gridType, setGridType] = useState<GridType>('lines');
  const [snapToGrid, setSnapToGrid] = useState(false);

  const activePage = pages.find(p => p.id === activePageId) || pages[0];

  // VIEWPORT PAN / ZOOM STATE WITH SYNCHRONIZED REF FOR STALE-FREE READS
  const [offsetX, setOffsetXState] = useState(activePage?.offsetX ?? 0);
  const [offsetY, setOffsetYState] = useState(activePage?.offsetY ?? 0);
  const [scale, setScaleState] = useState(activePage?.scale ?? 1.0);

  const viewportRef = useRef({
    offsetX: activePage?.offsetX ?? 0,
    offsetY: activePage?.offsetY ?? 0,
    scale: activePage?.scale ?? 1.0,
  });

  const setOffsetX = (val: number | ((prev: number) => number)) => {
    if (typeof val === 'function') {
      setOffsetXState(prev => {
        const next = val(prev);
        viewportRef.current.offsetX = next;
        return next;
      });
    } else {
      viewportRef.current.offsetX = val;
      setOffsetXState(val);
    }
  };

  const setOffsetY = (val: number | ((prev: number) => number)) => {
    if (typeof val === 'function') {
      setOffsetYState(prev => {
        const next = val(prev);
        viewportRef.current.offsetY = next;
        return next;
      });
    } else {
      viewportRef.current.offsetY = val;
      setOffsetYState(val);
    }
  };

  const setScale = (val: number | ((prev: number) => number)) => {
    if (typeof val === 'function') {
      setScaleState(prev => {
        const next = val(prev);
        viewportRef.current.scale = next;
        return next;
      });
    } else {
      viewportRef.current.scale = val;
      setScaleState(val);
    }
  };

  // MULTI-TOUCH GESTURE STATE REFS
  const activePointersRef = useRef<PointerEvent[]>([]);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1.0);
  const pinchStartOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const pinchStartMidRef = useRef<Point>({ x: 0, y: 0 });

  // SELECTION & INTERACTION STATE
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 }); // World coordinate start
  const [lastScreenPoint, setLastScreenPoint] = useState<Point>({ x: 0, y: 0 }); // Screen position
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]); // Temp points for brush drawing
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 }); // Anchor difference
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'se' | 'sw' | null>(null);
  const [marqueeSelect, setMarqueeSelect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // UNDO & REDO STACKS per whiteboard
  const [history, setHistory] = useState<{ [pageId: string]: { past: BoardElement[][]; future: BoardElement[][] } }>({});

  // TEXT EDITING ON-SCREEN INPUT
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextVal, setEditingTextVal] = useState('');
  const [editingTextPos, setEditingTextPos] = useState<Point>({ x: 0, y: 0 });

  // DOM REFS
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spacePressed = useRef(false);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const getCanvasCursor = () => {
    if (spacePressed.current) return isDrawing ? 'grabbing' : 'grab';
    if (currentTool === 'pan') return isDrawing ? 'grabbing' : 'grab';
    if (currentTool === 'select') return 'default';
    if (currentTool === 'text' || currentTool === 'sticky') return 'text';
    if (currentTool === 'eraser') return 'default';
    return 'crosshair';
  };

  // SYNC VIEWPORT BACK TO NOTES STATE
  const syncViewportToActivePage = useCallback(() => {
    const { offsetX: ox, offsetY: oy, scale: s } = viewportRef.current;
    setPages(prev =>
      prev.map(p => {
        if (p.id === activePageId) {
          return { ...p, offsetX: ox, offsetY: oy, scale: s, updatedAt: Date.now() };
        }
        return p;
      })
    );
  }, [activePageId]);

  const debounceSyncRef = useRef<NodeJS.Timeout | null>(null);
  const debounceSyncViewport = useCallback(() => {
    if (debounceSyncRef.current) {
      clearTimeout(debounceSyncRef.current);
    }
    debounceSyncRef.current = setTimeout(() => {
      syncViewportToActivePage();
    }, 500);
  }, [syncViewportToActivePage]);

  // Keep compatibility wrapper for old callers
  const updateActivePageViewport = (ox: number, oy: number, currentScale: number) => {
    viewportRef.current = { offsetX: ox, offsetY: oy, scale: currentScale };
    syncViewportToActivePage();
  };

  // HAND GRIPPER NAVIGATIONAL JOYSTICK STATE MACHINE
  const [joyPos, setJoyPos] = useState({ x: 0, y: 0 });
  const [isGripping, setIsGripping] = useState(false);
  const gripStartRef = useRef({ x: 0, y: 0 });
  const viewOffsetStartRef = useRef({ x: 0, y: 0 });

  const handleJoystickDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGripping(true);
    gripStartRef.current = { x: e.clientX, y: e.clientY };
    viewOffsetStartRef.current = { x: offsetX, y: offsetY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleJoystickMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isGripping) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - gripStartRef.current.x;
    const dy = e.clientY - gripStartRef.current.y;

    const distance = Math.hypot(dx, dy);
    const maxRadius = 18;
    let visualX = dx;
    let visualY = dy;
    if (distance > maxRadius) {
      visualX = (dx / distance) * maxRadius;
      visualY = (dy / distance) * maxRadius;
    }
    setJoyPos({ x: visualX, y: visualY });

    const sensitivity = 3.5;
    const targetOx = viewOffsetStartRef.current.x + dx * sensitivity;
    const targetOy = viewOffsetStartRef.current.y + dy * sensitivity;

    setOffsetX(targetOx);
    setOffsetY(targetOy);
  };

  const handleJoystickUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isGripping) return;
    e.preventDefault();
    e.stopPropagation();
    setIsGripping(false);
    setJoyPos({ x: 0, y: 0 });
    syncViewportToActivePage();
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // SMART AUTO-FIT CONTENT ADJUST VIEWPORTS TO SUPPORT ALL SCREEN RATIOS & FIXED ALLIGNMENTS
  const fitToScreen = useCallback(() => {
    if (!activePage || activePage.elements.length === 0) {
      setOffsetX(100);
      setOffsetY(50);
      setScale(1.0);
      syncViewportToActivePage();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const el of activePage.elements) {
      if (el.points && el.points.length > 0) {
        for (const p of el.points) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
      } else {
        if (el.x < minX) minX = el.x;
        if (el.x + el.width > maxX) maxX = el.x + el.width;
        if (el.y < minY) minY = el.y;
        if (el.y + el.height > maxY) maxY = el.y + el.height;
      }
    }

    const padding = window.innerWidth < 768 ? 32 : 80;
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    if (contentWidth <= 0 || contentHeight <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const viewportWidth = parent.clientWidth;
    const viewportHeight = parent.clientHeight;

    const scaleX = (viewportWidth - padding * 2) / contentWidth;
    const scaleY = (viewportHeight - padding * 2) / contentHeight;
    let targetScale = Math.min(scaleX, scaleY);
    targetScale = Math.max(0.15, Math.min(3.0, targetScale));

    const contentCenterX = minX + contentWidth / 2;
    const contentCenterY = minY + contentHeight / 2;

    const targetOffsetX = viewportWidth / 2 - contentCenterX * targetScale;
    const targetOffsetY = viewportHeight / 2 - contentCenterY * targetScale;

    setOffsetX(targetOffsetX);
    setOffsetY(targetOffsetY);
    setScale(targetScale);
    syncViewportToActivePage();
  }, [activePage, syncViewportToActivePage]);

  // SYNC ACTIVE PAGE VIEWPORT STATE ON PAGE CHANGE
  useEffect(() => {
    if (activePage) {
      setOffsetX(activePage.offsetX);
      setOffsetY(activePage.offsetY);
      setScale(activePage.scale);
      setGridType(activePage.gridType);

      // Trigger automatic smart containment centering if loaded unpanned page with items
      if (activePage.elements.length > 0 && activePage.offsetX === 100 && activePage.offsetY === 50) {
        const timeout = setTimeout(() => {
          fitToScreen();
        }, 150);
        return () => clearTimeout(timeout);
      }
    }
  }, [activePageId]);

  // DEBOUNCED PERSIST PAGES STATE TO ELIMINATE HIGH-FPS DRAWING/PANNING CONGESTION
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(pages));
      } catch (err) {
        console.warn('Could not persist board changes to local storage:', err);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [pages]);

  // SAVE THEME
  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // PUSH NEW HISTORY POINT
  const saveHistoryState = useCallback((elementsToPush: BoardElement[]) => {
    setHistory(prev => {
      const pageHistory = prev[activePageId] || { past: [], future: [] };
      return {
        ...prev,
        [activePageId]: {
          past: [...pageHistory.past, activePage.elements],
          future: [],
        },
      };
    });
  }, [activePageId, activePage?.elements]);

  // Load selected element's styles dynamically into the active state defaults
  useEffect(() => {
    if (selectedId && activePage) {
      const el = activePage.elements.find(e => e.id === selectedId);
      if (el) {
        if (el.color) setColor(el.color);
        if (el.strokeWidth) setStrokeWidth(el.strokeWidth);
        if (el.strokeStyle) setStrokeStyle(el.strokeStyle);
        if (el.fillColor !== undefined) setFillColor(el.fillColor);
        if (el.fontSize !== undefined) setFontSize(el.fontSize);
      }
    }
  }, [selectedId]);

  const updateSelectedElementStyle = useCallback((updatedProperties: Partial<BoardElement>) => {
    if (!selectedId) return;
    setPages(prev =>
      prev.map(p => {
        if (p.id !== activePageId) return p;
        return {
          ...p,
          elements: p.elements.map(el => {
            if (el.id !== selectedId) return el;
            return { ...el, ...updatedProperties };
          }),
        };
      })
    );
  }, [selectedId, activePageId]);

  const changeColor = (newVal: string) => {
    setColor(newVal);
    if (selectedId) {
      saveHistoryState(activePage.elements);
      updateSelectedElementStyle({ color: newVal });
    }
  };

  const changeFillColor = (newVal: string) => {
    setFillColor(newVal);
    if (selectedId) {
      saveHistoryState(activePage.elements);
      updateSelectedElementStyle({ fillColor: newVal });
    }
  };

  const changeStrokeWidth = (newVal: number) => {
    setStrokeWidth(newVal);
    if (selectedId) {
      saveHistoryState(activePage.elements);
      updateSelectedElementStyle({ strokeWidth: newVal });
    }
  };

  const changeStrokeStyle = (newVal: StrokeStyle) => {
    setStrokeStyle(newVal);
    if (selectedId) {
      saveHistoryState(activePage.elements);
      updateSelectedElementStyle({ strokeStyle: newVal });
    }
  };

  const changeFontSize = (newVal: number) => {
    setFontSize(newVal);
    if (selectedId) {
      saveHistoryState(activePage.elements);
      updateSelectedElementStyle({ fontSize: newVal });
    }
  };

  /**
   * Screen px to world point mapping
   */
  const getCoordinatesFromScreen = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      return {
        x: (sx - offsetX) / scale,
        y: (sy - offsetY) / scale,
      };
    },
    [offsetX, offsetY, scale]
  );

  /**
   * World coordinates to screen coordinates mapping
   */
  const getWorldToScreen = useCallback(
    (wx: number, wy: number): Point => {
      return {
        x: wx * scale + offsetX,
        y: wy * scale + offsetY,
      };
    },
    [offsetX, offsetY, scale]
  );

  /**
   * Determine click target on elements
   */
  const getElementAtPosition = useCallback(
    (wp: Point): BoardElement | null => {
      // Loop backwards to hit top-most drawn item first
      const elements = activePage?.elements || [];
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (isPointNearElement(wp, el, scale)) {
          return el;
        }
      }
      return null;
    },
    [activePage?.elements, scale]
  );

  /**
   * Determine if we clicked on resize anchors
   */
  const getResizeAnchorAtPosition = useCallback(
    (wp: Point, el: BoardElement): 'nw' | 'ne' | 'se' | 'sw' | null => {
      const handleSize = 8 / scale; // Screen-consistent handle boundary box
      const corners = {
        nw: { x: el.x, y: el.y },
        ne: { x: el.x + el.width, y: el.y },
        se: { x: el.x + el.width, y: el.y + el.height },
        sw: { x: el.x, y: el.y + el.height },
      };

      for (const [corner, p] of Object.entries(corners)) {
        if (getDistance(wp, p) <= handleSize * 2) {
          return corner as 'nw' | 'ne' | 'se' | 'sw';
        }
      }
      return null;
    },
    [scale]
  );

  // TEXT WRAPPING AND DRAWING
  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSizeValue: number,
    fontColor: string,
    alignCenter = false
  ) => {
    ctx.font = `${fontSizeValue}px var(--font-sans)`;
    ctx.fillStyle = fontColor;
    
    const lines = text.split('\n');
    let currentY = y + fontSizeValue;
  
    lines.forEach(lineStr => {
      const words = lineStr.split(' ');
      let currentLine = '';
  
      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
  
        if (testWidth > maxWidth && n > 0) {
          const drawX = alignCenter ? x + (maxWidth - ctx.measureText(currentLine).width) / 2 : x;
          ctx.fillText(currentLine.trim(), drawX, currentY);
          currentLine = words[n] + ' ';
          currentY += fontSizeValue * 1.3;
        } else {
          currentLine = testLine;
        }
      }
      
      const drawX = alignCenter ? x + (maxWidth - ctx.measureText(currentLine).width) / 2 : x;
      ctx.fillText(currentLine.trim(), drawX, currentY);
      currentY += fontSizeValue * 1.3;
    });
  };

  /**
   * RENDER PIPELINE Drawing everything
   */
  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Clear everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = isDarkMode;

    // Grid rendering does not need global transform scale translate because we compute intervals.
    drawGrid(ctx, canvas.width / dpr, canvas.height / dpr, offsetX, offsetY, scale, gridType, isDark);

    ctx.save();
    // Render using global zoom scale & panning translations
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // DRAW USER VECTOR SHAPES
    const elements = activePage?.elements || [];
    elements.forEach(el => {
      if (el.id === editingTextId) return; // Hide standard rendering while interactive textarea is active

      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1.0;
      ctx.lineWidth = el.strokeWidth;
      ctx.strokeStyle = el.color;

      if (el.strokeStyle === 'dashed') {
        ctx.setLineDash([12, 6]);
      } else if (el.strokeStyle === 'dotted') {
        ctx.setLineDash([3, 6]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (el.type) {
        case 'pen':
        case 'highlighter': {
          if (!el.points || el.points.length < 2) break;
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
          break;
        }

        case 'line': {
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          ctx.stroke();
          break;
        }

        case 'arrow': {
          drawArrow(ctx, el.x, el.y, el.x + el.width, el.y + el.height, el.strokeWidth, el.color, el.strokeStyle);
          break;
        }

        case 'rectangle': {
          if (el.fillColor && el.fillColor !== 'transparent') {
            ctx.fillStyle = el.fillColor;
            ctx.fillRect(el.x, el.y, el.width, el.height);
          }
          ctx.beginPath();
          ctx.rect(el.x, el.y, el.width, el.height);
          ctx.stroke();
          break;
        }

        case 'ellipse': {
          if (el.fillColor && el.fillColor !== 'transparent') {
            ctx.fillStyle = el.fillColor;
            ctx.beginPath();
            ctx.ellipse(
              el.x + el.width / 2,
              el.y + el.height / 2,
              Math.abs(el.width / 2),
              Math.abs(el.height / 2),
              0,
              0,
              2 * Math.PI
            );
            ctx.fill();
          }
          ctx.beginPath();
          ctx.ellipse(
            el.x + el.width / 2,
            el.y + el.height / 2,
            Math.abs(el.width / 2),
            Math.abs(el.height / 2),
            0,
            0,
            2 * Math.PI
          );
          ctx.stroke();
          break;
        }

        case 'text': {
          if (el.text) {
            drawWrappedText(ctx, el.text, el.x, el.y, el.width, el.fontSize || 16, el.color, false);
          }
          break;
        }

        case 'sticky': {
          // Rounded beautiful sticky note background
          const padding = 15;
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;
          
          ctx.fillStyle = el.fillColor || 'rgba(242, 122, 26, 0.15)'; // Fallback pastel orange
          ctx.beginPath();
          const r = 8; // rounded circle
          const left = el.x;
          const top = el.y;
          const w = el.width;
          const h = el.height;
          ctx.moveTo(left + r, top);
          ctx.arcTo(left + w, top, left + w, top + h, r);
          ctx.arcTo(left + w, top + h, left, top + h, r);
          ctx.arcTo(left, top + h, left, top, r);
          ctx.arcTo(left, top, left + w, top, r);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Border overlay
          ctx.strokeStyle = el.color === '#ffffff' ? 'rgba(148, 163, 184, 0.4)' : el.color;
          ctx.lineWidth = el.strokeWidth || 1.5;
          ctx.beginPath();
          ctx.moveTo(left + r, top);
          ctx.arcTo(left + w, top, left + w, top + h, r);
          ctx.arcTo(left + w, top + h, left, top + h, r);
          ctx.arcTo(left, top + h, left, top, r);
          ctx.arcTo(left, top, left + w, top, r);
          ctx.closePath();
          ctx.stroke();

          // Inner sticky note font align
          if (el.text) {
            drawWrappedText(
              ctx,
              el.text,
              left + padding,
              top + padding,
              w - padding * 2,
              el.fontSize || 14,
              isDark ? '#f8fafc' : '#0f172a',
              false
            );
          }
          break;
        }

        case 'image': {
          if (el.text) {
            const cachedImg = imageCache.current.get(el.text);
            if (cachedImg && cachedImg.complete && cachedImg.naturalWidth !== 0) {
              ctx.drawImage(cachedImg, el.x, el.y, el.width, el.height);
            } else {
              if (!cachedImg) {
                const img = new Image();
                img.onload = () => {
                  drawAll();
                };
                img.onerror = () => {
                  console.error('Failed to load stitched image');
                };
                img.src = el.text;
                imageCache.current.set(el.text, img);
              }
              // Render stylized minimal loading placeholder frame
              ctx.save();
              ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
              ctx.fillRect(el.x, el.y, el.width, el.height);
              ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
              ctx.lineWidth = 1;
              ctx.setLineDash([4, 4]);
              ctx.strokeRect(el.x, el.y, el.width, el.height);
              ctx.restore();
            }
          }
          break;
        }

        default:
          break;
      }
      ctx.restore();
    });

    // DRAW CURRENTLY INTERACTIVE DRAWING COMPONENT
    if (isDrawing) {
      ctx.save();
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (strokeStyle === 'dashed') {
        ctx.setLineDash([12, 6]);
      } else if (strokeStyle === 'dotted') {
        ctx.setLineDash([3, 6]);
      }

      if (currentTool === 'pen' || currentTool === 'highlighter') {
        ctx.globalAlpha = currentTool === 'highlighter' ? 0.45 : 1.0;
        ctx.lineWidth = currentTool === 'highlighter' ? strokeWidth * 2.5 : strokeWidth;
        if (drawingPoints.length > 1) {
          ctx.beginPath();
          ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y);
          for (let i = 1; i < drawingPoints.length; i++) {
            ctx.lineTo(drawingPoints[i].x, drawingPoints[i].y);
          }
          ctx.stroke();
        }
      } else if (['rectangle', 'ellipse', 'line', 'arrow'].includes(currentTool)) {
        const dx = lastScreenPoint.x - startPoint.x;
        const dy = lastScreenPoint.y - startPoint.y;

        if (currentTool === 'rectangle') {
          if (fillColor !== 'transparent') {
            ctx.fillStyle = fillColor;
            ctx.fillRect(startPoint.x, startPoint.y, dx, dy);
          }
          ctx.beginPath();
          ctx.rect(startPoint.x, startPoint.y, dx, dy);
          ctx.stroke();
        } else if (currentTool === 'ellipse') {
          if (fillColor !== 'transparent') {
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.ellipse(
              startPoint.x + dx / 2,
              startPoint.y + dy / 2,
              Math.abs(dx / 2),
              Math.abs(dy / 2),
              0,
              0,
              2 * Math.PI
            );
            ctx.fill();
          }
          ctx.beginPath();
          ctx.ellipse(
            startPoint.x + dx / 2,
            startPoint.y + dy / 2,
            Math.abs(dx / 2),
            Math.abs(dy / 2),
            0,
            0,
            2 * Math.PI
          );
          ctx.stroke();
        } else if (currentTool === 'line') {
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(startPoint.x + dx, startPoint.y + dy);
          ctx.stroke();
        } else if (currentTool === 'arrow') {
          drawArrow(ctx, startPoint.x, startPoint.y, startPoint.x + dx, startPoint.y + dy, strokeWidth, color, strokeStyle);
        }
      }
      ctx.restore();
    }

    ctx.restore(); // Restore world translation

    // DRAW OVERLAYS IN SCREEN COORDINATES (so sizes are zoom-invariant)
    // 1. Draw Marquee Selection dashed overlay if drag selecting on blank
    if (marqueeSelect) {
      ctx.save();
      ctx.strokeStyle = 'rgba(242, 122, 26, 0.7)'; // ACE Board style orange selection marquee
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.fillStyle = 'rgba(242, 122, 26, 0.04)';
      const mx = Math.min(marqueeSelect.x1, marqueeSelect.x2);
      const my = Math.min(marqueeSelect.y1, marqueeSelect.y2);
      const mw = Math.abs(marqueeSelect.x1 - marqueeSelect.x2);
      const mh = Math.abs(marqueeSelect.y1 - marqueeSelect.y2);
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeRect(mx, my, mw, mh);
      ctx.restore();
    }

    // 2. Draw Vector Selection corners and boxes for selected element
    if (selectedId) {
      const el = activePage.elements.find(e => e.id === selectedId);
      if (el && el.id !== editingTextId) {
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        let minX = el.x;
        let minY = el.y;
        let maxX = el.x + el.width;
        let maxY = el.y + el.height;

        if (el.type === 'pen' || el.type === 'highlighter') {
          if (el.points && el.points.length > 0) {
            minX = Math.min(...el.points.map(p => p.x));
            maxX = Math.max(...el.points.map(p => p.x));
            minY = Math.min(...el.points.map(p => p.y));
            maxY = Math.max(...el.points.map(p => p.y));
          }
        }

        // Map world endpoints to Screen coordinates
        const pNW = getWorldToScreen(minX, minY);
        const pSE = getWorldToScreen(maxX, maxY);

        const sw = pSE.x - pNW.x;
        const sh = pSE.y - pNW.y;

        // Draw standard blue bounds
        ctx.strokeRect(pNW.x, pNW.y, sw, sh);

        // Draw 4 circular corner resizing anchors for shapes (skip pen resizing to keep simple)
        if (el.type !== 'pen' && el.type !== 'highlighter') {
          ctx.setLineDash([]);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          const handles = [
            { x: pNW.x, y: pNW.y }, // nw
            { x: pNW.x + sw, y: pNW.y }, // ne
            { x: pNW.x + sw, y: pNW.y + sh }, // se
            { x: pNW.x, y: pNW.y + sh }, // sw
          ];

          handles.forEach(h => {
            ctx.beginPath();
            ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
        }
        ctx.restore();
      }
    }
  }, [
    activePage,
    offsetX,
    offsetY,
    scale,
    gridType,
    selectedId,
    marqueeSelect,
    isDrawing,
    drawingPoints,
    startPoint,
    lastScreenPoint,
    strokeWidth,
    color,
    fillColor,
    strokeStyle,
    editingTextId,
    isDarkMode,
  ]);

  // REDRAW EFFECT ON RESIZE AND CHANGES
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.style.width = '100%';
      canvas.style.height = '100%';

      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      drawAll();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [drawAll]);

  // TRIGGER REDRAW MANUALLY COMPONENT IS MOUNTED OR PREFS CHANGED
  useEffect(() => {
    drawAll();
  }, [drawAll]);

  /**
   * KEYBOARD HOTKEYS MASTER HANDLER
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when writing text
      const targetTag = (e.target as HTMLElement).tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || editingTextId !== null) {
        return;
      }

      // 1. DELETE SHORTCUT
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
        e.preventDefault();
        saveHistoryState(activePage.elements);
        const updated = activePage.elements.filter(el => el.id !== selectedId);
        setPages(prev =>
          prev.map(p => (p.id === activePageId ? { ...p, elements: updated, updatedAt: Date.now() } : p))
        );
        setSelectedId(null);
      }

      // 2. SPACE TO PAN TOGGLE
      if (e.key === ' ' && !spacePressed.current) {
        spacePressed.current = true;
        // Temporary switch to pan tool
        setTool('pan');
      }

      // 3. UNDO / REDO CONTROLS
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        handleRedo();
      }

      // 4. ALPHABETICAL TOOL CHOICES
      switch (e.key.toLowerCase()) {
        case 'v':
          setTool('select');
          break;
        case 'h':
          setTool('pan');
          break;
        case 'p':
          setTool('pen');
          break;
        case 'y':
          setTool('highlighter');
          break;
        case 'l':
          setTool('line');
          break;
        case 'a':
          setTool('arrow');
          break;
        case 'r':
          setTool('rectangle');
          break;
        case 'o':
          setTool('ellipse');
          break;
        case 't':
          setTool('text');
          break;
        case 's':
          setTool('sticky');
          break;
        case 'e':
          setTool('eraser');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        spacePressed.current = false;
        setTool('select'); // fall back to mouse pointer
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedId, activePage, activePageId, editingTextId, saveHistoryState]);

  /**
   * UNDO HANDLER
   */
  const handleUndo = () => {
    const pageHistory = history[activePageId];
    if (!pageHistory || pageHistory.past.length === 0) return;

    const previousElements = pageHistory.past[pageHistory.past.length - 1];
    const remainingPast = pageHistory.past.slice(0, pageHistory.past.length - 1);

    setHistory(prev => ({
      ...prev,
      [activePageId]: {
        past: remainingPast,
        future: [activePage.elements, ...(prev[activePageId]?.future || [])],
      },
    }));

    setPages(prev =>
      prev.map(p => (p.id === activePageId ? { ...p, elements: previousElements, updatedAt: Date.now() } : p))
    );
    setSelectedId(null);
  };

  /**
   * REDO HANDLER
   */
  const handleRedo = () => {
    const pageHistory = history[activePageId];
    if (!pageHistory || pageHistory.future.length === 0) return;

    const nextElements = pageHistory.future[0];
    const remainingFuture = pageHistory.future.slice(1);

    setHistory(prev => ({
      ...prev,
      [activePageId]: {
        past: [...(prev[activePageId]?.past || []), activePage.elements],
        future: remainingFuture,
      },
    }));

    setPages(prev =>
      prev.map(p => (p.id === activePageId ? { ...p, elements: nextElements, updatedAt: Date.now() } : p))
    );
    setSelectedId(null);
  };

  /**
   * ZOOM IN & OUT ARITHMETIC
   */
  const executeZoom = (zoomMultiplier: number, focusX?: number, focusY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fx = focusX ?? canvas.width / (2 * (window.devicePixelRatio || 1));
    const fy = focusY ?? canvas.height / (2 * (window.devicePixelRatio || 1));

    const curScale = viewportRef.current.scale;
    const curOffsetX = viewportRef.current.offsetX;
    const curOffsetY = viewportRef.current.offsetY;

    const nextScale = Math.min(10.0, Math.max(0.05, curScale * zoomMultiplier));
    const nextOffsetX = fx - ((fx - curOffsetX) / curScale) * nextScale;
    const nextOffsetY = fy - ((fy - curOffsetY) / curScale) * nextScale;

    setScale(nextScale);
    setOffsetX(nextOffsetX);
    setOffsetY(nextOffsetY);
    debounceSyncViewport();
  };

  // ZOOM WHEEL HANDLER FOR GENTLE ZOOM
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    if (e.ctrlKey) {
      // Zoom centered on cursor
      const multiplier = e.deltaY > 0 ? 0.92 : 1.08;
      executeZoom(multiplier, cursorX, cursorY);
    } else {
      // Regular scroll wheel translates to panning
      setOffsetX(prev => prev - e.deltaX * 0.95);
      setOffsetY(prev => prev - e.deltaY * 0.95);
      debounceSyncViewport();
    }
  };

  /**
   * POINTER INTERACTIONS ENGINE
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const nativeEvent = e.nativeEvent;
    // Track pointer
    activePointersRef.current = [...activePointersRef.current.filter(p => p.pointerId !== nativeEvent.pointerId), nativeEvent];

    if (activePointersRef.current.length === 2) {
      setIsDrawing(false);
      setDrawingPoints([]);
      setSelectedId(null);
      setMarqueeSelect(null);

      const p1 = activePointersRef.current[0];
      const p2 = activePointersRef.current[1];
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = viewportRef.current.scale;
      pinchStartOffsetRef.current = { x: viewportRef.current.offsetX, y: viewportRef.current.offsetY };
      pinchStartMidRef.current = {
        x: (p1.clientX + p2.clientX) / 2,
        y: (p1.clientY + p2.clientY) / 2
      };
      return;
    }

    if (activePointersRef.current.length > 1) {
      return;
    }

    // Catch middle click to force pan dragging
    const isMiddleClick = e.button === 1;
    const activeToolValue = isMiddleClick ? 'pan' : currentTool;

    if (editingTextId !== null) {
      dismissTextEditing();
      return;
    }

    const worldCoord = getCoordinatesFromScreen(e.clientX, e.clientY);
    setStartPoint(worldCoord);
    setLastScreenPoint(worldCoord);

    // Save previous pointer client to track screen vector delta on move
    setLastScreenPoint({ x: e.clientX, y: e.clientY });

    setIsDrawing(true);

    if (activeToolValue === 'pan') {
      // Just record positions
      return;
    }

    if (activeToolValue === 'select') {
      // 1. First check if selected component has corner handles and user dragging corner
      if (selectedId) {
        const selectedEl = activePage.elements.find(el => el.id === selectedId);
        if (selectedEl) {
          const corner = getResizeAnchorAtPosition(worldCoord, selectedEl);
          if (corner) {
            setResizeHandle(corner);
            saveHistoryState(activePage.elements);
            return;
          }
        }
      }

      // 2. Check if user clicked an element
      const hit = getElementAtPosition(worldCoord);
      if (hit) {
        setSelectedId(hit.id);
        setDragOffset({
          x: worldCoord.x - hit.x,
          y: worldCoord.y - hit.y,
        });
        saveHistoryState(activePage.elements);
      } else {
        // Did not hit any - start selection marquee box
        setSelectedId(null);
        setMarqueeSelect({
          x1: e.clientX,
          y1: e.clientY,
          x2: e.clientX,
          y2: e.clientY,
        });
      }
      return;
    }

    if (activeToolValue === 'eraser') {
      saveHistoryState(activePage.elements);
      const hit = getElementAtPosition(worldCoord);
      if (hit) {
        setPages(prev =>
          prev.map(p =>
            p.id === activePageId
              ? { ...p, elements: p.elements.filter(el => el.id !== hit.id), updatedAt: Date.now() }
              : p
          )
        );
        setSelectedId(null);
      }
      return;
    }

    if (activeToolValue === 'pen' || activeToolValue === 'highlighter') {
      setDrawingPoints([worldCoord]);
      return;
    }

    if (activeToolValue === 'text') {
      // Trigger instant placement text editing
      setIsDrawing(false);
      const hit = getElementAtPosition(worldCoord);
      if (hit && hit.type === 'text') {
        // Double clicked or editing click on text
        setEditingTextId(hit.id);
        setEditingTextVal(hit.text || '');
        setEditingTextPos({ x: hit.x, y: hit.y });
      } else {
        // Create new text block
        const newId = generateId();
        const snappedWordX = snapValue(worldCoord.x, snapToGrid);
        const snappedWordY = snapValue(worldCoord.y, snapToGrid);
        
        const newTextEl: BoardElement = {
          id: newId,
          type: 'text',
          x: snappedWordX,
          y: snappedWordY,
          width: 250,
          height: 40,
          color,
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1.0,
          text: '',
          fontSize,
          createdAt: Date.now(),
        };

        saveHistoryState(activePage.elements);
        setPages(prev =>
          prev.map(p =>
            p.id === activePageId ? { ...p, elements: [...p.elements, newTextEl], updatedAt: Date.now() } : p
          )
        );
        setEditingTextId(newId);
        setEditingTextVal('');
        setEditingTextPos({ x: snappedWordX, y: snappedWordY });
      }
      return;
    }

    if (activeToolValue === 'sticky') {
      setIsDrawing(false);
      const snappedStickyX = snapValue(worldCoord.x, snapToGrid);
      const snappedStickyY = snapValue(worldCoord.y, snapToGrid);
      const newId = generateId();
      
      const newSticky: BoardElement = {
        id: newId,
        type: 'sticky',
        x: snappedStickyX,
        y: snappedStickyY,
        width: 180,
        height: 180,
        color,
        fillColor: fillColor === 'transparent' ? 'rgba(242, 122, 26, 0.14)' : fillColor,
        strokeWidth: 1.5,
        strokeStyle: 'solid',
        opacity: 1.0,
        text: 'Clean notes',
        fontSize: 14,
        createdAt: Date.now(),
      };

      saveHistoryState(activePage.elements);
      setPages(prev =>
        prev.map(p =>
          p.id === activePageId ? { ...p, elements: [...p.elements, newSticky], updatedAt: Date.now() } : p
        )
      );
      setEditingTextId(newId);
      setEditingTextVal('Clean notes');
      setEditingTextPos({ x: snappedStickyX, y: snappedStickyY });
      return;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const nativeEvent = e.nativeEvent;
    
    // Update pointer in ref
    activePointersRef.current = activePointersRef.current.map(p => 
      p.pointerId === nativeEvent.pointerId ? nativeEvent : p
    );

    if (activePointersRef.current.length === 2) {
      // 2-finger pinch/pan gesture
      const p1 = activePointersRef.current[0];
      const p2 = activePointersRef.current[1];
      const currentDist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      const currentMid = {
        x: (p1.clientX + p2.clientX) / 2,
        y: (p1.clientY + p2.clientY) / 2
      };

      if (pinchStartDistRef.current && pinchStartDistRef.current > 0) {
        const scaleMultiplier = currentDist / pinchStartDistRef.current;
        const targetScale = Math.min(10.0, Math.max(0.05, pinchStartScaleRef.current * scaleMultiplier));

        const dx = currentMid.x - pinchStartMidRef.current.x;
        const dy = currentMid.y - pinchStartMidRef.current.y;

        const midX = pinchStartMidRef.current.x;
        const midY = pinchStartMidRef.current.y;
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const focusX = midX - rect.left;
          const focusY = midY - rect.top;

          const zoomedOffsetX = focusX - ((focusX - pinchStartOffsetRef.current.x) / pinchStartScaleRef.current) * targetScale;
          const zoomedOffsetY = focusY - ((focusY - pinchStartOffsetRef.current.y) / pinchStartScaleRef.current) * targetScale;

          setScale(targetScale);
          setOffsetX(zoomedOffsetX + dx);
          setOffsetY(zoomedOffsetY + dy);
          debounceSyncViewport();
        }
      }
      return;
    }

    if (activePointersRef.current.length > 1) {
      return;
    }

    if (!isDrawing) return;

    const currentScreenPoint = { x: e.clientX, y: e.clientY };
    const worldPoint = getCoordinatesFromScreen(e.clientX, e.clientY);

    // SCREEN DELTA TO DO SEAMLESS GRID PANNING
    const deltaX = currentScreenPoint.x - lastScreenPoint.x;
    const deltaY = currentScreenPoint.y - lastScreenPoint.y;

    const isMiddleClick = e.buttons === 4; // scroll wheel push down
    const activeToolValue = isMiddleClick ? 'pan' : currentTool;

    if (activeToolValue === 'pan') {
      setOffsetX(prev => prev + deltaX);
      setOffsetY(prev => prev + deltaY);
      setLastScreenPoint(currentScreenPoint);
      return;
    }

    if (activeToolValue === 'select') {
      if (resizeHandle && selectedId) {
        // Calculate new dimension boundaries during resize dragging
        setPages(prev =>
          prev.map(p => {
            if (p.id !== activePageId) return p;
            const updated = p.elements.map(el => {
              if (el.id !== selectedId) return el;

              let updatedX = el.x;
              let updatedY = el.y;
              let updatedWidth = el.width;
              let updatedHeight = el.height;

              const snappedTargetX = snapValue(worldPoint.x, snapToGrid);
              const snappedTargetY = snapValue(worldPoint.y, snapToGrid);

              const isImage = el.type === 'image' && el.aspectRatio;

              if (isImage && el.aspectRatio) {
                const ratio = el.aspectRatio;
                switch (resizeHandle) {
                  case 'se':
                    updatedWidth = snappedTargetX - el.x;
                    updatedHeight = updatedWidth / ratio;
                    break;
                  case 'nw':
                    updatedWidth = el.x + el.width - snappedTargetX;
                    updatedHeight = updatedWidth / ratio;
                    updatedX = snappedTargetX;
                    updatedY = el.y + el.height - updatedHeight;
                    break;
                  case 'ne':
                    updatedWidth = snappedTargetX - el.x;
                    updatedHeight = updatedWidth / ratio;
                    updatedY = el.y + el.height - updatedHeight;
                    break;
                  case 'sw':
                    updatedWidth = el.x + el.width - snappedTargetX;
                    updatedHeight = updatedWidth / ratio;
                    updatedX = snappedTargetX;
                    break;
                }
              } else {
                switch (resizeHandle) {
                  case 'se':
                    updatedWidth = snappedTargetX - el.x;
                    updatedHeight = snappedTargetY - el.y;
                    break;
                  case 'nw':
                    updatedWidth = el.x + el.width - snappedTargetX;
                    updatedHeight = el.y + el.height - snappedTargetY;
                    updatedX = snappedTargetX;
                    updatedY = snappedTargetY;
                    break;
                  case 'ne':
                    updatedWidth = snappedTargetX - el.x;
                    updatedHeight = el.y + el.height - snappedTargetY;
                    updatedY = snappedTargetY;
                    break;
                  case 'sw':
                    updatedWidth = el.x + el.width - snappedTargetX;
                    updatedHeight = snappedTargetY - el.y;
                    updatedX = snappedTargetX;
                    break;
                }
              }

              return {
                ...el,
                x: updatedX,
                y: updatedY,
                width: updatedWidth,
                height: updatedHeight,
              };
            });
            return { ...p, elements: updated };
          })
        );
      } else if (selectedId) {
        // Move element physically mapped to drag offset
        setPages(prev =>
          prev.map(p => {
            if (p.id !== activePageId) return p;
            const updated = p.elements.map(el => {
              if (el.id !== selectedId) return el;

              const rawX = worldPoint.x - dragOffset.x;
              const rawY = worldPoint.y - dragOffset.y;

              const snappedCoordX = snapValue(rawX, snapToGrid);
              const snappedCoordY = snapValue(rawY, snapToGrid);

              // Update point offsets with offset difference vector for pen drawings
              if (el.type === 'pen' || el.type === 'highlighter') {
                if (!el.points || el.points.length === 0) return el;
                // Move path points relatively
                const deltaTranslateX = snappedCoordX - el.x;
                const deltaTranslateY = snappedCoordY - el.y;
                const shiftedPoints = el.points.map(pt => ({
                  x: pt.x + deltaTranslateX,
                  y: pt.y + deltaTranslateY,
                }));
                return {
                  ...el,
                  x: snappedCoordX,
                  y: snappedCoordY,
                  points: shiftedPoints,
                };
              }

              return {
                ...el,
                x: snappedCoordX,
                y: snappedCoordY,
              };
            });
            return { ...p, elements: updated };
          })
        );
      } else if (marqueeSelect) {
        setMarqueeSelect(prev => (prev ? { ...prev, x2: e.clientX, y2: e.clientY } : null));
      }
      setLastScreenPoint(currentScreenPoint);
      return;
    }

    if (activeToolValue === 'eraser') {
      const hit = getElementAtPosition(worldPoint);
      if (hit) {
        setPages(prev =>
          prev.map(p =>
            p.id === activePageId
              ? { ...p, elements: p.elements.filter(el => el.id !== hit.id), updatedAt: Date.now() }
              : p
          )
        );
        setSelectedId(null);
      }
      setLastScreenPoint(currentScreenPoint);
      return;
    }

    if (activeToolValue === 'pen' || activeToolValue === 'highlighter') {
      setDrawingPoints(prev => [...prev, worldPoint]);
      setLastScreenPoint(currentScreenPoint);
      return;
    }

    // DRAWING TEMPORARY WORLD BOUND SHAPES IN-LINE
    setLastScreenPoint(worldPoint); // Holds current world cursor
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current = [];
    pinchStartDistRef.current = null;
    setIsDrawing(false);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const nativeEvent = e.nativeEvent;
    
    // Remove pointer from active list
    activePointersRef.current = activePointersRef.current.filter(p => p.pointerId !== nativeEvent.pointerId);

    if (activePointersRef.current.length < 2) {
      pinchStartDistRef.current = null;
    }

    if (activePointersRef.current.length > 0) {
      // If pointer is still down, don't execute single pointer release actions, but reset points
      setIsDrawing(false);
      return;
    }

    setIsDrawing(false);

    const activeToolValue = currentTool;

    if (activeToolValue === 'pan') {
      syncViewportToActivePage();
      return;
    }

    if (activeToolValue === 'select') {
      setResizeHandle(null);
      if (marqueeSelect) {
        // Multi elements bounding select marquee hits
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const screenX1 = marqueeSelect.x1 - rect.left;
          const screenY1 = marqueeSelect.y1 - rect.top;
          const screenX2 = marqueeSelect.x2 - rect.left;
          const screenY2 = marqueeSelect.y2 - rect.top;

          const worldX1 = (screenX1 - offsetX) / scale;
          const worldY1 = (screenY1 - offsetY) / scale;
          const worldX2 = (screenX2 - offsetX) / scale;
          const worldY2 = (screenY2 - offsetY) / scale;

          const rx = Math.min(worldX1, worldX2);
          const ry = Math.min(worldY1, worldY2);
          const rw = Math.abs(worldX1 - worldX2);
          const rh = Math.abs(worldY1 - worldY2);

          // Find first intersected element to select
          const hit = activePage.elements.find(el => {
            return (
              el.x >= rx &&
              el.x + el.width <= rx + rw &&
              el.y >= ry &&
              el.y + el.height <= ry + rh
            );
          });
          if (hit) {
            setSelectedId(hit.id);
          }
        }
        setMarqueeSelect(null);
      }
      return;
    }

    if (activeToolValue === 'pen' || activeToolValue === 'highlighter') {
      if (drawingPoints.length < 2) {
        setDrawingPoints([]);
        return;
      }

      // Bound calculation
      const minX = Math.min(...drawingPoints.map(p => p.x));
      const maxX = Math.max(...drawingPoints.map(p => p.x));
      const minY = Math.min(...drawingPoints.map(p => p.y));
      const maxY = Math.max(...drawingPoints.map(p => p.y));

      const newElId = generateId();
      const newPenElement: BoardElement = {
        id: newElId,
        type: activeToolValue,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        points: drawingPoints,
        color,
        fillColor: 'transparent',
        strokeWidth: activeToolValue === 'highlighter' ? strokeWidth * 2.5 : strokeWidth,
        strokeStyle,
        opacity: activeToolValue === 'highlighter' ? 0.45 : 1.0,
        createdAt: Date.now(),
      };

      saveHistoryState(activePage.elements);
      setPages(prev =>
        prev.map(p =>
          p.id === activePageId ? { ...p, elements: [...p.elements, newPenElement], updatedAt: Date.now() } : p
        )
      );
      setDrawingPoints([]);
      setSelectedId(newElId);
      return;
    }

    if (['rectangle', 'ellipse', 'line', 'arrow'].includes(activeToolValue)) {
      const worldEndpointCoord = getCoordinatesFromScreen(e.clientX, e.clientY);
      const rawWidth = worldEndpointCoord.x - startPoint.x;
      const rawHeight = worldEndpointCoord.y - startPoint.y;

      if (Math.abs(rawWidth) < 3 && Math.abs(rawHeight) < 3) return;

      const newElId = generateId();
      const newShape: BoardElement = {
        id: newElId,
        type: activeToolValue,
        x: snapValue(startPoint.x, snapToGrid),
        y: snapValue(startPoint.y, snapToGrid),
        width: snapValue(rawWidth, snapToGrid) || rawWidth,
        height: snapValue(rawHeight, snapToGrid) || rawHeight,
        color,
        fillColor: activeToolValue === 'rectangle' || activeToolValue === 'ellipse' ? fillColor : undefined,
        strokeWidth,
        strokeStyle,
        opacity: 1.0,
        createdAt: Date.now(),
      };

      saveHistoryState(activePage.elements);
      setPages(prev =>
        prev.map(p =>
          p.id === activePageId ? { ...p, elements: [...p.elements, newShape], updatedAt: Date.now() } : p
        )
      );
      setSelectedId(newElId);
      return;
    }
  };

  /**
   * COMMIT ON-SCREEN TEXT EDIT CHANGES
   */
  const dismissTextEditing = () => {
    if (!editingTextId) return;

    const trimmedValue = editingTextVal.trim();
    setPages(prev =>
      prev.map(p => {
        if (p.id !== activePageId) return p;
        if (!trimmedValue) {
          // Remove if completely blank
          return { ...p, elements: p.elements.filter(el => el.id !== editingTextId) };
        }
        return {
          ...p,
          elements: p.elements.map(el => {
            if (el.id !== editingTextId) return el;
            return {
              ...el,
              text: trimmedValue,
              width: el.type === 'sticky' ? el.width : 280, // standardized widths
              height: el.type === 'sticky' ? el.height : Math.max(40, Math.ceil(trimmedValue.length / 15) * 24),
            };
          }),
        };
      })
    );
    setEditingTextId(null);
    setEditingTextVal('');
  };

  // ZOOM ACTIONS
  const zoomIn = () => executeZoom(1.15);
  const zoomOut = () => executeZoom(0.85);
  const resetZoom = () => {
    setScale(1.0);
    setOffsetX(100);
    setOffsetY(50);
    syncViewportToActivePage();
  };

  const clearCanvas = () => {
    if (confirm('Clear all drawings and notes on this whiteboard?')) {
      saveHistoryState(activePage.elements);
      setPages(prev =>
        prev.map(p => (p.id === activePageId ? { ...p, elements: [], updatedAt: Date.now() } : p))
      );
      setSelectedId(null);
    }
  };

  /**
   * MULTIPAGE MANAGEMENT CORES
   */
  const createNewBoardPage = (titleText?: string) => {
    const freshId = generateId();
    const cleanPage: NotePage = {
      id: freshId,
      title: titleText || `Sketch Board ${pages.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      elements: [],
      offsetX: 100,
      offsetY: 50,
      scale: 1.0,
      gridType: 'lines',
    };

    setPages(prev => [...prev, cleanPage]);
    setActivePageId(freshId);
    setSelectedId(null);
  };

  const renameBoardPage = (id: string, textStr: string) => {
    setPages(prev =>
      prev.map(p => (p.id === id ? { ...p, title: textStr, updatedAt: Date.now() } : p))
    );
  };

  const deleteBoardPage = (id: string) => {
    if (pages.length <= 1) return;
    const remaining = pages.filter(p => p.id !== id);
    setPages(remaining);
    setActivePageId(remaining[0].id);
    setSelectedId(null);
  };

  const importFullWorkspace = (newPages: NotePage[]) => {
    setPages(newPages);
    setActivePageId(newPages[0].id);
    setSelectedId(null);
  };

  const exportFullWorkspace = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pages, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `kotlin_board_backup_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  /**
   * IMAGE EXPORT: RASTER PNG VIEWPORT
   */
  const exportToPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${activePage.title.replace(/\s+/g, '_')}_whiteboard.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  /**
   * EXPORT TO VECTOR SVG CODE
   */
  const exportToSVG = () => {
    const elements = activePage?.elements || [];
    if (elements.length === 0) {
      alert('Whiteboard is empty, draw something to export SVG.');
      return;
    }

    // Capture overall boundary
    let minX = Math.min(...elements.map(e => e.x));
    let minY = Math.min(...elements.map(e => e.y));
    let maxX = Math.max(...elements.map(e => e.x + e.width));
    let maxY = Math.max(...elements.map(e => e.y + e.height));

    // Pad a little bit
    minX -= 40;
    minY -= 40;
    maxX += 40;
    maxY += 40;

    const width = maxX - minX;
    const height = maxY - minY;

    let svgNodes = '';

    elements.forEach(el => {
      const stroke = el.color;
      const fill = el.fillColor === 'transparent' ? 'none' : el.fillColor || 'none';
      const sw = el.strokeWidth;
      const styleAttr =
        el.strokeStyle === 'dashed'
          ? 'stroke-dasharray="8,6"'
          : el.strokeStyle === 'dotted'
          ? 'stroke-dasharray="2,4"'
          : '';

      switch (el.type) {
        case 'rectangle':
          svgNodes += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" stroke="${stroke}" fill="${fill}" stroke-width="${sw}" ${styleAttr} opacity="${el.opacity}" />\n`;
          break;

        case 'ellipse':
          svgNodes += `  <ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${Math.abs(el.width / 2)}" ry="${Math.abs(el.height / 2)}" stroke="${stroke}" fill="${fill}" stroke-width="${sw}" ${styleAttr} opacity="${el.opacity}" />\n`;
          break;

        case 'line':
          svgNodes += `  <line x1="${el.x}" y1="${el.y}" x2="${el.x + el.width}" y2="${el.y + el.height}" stroke="${stroke}" stroke-width="${sw}" ${styleAttr} opacity="${el.opacity}" />\n`;
          break;

        case 'arrow': {
          const angle = Math.atan2(el.height, el.width);
          const toX = el.x + el.width;
          const toY = el.y + el.height;
          const headLength = Math.max(10, el.strokeWidth * 3);
          const head1X = toX - headLength * Math.cos(angle - Math.PI / 6);
          const head1Y = toY - headLength * Math.sin(angle - Math.PI / 6);
          const head2X = toX - headLength * Math.cos(angle + Math.PI / 6);
          const head2Y = toY - headLength * Math.sin(angle + Math.PI / 6);

          svgNodes += `  <g stroke="${stroke}" stroke-width="${sw}" opacity="${el.opacity}">\n`;
          svgNodes += `    <line x1="${el.x}" y1="${el.y}" x2="${toX}" y2="${toY}" ${styleAttr} />\n`;
          svgNodes += `    <polygon points="${toX},${toY} ${head1X},${head1Y} ${head2X},${head2Y}" fill="${stroke}" stroke="none" />\n`;
          svgNodes += `  </g>\n`;
          break;
        }

        case 'pen':
        case 'highlighter': {
          if (el.points && el.points.length > 1) {
            let pathD = `M ${el.points[0].x} ${el.points[0].y}`;
            for (let i = 1; i < el.points.length; i++) {
              pathD += ` L ${el.points[i].x} ${el.points[i].y}`;
            }
            svgNodes += `  <path d="${pathD}" stroke="${stroke}" fill="none" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${el.opacity}" />\n`;
          }
          break;
        }

        case 'text': {
          if (el.text) {
            svgNodes += `  <text x="${el.x}" y="${el.y + (el.fontSize || 16)}" fill="${stroke}" font-family="sans-serif" font-size="${el.fontSize || 16}" opacity="${el.opacity}">\n`;
            svgNodes += `    ${el.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n`;
            svgNodes += `  </text>\n`;
          }
          break;
        }

        case 'sticky': {
          svgNodes += `  <g opacity="${el.opacity}">\n`;
          svgNodes += `    <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="8" fill="${el.fillColor}" stroke="${stroke}" stroke-width="1.5" />\n`;
          if (el.text) {
            svgNodes += `    <text x="${el.x + 12}" y="${el.y + 24}" fill="#0f172a" font-family="sans-serif" font-size="${el.fontSize || 14}">\n`;
            svgNodes += `      ${el.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n`;
            svgNodes += `    </text>\n`;
          }
          svgNodes += `  </g>\n`;
          break;
        }

        case 'image': {
          if (el.text) {
            svgNodes += `  <image href="${el.text}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" opacity="${el.opacity}" />\n`;
          }
          break;
        }

        default:
          break;
      }
    });

    const fullSvgString = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">
  <style>
    text { font-family: system-ui, -apple-system, sans-serif; }
  </style>
${svgNodes}</svg>`;

    const svgBlob = new Blob([fullSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${activePage.title.replace(/\s+/g, '_')}_vector.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // DRAG & DROP & PASTE STITCH GRAPHICS FUNCTIONS
  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;
      const worldX = (dropX - offsetX) / scale;
      const worldY = (dropY - offsetY) / scale;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        if (dataUrl && typeof dataUrl === 'string') {
          compressImage(dataUrl).then(compressedUrl => {
            const tempImg = new Image();
            tempImg.onload = () => {
              const nativeWidth = tempImg.naturalWidth || 400;
              const nativeHeight = tempImg.naturalHeight || 300;
              const initialWidth = Math.min(350, nativeWidth);
              const ratio = nativeWidth / nativeHeight;
              const initialHeight = initialWidth / ratio;

              const newImageId = generateId();
              const newImageElement: BoardElement = {
                id: newImageId,
                type: 'image',
                x: snapValue(worldX - initialWidth / 2, snapToGrid),
                y: snapValue(worldY - initialHeight / 2, snapToGrid),
                width: initialWidth,
                height: initialHeight,
                color: 'transparent',
                strokeWidth: 0,
                strokeStyle: 'solid',
                opacity: 1.0,
                text: compressedUrl,
                createdAt: Date.now(),
                aspectRatio: ratio,
              };

              saveHistoryState(activePage.elements);
              setPages(prev =>
                prev.map(p =>
                  p.id === activePageId ? { ...p, elements: [...p.elements, newImageElement], updatedAt: Date.now() } : p
                )
              );

              imageCache.current.set(compressedUrl, tempImg);
              setSelectedId(newImageId);
              setTool('select');
            };
            tempImg.src = compressedUrl;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImage = useCallback((dataUrl: string) => {
    const canvas = canvasRef.current;
    let worldX = 150;
    let worldY = 150;

    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      worldX = (rect.width / 2 - offsetX) / scale;
      worldY = (rect.height / 2 - offsetY) / scale;
    }

    compressImage(dataUrl).then(compressedUrl => {
      const tempImg = new Image();
      tempImg.onload = () => {
        const nativeWidth = tempImg.naturalWidth || 400;
        const nativeHeight = tempImg.naturalHeight || 300;
        const initialWidth = Math.min(350, nativeWidth);
        const ratio = nativeWidth / nativeHeight;
        const initialHeight = initialWidth / ratio;

        const newImageId = generateId();
        const newImageElement: BoardElement = {
          id: newImageId,
          type: 'image',
          x: snapValue(worldX - initialWidth / 2, snapToGrid),
          y: snapValue(worldY - initialHeight / 2, snapToGrid),
          width: initialWidth,
          height: initialHeight,
          color: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid',
          opacity: 1.0,
          text: compressedUrl,
          createdAt: Date.now(),
          aspectRatio: ratio,
        };

        saveHistoryState(activePage.elements);
        setPages(prev =>
          prev.map(p =>
            p.id === activePageId ? { ...p, elements: [...p.elements, newImageElement], updatedAt: Date.now() } : p
          )
        );

        imageCache.current.set(compressedUrl, tempImg);
        setSelectedId(newImageId);
        setTool('select');
      };
      tempImg.src = compressedUrl;
    });
  }, [activePageId, activePage?.elements, offsetX, offsetY, scale, snapToGrid, saveHistoryState]);

  // LISTEN FOR GLOBAL CLIPBOARD IMAGE COPY-PASTE RECEPTIVELY
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const targetTag = (e.target as HTMLElement).tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || editingTextId !== null) {
        return;
      }

      const file = e.clipboardData?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result;
          if (dataUrl && typeof dataUrl === 'string') {
            const canvas = canvasRef.current;
            let worldX = 150;
            let worldY = 150;
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              worldX = (rect.width / 2 - offsetX) / scale;
              worldY = (rect.height / 2 - offsetY) / scale;
            }

            compressImage(dataUrl).then(compressedUrl => {
              const tempImg = new Image();
              tempImg.onload = () => {
                const nativeWidth = tempImg.naturalWidth || 400;
                const nativeHeight = tempImg.naturalHeight || 300;
                const initialWidth = Math.min(350, nativeWidth);
                const ratio = nativeWidth / nativeHeight;
                const initialHeight = initialWidth / ratio;

                const newImageId = generateId();
                const newImageElement: BoardElement = {
                  id: newImageId,
                  type: 'image',
                  x: snapValue(worldX - initialWidth / 2, snapToGrid),
                  y: snapValue(worldY - initialHeight / 2, snapToGrid),
                  width: initialWidth,
                  height: initialHeight,
                  color: 'transparent',
                  strokeWidth: 0,
                  strokeStyle: 'solid',
                  opacity: 1.0,
                  text: compressedUrl,
                  createdAt: Date.now(),
                  aspectRatio: ratio,
                };

                saveHistoryState(activePage.elements);
                setPages(prev =>
                  prev.map(p =>
                    p.id === activePageId ? { ...p, elements: [...p.elements, newImageElement], updatedAt: Date.now() } : p
                  )
                );

                imageCache.current.set(compressedUrl, tempImg);
                setSelectedId(newImageId);
                setTool('select');
              };
              tempImg.src = compressedUrl;
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activePageId, activePage?.elements, offsetX, offsetY, scale, snapToGrid, saveHistoryState, editingTextId]);

  // FLOAT EDIT PORT HANDLERS FOR THE SKETCH AND ELEMENTS SESSIONS
  const smoothPenPoints = (points: { x: number; y: number }[]) => {
    if (points.length < 3) return points;
    const smoothed = [...points];
    for (let i = 1; i < points.length - 1; i++) {
      smoothed[i] = {
        x: (points[i - 1].x + points[i].x + points[i + 1].x) / 3,
        y: (points[i - 1].y + points[i].y + points[i + 1].y) / 3,
      };
    }
    return smoothed;
  };

  const handleSmoothSelectedSketch = () => {
    const selectedElement = activePage?.elements.find(el => el.id === selectedId);
    if (!selectedElement || !selectedElement.points) return;
    saveHistoryState(activePage.elements);
    const newPoints = smoothPenPoints(selectedElement.points);
    setPages(prev =>
      prev.map(p =>
        p.id === activePageId
          ? {
              ...p,
              elements: p.elements.map(el =>
                el.id === selectedId ? { ...el, points: newPoints, updatedAt: Date.now() } : el
              ),
            }
          : p
      )
    );
  };

  const handleTogglePenType = () => {
    const selectedElement = activePage?.elements.find(el => el.id === selectedId);
    if (!selectedElement) return;
    saveHistoryState(activePage.elements);
    const nextType = selectedElement.type === 'pen' ? 'highlighter' : 'pen';
    setPages(prev =>
      prev.map(p =>
        p.id === activePageId
          ? {
              ...p,
              elements: p.elements.map(el =>
                el.id === selectedId
                  ? {
                      ...el,
                      type: nextType,
                      opacity: nextType === 'highlighter' ? 0.45 : 1.0,
                      strokeWidth: nextType === 'highlighter' ? 12 : 4,
                      updatedAt: Date.now(),
                    }
                  : el
              ),
            }
          : p
      )
    );
  };

  const handleConvertSketchToShape = (targetType: 'rectangle' | 'ellipse' | 'line' | 'arrow') => {
    const selectedElement = activePage?.elements.find(el => el.id === selectedId);
    if (!selectedElement) return;
    saveHistoryState(activePage.elements);

    let minX = selectedElement.x;
    let minY = selectedElement.y;
    let maxX = selectedElement.x + selectedElement.width;
    let maxY = selectedElement.y + selectedElement.height;

    if (selectedElement.points && selectedElement.points.length > 0) {
      minX = Math.min(...selectedElement.points.map(p => p.x));
      maxX = Math.max(...selectedElement.points.map(p => p.x));
      minY = Math.min(...selectedElement.points.map(p => p.y));
      maxY = Math.max(...selectedElement.points.map(p => p.y));
    }

    const w = maxX - minX;
    const h = maxY - minY;

    const shapeElement: BoardElement = {
      id: selectedId!,
      type: targetType,
      x: minX,
      y: minY,
      width: w,
      height: h,
      color: selectedElement.color || '#7F52FF',
      strokeWidth: selectedElement.strokeWidth || 4,
      strokeStyle: 'solid',
      fillColor: targetType === 'rectangle' || targetType === 'ellipse' ? 'transparent' : undefined,
      opacity: 1.0,
      createdAt: selectedElement.createdAt || Date.now(),
    };

    setPages(prev =>
      prev.map(p =>
        p.id === activePageId
          ? {
              ...p,
              elements: p.elements.map(el => (el.id === selectedId ? shapeElement : el)),
            }
          : p
      )
    );
  };

  const handleDuplicateSelected = () => {
    const selectedElement = activePage?.elements.find(el => el.id === selectedId);
    if (!selectedElement) return;
    saveHistoryState(activePage.elements);

    const newId = generateId();
    const duplicate: BoardElement = {
      ...selectedElement,
      id: newId,
      x: selectedElement.x + 25,
      y: selectedElement.y + 25,
      createdAt: Date.now(),
    };

    if (selectedElement.points) {
      duplicate.points = selectedElement.points.map(p => ({
        x: p.x + 25,
        y: p.y + 25,
      }));
    }

    setPages(prev =>
      prev.map(p =>
        p.id === activePageId
          ? {
              ...p,
              elements: [...p.elements, duplicate],
              updatedAt: Date.now(),
            }
          : p
      )
    );
    setSelectedId(newId);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    saveHistoryState(activePage.elements);
    setPages(prev =>
      prev.map(p =>
        p.id === activePageId
          ? {
              ...p,
              elements: p.elements.filter(el => el.id !== selectedId),
              updatedAt: Date.now(),
            }
          : p
      )
    );
    setSelectedId(null);
  };

  /**
   * SELECTION AND HIGHLIGHT QUICK DOCK TRIGGERS
   */
  const handleQuickPresetSelection = (toolId: Tool) => {
    setTool(toolId);
    setSelectedId(null);
  };

  // SIZINGS FOR ON-SCREEN ABSOLUTE POSITIONED FLOATING INPUTS
  const inputStyleLeft = editingTextPos.x * scale + offsetX;
  const inputStyleTop = editingTextPos.y * scale + offsetY;
  const inputStyleWidth = Math.max(160, 240 * scale);
  const inputStyleHeight = Math.max(100, 140 * scale);

  // EVALUATING POSITION FOR FLOATING QUICK OPTION ACTION BAR
  let floatMenuPos: { top: number; left: number } | null = null;
  const selectedElement = selectedId && activePage ? activePage.elements.find(el => el.id === selectedId) || null : null;

  if (selectedId && selectedElement && editingTextId !== selectedId) {
    let minX = selectedElement.x;
    let minY = selectedElement.y;
    let maxX = selectedElement.x + selectedElement.width;
    let maxY = selectedElement.y + selectedElement.height;

    if (selectedElement.type === 'pen' || selectedElement.type === 'highlighter') {
      if (selectedElement.points && selectedElement.points.length > 0) {
        minX = Math.min(...selectedElement.points.map(p => p.x));
        maxX = Math.max(...selectedElement.points.map(p => p.x));
        minY = Math.min(...selectedElement.points.map(p => p.y));
        maxY = Math.max(...selectedElement.points.map(p => p.y));
      }
    }

    // Map endpoints to Screen coordinates
    const pNW = getWorldToScreen(minX, minY);
    const pSE = getWorldToScreen(maxX, maxY);

    // Float menu exactly above the selection box, or centered
    const top = Math.max(90, pNW.y - 56);
    const left = Math.max(16, Math.min(window.innerWidth - 380, (pNW.x + pSE.x) / 2 - 170));
    floatMenuPos = { top, left };
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* SIDEBAR FOR NOTES ALBUM (RESPONSIVE DRAWER OVERLAY ON MOBILE) */}
      {isSidebarOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="md:hidden fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-[1.5px]"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="fixed md:relative inset-y-0 left-0 z-40 md:z-auto h-full shadow-2xl md:shadow-none bg-[#f8fafc] dark:bg-slate-950 animate-slide-in">
            <PageList
              pages={pages}
              activePageId={activePageId}
              onSelectPage={(id) => {
                syncViewportToActivePage();
                setActivePageId(id);
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }}
              onCreatePage={(title) => {
                syncViewportToActivePage();
                createNewBoardPage(title);
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }}
              onRenamePage={renameBoardPage}
              onDeletePage={deleteBoardPage}
              onImportWorkspace={importFullWorkspace}
              onExportWorkspace={exportFullWorkspace}
            />
          </div>
        </>
      )}

      {/* WEB APPLICATION CANVAS STAGE */}
      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER BRAND & STATS */}
        <header className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* LEFT GROUP: Toggle, Title, Undo, Redo */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Sidebar Toggle Button */}
            <button
              id="btn-toggle-sidebar"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-2.5 bg-white/45 dark:bg-slate-950/45 backdrop-blur-xl border border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-900/50 rounded-xl shadow-lg transition active:scale-95 text-slate-600 dark:text-slate-350 cursor-pointer"
              title="Toggle Notebook Slider"
            >
              {isSidebarOpen ? <ChevronRight className="w-5 h-5 rotate-180" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Title Board detail */}
            <div className="bg-white/45 dark:bg-slate-950/45 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-xl px-3.5 py-1.5 shadow-lg flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-28 sm:max-w-44">
                {activePage?.title || 'Whiteboard'}
              </span>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            </div>

            {/* Undo / Redo in Header */}
            <div className="bg-white/45 dark:bg-slate-950/45 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-xl p-1 shadow-lg flex items-center gap-0.5">
              <button
                id="header-btn-undo"
                onClick={handleUndo}
                disabled={!history[activePageId]?.past?.length}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-350 hover:bg-white/40 dark:hover:bg-slate-900/40 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                id="header-btn-redo"
                onClick={handleRedo}
                disabled={!history[activePageId]?.future?.length}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-350 hover:bg-white/40 dark:hover:bg-slate-900/40 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT GROUP: Theme, Canvas Settings Dropdown, Guides */}
          <div className="flex items-center gap-2 pointer-events-auto relative">
            {/* Canvas settings popover */}
            <div className="relative">
              <button
                id="btn-canvas-settings"
                onClick={() => setIsSettingsOpen(prev => !prev)}
                className={`p-2.5 backdrop-blur-xl border rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer ${
                  isSettingsOpen
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 border-transparent'
                    : 'bg-white/45 dark:bg-slate-950/45 border-white/20 dark:border-white/5 text-slate-600 dark:text-slate-350 hover:bg-white/60 dark:hover:bg-slate-900/60'
                }`}
                title="Canvas Settings & Actions"
              >
                <Sliders className="w-4 h-4" />
                <span className="text-xs font-mono font-medium hidden sm:inline">Settings</span>
              </button>

              {/* DROPDOWN MENU */}
              {isSettingsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSettingsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 z-20 bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-slate-200/40 dark:border-slate-800/25 flex flex-col gap-3.5 animate-scale-up text-xs">
                    {/* Grid Selection */}
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider font-mono font-bold text-slate-450 dark:text-slate-500 mb-1.5">
                        Background Grid
                      </span>
                      <div className="flex gap-1 bg-slate-100/40 dark:bg-slate-950/40 p-0.5 rounded-lg border border-slate-200/30 dark:border-slate-800/10">
                        {(['none', 'dots', 'lines'] as GridType[]).map(type => (
                          <button
                            key={type}
                            onClick={() => setGridType(type)}
                            className={`flex-1 py-1 text-[10px] font-semibold rounded-md capitalize transition ${
                              gridType === type
                                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm font-bold'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-normal'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Snap To Grid Toggle */}
                    <div className="flex items-center justify-between border-t border-slate-200/20 dark:border-slate-800/15 pt-3">
                      <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-450 dark:text-slate-500">
                        Snap to Grid
                      </span>
                      <input
                        type="checkbox"
                        checked={snapToGrid}
                        onChange={e => setSnapToGrid(e.target.checked)}
                        className="w-4 h-4 accent-slate-800 dark:accent-white rounded border-slate-300 dark:bg-slate-800 cursor-pointer"
                      />
                    </div>

                    {/* Export Actions */}
                    <div className="border-t border-slate-200/20 dark:border-slate-800/15 pt-3">
                      <span className="block text-[9px] uppercase tracking-wider font-mono font-bold text-slate-450 dark:text-slate-500 mb-1.5">
                        Export Board
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            exportToPNG();
                            setIsSettingsOpen(false);
                          }}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100/60 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          <Image className="w-3.5 h-3.5" />
                          <span>PNG</span>
                        </button>
                        <button
                          onClick={() => {
                            exportToSVG();
                            setIsSettingsOpen(false);
                          }}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100/60 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          <Codepen className="w-3.5 h-3.5" />
                          <span>SVG</span>
                        </button>
                      </div>
                    </div>

                    {/* Reset Canvas */}
                    <div className="border-t border-slate-200/20 dark:border-slate-800/15 pt-2">
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to clear your entire whiteboard canvas?')) {
                            clearCanvas();
                            setIsSettingsOpen(false);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-500 hover:bg-red-650 text-white font-medium rounded-lg text-[11px] hover:scale-[1.01] transition active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Board</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme Selector */}
            <button
              id="btn-theme-selector"
              onClick={() => setIsDarkMode(prev => !prev)}
              className="p-2.5 bg-white/45 dark:bg-slate-950/45 backdrop-blur-xl border border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-900/60 rounded-xl shadow-lg transition text-slate-600 dark:text-slate-350 cursor-pointer"
              title="Switch Day / Night style theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Shortcuts Modal opener */}
            <button
              id="btn-shortcuts-opener"
              onClick={() => setIsShortcutsOpen(true)}
              className="p-2.5 bg-white/45 dark:bg-slate-950/45 backdrop-blur-xl border border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-900/60 rounded-xl shadow-lg transition text-slate-600 dark:text-slate-350 flex items-center gap-1.5 cursor-pointer"
              title="Whiteboard keyboard rules and info modal guides"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-mono font-medium hidden sm:inline">Guides</span>
            </button>
          </div>
        </header>

        {/* FLOAT BAR TOOLBAR BOTTOM CENTERED (Simplified and Optimized single bar) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 w-max max-w-[92vw]">
          <Toolbar
            currentTool={currentTool}
            setTool={handleQuickPresetSelection}
            color={color}
            setColor={changeColor}
            fillColor={fillColor}
            setFillColor={changeFillColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={changeStrokeWidth}
            strokeStyle={strokeStyle}
            setStrokeStyle={changeStrokeStyle}
            fontSize={fontSize}
            setFontSize={changeFontSize}
            onAddImage={handleAddImage}
          />
        </div>

        {/* RESPONSIVE FLOATING NAVIGATION DOCK (BOTTOM RIGHT CORES) */}
        <div className="absolute top-20 right-4 md:top-auto md:bottom-6 md:right-6 z-10 flex flex-col items-center gap-2.5 pointer-events-auto">
          {/* Touch Joystick Panner Hand Gripper */}
          <div 
            className="w-14 h-14 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-xl flex items-center justify-center relative select-none cursor-grab active:cursor-grabbing group overflow-visible"
            title="Hand Gripper joystick: Hold & drag to pan board in any direction instantly"
          >
            {/* Compass guides indicators */}
            <div className="absolute inset-1 border border-dashed border-slate-200/40 dark:border-slate-800/20 rounded-full pointer-events-none" />
            <div className="absolute top-1 text-[7px] text-slate-400 font-bold tracking-wider select-none pointer-events-none uppercase">U</div>
            <div className="absolute bottom-1 text-[7px] text-slate-400 font-bold tracking-wider select-none pointer-events-none uppercase">D</div>
            <div className="absolute left-1.5 text-[7px] text-slate-400 font-bold tracking-wider select-none pointer-events-none uppercase">L</div>
            <div className="absolute right-1.5 text-[7px] text-slate-400 font-bold tracking-wider select-none pointer-events-none uppercase">R</div>
            
            {/* Visual joystick handle knob */}
            <div
              onPointerDown={handleJoystickDown}
              onPointerMove={handleJoystickMove}
              onPointerUp={handleJoystickUp}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isGripping 
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 scale-105 shadow-md shadow-slate-950/20' 
                  : 'bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm'
              }`}
              style={{
                transform: `translate(${joyPos.x}px, ${joyPos.y}px)`,
                touchAction: 'none'
              }}
            >
              <Hand className={`w-4 h-4 ${isGripping ? 'animate-pulse' : ''}`} />
            </div>

            {/* Hint label tooltip */}
            <div className="absolute right-16 scale-0 group-hover:scale-100 transition-all origin-right bg-slate-800 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap shadow-md pointer-events-none tracking-wide">
              Hand Gripper <span className="text-slate-400">Drag to Pan</span>
            </div>
          </div>

          {/* Zoom & Fit Control Controls panel */}
          <div className="flex items-center gap-1 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-1 shadow-xl text-xs">
            {/* Zoom Out Button */}
            <button
              onClick={zoomOut}
              className="w-7.5 h-7.5 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-950 dark:hover:text-white transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            
            {/* Scale Percent Indicator and Fit To Screen toggle */}
            <button
              onClick={fitToScreen}
              className="px-1.5 h-7.5 font-mono font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] min-w-14 text-center transition text-slate-700 dark:text-slate-350 cursor-pointer flex flex-col justify-center items-center group/btn relative"
              title="Fit to Screen/Center view"
            >
              <span className="leading-tight">{Math.round(scale * 100)}%</span>
              <span className="text-[7.5px] text-blue-500 dark:text-blue-400 uppercase tracking-widest font-bold font-sans">Fit</span>
            </button>
            
            {/* Zoom In Button */}
            <button
              onClick={zoomIn}
              className="w-7.5 h-7.5 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-950 dark:hover:text-white transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* WHITEBOARD HTML5 CANVAS INTERACTIVE STAGE */}
        <div 
          className="w-full h-full select-none relative bg-[#f8fafc] dark:bg-[#07080b]"
          style={{ cursor: getCanvasCursor() }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerCancel}
            onWheel={handleWheel}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="block w-full h-full"
          />

          {/* QUICK EDIT FLOATING INTERACTIVE MENU PANEL FOR SELECTED WHITEBOARD ELEMENTS */}
          {floatMenuPos && selectedElement && (
            <div
              className="absolute z-40 flex items-center gap-1 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-slate-200/50 dark:border-slate-800/40 animate-scale-up text-[10px] sm:text-xs pointer-events-auto"
              style={{
                left: `${floatMenuPos.left}px`,
                top: `${floatMenuPos.top}px`,
              }}
            >
              {/* If Selected Element is a Sketch (Pen or Highlighter) */}
              {(selectedElement.type === 'pen' || selectedElement.type === 'highlighter') && (
                <>
                  <button
                    onClick={handleSmoothSelectedSketch}
                    className="flex items-center gap-1 px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-350 transition font-medium cursor-pointer"
                    title="Smooth/Beautify shaky stroke points"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Smooth</span>
                  </button>

                  <button
                    onClick={handleTogglePenType}
                    className="flex items-center gap-1 px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-350 transition font-medium cursor-pointer border-r border-slate-200/40 dark:border-slate-800/30 pr-1.5"
                    title="Toggle pen solid stroke vs highlighter transparency"
                  >
                    <span className="font-mono text-[9px] px-1 bg-slate-150 dark:bg-slate-800 rounded">
                      {selectedElement.type === 'pen' ? 'Pen' : 'Highlighter'}
                    </span>
                    <span>Toggle</span>
                  </button>

                  {/* Convert Sketch to Vector Option Choices */}
                  <div className="flex items-center gap-1 border-r border-slate-200/40 dark:border-slate-800/30 px-1.5 opacity-90 hover:opacity-100 transition">
                    <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider select-none shrink-0 mr-0.5">Auto-Convert:</span>
                    <button
                      onClick={() => handleConvertSketchToShape('rectangle')}
                      className="px-1 py-0.5 bg-slate-100/60 dark:bg-slate-800/50 hover:bg-slate-200/70 rounded text-[9px] font-mono border border-slate-200/30 dark:border-slate-800/15 cursor-pointer"
                      title="Convert to perfect rectangle"
                    >
                      Rect
                    </button>
                    <button
                      onClick={() => handleConvertSketchToShape('ellipse')}
                      className="px-1 py-0.5 bg-slate-100/60 dark:bg-slate-800/50 hover:bg-slate-200/70 rounded text-[9px] font-mono border border-slate-200/30 dark:border-slate-800/15 cursor-pointer"
                      title="Convert to perfect circle"
                    >
                      Circle
                    </button>
                    <button
                      onClick={() => handleConvertSketchToShape('line')}
                      className="px-1 py-0.5 bg-slate-100/60 dark:bg-slate-800/50 hover:bg-slate-200/70 rounded text-[9px] font-mono border border-slate-200/30 dark:border-slate-800/15 cursor-pointer"
                      title="Convert to straight line"
                    >
                      Line
                    </button>
                    <button
                      onClick={() => handleConvertSketchToShape('arrow')}
                      className="px-1 py-0.5 bg-slate-100/60 dark:bg-slate-800/50 hover:bg-slate-200/70 rounded text-[9px] font-mono border border-slate-200/30 dark:border-slate-800/15 cursor-pointer"
                      title="Convert to arrow"
                    >
                      Arrow
                    </button>
                  </div>
                </>
              )}

              {/* Standard actions for all types of elements */}
              <div className="flex items-center gap-1 pl-1">
                <button
                  onClick={handleDuplicateSelected}
                  className="flex items-center gap-1 px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-350 transition font-medium cursor-pointer"
                  title="Make an offset duplicate of this element"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Duplicate</span>
                </button>

                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 px-1.5 py-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 rounded-lg transition font-medium cursor-pointer"
                  title="Erase or remove this element"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* ON-SCREEN FLOATING ABSOLUTE INPUT PORT FOR TEXT & STICKY NOTES WRITING */}
          {editingTextId !== null && (
            <div
              className="absolute z-40 p-2 rounded-xl bg-white/75 dark:bg-slate-950/75 backdrop-blur-md shadow-2xl border border-white/30 dark:border-white/10 animate-scale-up"
              style={{
                left: `${inputStyleLeft}px`,
                top: `${inputStyleTop}px`,
                width: `${inputStyleWidth}px`,
                height: `${inputStyleHeight}px`,
              }}
            >
              <textarea
                value={editingTextVal}
                onChange={e => setEditingTextVal(e.target.value)}
                onBlur={dismissTextEditing}
                placeholder="Type board notes here..."
                className="w-full h-full resize-none border-none outline-none focus:ring-0 text-slate-800 dark:text-white bg-transparent scrollbar-thin text-xs"
                style={{
                  fontSize: `${Math.max(10, fontSize * scale)}px`,
                  fontFamily: 'inherit',
                }}
                autoFocus
              />
              <div className="absolute right-2 bottom-1.5 text-[9px] text-slate-400 font-mono">
                Click away to commit
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HELPFUL HOTKEYS MODAL GUIDES */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
