import { LEGAL_ENTITY_NAME } from "@/lib/brand";

/** Kontaktné a identifikačné údaje prevádzkovateľa (pätička, GDPR, …). */
export const COMPANY_CONTACT = {
  legalName: LEGAL_ENTITY_NAME,
  responsiblePerson: "Karolína Nováková",
  address: "Haburská 84/9, 821 01 Bratislava – mestská časť Ružinov",
  email: "know3d.know3d@gmail.com",
  /** Email účtovníčky (Doklado / fakturácia). */
  accountantEmail: "know3dsro-vbo7@faktury.doklado.sk",
  ico: "57514097",
  dic: "2122789163",
  registryLines: [
    "Zapísaný v Obchodnom registri Mestského súdu Bratislava III",
    "oddiel: Sro",
    "vložka č. 197405/B",
  ],
} as const;
