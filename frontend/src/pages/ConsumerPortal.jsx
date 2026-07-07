import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api';
import { 
  Compass, ShieldCheck, ShieldAlert, CheckCircle, 
  AlertTriangle, Star, Calendar, MessageSquare, Send, Globe, Camera
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
  es: {
    title: "Portal Público de Verificación de Medicamentos",
    subtitle: "Verifique al instante la autenticidad de los medicamentos y las órdenes de retirada.",
    verify_btn: "Verificar Medicamento",
    enter_serial: "Ingrese el número de serialización único...",
    scan_sim: "Simular Escáner de Cámara",
    safety_eval: "Evaluación de Seguridad:",
    composition: "Detalles de la Composición del Medicamento:",
    generic: "Fórmula Genérica",
    sku: "SKU del Sistema",
    strength: "Concentración",
    expiry: "Fecha de Caducidad",
    mfg: "Fabricado por",
    report_btn: "Presentar Informe de Falsificación",
    reporter_details: "Coordenadas y Detalles del Informante:",
    desc: "Describa la anomalía (ej. sello roto, pastillas de otro color)",
    location: "Ubicación del Escaneo (Ciudad, Clínica)",
    submit_rep: "Enviar Alerta de Incidente",
    feedback_title: "¿Cómo fue su experiencia?",
    rating: "Calificar la Precisión de la Verificación",
    submit_fb: "Enviar Comentarios",
    usage: "Uso Prescrito / Indicaciones"
  },
  hi: {
    title: "सार्वजनिक औषधि सत्यापन पोर्टल",
    subtitle: "दवा की प्रामाणिकता, समाप्ति समयरेखा और रिकॉल आदेशों की तुरंत जांच करें।",
    verify_btn: "दवा सत्यापित करें",
    enter_serial: "अद्वितीय क्रमांकन संख्या दर्ज करें...",
    scan_sim: "कैमरा स्कैनर सिम्युलेट करें",
    safety_eval: "सुरक्षा मूल्यांकन:",
    composition: "दवा संरचना विवरण:",
    generic: "जेनेरिक फॉर्मूला",
    sku: "सिस्टम SKU",
    strength: "शक्ति",
    expiry: "समाप्ति तिथि",
    mfg: "निर्माता",
    report_btn: "संदिग्ध नकली दवा की रिपोर्ट दर्ज करें",
    reporter_details: "रिपोर्टर स्थान और विवरण:",
    desc: "विसंगति का वर्णन करें (जैसे, टूटी हुई सील, भिन्न रंग)",
    location: "स्कैन स्थान (शहर, क्लिनिक)",
    submit_rep: "घटना चेतावनी भेजें",
    feedback_title: "आपका अनुभव कैसा रहा?",
    rating: "सत्यापन सटीकता का मूल्यांकन करें",
    submit_fb: "प्रतिक्रिया सबमिट करें",
    usage: "निर्धारित उपयोग / संकेत"
  },
  de: {
    title: "Öffentliches Portal zur Arzneimittelüberprüfung",
    subtitle: "Überprüfen Sie sofort die Echtheit von Medikamenten, Ablaufdaten und Rückrufen.",
    verify_btn: "Medikament überprüfen",
    enter_serial: "Geben Sie die eindeutige Seriennummer ein...",
    scan_sim: "Kamerascanner simulieren",
    safety_eval: "Sicherheitsbewertung:",
    composition: "Details zur Wirkstoffzusammensetzung:",
    generic: "Generische Formel",
    sku: "System-SKU",
    strength: "Stärke",
    expiry: "Verfallsdatum",
    mfg: "Hergestellt von",
    report_btn: "Verdacht auf Fälschung melden",
    reporter_details: "Koordinaten und Details des Meldenden:",
    desc: "Anomalie beschreiben (z. B. beschädigtes Siegel, andere Pillenfarbe)",
    location: "Scan-Ort (Stadt, Klinik)",
    submit_rep: "Zwischenfall melden",
    feedback_title: "Wie war Ihre Erfahrung?",
    rating: "Genauigkeit der Überprüfung bewerten",
    submit_fb: "Feedback abschicken",
    usage: "Vorgeschriebene Verwendung / Indikationen"
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
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Language Selector */}
      <div className="flex justify-end items-center gap-2">
        <Globe size={16} className="text-gray-400" />
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          className="bg-[#151c2c] border border-[#222f47] text-xs font-semibold rounded-lg text-white px-2 py-1.5 focus:outline-none focus:border-primary-500"
        >
          <option value="en">English (EN)</option>
          <option value="es">Español (ES)</option>
          <option value="hi">हिन्दी (HI)</option>
          <option value="de">Deutsch (DE)</option>
        </select>
      </div>

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 bg-primary-600/10 border border-primary-500/20 rounded-2xl text-primary-500">
          <Compass size={32} className="pulse-indicator" />
        </div>
        <h1 className="text-3xl font-extrabold text-white font-sans">{t.title}</h1>
        <p className="text-sm text-gray-400 max-w-lg mx-auto">{t.subtitle}</p>
      </div>

      {/* Input Verification Bar */}
      <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] space-y-4">
        <div className={`relative border border-[#222f47] rounded-2xl bg-black max-w-sm mx-auto aspect-square overflow-hidden shadow-lg transition-all duration-300 ${isScanning ? 'block' : 'hidden'}`}>
          <div id="qr-reader" className="w-full h-full" />
          <div className="absolute inset-0 border-2 border-dashed border-primary-500/50 pointer-events-none rounded-xl m-10 animate-pulse flex items-center justify-center">
            <span className="bg-black/60 text-[10px] text-primary-400 px-2 py-0.5 rounded uppercase font-semibold tracking-wider">Align QR Code</span>
          </div>
        </div>

        {isScanning && cameras.length > 1 && (
          <div className="flex flex-col items-center gap-1.5 py-2">
            <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Select Active Webcam</label>
            <select
              value={selectedCameraId}
              onChange={(e) => switchCamera(e.target.value)}
              className="px-3 py-1.5 bg-[#151c2c] border border-[#222f47] rounded-xl text-xs text-white focus:outline-none focus:border-primary-500 max-w-xs cursor-pointer"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Webcam ${cameras.indexOf(cam) + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text" required
            placeholder={t.enter_serial}
            value={serial}
            onChange={e => setSerial(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500 text-sm font-mono"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={isScanning ? stopScanning : startScanning}
              className={`px-4 py-2.5 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 ${
                isScanning 
                  ? 'bg-red-600/85 hover:bg-red-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Camera size={16} />
              {isScanning ? 'Cancel' : 'Scan QR'}
            </button>
            <button
              type="submit" disabled={loading || isScanning}
              className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : t.verify_btn}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={handleSimulateScan}
            className="text-xs text-primary-400 hover:text-primary-300 font-semibold underline"
          >
            {t.scan_sim}
          </button>
        </div>
      </div>

      {/* General Alert */}
      {success && <div className="p-4 bg-green-950/25 border border-green-500/30 text-green-400 rounded-xl text-xs font-semibold">{success}</div>}
      {error && (
        <div className="p-4 bg-accent-950/25 border border-accent-500/30 text-accent-400 rounded-xl text-xs font-semibold space-y-1">
          <p>{error}</p>
          <p className="text-[10px] text-gray-500">This serial number is unregistered. Please lodge a suspect counterfeiting report immediately.</p>
        </div>
      )}

      {/* Verification Ledger result */}
      {verification && (
        <div className="space-y-6 animate-fade-in">
          {/* Safety Status card */}
          <div className={`p-6 rounded-2xl border text-center space-y-3 ${
            verification.safety_status === 'Authentic'
              ? 'bg-green-950/15 border-green-500/20 text-green-400 glow-blue'
              : 'bg-accent-950/15 border-accent-500/20 text-accent-400 glow-red'
          }`}>
            <span className="text-xs uppercase tracking-wider font-semibold block">{t.safety_eval}</span>
            <div className="flex items-center justify-center gap-2">
              {verification.safety_status === 'Authentic' ? <CheckCircle size={28} /> : <AlertTriangle size={28} className="pulse-indicator" />}
              <span className="text-2xl font-extrabold">{verification.safety_status}</span>
            </div>
            <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">{verification.safety_message}</p>
          </div>

          {/* Medicine Metadata */}
          <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary-400" />
              {t.composition}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
              <div className="bg-[#151c2c]/40 p-4 border border-[#222f47]/55 rounded-xl space-y-1">
                <span className="text-gray-500 block uppercase font-semibold">Medicine Brand</span>
                <span className="text-sm font-bold text-white">{verification.medicine.name}</span>
              </div>
              <div className="bg-[#151c2c]/40 p-4 border border-[#222f47]/55 rounded-xl space-y-1">
                <span className="text-gray-500 block uppercase font-semibold">{t.generic}</span>
                <span className="text-sm font-bold text-white">{verification.medicine.generic_name}</span>
              </div>
              <div className="bg-[#151c2c]/40 p-4 border border-[#222f47]/55 rounded-xl space-y-1">
                <span className="text-gray-500 block uppercase font-semibold">{t.sku}</span>
                <span className="text-sm text-white font-mono">{verification.medicine.sku}</span>
              </div>
              <div className="bg-[#151c2c]/40 p-4 border border-[#222f47]/55 rounded-xl space-y-1">
                <span className="text-gray-500 block uppercase font-semibold">{t.strength}</span>
                <span className="text-sm text-white">{verification.medicine.strength} ({verification.medicine.formulation})</span>
              </div>
              <div className="bg-[#151c2c]/40 p-4 border border-[#222f47]/55 rounded-xl space-y-1">
                <span className="text-gray-500 block uppercase font-semibold">{t.expiry}</span>
                <span className={`text-sm font-semibold ${verification.is_expired ? 'text-accent-400' : 'text-white'}`}>
                  {verification.medicine.expiry_date.split('T')[0]} {verification.is_expired && '(EXPIRED)'}
                </span>
              </div>
              <div className="bg-[#151c2c]/40 p-4 border border-[#222f47]/55 rounded-xl space-y-1">
                <span className="text-gray-500 block uppercase font-semibold">{t.mfg}</span>
                <span className="text-sm font-bold text-white">{verification.medicine.manufacturer_name}</span>
              </div>
            </div>

            {/* Medicine Usage Block */}
            {verification.medicine.description && (
              <div className="mt-4 bg-primary-950/15 border border-primary-500/15 p-4 rounded-xl space-y-1.5 font-sans text-xs">
                <span className="text-primary-400 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                  <Compass size={14} className="animate-pulse" />
                  {t.usage}
                </span>
                <p className="text-gray-300 text-sm leading-relaxed font-medium">
                  {verification.medicine.description}
                </p>
              </div>
            )}
          </div>

          {/* Verification Feedback Form */}
          <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-400" />
              {t.feedback_title}
            </h2>
            {feedbackSuccess ? (
              <div className="p-3 bg-green-950/25 border border-green-500/30 text-green-400 rounded-lg text-xs font-semibold">
                {feedbackSuccess}
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-semibold">{t.rating}:</span>
                  <div className="flex gap-1 text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star} type="button"
                        onClick={() => setFeedback({ ...feedback, rating: star })}
                        className="hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Star size={18} fill={feedback.rating >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <textarea
                    rows="2" required placeholder="Add comments on verification speed or package condition..."
                    value={feedback.comments}
                    onChange={e => setFeedback({...feedback, comments: e.target.value})}
                    className="w-full px-4 py-2 text-xs bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-lg transition-colors"
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
        <div className="p-6 rounded-2xl glass-panel border border-accent-500/20 glow-red space-y-6 animate-fade-in">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-accent-500" />
            {t.report_btn}
          </h2>

          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">{t.reporter_details}</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="email" placeholder="Your Email (Optional)"
                  value={reportForm.email}
                  onChange={e => setReportForm({...reportForm, email: e.target.value})}
                  className="px-4 py-2 text-xs bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none"
                />
                <input
                  type="text" placeholder="Your Phone (Optional)"
                  value={reportForm.phone}
                  onChange={e => setReportForm({...reportForm, phone: e.target.value})}
                  className="px-4 py-2 text-xs bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">{t.location}</label>
                <input
                  type="text" required placeholder="Hospital / City pharmacy name"
                  value={reportForm.location_name}
                  onChange={e => setReportForm({...reportForm, location_name: e.target.value})}
                  className="w-full px-4 py-2 text-xs bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Latitude / Longitude</label>
                <div className="flex gap-2">
                  <input
                    type="number" step="any" required placeholder="Lat"
                    value={reportForm.lat}
                    onChange={e => setReportForm({...reportForm, lat: parseFloat(e.target.value) || 0.0})}
                    className="w-full px-2 py-2 text-xs bg-[#151c2c] border border-[#222f47] rounded-xl text-white text-center focus:outline-none"
                  />
                  <input
                    type="number" step="any" required placeholder="Lng"
                    value={reportForm.lng}
                    onChange={e => setReportForm({...reportForm, lng: parseFloat(e.target.value) || 0.0})}
                    className="w-full px-2 py-2 text-xs bg-[#151c2c] border border-[#222f47] rounded-xl text-white text-center focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">{t.desc}</label>
              <textarea
                rows="3" required placeholder="Detail the packaging abnormalities..."
                value={reportForm.description}
                onChange={e => setReportForm({...reportForm, description: e.target.value})}
                className="w-full px-4 py-2 text-xs bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-xl text-sm transition-all"
            >
              {t.submit_rep}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ConsumerPortal;
