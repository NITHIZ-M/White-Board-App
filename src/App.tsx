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
  Sliders,
  Sparkles,
  Copy,
  User,
  Pencil,
  Highlighter,
  Square,
  Circle,
  Minus,
  ArrowUpRight,
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
import ProfileModal from './components/ProfileModal';
import PermissionModal from './components/PermissionModal';

const SAVE_KEY = 'doodle_space_v1_pages';
const THEME_KEY = 'doodle_space_theme';

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
      text: 'Doodle Space',
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
      text: 'Make a Doodle - infinite zoom & pan vector Doodle canvas.',
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

const smoothPenPoints = (points: { x: number; y: number }[]): { x: number; y: number }[] => {
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

const DEFAULT_PAGES: NotePage[] = [
  {
    id: 'default-onboarding',
    title: 'Welcome Doodle',
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Guest Artist',
    role: 'Creative Explorer'
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('doodle_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile({
          name: parsed.name || 'Guest Artist',
          role: parsed.role || 'Creative Explorer'
        });
      }
    } catch (e) {
      // ignore
    }
  }, [isProfileOpen]);

  // ORIENTATION STATE FOR LANDSCAPE SAFE AREAS
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscapeMobile(window.innerWidth > window.innerHeight && window.innerHeight < 600);
    };
    window.addEventListener('resize', checkOrientation);
    checkOrientation();
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // PERMISSIONS SYSTEM
  const [permissions, setPermissions] = useState(() => {
    try {
      const saved = localStorage.getItem('doodle_space_permissions');
      return saved ? JSON.parse(saved) : { storage: true, export: false, import: false };
    } catch {
      return { storage: true, export: false, import: false };
    }
  });

  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [permissionType, setPermissionType] = useState<'export' | 'import'>('export');
  const [onPermissionGrantedCallback, setOnPermissionGrantedCallback] = useState<(() => void) | null>(null);

  const handleRequestPermission = (type: 'export' | 'import', onGranted: () => void) => {
    if (permissions[type]) {
      onGranted();
    } else {
      setPermissionType(type);
      setOnPermissionGrantedCallback(() => onGranted);
      setPermissionModalOpen(true);
    }
  };

  const handleGrantPermission = () => {
    const updated = { ...permissions, [permissionType]: true };
    setPermissions(updated);
    try {
      localStorage.setItem('doodle_space_permissions', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save permissions to localStorage', e);
    }
    if (onPermissionGrantedCallback) {
      onPermissionGrantedCallback();
    }
    setOnPermissionGrantedCallback(null);
  };

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

  const debounceSyncRef = useRef<any>(null);
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

  // Helper to commit current freehand pen/highlighter sketch stroke to elements state
  const commitCurrentStroke = useCallback(() => {
    if (isDrawing && (currentTool === 'pen' || currentTool === 'highlighter') && drawingPoints.length >= 2) {
      // Smooth the sketch points to eliminate hand shaking/jittering automatically on release
      const smoothed = smoothPenPoints(drawingPoints);

      const minX = Math.min(...smoothed.map(p => p.x));
      const maxX = Math.max(...smoothed.map(p => p.x));
      const minY = Math.min(...smoothed.map(p => p.y));
      const maxY = Math.max(...smoothed.map(p => p.y));

      const newElId = generateId();
      const newPenElement: BoardElement = {
        id: newElId,
        type: currentTool,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        points: smoothed,
        color,
        fillColor: 'transparent',
        strokeWidth: currentTool === 'highlighter' ? strokeWidth * 2.5 : strokeWidth,
        strokeStyle,
        opacity: currentTool === 'highlighter' ? 0.45 : 1.0,
        createdAt: Date.now(),
      };

      saveHistoryState(activePage.elements);
      setPages(prev =>
        prev.map(p =>
          p.id === activePageId ? { ...p, elements: [...p.elements, newPenElement], updatedAt: Date.now() } : p
        )
      );
      setSelectedId(newElId);
    }
    setIsDrawing(false);
    setDrawingPoints([]);
  }, [isDrawing, currentTool, drawingPoints, color, strokeWidth, strokeStyle, activePage?.elements, activePageId, saveHistoryState]);

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
          if (el.points.length === 2) {
            ctx.lineTo(el.points[1].x, el.points[1].y);
          } else {
            for (let i = 1; i < el.points.length - 1; i++) {
              const xc = (el.points[i].x + el.points[i + 1].x) / 2;
              const yc = (el.points[i].y + el.points[i + 1].y) / 2;
              ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, xc, yc);
            }
            ctx.lineTo(el.points[el.points.length - 1].x, el.points[el.points.length - 1].y);
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
                const img = new window.Image();
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
          if (drawingPoints.length === 2) {
            ctx.lineTo(drawingPoints[1].x, drawingPoints[1].y);
          } else {
            for (let i = 1; i < drawingPoints.length - 1; i++) {
              const xc = (drawingPoints[i].x + drawingPoints[i + 1].x) / 2;
              const yc = (drawingPoints[i].y + drawingPoints[i + 1].y) / 2;
              ctx.quadraticCurveTo(drawingPoints[i].x, drawingPoints[i].y, xc, yc);
            }
            ctx.lineTo(drawingPoints[drawingPoints.length - 1].x, drawingPoints[drawingPoints.length - 1].y);
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

  // PREVENT NATIVE SCROLL AND ZOOM GESTURES ON CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefault);
      canvas.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  // REDRAW EFFECT ON RESIZE AND CHANGES (ORIENTATIONS SETTLE AUTOMATICALLY)
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      // Get current center in world coordinates before resize
      const prevDpr = window.devicePixelRatio || 1;
      const prevWidth = canvas.width / prevDpr;
      const prevHeight = canvas.height / prevDpr;

      let worldCenter: Point | null = null;
      if (prevWidth > 0 && prevHeight > 0) {
        const { scale: s, offsetX: ox, offsetY: oy } = viewportRef.current;
        worldCenter = {
          x: (prevWidth / 2 - ox) / s,
          y: (prevHeight / 2 - oy) / s,
        };
      }

      canvas.style.width = '100%';
      canvas.style.height = '100%';

      const dpr = window.devicePixelRatio || 1;
      const newWidth = parent.clientWidth;
      const newHeight = parent.clientHeight;
      canvas.width = newWidth * dpr;
      canvas.height = newHeight * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Restore centered layout on screen ratio orientation updates
      if (worldCenter) {
        const { scale: s } = viewportRef.current;
        const newOffsetX = newWidth / 2 - worldCenter.x * s;
        const newOffsetY = newHeight / 2 - worldCenter.y * s;
        setOffsetX(newOffsetX);
        setOffsetY(newOffsetY);
      }

      drawAll();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [drawAll]);

  // SCHEDULED RENDERING LOOP USING requestAnimationFrame FOR HIGH-FPS CANVAS DRAWING
  const drawAllRef = useRef(drawAll);
  useEffect(() => {
    drawAllRef.current = drawAll;
  }, [drawAll]);

  useEffect(() => {
    let frameId: number;
    const scheduleDraw = () => {
      frameId = requestAnimationFrame(() => {
        drawAllRef.current();
      });
    };
    scheduleDraw();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
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
      // Keyup handling
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
  };

  /**
   * POINTER INTERACTIONS ENGINE
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn('Pointer capture failed:', err);
    }

    const nativeEvent = e.nativeEvent;
    // Track pointer
    activePointersRef.current = [...activePointersRef.current.filter(p => p.pointerId !== nativeEvent.pointerId), nativeEvent];

    if (activePointersRef.current.length === 2) {
      commitCurrentStroke(); // Commit active pen stroke before pinch zoom
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

    const activeToolValue = currentTool;

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
      if (hit && (hit.type === 'text' || hit.type === 'sticky')) {
        // Double clicked or editing click on text/sticky
        setEditingTextId(hit.id);
        const isDefaultText = hit.text && hit.text.toLowerCase() === 'clean notes';
        setEditingTextVal(isDefaultText ? '' : hit.text || '');
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
      setEditingTextVal('');
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

    const activeToolValue = currentTool;

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
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
    commitCurrentStroke(); // Auto-save stroke on cancel/interrupt
    activePointersRef.current = [];
    pinchStartDistRef.current = null;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const nativeEvent = e.nativeEvent;
    
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
    
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

    const activeToolValue = currentTool;

    if (activeToolValue === 'pan') {
      setIsDrawing(false);
      syncViewportToActivePage();
      return;
    }

    if (activeToolValue === 'select') {
      setIsDrawing(false);
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
      commitCurrentStroke();
      return;
    }

    if (['rectangle', 'ellipse', 'line', 'arrow'].includes(activeToolValue)) {
      setIsDrawing(false);
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

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const worldCoord = getCoordinatesFromScreen(e.clientX, e.clientY);
    const hit = getElementAtPosition(worldCoord);
    if (hit && (hit.type === 'text' || hit.type === 'sticky')) {
      setEditingTextId(hit.id);
      const isDefaultText = hit.text && hit.text.toLowerCase() === 'clean notes';
      setEditingTextVal(isDefaultText ? '' : hit.text || '');
      setEditingTextPos({ x: hit.x, y: hit.y });
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
        
        const el = p.elements.find(e => e.id === editingTextId);
        if (!el) return p;

        if (!trimmedValue) {
          if (el.type === 'sticky') {
            return {
              ...p,
              elements: p.elements.map(e => {
                if (e.id !== editingTextId) return e;
                return { ...e, text: 'Clean notes' };
              }),
            };
          }
          // Remove if completely blank
          return { ...p, elements: p.elements.filter(e => e.id !== editingTextId) };
        }
        return {
          ...p,
          elements: p.elements.map(item => {
            if (item.id !== editingTextId) return item;
            return {
              ...item,
              text: trimmedValue,
              width: item.type === 'sticky' ? item.width : 280, // standardized widths
              height: item.type === 'sticky' ? item.height : Math.max(40, Math.ceil(trimmedValue.length / 15) * 24),
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
    if (confirm('Clear all drawings and notes on this Doodle?')) {
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
      title: titleText || `Sketch Doodle ${pages.length + 1}`,
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
    dlAnchorElem.setAttribute('download', `doodle_space_backup_${Date.now()}.json`);
    dlAnchorElem.click();
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
            const tempImg = new window.Image();
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
      const tempImg = new window.Image();
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
              const tempImg = new window.Image();
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

    // Float menu exactly above the selection box, or centered, with safe boundary limits
    let top = pNW.y - 50;
    // If it overlaps the top header, place it below the selected element
    if (top < 70) {
      top = pSE.y + 15;
    }
    // If it overflows the bottom of the screen, clamp it
    if (top > window.innerHeight - 85) {
      top = window.innerHeight - 135;
    }

    let left = (pNW.x + pSE.x) / 2 - 120;
    const menuWidth = (isLandscapeMobile || window.innerWidth < 640) ? 250 : 360;
    left = Math.max(10, Math.min(window.innerWidth - menuWidth - 10, left));
    
    floatMenuPos = { top, left };
  }

  const headerLeftClass = (isSidebarOpen && (window.innerWidth < 768 || isLandscapeMobile))
    ? isLandscapeMobile 
      ? "left-[calc(1rem+240px+env(safe-area-inset-left,0px))]"
      : "left-[calc(1rem+288px+env(safe-area-inset-left,0px))]"
    : "left-[calc(1rem+env(safe-area-inset-left,0px))]";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* SIDEBAR FOR NOTES ALBUM (RESPONSIVE DRAWER OVERLAY ON MOBILE) */}
      {isSidebarOpen && (
        <>
          {/* Backdrop on mobile or mobile landscape */}
          <div
            className={`${isLandscapeMobile ? 'fixed' : 'md:hidden fixed'} inset-0 z-30 bg-slate-950/25 backdrop-blur-[1.5px]`}
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className={`${isLandscapeMobile ? 'fixed z-40' : 'fixed md:relative z-40 md:z-auto'} inset-y-0 left-0 h-full shadow-2xl md:shadow-none bg-[#f8fafc] dark:bg-slate-950 animate-slide-in pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] border-r border-slate-200/40 dark:border-slate-800/20`}>
            <PageList
              pages={pages}
              activePageId={activePageId}
              onSelectPage={(id) => {
                syncViewportToActivePage();
                setActivePageId(id);
                if (window.innerWidth < 768 || isLandscapeMobile) {
                  setIsSidebarOpen(false);
                }
              }}
              onCreatePage={(title) => {
                syncViewportToActivePage();
                createNewBoardPage(title);
                if (window.innerWidth < 768 || isLandscapeMobile) {
                  setIsSidebarOpen(false);
                }
              }}
              onRenamePage={renameBoardPage}
              onDeletePage={deleteBoardPage}
              onImportWorkspace={importFullWorkspace}
              onExportWorkspace={exportFullWorkspace}
              profileName={profile.name}
              profileRole={profile.role}
              onOpenProfile={() => setIsProfileOpen(true)}
              isLandscapeMobile={isLandscapeMobile}
              permissions={permissions}
              onRequestPermission={handleRequestPermission}
            />
          </div>
        </>
      )}

      {/* WEB APPLICATION CANVAS STAGE */}
      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER BRAND & STATS (LEFT COMPONENT) */}
        <header className={`absolute top-[calc(1rem+env(safe-area-inset-top,0px))] ${headerLeftClass} z-20 flex items-center gap-2 pointer-events-auto transition-all duration-300`}>
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
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-28 sm:max-w-44 font-mono uppercase">
              {activePage?.title || 'Doodle Board'}
            </span>
            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
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
        </header>

        {/* FIXED SETTINGS BUTTON IN THE TOP RIGHT CORNER */}
        <div className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] z-20 pointer-events-auto">
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

                  {/* Theme Mode Toggle (In settings) */}
                  <div className="flex items-center justify-between border-t border-slate-200/20 dark:border-slate-800/15 pt-3">
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-450 dark:text-slate-500">
                      Theme Mode
                    </span>
                    <button
                      onClick={() => setIsDarkMode(prev => !prev)}
                      className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-100/60 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg text-[10px] font-medium transition cursor-pointer text-slate-700 dark:text-slate-330"
                    >
                      {isDarkMode ? (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Dark Mode</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Keyboard Shortcuts Guides (In settings) */}
                  <div className="border-t border-slate-200/20 dark:border-slate-800/15 pt-3">
                    <button
                      onClick={() => {
                        setIsShortcutsOpen(true);
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100/60 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg text-[10px] font-semibold transition cursor-pointer text-slate-650 dark:text-slate-300"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Open Keyboard Guides</span>
                    </button>
                  </div>

                  {/* Reset Canvas */}
                  <div className="border-t border-slate-200/20 dark:border-slate-800/15 pt-2">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to clear your entire Doodle canvas?')) {
                          clearCanvas();
                          setIsSettingsOpen(false);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-500 hover:bg-red-650 text-white font-medium rounded-lg text-[11px] hover:scale-[1.01] transition active:scale-95 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Doodle</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* FLOAT BAR TOOLBAR BOTTOM OR SAFE CORNER */}
        {!(isProfileOpen || isShortcutsOpen || (isSidebarOpen && window.innerWidth < 768) || (isSidebarOpen && isLandscapeMobile)) && (
          <div className={isLandscapeMobile
            ? "absolute bottom-3 right-3 z-10 flex flex-col items-end gap-2 max-w-[45vw]"
            : "absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 w-max max-w-[92vw]"
          }>
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
        )}

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
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="block w-full h-full"
            style={{ touchAction: 'none' }}
          />

          {/* QUICK EDIT FLOATING INTERACTIVE MENU PANEL FOR SELECTED WHITEBOARD ELEMENTS */}
          {!(isProfileOpen || isShortcutsOpen || (isSidebarOpen && window.innerWidth < 768) || (isSidebarOpen && isLandscapeMobile)) && floatMenuPos && selectedElement && (
            <div
              className="absolute z-40 flex flex-nowrap items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-slate-200/50 dark:border-slate-800/40 animate-scale-up text-xs pointer-events-auto shrink-0 select-none"
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
                    className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-350 transition font-medium cursor-pointer shrink-0"
                    title="Smooth shaky stroke points"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {!isLandscapeMobile && window.innerWidth >= 640 && <span className="ml-1 text-[11px]">Smooth</span>}
                  </button>

                  <button
                    onClick={handleTogglePenType}
                    className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-350 transition font-medium cursor-pointer shrink-0 border-r border-slate-200/40 dark:border-slate-800/30 pr-2"
                    title="Toggle Pen vs Highlighter"
                  >
                    {selectedElement.type === 'pen' ? <Pencil className="w-4 h-4 text-violet-500" /> : <Highlighter className="w-4 h-4 text-violet-500" />}
                    {!isLandscapeMobile && window.innerWidth >= 640 && <span className="ml-1 text-[11px]">Toggle</span>}
                  </button>

                  {/* Convert Sketch to Vector Option Choices */}
                  <div className="flex items-center gap-1 border-r border-slate-200/40 dark:border-slate-800/30 px-1.5 opacity-90 hover:opacity-100 transition shrink-0">
                    {!isLandscapeMobile && window.innerWidth >= 640 && (
                      <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider select-none shrink-0 mr-1">
                        Convert:
                      </span>
                    )}
                    <button
                      onClick={() => handleConvertSketchToShape('rectangle')}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded cursor-pointer"
                      title="Convert to Rectangle"
                    >
                      <Square className="w-3.5 h-3.5 text-slate-600 dark:text-slate-350" />
                    </button>
                    <button
                      onClick={() => handleConvertSketchToShape('ellipse')}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded cursor-pointer"
                      title="Convert to Ellipse/Circle"
                    >
                      <Circle className="w-3.5 h-3.5 text-slate-600 dark:text-slate-350" />
                    </button>
                    <button
                      onClick={() => handleConvertSketchToShape('line')}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded cursor-pointer"
                      title="Convert to Line"
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-350" />
                    </button>
                    <button
                      onClick={() => handleConvertSketchToShape('arrow')}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded cursor-pointer"
                      title="Convert to Arrow"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-350" />
                    </button>
                  </div>
                </>
              )}

              {/* Standard actions for all types of elements */}
              <div className="flex items-center gap-1.5 pl-1 shrink-0">
                <button
                  onClick={handleDuplicateSelected}
                  className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-350 transition font-medium cursor-pointer shrink-0"
                  title="Make duplicate of this element"
                >
                  <Copy className="w-4 h-4" />
                  {!isLandscapeMobile && window.innerWidth >= 640 && <span className="ml-1 text-[11px]">Duplicate</span>}
                </button>

                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center justify-center p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 rounded-lg transition font-medium cursor-pointer shrink-0"
                  title="Erase or remove this element"
                >
                  <Trash2 className="w-4 h-4" />
                  {!isLandscapeMobile && window.innerWidth >= 640 && <span className="ml-1 text-[11px]">Delete</span>}
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
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <PermissionModal
        isOpen={permissionModalOpen}
        onClose={() => {
          setPermissionModalOpen(false);
          setOnPermissionGrantedCallback(null);
        }}
        onGrant={handleGrantPermission}
        type={permissionType}
      />
    </div>
  );
}
