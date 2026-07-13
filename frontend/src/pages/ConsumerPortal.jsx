import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api';
import { 
  Compass, ShieldCheck, ShieldAlert, CheckCircle, 
  AlertTriangle, Star, Calendar, MessageSquare, Send, Globe, Camera,
  HelpCircle, QrCode, ArrowRight
} from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: "Public Medicine Verification Portal",
    subtitle: "Instantly check drug authenticity, expiry timelines, and recall orders.",
    verify_btn: "Verify Medicine",
    enter_serial: "Enter unique serialization number...",
    scan_sim: "Simulate Camera Scanner",
    safety_eval: "Safety Evaluation:",
    composition: "Drug Composition Details:",
    generic: "Generic Formula",
    sku: "System SKU",
    strength: "Strength",
    expiry: "Expiry Date",
    mfg: "Manufactured By",
    report_btn: "File Suspect Counterfeit Report",
    reporter_details: "Reporter Coordinates & Details:",
    desc: "Describe anomaly (e.g., color mismatch, torn seal)",
    location: "Scan Location (City, Clinic)",
    submit_rep: "Dispatch Incident Alert",
    feedback_title: "How was your experience?",
    rating: "Rate Verification Accuracy",
    submit_fb: "Submit Feedback",
    usage: "Prescribed Use / Indications"
  },
  hi: {
    title: "सार्वजनिक औषधि सत्यापन पोर्टल",
    subtitle: "दवा की प्रामाणिकता, समाप्ति समयरेखा और रिकॉल आदेशों की तुरंत जांच करें।",
    verify_btn: "दवा सत्यापित करें",
    enter_serial: "अद्वितीय क्रमांकन संख्या दर्ज करें...",
    scan_sim: "कैमरा स्कैनर सिम्युलेट करें",
    safety_eval: "सुरक्षा मूल्यांकन:",
    composition: "दवा संरचना विवरण:",
    generic: "जेनेरिक फार्मूला",
    sku: "सिस्टम SKU",
    strength: "शक्ति",
    expiry: "समाप्ति तिथि",
    mfg: "निर्माता",
    report_btn: "संदिग्ध नकली दवा की रिपोर्ट दर्ज करें",
    reporter_details: "रिपोर्टर स्थान और विवरण:",
    desc: "विसंगति का वर्णन करें (जैसे, टूटी हुई सील, भिन्न रंग)",
    location: "स्कैन स्थान (शहर, क्लिनಿಕ)",
    submit_rep: "घटना चेतावनी भेजें",
    feedback_title: "भारत में आपका अनुभव कैसा रहा?",
    rating: "सत्यापन सटीकता का मूल्यांकन करें",
    submit_fb: "प्रतिक्रिया सबमिट करें",
    usage: "निर्धारित उपयोग / संकेत"
  },
  kn: {
    title: "ಸಾರ್ವಜನಿಕ ಔಷಧ ಪರಿಶೀಲನಾ ಪೋರ್ಟಲ್",
    subtitle: "ಔಷಧದ ದೃಢೀಕರಣ, ಮುಕ್ತಾಯ ಸಮಯ ಮತ್ತು ಮರುಸ್ಥಾಪನೆ ಆದೇಶಗಳನ್ನು ತಕ್ಷಣವೇ ಪರಿಶೀಲಿಸಿ.",
    verify_btn: "ಔಷಧವನ್ನು ಪರಿಶೀಲಿಸಿ",
    enter_serial: "ವಿಶಿಷ್ಟ ಸರಣಿ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ...",
    scan_sim: "ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನರ್ ಅನ್ನು ಸಿಮ್ಯುಲೇಟ್ ಮಾಡಿ",
    safety_eval: "ಸುರಕ್ಷತಾ ಮೌಲ್ಯಮಾಪನ:",
    composition: "ಔಷಧ ಸಂಯೋಜನೆ ವಿವರಗಳು:",
    generic: "ಜೆನೆರಿಕ್ ಫಾರ್ಮುಲಾ",
    sku: "ಸಿಸ್ಟಮ್ SKU",
    strength: "ಸಾಮರ್ಥ್ಯ",
    expiry: "ಮುಕ್ತಾಯ ದಿನಾಂಕ",
    mfg: "ತಯಾರಕರು",
    report_btn: "ಶಂಕಿತ ನಕಲಿ ವರದಿ ದಾಖಲಿಸಿ",
    reporter_details: "ವರದಿಗಾರರ ವಿವರಗಳು:",
    desc: "ವ್ಯತ್ಯಾಸಗಳನ್ನು ವಿವರಿಸಿ (ಉದಾಹರಣೆಗೆ, ಬಣ್ಣ ಹೊಂದಾಣಿಕೆಯಾಗದಿರುವುದು, ಹರಿದ ಮುದ್ರೆ)",
    location: "ಸ್ಕ್ಯಾನ್ ಸ್ಥಳ (ನಗರ, ಕ್ಲಿನಿಕ್)",
    submit_rep: "ಘಟನೆಯ ಎಚ್ಚರಿಕೆಯನ್ನು ಕಳುಹಿಸಿ",
    feedback_title: "ನಿಮ್ಮ ಅನುಭವ ಹೇಗಿತ್ತು?",
    rating: "ಪರಿಶೀಲನೆಯ ನಿಖರತೆಯನ್ನು ರೇಟ್ ಮಾಡಿ",
    submit_fb: "ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಸಲ್ಲಿಸಿ",
    usage: "ಶಿಫಾರಸು ಮಾಡಿದ ಬಳಕೆ / ಸೂಚನೆಗಳು"
  }
};

