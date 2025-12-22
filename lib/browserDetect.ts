/**
 * 🔍 Browser & OS Detection Utility
 * Auto-captures technical info when user submits bug
 */

/**
 * Detect user's browser name and version
 */
export function detectBrowser(): string {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  
  // Chrome
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    browser = match ? `Chrome ${match[1]}` : 'Chrome';
  }
  // Edge
  else if (userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+\.\d+)/);
    browser = match ? `Edge ${match[1]}` : 'Edge';
  }
  // Firefox
  else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    browser = match ? `Firefox ${match[1]}` : 'Firefox';
  }
  // Safari
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    browser = match ? `Safari ${match[1]}` : 'Safari';
  }
  // Opera
  else if (userAgent.includes('OPR') || userAgent.includes('Opera')) {
    const match = userAgent.match(/OPR\/(\d+\.\d+)/);
    browser = match ? `Opera ${match[1]}` : 'Opera';
  }
  
  return browser;
}

/**
 * Detect user's operating system
 */
export function detectOS(): string {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  // Windows
  if (userAgent.includes('Windows NT 10.0')) return 'Windows 10/11';
  if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
  if (userAgent.includes('Windows NT 6.2')) return 'Windows 8';
  if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
  if (userAgent.includes('Windows')) return 'Windows';
  
  // macOS
  if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    if (match) {
      const version = match[1].replace('_', '.');
      return `macOS ${version}`;
    }
    return 'macOS';
  }
  
  // Linux
  if (platform.includes('Linux') || userAgent.includes('Linux')) {
    return 'Linux';
  }
  
  // iOS
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const match = userAgent.match(/OS (\d+[._]\d+)/);
    if (match) {
      const version = match[1].replace('_', '.');
      return `iOS ${version}`;
    }
    return 'iOS';
  }
  
  // Android
  if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android (\d+\.\d+)/);
    return match ? `Android ${match[1]}` : 'Android';
  }
  
  return 'Unknown OS';
}

/**
 * Detect device type (desktop, mobile, tablet)
 */
export function detectDeviceType(): string {
  const userAgent = navigator.userAgent;
  
  // Tablet
  if (userAgent.includes('iPad') || 
      (userAgent.includes('Android') && !userAgent.includes('Mobile'))) {
    return 'tablet';
  }
  
  // Mobile
  if (userAgent.includes('Mobile') || 
      userAgent.includes('iPhone') || 
      userAgent.includes('Android')) {
    return 'mobile';
  }
  
  // Desktop
  return 'desktop';
} 

/**
 * Get all device info at once
 */
export function getDeviceInfo() {
  return {
    browser: detectBrowser(),
    os: detectOS(),
    deviceType: detectDeviceType(),
  };
}