/**
 * 🔐 Device Fingerprinting Library
 * Generates unique device identifier from multiple browser signals
 * Used for security tracking and ban evasion detection
 */

/**
 * Main function: Generate composite device fingerprint
 * Combines multiple browser APIs for maximum uniqueness
 */
export async function generateDeviceFingerprint(): Promise<string> {
  try {
    const components = {
      // Basic browser info
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages ? navigator.languages.join(',') : '',
      
      // Timezone & location hints
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      
      // Screen properties (hardware-specific)
      screenResolution: `${screen.width}x${screen.height}`,
      availableScreenResolution: `${screen.availWidth}x${screen.availHeight}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      
      // Hardware capabilities
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || 0,
      
      // Advanced fingerprints (hard to fake)
      canvas: await getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      audio: await getAudioFingerprint(),
      fonts: await getFontsFingerprint(),
      
      // Input capabilities
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      
      // Browser features
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unknown',
      
      // Storage
      localStorage: typeof(Storage) !== 'undefined',
      sessionStorage: typeof(Storage) !== 'undefined',
      indexedDB: !!window.indexedDB,
    };
    
    // Combine all components into single string
    const combined = JSON.stringify(components);
    
    // Hash using SHA-256 (Web Crypto API)
    const hashHex = await hashString(combined);
    
    return hashHex;
  } catch (error) {
    console.error('Device fingerprint generation failed:', error);
    // Fallback to simpler fingerprint
    return await generateFallbackFingerprint();
  }
}

/**
 * Canvas Fingerprinting
 * Draws text/shapes on canvas - rendering differs by GPU/OS
 */
async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return 'no-canvas';
    
    // Draw text with specific font/color
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('Lyvo Security 🔒', 2, 2);
    
    // Draw additional shapes
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillRect(100, 0, 100, 50);
    
    // Get canvas data URL (varies by hardware)
    const dataUrl = canvas.toDataURL();
    
    // Hash the canvas output
    return await hashString(dataUrl);
  } catch {
    return 'canvas-error';
  }
}

/**
 * WebGL Fingerprinting
 * GPU vendor/renderer info (very hardware-specific)
 */
/**
 * WebGL Fingerprinting
 * GPU vendor/renderer info (very hardware-specific)
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    
    if (!gl) return 'no-webgl';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      // Fallback: supported extensions
      const extensions = gl.getSupportedExtensions();
      return extensions ? extensions.join(',').slice(0, 50) : 'no-debug';
    }
    
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    return `${vendor}|${renderer}`.slice(0, 100);
  } catch {
    return 'webgl-error';
  }
}
/**
 * Audio Fingerprinting
 * Audio processing varies by hardware
 */
async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return 'no-audio-context';
    
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gainNode = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
    
    gainNode.gain.value = 0; // Mute
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;
    
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(0);
    
    const audioData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(audioData);
    
    oscillator.stop();
    await context.close();
    
    // Sample first 10 values
    const sample = Array.from(audioData.slice(0, 10)).join(',');
    return await hashString(sample);
  } catch {
    return 'audio-error';
  }
}

/**
 * Font Fingerprinting
 * Detect installed fonts (OS-specific)
 */
async function getFontsFingerprint(): Promise<string> {
  try {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
      'Arial', 'Verdana', 'Times New Roman', 'Courier New',
      'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS',
      'Trebuchet MS', 'Impact', 'Lucida Console', 'Tahoma'
    ];
    
    const detected: string[] = [];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    // Get baseline widths
    const baselines: { [key: string]: number } = {};
    for (const baseFont of baseFonts) {
      ctx.font = `${testSize} ${baseFont}`;
      baselines[baseFont] = ctx.measureText(testString).width;
    }
    
    // Test each font
    for (const font of testFonts) {
      let detected_font = false;
      
      for (const baseFont of baseFonts) {
        ctx.font = `${testSize} "${font}", ${baseFont}`;
        const width = ctx.measureText(testString).width;
        
        if (width !== baselines[baseFont]) {
          detected_font = true;
          break;
        }
      }
      
      if (detected_font) {
        detected.push(font);
      }
    }
    
    return detected.sort().join(',');
  } catch {
    return 'font-error';
  }
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch {
    //  Better fallback: use timestamp + random instead of weak hash
    console.warn('SHA-256 not available, using timestamp fallback');
    const fallback = `${Date.now()}_${Math.random().toString(36)}_${str.length}`;
    // Simple hash as last resort (but add more entropy)
    let hash = 5381;
    for (let i = 0; i < fallback.length; i++) {
      hash = ((hash << 5) + hash) + fallback.charCodeAt(i);
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
}

/**
 * Fallback fingerprint (if advanced methods fail)
 * Still secure - uses crypto API + session randomness
 */
async function generateFallbackFingerprint(): Promise<string> {
  const simple = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages?.join(',') || '',
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || 0,
    // ✅ Add session-unique component (prevents replay attacks)
    sessionId: crypto.getRandomValues(new Uint8Array(16)).join(''),
    timestamp: Date.now()
  };
  
  // ✅ Use crypto.subtle.digest even for fallback (not weak hash)
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(simple));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // ✅ Last resort: still use timestamp + random (better than predictable)
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    // Try to hash it one more time
    try {
      return await hashString(fallbackId);
    } catch {
      return fallbackId;
    }
  }
}

/**
 * Test if device fingerprinting is working
 * Returns fingerprint + all components for debugging
 */
export async function testDeviceFingerprint(): Promise<{
  fingerprint: string;
  components: any;
}> {
  const fingerprint = await generateDeviceFingerprint();
  
  const components = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    canvas: await getCanvasFingerprint(),
    webgl: getWebGLFingerprint(),
    audio: await getAudioFingerprint(),
    fonts: await getFontsFingerprint(),
  };
  
  return { fingerprint, components };
}