const extractSerialFromUrl = (input) => {
  let text = input.trim();
  if (text.startsWith('http://') || text.startsWith('https://')) {
    try {
      const url = new URL(text);
      const serialParam = url.searchParams.get('serial') || url.searchParams.get('code');
      if (serialParam) {
        return serialParam;
      }
      
      const pathname = url.pathname;
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        if (lastPart !== 'verify') {
          return lastPart;
        }
      }
    } catch (e) {
      console.error("Error parsing URL:", e);
    }
  }
  
  if (text.includes('serial=')) {
    const parts = text.split('serial=');
    return parts[parts.length - 1].split('&')[0];
  }
  if (text.includes('code=')) {
    const parts = text.split('code=');
    return parts[parts.length - 1].split('&')[0];
  }
  
  if (text.includes('/')) {
    const parts = text.split('/');
    return parts[parts.length - 1];
  }
  
  return text;
};

const MedicalBriefcaseIcon = () => (
  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 animate-pulse" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M8 3C7.44772 3 7 3.44772 7 4V6H4C2.89543 6 2 6.89543 2 8V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H17V4C17 3.44772 16.5523 3 16 3H8ZM9 5V6H15V5H9ZM4 8H20V18H4V8ZM11 10H13V12H15V14H13V16H11V14H9V12H11V10Z" />
  </svg>
);

const BarcodeIcon = () => (
  <svg className="w-6 h-6 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 5H3v14h2M19 5h2v14h-2M8 7v10M12 7v10M16 7v10" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5M12 7v5l4 2" />
  </svg>
);

