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

  // Check HTTPS requirement and enumerate cameras
  useEffect(() => {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    setIsHttps(isSecure);
    
    // Check camera permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'camera' as PermissionName }).then((result) => {
        setCameraPermission(result.state);
      }).catch(() => {
        setCameraPermission('unknown');
      });
    }

    // Enumerate available cameras
    const enumerateCameras = async () => {
      try {
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
      } catch (error) {
        console.warn('Could not enumerate cameras:', error);
      }
    };

    enumerateCameras();
  }, []);

  // Reset error state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setErrorCount(0);
      setLastErrorTime(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !scannerRef.current && isHttps) {
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
              onScan(decodedText);
              setIsScanning(false);
              onClose();
            },
            (error) => {
              const now = Date.now();
              const timeSinceLastError = now - lastErrorTime;
              
              // Throttle error handling to prevent spam
              if (timeSinceLastError < 1000) { // Only process errors once per second
                return;
              }
              
              setLastErrorTime(now);
              setErrorCount(prev => prev + 1);
              
              // Stop processing errors after 5 attempts to prevent spam
              if (errorCount >= 5) {
                setError('Camera not supported. Please use a device with a camera.');
                onError?.('Camera not supported');
                return;
              }
              
              // Handle different types of errors
              if (error.includes('No MultiFormat Readers') || 
                  error.includes('Camera not supported') ||
                  error.includes('QR code parse error')) {
                setError('Camera not supported. Please use a device with a camera.');
                onError?.('Camera not supported');
              } else if (error.includes('Permission denied')) {
                setError('Camera permission denied. Please allow camera access in your browser settings.');
                onError?.('Camera permission denied');
              } else if (error.includes('NotAllowedError')) {
                setError('Camera access denied. Please check your browser permissions.');
                onError?.('Camera access denied');
              } else if (error.includes('NotFoundError')) {
                setError('No camera found. Please ensure your device has a camera.');
                onError?.('No camera found');
              } else if (error.includes('NotReadableError')) {
                setError('Camera is already in use by another application.');
                onError?.('Camera in use');
              } else if (!error.includes('NotFoundException') && !error.includes('QR code parse error')) {
                setError('Scanning error. Please try again.');
                onError?.(error);
              }
            }
          );

          setIsScanning(true);
        } catch (err) {
          console.error('Failed to initialize barcode scanner:', err);
          setError('Failed to initialize camera. Please try again.');
          onError?.('Scanner initialization failed');
        }
      };

      // Start initialization
      initScanner();
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (err) {
          console.warn('Error clearing scanner:', err);
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, onClose, onError, isHttps, errorCount, lastErrorTime, selectedCamera]);

  if (!isOpen) return null;

  // Show HTTPS warning if not secure
  if (!isHttps) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
        <div className="relative w-full max-w-md mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
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
            {error ? (
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
