import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, Camera, AlertCircle, Smartphone, Wifi } from 'lucide-react';
import { Button } from './Button';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  onError,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHttps, setIsHttps] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [errorCount, setErrorCount] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState(0);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const errorReportedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Function to play beep sound on successful scan
  const playBeepSound = () => {
    try {
      // Resume AudioContext if it's suspended (required after user interaction)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      // Create AudioContext if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure beep sound (loud, attention-grabbing beep at 1000Hz)
      oscillator.frequency.value = 1000;
      oscillator.type = 'sine';
      
      // Set volume envelope (quick attack, quick release) - maximum volume
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(1.0, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      // Play the beep (slightly longer for better audibility)
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Silently fail if audio is not supported or user hasn't interacted
      console.warn('Could not play beep sound:', error);
    }
  };

  // Check HTTPS requirement and request camera permission
  useEffect(() => {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    setIsHttps(isSecure);
    
    // Check camera permission
    const checkPermission = async () => {
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermission(result.state);
        } catch {
          setCameraPermission('unknown');
        }
      }
    };

    checkPermission();
  }, []);

  // Request camera permission and enumerate cameras when modal opens
  useEffect(() => {
    if (!isOpen || !isHttps) return;

    const requestCameraAccess = async () => {
      try {
        // Request camera permission by trying to access the camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach(track => track.stop());
        
        setCameraPermission('granted');
        setHasRequestedPermission(true);
        
        // Now enumerate cameras (will have labels after permission is granted)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(cameras);
        
        // Auto-select back camera if available, otherwise first camera
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        );
        
        if (backCamera) {
          setSelectedCamera(backCamera.deviceId);
        } else if (cameras.length > 0) {
          setSelectedCamera(cameras[0].deviceId);
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setHasRequestedPermission(true);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraPermission('denied');
          setError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setCameraPermission('denied');
          setError('No camera found. Please ensure your device has a camera.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera is already in use by another application.');
        } else {
          setError('Failed to access camera. Please check your device settings.');
        }
      }
    };

    if (!hasRequestedPermission) {
      requestCameraAccess();
    }
  }, [isOpen, isHttps, hasRequestedPermission]);

  // Clean up scanner when modal closes
  useEffect(() => {
    if (!isOpen && scannerRef.current) {
      setIsScanning(false);
      
      const cleanupScanner = async () => {
        try {
          const scanner = scannerRef.current;
          if (!scanner) return;

          const scannerAny = scanner as any;
          
          // Try multiple ways to access and stop the internal Html5Qrcode instance
          let html5Qrcode = null;
          
          // Method 1: Direct property access
          if (scannerAny._html5Qrcode) {
            html5Qrcode = scannerAny._html5Qrcode;
          }
          // Method 2: Alternative property name
          else if (scannerAny.html5Qrcode) {
            html5Qrcode = scannerAny.html5Qrcode;
          }
          // Method 3: Check all properties for Html5Qrcode instance
          else {
            for (const key in scannerAny) {
              if (scannerAny[key] && typeof scannerAny[key] === 'object' && typeof scannerAny[key].stop === 'function') {
                html5Qrcode = scannerAny[key];
                break;
              }
            }
          }
          
          // Stop the internal scanner if we found it
          if (html5Qrcode && typeof html5Qrcode.stop === 'function') {
            try {
              await html5Qrcode.stop();
              // Give it a moment to fully stop
              await new Promise(resolve => setTimeout(resolve, 150));
            } catch (stopErr) {
              // Ignore stop errors - scanner might already be stopped
            }
          }

          // Now try to clear the scanner with retry logic
          let retries = 3;
          let cleared = false;
          
          while (retries > 0 && scannerRef.current && !cleared) {
            try {
              scannerRef.current.clear();
              cleared = true;
            } catch (clearErr: any) {
              retries--;
              
              // If it's the "scan is ongoing" error and we have retries left
              if (clearErr.message && clearErr.message.includes('scan is ongoing') && retries > 0) {
                // Wait longer and try to stop again
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Try to stop again if we have html5Qrcode
                if (html5Qrcode && typeof html5Qrcode.stop === 'function') {
                  try {
                    await html5Qrcode.stop();
                    await new Promise(resolve => setTimeout(resolve, 200));
                  } catch (retryStopErr) {
                    // Ignore
                  }
                }
                continue; // Retry clearing
              }
              
              // If it's not the "scan is ongoing" error or we're out of retries
              if (!clearErr.message?.includes('scan is ongoing') && !clearErr.message?.includes('already')) {
                console.warn('Scanner cleanup warning:', clearErr);
              }
              // Even if clear fails, we should null the ref to prevent memory leaks
              break;
            }
          }
          
          scannerRef.current = null;
        } catch (err) {
          // If anything fails, just null the ref
          scannerRef.current = null;
        }
      };

      cleanupScanner();
    }
  }, [isOpen]);

  // Reset error state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setErrorCount(0);
      setLastErrorTime(0);
      errorReportedRef.current = false;
    } else {
      // Reset permission request state when modal closes
      setHasRequestedPermission(false);
    }
  }, [isOpen]);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (error) {
          // Ignore errors during cleanup
        }
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && !scannerRef.current && isHttps && cameraPermission === 'granted' && hasRequestedPermission) {
      // Wait for the DOM element to be available
      const initScanner = () => {
        const scannerElement = document.getElementById('barcode-scanner');
        if (!scannerElement) {
          // If element doesn't exist, try again in next tick
          setTimeout(initScanner, 100);
          return;
        }

        // Mobile-optimized configuration with better error handling
        const config = {
          fps: 10, // Good balance for webcam and mobile
          qrbox: { width: 280, height: 280 }, // Larger for mobile
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          useBarCodeDetectorIfSupported: true, // Enable for better barcode detection
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          },
          rememberLastUsedCamera: true,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          // Camera constraints for better device selection
          videoConstraints: selectedCamera ? {
            deviceId: { exact: selectedCamera }
          } : {
            facingMode: "environment" // Prefer back camera on mobile, webcam on desktop
          }
        };

        try {
          scannerRef.current = new Html5QrcodeScanner(
            'barcode-scanner',
            config,
            false // verbose = false for cleaner logs
          );

          scannerRef.current.render(
            (decodedText) => {
              // Play beep sound on successful scan
              playBeepSound();
              onScan(decodedText);
              setIsScanning(false);
              onClose();
            },
            (error) => {
              const now = Date.now();
              const timeSinceLastError = now - lastErrorTime;
              
              // Ignore common scanning errors that don't indicate a real problem
              // These are just "no barcode found" errors during scanning
              if (error.includes('NotFoundException') || 
                  error.includes('QR code parse error') ||
                  error.includes('No MultiFormat Readers')) {
                // These are normal scanning errors, don't report them
                return;
              }
              
              // Throttle error handling to prevent spam - only process critical errors
              if (timeSinceLastError < 2000) { // Only process errors once per 2 seconds
                return;
              }
              
              setLastErrorTime(now);
              setErrorCount(prev => prev + 1);
              
              // Only report critical errors once
              if (errorReportedRef.current) {
                return;
              }
              
              // Handle critical errors that indicate a real problem
              if (error.includes('Permission denied') || error.includes('NotAllowedError')) {
                setError('Camera permission denied. Please allow camera access in your browser settings.');
                if (!errorReportedRef.current) {
                  errorReportedRef.current = true;
                  onError?.('Camera permission denied');
                }
              } else if (error.includes('NotFoundError')) {
                setError('No camera found. Please ensure your device has a camera.');
                if (!errorReportedRef.current) {
                  errorReportedRef.current = true;
                  onError?.('No camera found');
                }
              } else if (error.includes('NotReadableError')) {
                setError('Camera is already in use by another application.');
                if (!errorReportedRef.current) {
                  errorReportedRef.current = true;
                  onError?.('Camera in use');
                }
              } else if (error.includes('Camera not supported')) {
                setError('Camera not supported. Please use a device with a camera.');
                if (!errorReportedRef.current) {
                  errorReportedRef.current = true;
                  onError?.('Camera not supported');
                }
              }
            }
          );

          setIsScanning(true);
        } catch (err: any) {
          console.error('Failed to initialize barcode scanner:', err);
          setError('Failed to initialize camera. Please try again.');
          if (!errorReportedRef.current) {
            errorReportedRef.current = true;
            onError?.('Scanner initialization failed');
          }
        }
      };

      // Start initialization
      initScanner();
    }

    return () => {
      // Cleanup is primarily handled when isOpen becomes false
      // This cleanup handles dependency changes (like camera selection change)
      if (scannerRef.current && !isOpen) {
        setIsScanning(false);
        const cleanup = async () => {
          try {
            const scannerAny = scannerRef.current as any;
            if (!scannerAny) return;
            
            // Try to find and stop the internal scanner
            let html5Qrcode = scannerAny._html5Qrcode || scannerAny.html5Qrcode;
            if (!html5Qrcode) {
              for (const key in scannerAny) {
                if (scannerAny[key] && typeof scannerAny[key] === 'object' && typeof scannerAny[key].stop === 'function') {
                  html5Qrcode = scannerAny[key];
                  break;
                }
              }
            }
            
            if (html5Qrcode && typeof html5Qrcode.stop === 'function') {
              try {
                await html5Qrcode.stop();
                await new Promise(resolve => setTimeout(resolve, 150));
              } catch (stopErr) {
                // Ignore
              }
            }
            
            // Try to clear with retry
            let retries = 2;
            while (retries > 0 && scannerRef.current) {
              try {
                scannerRef.current.clear();
                break;
              } catch (clearErr: any) {
                retries--;
                if (clearErr.message?.includes('scan is ongoing') && retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 200));
                  continue;
                }
                break;
              }
            }
            scannerRef.current = null;
          } catch (err) {
            scannerRef.current = null;
          }
        };
        cleanup();
      }
    };
  }, [isOpen, onScan, onClose, onError, isHttps, cameraPermission, hasRequestedPermission, selectedCamera, lastErrorTime, errorCount]);

  if (!isOpen) return null;

  // Show HTTPS warning if not secure
  if (!isHttps) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center py-8 px-4 overflow-y-auto">
        <div className="relative w-full max-w-md mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Camera Access Required
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="!p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 text-center">
              <Wifi className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                HTTPS Required
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Camera access requires a secure connection (HTTPS). Please access this app through a secure URL.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>For mobile access:</strong> Use your computer's IP address with HTTPS or set up a secure domain.
                </p>
              </div>
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center py-8 px-4 overflow-y-auto">
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scan Barcode
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="!p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4">
            {!hasRequestedPermission ? (
              <div className="text-center py-8">
                <Camera className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Requesting camera access...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Please allow camera access when prompted
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                {error.includes('permission') && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>How to enable camera access:</strong>
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 text-left">
                      <li>• Tap the camera icon in your browser's address bar</li>
                      <li>• Select "Allow" for camera access</li>
                      <li>• Refresh the page and try again</li>
                    </ul>
                  </div>
                )}
                <Button onClick={onClose}>Close</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <Camera className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Position the barcode within the frame
                  </p>
                  {cameraPermission === 'denied' && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Camera permission denied. Please enable in browser settings.
                    </p>
                  )}
                  
                  {/* Camera Selection */}
                  {availableCameras.length > 1 && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Select Camera:
                      </label>
                      <select
                        value={selectedCamera}
                        onChange={(e) => setSelectedCamera(e.target.value)}
                        className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        aria-label="Select camera for barcode scanning"
                      >
                        {availableCameras.map((camera) => (
                          <option key={camera.deviceId} value={camera.deviceId}>
                            {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div 
                  id="barcode-scanner" 
                  key={isOpen ? 'scanner-open' : 'scanner-closed'}
                  className="w-full" 
                />
                {isScanning && (
                  <div className="text-center">
                    <div className="animate-pulse text-primary-600">
                      Scanning...
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <Smartphone className="h-4 w-4 inline mr-1" />
                    Mobile optimized for better scanning
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