const ConsumerPortal = () => {
  const [lang, setLang] = useState('en');
  const [serial, setSerial] = useState('');
  
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  // Counterfeit Report Form State
  const [reportForm, setReportForm] = useState({
    location_name: '',
    description: '',
    email: '',
    phone: '',
    lat: 13.0827,
    lng: 80.2707
  });
  const [reportingOpen, setReportingOpen] = useState(false);

  // Feedback State
  const [feedback, setFeedback] = useState({ rating: 5, comments: '' });
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  const t = TRANSLATIONS[lang];

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(err => console.error(err));
      }
    };
  }, []);

  // Dynamic Body Styling for public light theme portal
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;
    const originalClass = document.body.className;

    document.body.style.backgroundColor = '#f8fafc';
    document.body.style.color = '#1e293b';
    document.body.className = 'bg-[#f8fafc] text-slate-800 font-sans';

    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
      document.body.className = originalClass;
    };
  }, []);

  const handleVerifyText = async (code) => {
    if (!code) return;
    
    // Parse URL if the code is a full verification link
    const serialCode = extractSerialFromUrl(code);
    if (!serialCode) return;

    setError(''); setVerification(null); setSuccess(''); setReportingOpen(false); setLoading(true);

    try {
      // Unauthenticated endpoint
      const res = await api.consumer.verify(serialCode);
      setVerification(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Serial code verification failed. This serial is unregistered in our system database.');
      // Open reporting automatically for unregistered codes
      setReportingOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    handleVerifyText(serial);
  };

  const startScanning = async () => {
    setIsScanning(true);
    setError('');
    setVerification(null);
    
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error("No camera devices found.");
      }
      setCameras(devices);
      
      // Auto-detect a real webcam device if possible (instead of virtual driver/OBS)
      let defaultCamera = devices[0];
      for (const device of devices) {
        const label = device.label.toLowerCase();
        if (label.includes('webcam') || label.includes('integrated') || label.includes('usb') || label.includes('front')) {
          defaultCamera = device;
          break;
        }
      }
      setSelectedCameraId(defaultCamera.id);

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        defaultCamera.id,
        {
          fps: 24, // Higher frame rate for faster detection
        },
        async (decodedText) => {
          const parsedCode = extractSerialFromUrl(decodedText);
          setSerial(parsedCode);
          setIsScanning(false);
          try {
            await html5QrCode.stop();
          } catch (stopErr) {
            console.error("Error stopping scanner:", stopErr);
          }
          scannerRef.current = null;
          handleVerifyText(parsedCode);
        },
        () => {
          // Silence noise/no QR detected frames
        }
      );
    } catch (err) {
      console.error("Camera scan error:", err);
      setError("Camera access is required. Please verify permissions or select another method.");
      setIsScanning(false);
      scannerRef.current = null;
    }
  };

  const switchCamera = async (cameraId) => {
    if (!scannerRef.current) return;
    setSelectedCameraId(cameraId);
    
    try {
      await scannerRef.current.stop();
    } catch (err) {
      console.error("Error stopping scanner during switch:", err);
    }

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        cameraId,
        {
          fps: 24,
        },
        async (decodedText) => {
          const parsedCode = extractSerialFromUrl(decodedText);
          setSerial(parsedCode);
          setIsScanning(false);
          try {
            await html5QrCode.stop();
          } catch (stopErr) {
            console.error("Error stopping scanner:", stopErr);
          }
          scannerRef.current = null;
          handleVerifyText(parsedCode);
        },
        () => {
          // Silence noise
        }
      );
    } catch (err) {
      console.error("Error starting camera during switch:", err);
      setError("Failed to start the selected camera.");
      setIsScanning(false);
      scannerRef.current = null;
    }
  };

  const stopScanning = async () => {
    setIsScanning(false);
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
  };

  const handleSimulateScan = () => {
    // If camera scanner is active, stop it first
    if (isScanning) {
      stopScanning();
    }
    // Inject a valid seed code to show active scan details easily
    const demoCodes = [
      'MC-SKU-ASP-500-B-ASP-001-0001', // Authentic Aspirin
      'MC-SKU-AMX-250-B-AMX-003-0002', // Recalled Amoxicillin
      'MC-UNREGISTERED-9999'           // Counterfeit
    ];
    // Cycle codes
    const randomCode = demoCodes[Math.floor(Math.random() * demoCodes.length)];
    setSerial(randomCode);
    setVerification(null);
    setError('');
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      await api.consumer.reportCounterfeit({
        serial_number: serial,
        location_name: reportForm.location_name,
        description: reportForm.description,
        reporter_email: reportForm.email || null,
        reporter_phone: reportForm.phone || null,
        latitude: parseFloat(reportForm.lat) || null,
        longitude: parseFloat(reportForm.lng) || null
      });
      setSuccess('Incident reported successfully. National Regulatory Inspectors have been notified.');
      setReportForm({ location_name: '', description: '', email: '', phone: '', lat: 13.0827, lng: 80.2707 });
      setReportingOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackSuccess('');
    try {
      await api.consumer.submitFeedback({
        serial_number: serial,
        rating: feedback.rating,
        comments: feedback.comments
      });
      setFeedbackSuccess('Thank you for your feedback!');
      setFeedback({ rating: 5, comments: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col justify-between">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <MedicalBriefcaseIcon />
          <span className="font-semibold text-lg text-blue-700 font-sans tracking-tight">MediClear Enterprise</span>
        </div>
        
        <div className="flex items-center gap-4 text-slate-500">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2 py-1 bg-white hover:bg-slate-50 transition-colors">
            <Globe size={14} className="text-slate-400" />
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="en">English (EN)</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="kn">ಕನ್ನಡ (KN)</option>
            </select>
          </div>
          
          <button className="hover:text-blue-600 transition-colors p-1 cursor-pointer" title="Security Integrity">
            <ShieldCheck size={20} />
          </button>
          <button className="hover:text-blue-600 transition-colors p-1 cursor-pointer" title="Help & Support">
            <HelpCircle size={20} />
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 flex flex-col items-center justify-center">
        
        {/* Centered Hero Icon */}
        <div className="w-16 h-16 bg-[#e6efff] rounded-2xl flex items-center justify-center mb-6 shadow-sm shadow-blue-100">
          <ShieldCheck size={32} className="text-blue-600" />
        </div>

        {/* Headings */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 text-center tracking-tight mb-3">
          {t.title}
        </h1>
        <p className="text-sm md:text-base text-slate-500 text-center max-w-xl mx-auto mb-10 leading-relaxed">
          {t.subtitle}
        </p>

        {/* Verification Card */}
        <div className="w-full max-w-2xl bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] p-6 md:p-8 mb-8">
          
          {/* QR Scanner Container */}
          {isScanning && (
            <div className="mb-6 space-y-4">
              <div className="relative border border-gray-200 rounded-2xl bg-black max-w-sm mx-auto aspect-square overflow-hidden shadow-lg transition-all duration-300">
                <div id="qr-reader" className="w-full h-full" />
                <div className="absolute inset-0 border-2 border-dashed border-blue-500/50 pointer-events-none rounded-xl m-10 animate-pulse flex items-center justify-center">
                  <span className="bg-black/60 text-[10px] text-blue-400 px-2 py-0.5 rounded uppercase font-semibold tracking-wider">Align QR Code</span>
                </div>
              </div>
              {cameras.length > 1 && (
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Select Active Webcam</label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => switchCamera(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 max-w-xs cursor-pointer"
                  >
                    {cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Webcam ${cameras.indexOf(cam) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            {/* Barcode/Input block */}
            <div className="relative flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <BarcodeIcon />
              <input
                type="text"
                required
                placeholder={t.enter_serial}
                value={serial}
                onChange={e => setSerial(e.target.value)}
                className="w-full bg-transparent text-slate-800 text-sm md:text-base placeholder-slate-400 focus:outline-none font-mono ml-3"
              />
            </div>

            {/* Action buttons row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-start">
                <button
                  type="button"
                  onClick={isScanning ? stopScanning : startScanning}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer ${
                    isScanning 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-[#e6efff] hover:bg-[#dbe7ff] text-blue-600'
                  }`}
                >
                  <QrCode size={16} />
                  {isScanning ? 'Cancel' : 'Scan QR'}
                </button>
                
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  className="mt-2 text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  {t.scan_sim}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || isScanning}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-200 cursor-pointer"
              >
                {loading ? 'Verifying...' : t.verify_btn}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* General Alert */}
        {success && (
          <div className="w-full max-w-2xl mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="w-full max-w-2xl mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-semibold space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
            <p className="text-[10px] text-red-500/80 ml-6">This serial number is unregistered. Please lodge a suspect counterfeiting report immediately.</p>
          </div>
        )}

        {/* Verification Ledger result */}
        {verification && (
          <div className="w-full max-w-2xl space-y-6 animate-fade-in mb-8">
            
            {/* Safety Status card */}
            <div className={`p-6 rounded-2xl border text-center space-y-3 ${
              verification.safety_status === 'Authentic'
                ? 'bg-emerald-50/55 border-emerald-100 text-emerald-800'
                : 'bg-red-50/55 border-red-100 text-red-800'
            }`}>
              <span className="text-xs uppercase tracking-wider font-semibold block opacity-75">{t.safety_eval}</span>
              <div className="flex items-center justify-center gap-2">
                {verification.safety_status === 'Authentic' 
                  ? <CheckCircle size={28} className="text-emerald-600" /> 
                  : <AlertTriangle size={28} className="text-red-600 pulse-indicator" />
                }
                <span className="text-2xl font-bold">{verification.safety_status}</span>
              </div>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">{verification.safety_message}</p>
            </div>

            {/* Medicine Metadata */}
            <div className="p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.01)] space-y-5">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <ShieldCheck size={18} className="text-blue-500" />
                {t.composition}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                <div className="bg-slate-50/70 p-4 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 block uppercase font-semibold tracking-wider text-[10px]">Medicine Brand</span>
                  <span className="text-sm font-bold text-slate-800">{verification.medicine.name}</span>
                </div>
                <div className="bg-slate-50/70 p-4 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 block uppercase font-semibold tracking-wider text-[10px]">{t.generic}</span>
                  <span className="text-sm font-bold text-slate-800">{verification.medicine.generic_name}</span>
                </div>
                <div className="bg-slate-50/70 p-4 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 block uppercase font-semibold tracking-wider text-[10px]">{t.sku}</span>
                  <span className="text-sm text-slate-800 font-mono font-semibold">{verification.medicine.sku}</span>
                </div>
                <div className="bg-slate-50/70 p-4 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 block uppercase font-semibold tracking-wider text-[10px]">{t.strength}</span>
                  <span className="text-sm text-slate-800 font-semibold">{verification.medicine.strength} ({verification.medicine.formulation})</span>
                </div>
                <div className="bg-slate-50/70 p-4 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 block uppercase font-semibold tracking-wider text-[10px]">{t.expiry}</span>
                  <span className={`text-sm font-semibold ${verification.is_expired ? 'text-red-600' : 'text-slate-800'}`}>
                    {verification.medicine.expiry_date.split('T')[0]} {verification.is_expired && '(EXPIRED)'}
                  </span>
                </div>
                <div className="bg-slate-50/70 p-4 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 block uppercase font-bold tracking-wider text-[10px]">{t.mfg}</span>
                  <span className="text-sm font-extrabold text-slate-800">{verification.medicine.manufacturer_name}</span>
                </div>
              </div>

              {/* Medicine Usage Block */}
              {verification.medicine.description && (
                <div className="mt-4 bg-blue-50/40 border border-blue-100/50 p-4 rounded-xl space-y-1.5 font-sans text-xs">
                  <span className="text-blue-600 flex items-center gap-1.5 uppercase font-semibold tracking-wider text-[10px]">
                    <Compass size={14} />
                    {t.usage}
                  </span>
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-medium">
                    {verification.medicine.description}
                  </p>
                </div>
              )}
            </div>

            {/* Verification Feedback Form */}
            <div className="p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.01)] space-y-5">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <MessageSquare size={18} className="text-blue-500" />
                {t.feedback_title}
              </h2>
              {feedbackSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{feedbackSuccess}</span>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-semibold">{t.rating}:</span>
                    <div className="flex gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star} type="button"
                          onClick={() => setFeedback({ ...feedback, rating: star })}
                          className="hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        >
                          <Star size={20} fill={feedback.rating >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <textarea
                      rows="2" required placeholder="Add comments on verification speed or package condition..."
                      value={feedback.comments}
                      onChange={e => setFeedback({...feedback, comments: e.target.value})}
                      className="w-full px-4 py-3 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {t.submit_fb}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Suspect Counterfeit Reporting Form */}
        {reportingOpen && (
          <div className="w-full max-w-2xl p-6 md:p-8 bg-white rounded-2xl border border-red-100 shadow-[0_4px_16px_rgba(239,68,68,0.03)] space-y-6 animate-fade-in mb-8">
            <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2 border-b border-red-50 pb-3">
              <AlertTriangle size={20} className="text-red-500" />
              {t.report_btn}
            </h2>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t.reporter_details}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="email" placeholder="Your Email (Optional)"
                    value={reportForm.email}
                    onChange={e => setReportForm({...reportForm, email: e.target.value})}
                    className="px-4 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <input
                    type="text" placeholder="Your Phone (Optional)"
                    value={reportForm.phone}
                    onChange={e => setReportForm({...reportForm, phone: e.target.value})}
                    className="px-4 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t.location}</label>
                  <input
                    type="text" required placeholder="Hospital / City pharmacy name"
                    value={reportForm.location_name}
                    onChange={e => setReportForm({...reportForm, location_name: e.target.value})}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Lat / Lng coordinates</label>
                  <div className="flex gap-2">
                    <input
                      type="number" step="any" required placeholder="Lat"
                      value={reportForm.lat}
                      onChange={e => setReportForm({...reportForm, lat: parseFloat(e.target.value) || 0.0})}
                      className="w-full px-2 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-800 text-center focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <input
                      type="number" step="any" required placeholder="Lng"
                      value={reportForm.lng}
                      onChange={e => setReportForm({...reportForm, lng: parseFloat(e.target.value) || 0.0})}
                      className="w-full px-2 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-800 text-center focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t.desc}</label>
                <textarea
                  rows="3" required placeholder="Detail the packaging abnormalities..."
                  value={reportForm.description}
                  onChange={e => setReportForm({...reportForm, description: e.target.value})}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer"
              >
                {t.submit_rep}
              </button>
            </form>
          </div>
        )}

        {/* Feature Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-4">
          {/* Authenticity Guaranteed */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 flex-shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1 leading-snug">Authenticity Guaranteed</h3>
              <p className="text-xs text-slate-400 leading-normal">Verify against manufacturer records.</p>
            </div>
          </div>

          {/* Traceability */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 flex-shrink-0">
              <HistoryIcon />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1 leading-snug">Traceability</h3>
              <p className="text-xs text-slate-400 leading-normal">Track the complete supply chain journey.</p>
            </div>
          </div>

          {/* Recall Alerts */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
            <div className="p-2.5 bg-red-50 rounded-xl text-red-600 flex-shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1 leading-snug">Recall Alerts</h3>
              <p className="text-xs text-slate-400 leading-normal">Instant notification of any active recall orders.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer Banner */}
      <footer className="w-full bg-[#f3f6fc] border-t border-gray-200/50 py-6 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <div className="text-slate-500 font-medium text-center md:text-left">
          © 2026 MediClear Systems. All rights reserved. Clinical Data Integrity Verified.
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-slate-600">
          <a href="#privacy" className="hover:text-blue-600 transition-colors font-semibold">Privacy Policy</a>
          <a href="#compliance" className="hover:text-blue-600 transition-colors font-semibold">Compliance Standards</a>
          <a href="#terms" className="hover:text-blue-600 transition-colors font-semibold">Terms of Service</a>
          <a href="#support" className="hover:text-blue-600 transition-colors font-semibold">Contact Support</a>
        </div>
      </footer>

    </div>
  );
};

export default ConsumerPortal;
