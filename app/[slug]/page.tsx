"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  MapPin,
  Loader2,
  MessageCircle,
  Calendar,
  Siren,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { getClienteBySlug } from "@/lib/config";
import { notFound } from "next/navigation";

function buildWhatsAppUrl(
  telefono: string,
  nomeAzienda: string,
  problema: string,
  urgente: boolean,
  zona: string,
  photoUrl: string | null
): string {
  const urgencyLine = urgente
    ? "🔴 URGENTE: Sì"
    : "🟢 URGENTE: No (Standard)";

  const photoLine = photoUrl && photoUrl.trim() ? `\n\n📷 FOTO: ${photoUrl.trim()}` : "";
  const textBody = `Ciao ${nomeAzienda},
Ho bisogno di un preventivo.

🛠 PROBLEMA:
${problema || "Non specificato"}

${urgencyLine}

📍 ZONA:
${zona || "Non specificata"}${photoLine}`;

  const cleanPhone = telefono.replace(/[^0-9]/g, "");
  const encodedText = encodeURIComponent(textBody);
  const finalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

  return finalUrl;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2)
    return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

export default function LeadPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const cliente = getClienteBySlug(slug);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoSectionRef = useRef<HTMLDivElement>(null);

  const [problema, setProblema] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [urgente, setUrgente] = useState(false);
  const [zona, setZona] = useState("");
  const [showNoPhotoConfirm, setShowNoPhotoConfirm] = useState(false);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setIsUploading(true);
    setUploadDone(false);
    setPhotoUrl(null);
    const formData = new FormData();
    formData.set("image", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fallito");
      setPhotoUrl(data.url);
      setUploadDone(true);
    } catch (err) {
      setUploadDone(false);
      setPhotoUrl(null);
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    setPhotoUrl(null);
    setUploadDone(false);
  };

  const openWhatsApp = (currentPhotoUrl: string | null) => {
    if (!cliente) return;
    const url = buildWhatsAppUrl(
      cliente.telefonoWhatsApp,
      cliente.nomeAzienda,
      problema,
      urgente,
      zona,
      currentPhotoUrl ?? null
    );
    window.open(url, "_blank");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;
    if (isUploading) return;

    if (!localPreview && !photoUrl) {
      setShowNoPhotoConfirm(true);
      return;
    }

    openWhatsApp(photoUrl);
  };

  const handleInviaComunque = () => {
    setShowNoPhotoConfirm(false);
    openWhatsApp(null);
  };

  const handleTornaIndietro = () => {
    setShowNoPhotoConfirm(false);
    photoSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  if (!cliente) notFound();

  const hasFilledForm = problema.trim() || zona.trim();
  const contentPaddingBottom = "pb-28";

  return (
    <form
      id="lead-form"
      onSubmit={handleSubmit}
      className="min-h-screen max-w-lg mx-auto bg-[#f8f9fa]"
    >
      {/* Banner avviso: nessuna foto inserita */}
      <AnimatePresence>
        {showNoPhotoConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={handleTornaIndietro}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5"
            >
              <p className="text-gray-800 text-sm leading-relaxed mb-5">
                Consiglio dell&apos;esperto: senza una foto del guasto il
                preventivo potrebbe essere meno preciso e richiedere un
                sopralluogo. Con una foto possiamo arrivare già pronti.
                Inviare comunque senza foto?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleTornaIndietro}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Torna indietro
                </button>
                <button
                  type="button"
                  onClick={handleInviaComunque}
                  className="flex-1 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#20bd5a] transition-colors"
                >
                  Invia comunque
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* —— Header (Fiducia) —— */}
      <motion.header
        initial={fadeInUp.initial}
        animate={fadeInUp.animate}
        transition={fadeInUp.transition}
        className="bg-white shadow-sm rounded-b-3xl px-5 pt-6 pb-8"
      >
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {cliente.logoUrl ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white shadow-md">
                <Image
                  src={cliente.logoUrl}
                  alt={cliente.nomeAzienda}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-md ring-2 ring-white">
                {getInitials(cliente.nomeAzienda)}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {cliente.nomeAzienda}
              </h1>
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Verificato
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              🟢 Online ora • Risponde in ~5 minuti
            </p>
            <p className="text-xs text-amber-700 mt-1 font-medium">
              4.9 ⭐ (120+ recensioni)
            </p>
          </div>
        </div>
      </motion.header>

      <div className={`px-4 pt-6 flex flex-col gap-5 ${contentPaddingBottom}`}>
        {/* —— 1. Descrizione (card “foglio”) —— */}
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ ...fadeInUp.transition, delay: 0.05 }}
        >
          <label
            htmlFor="problema"
            className="block text-sm font-semibold text-gray-800 mb-2"
          >
            Descrivi il problema
          </label>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 transition-shadow">
            <textarea
              id="problema"
              value={problema}
              onChange={(e) => setProblema(e.target.value)}
              placeholder="Es. guasto, malfunzionamento, intervento di cui hai bisogno..."
              rows={4}
              className="w-full px-4 py-3.5 text-gray-900 placeholder-gray-400 resize-none bg-[#fefefe] focus:outline-none text-[15px] leading-relaxed"
            />
          </div>
        </motion.div>

        {/* —— 2. Foto (area tratteggiata / anteprima) —— */}
        <motion.div
          ref={photoSectionRef}
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ ...fadeInUp.transition, delay: 0.1 }}
        >
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            📸 Foto del guasto (Consigliata per risparmiare tempo)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Carica foto del guasto"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full min-h-[140px] rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80 active:scale-[0.99] transition-all flex items-center justify-center overflow-hidden relative disabled:opacity-70 disabled:pointer-events-none"
          >
            {localPreview || photoUrl ? (
              <div className="relative w-full h-full min-h-[140px] group">
                <img
                  src={localPreview || photoUrl || ""}
                  alt="Anteprima"
                  className="w-full h-[140px] object-cover rounded-2xl border-2 border-emerald-400 shadow-inner"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 rounded-2xl z-10">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                    <span className="text-xs font-medium text-white">
                      Upload...
                    </span>
                  </div>
                )}
                {!isUploading && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    aria-label="Rimuovi foto"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center active:scale-95 transition-transform z-20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4">
                <Camera className="w-10 h-10 text-gray-300" />
                <span className="text-sm font-medium text-gray-500">
                  Tocca per caricare foto
                </span>
              </div>
            )}
          </button>
        </motion.div>

        {/* —— 3. Urgenza (due card) —— */}
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ ...fadeInUp.transition, delay: 0.15 }}
        >
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Tipo di intervento
          </label>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={() => setUrgente(false)}
              whileTap={{ scale: 0.97 }}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                !urgente
                  ? "bg-white border-blue-300 shadow-md shadow-blue-100/50"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <Calendar className="w-7 h-7 text-blue-500 mb-2" />
              <span className="block text-sm font-semibold text-gray-900">
                Intervento Standard
              </span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setUrgente(true)}
              whileTap={{ scale: 0.97 }}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                urgente
                  ? "bg-red-50 border-red-500 shadow-md shadow-red-100/50"
                  : "bg-white border-red-200 hover:border-red-300"
              }`}
            >
              <motion.span
                animate={urgente ? { scale: [1, 1.1, 1] } : {}}
                transition={{
                  repeat: urgente ? Infinity : 0,
                  duration: 1.2,
                  ease: "easeInOut",
                }}
                className="inline-block"
              >
                <Siren className="w-7 h-7 text-red-500 mb-2" />
              </motion.span>
              <span className="block text-sm font-semibold text-gray-900">
                Urgente
              </span>
            </motion.button>
          </div>

          <AnimatePresence>
            {urgente && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                  <p className="text-xs text-amber-800 font-medium">
                    ⚠️ Priorità massima attivata. Potrebbe essere applicato un
                    supplemento.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* —— 4. Zona / Indirizzo —— */}
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ ...fadeInUp.transition, delay: 0.2 }}
        >
          <label
            htmlFor="zona"
            className="block text-sm font-semibold text-gray-800 mb-2"
          >
            Zona / Indirizzo
          </label>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 transition-shadow">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                id="zona"
                type="text"
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                placeholder="Es. Centro, Via Roma..."
                className="flex-1 text-gray-900 placeholder-gray-400 focus:outline-none text-[15px]"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* —— Sticky Footer CTA —— */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto pointer-events-none">
        <div
          className="h-16 bg-gradient-to-t from-[#f8f9fa] to-transparent pointer-events-none"
          aria-hidden
        />
        <div className="px-4 pb-4 pt-0 pointer-events-auto">
          <motion.button
            type="submit"
            disabled={isUploading}
            whileTap={isUploading ? undefined : { scale: 0.97 }}
            className={`w-full py-4 rounded-2xl font-semibold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
              isUploading
                ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-90"
                : "text-white"
            } ${!isUploading && hasFilledForm ? "shadow-green-200/50" : ""}`}
            style={
              isUploading
                ? undefined
                : {
                    background:
                      hasFilledForm
                        ? "linear-gradient(135deg, #25D366 0%, #20bd5a 50%, #1da851 100%)"
                        : "linear-gradient(135deg, #25D366 0%, #20bd5a 100%)",
                  }
            }
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>⏳ Caricamento foto in corso...</span>
              </>
            ) : (
              <>
                {hasFilledForm && (
                  <motion.span
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                  >
                    <MessageCircle className="w-6 h-6" />
                  </motion.span>
                )}
                {!hasFilledForm && <MessageCircle className="w-6 h-6" />}
                <span>Richiedi Preventivo Gratuito ➜</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </form>
  );
}
