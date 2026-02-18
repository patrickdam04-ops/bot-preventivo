export type Cliente = {
  slug: string;
  nomeAzienda: string;
  telefonoWhatsApp: string;
  coloreTema: string;
  logoUrl?: string;
};

export const clienti: Cliente[] = [
  {
    slug: "mario-idraulico",
    nomeAzienda: "Nome Professionista",
    telefonoWhatsApp: "393780111216",
    coloreTema: "blue-600",
    logoUrl: undefined,
  },
  {
    slug: "idraulici-roma",
    nomeAzienda: "Nome Professionista",
    telefonoWhatsApp: "393780111216",
    coloreTema: "emerald-600",
    logoUrl: undefined,
  },
];

export function getClienteBySlug(slug: string): Cliente | undefined {
  return clienti.find((c) => c.slug === slug);
}

export function getFirstCliente(): Cliente | undefined {
  return clienti[0];
}

/** Mappa coloreTema Tailwind -> hex per stili inline (es. pulsanti urgenza) */
export const temaToHex: Record<string, string> = {
  "blue-600": "#2563eb",
  "emerald-600": "#059669",
  "violet-600": "#7c3aed",
  "amber-600": "#d97706",
};
