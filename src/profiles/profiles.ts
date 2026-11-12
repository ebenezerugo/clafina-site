/**
 * The illustrated world follows the visitor's country: popular local names for each character, a real city and
 * neighbourhood, the local currency at a natural price level, and the local sales tax.
 *
 * Every story keeps its amounts in a base (US dollars). A profile's `scale` turns them into local money; scales are
 * chosen so base amounts stay whole at the currency's precision, which keeps every total equal to its lines.
 * Names follow the drawn characters (a woman's part takes a woman's name), so the pictures still fit.
 */

export type ProfileId = 'global' | 'ng' | 'gh' | 'ke' | 'za' | 'gb' | 'us' | 'ca' | 'de' | 'fr' | 'in' | 'ae' | 'br' | 'mx';

/** The parts in the stories. Sale: seller's people and the customer. Farm: the family farm and its people. */
export type Part =
  | 'sales' | 'customer' | 'manager' | 'warehouse' | 'driver'
  | 'farmer' | 'agronomist' | 'poultry' | 'outgrower' | 'picker1' | 'picker2'
  | 'seller' | 'shop' | 'district' | 'farm' | 'valley' | 'hillside' | 'mills';

export interface Profile {
  id: ProfileId;
  city: string;
  currency: 'USD' | 'NGN' | 'GHS' | 'KES' | 'ZAR' | 'GBP' | 'CAD' | 'EUR' | 'INR' | 'AED' | 'BRL' | 'MXN';
  /** Local money for one base unit. */
  scale: number;
  tax: { label: string; rate: number };
  names: Record<Part, string>;
}

const P = (id: ProfileId, city: string, currency: Profile['currency'], scale: number, tax: [string, number], n: string[]): Profile => {
  const parts: Part[] = ['sales', 'customer', 'manager', 'warehouse', 'driver', 'farmer', 'agronomist', 'poultry', 'outgrower', 'picker1', 'picker2', 'seller', 'shop', 'district', 'farm', 'valley', 'hillside', 'mills'];
  if (n.length !== parts.length) throw new Error(`Profile ${id} needs ${parts.length} names`);
  return { id, city, currency, scale, tax: { label: tax[0], rate: tax[1] }, names: Object.fromEntries(parts.map((p, i) => [p, n[i]!])) as Record<Part, string> };
};

//                                                                     sales      customer   manager    warehouse  driver     farmer      agronomist poultry    outgrower            picker1    picker2    seller                    shop                     district       farm                          valley           hillside        mills
export const PROFILES: Record<ProfileId, Profile> = {
  global: P('global', 'Riverside', 'USD', 1, ['VAT', 10], ['Maya', 'Leo', 'Priya', 'Sam', 'Omar', 'Anna', 'Hana', 'Samuel', 'Daniel Ross', 'Rosa', 'Tomás', 'Bright Harbour Traders', 'Greenleaf Grocers', 'Riverside', 'Greenvale Family Farms', 'Greenvale', 'Hillside', 'Riverside Mills']),
  ng: P('ng', 'Lagos', 'NGN', 1000, ['VAT', 7.5], ['Ada', 'Tunde', 'Ngozi', 'Femi', 'Musa', 'Amina', 'Hauwa', 'Samuel', 'Musa Danladi', 'Blessing', 'Emeka', 'Bright Harbour Traders', 'Lagoon Foods', 'Yaba', 'Garba Family Farms', 'Zaria', 'Ogbomosho', 'Kaduna Mills']),
  gh: P('gh', 'Accra', 'GHS', 15, ['VAT', 15], ['Akosua', 'Kwame', 'Efua', 'Kofi', 'Yaw', 'Abena', 'Esi', 'Kojo', 'Kwesi Mensah', 'Ama', 'Kwabena', 'Bright Harbour Traders', 'Osu Fresh Foods', 'Osu', 'Volta Family Farms', 'Volta', 'Techiman', 'Tema Mills']),
  ke: P('ke', 'Nairobi', 'KES', 130, ['VAT', 16], ['Wanjiru', 'Otieno', 'Achieng', 'Kamau', 'Mwangi', 'Njeri', 'Akinyi', 'Kiprop', 'Daniel Mutua', 'Wambui', 'Kibet', 'Bright Harbour Traders', 'Westlands Grocers', 'Westlands', 'Nakuru Family Farms', 'Nakuru', 'Naivasha', 'Rift Valley Mills']),
  za: P('za', 'Johannesburg', 'ZAR', 18, ['VAT', 15], ['Thandi', 'Sipho', 'Naledi', 'Pieter', 'Themba', 'Annelie', 'Lerato', 'Johan', 'Bongani Dlamini', 'Zanele', 'Mandla', 'Bright Harbour Traders', 'Melville Grocers', 'Melville', 'Magalies Family Farms', 'Magaliesberg', 'Brits', 'Highveld Mills']),
  gb: P('gb', 'London', 'GBP', 0.8, ['VAT', 20], ['Emily', 'Oliver', 'Sophie', 'Jack', 'Harry', 'Margaret', 'Charlotte', 'Tom', 'James Wilson', 'Grace', 'Callum', 'Bright Harbour Traders', 'Camden Grocers', 'Camden', 'Cotswold Family Farms', 'Cotswold', 'Stow', 'Severn Mills']),
  us: P('us', 'Chicago', 'USD', 1, ['Sales tax', 8], ['Emma', 'Liam', 'Olivia', 'Noah', 'James', 'Linda', 'Ava', 'Ethan', 'Michael Brown', 'Mia', 'Carlos', 'Bright Harbour Traders', 'Lakeview Grocers', 'Lakeview', 'Prairie View Farms', 'Prairie View', 'Elm Creek', 'Midwest Mills']),
  ca: P('ca', 'Toronto', 'CAD', 1.4, ['HST', 13], ['Sophie', 'Liam', 'Emma', 'Lucas', 'Ethan', 'Mary', 'Charlotte', 'Noah', 'Ryan Martin', 'Chloe', 'Owen', 'Bright Harbour Traders', 'Leslieville Grocers', 'Leslieville', 'Niagara Family Farms', 'Niagara', 'Lincoln', 'Ontario Mills']),
  de: P('de', 'Berlin', 'EUR', 0.9, ['VAT', 19], ['Mia', 'Lukas', 'Hannah', 'Leon', 'Jonas', 'Ingrid', 'Lena', 'Felix', 'Thomas Müller', 'Anna', 'Paul', 'Bright Harbour Traders', 'Kreuzberg Feinkost', 'Kreuzberg', 'Havelland Hof', 'Havelland', 'Nauen', 'Havel Mills']),
  fr: P('fr', 'Paris', 'EUR', 0.9, ['VAT', 20], ['Léa', 'Lucas', 'Chloé', 'Hugo', 'Louis', 'Monique', 'Camille', 'Julien', 'Pierre Martin', 'Manon', 'Théo', 'Bright Harbour Traders', 'Épicerie du Marais', 'Le Marais', 'Ferme du Val de Loire', 'Val de Loire', 'Saumur', 'Moulins de Loire']),
  in: P('in', 'Mumbai', 'INR', 85, ['GST', 18], ['Ananya', 'Rohan', 'Priya', 'Arjun', 'Vikram', 'Lakshmi', 'Kavya', 'Rahul', 'Suresh Patil', 'Pooja', 'Ravi', 'Bright Harbour Traders', 'Bandra Fresh Mart', 'Bandra', 'Nashik Family Farms', 'Nashik', 'Igatpuri', 'Deccan Mills']),
  ae: P('ae', 'Dubai', 'AED', 3.7, ['VAT', 5], ['Fatima', 'Omar', 'Aisha', 'Ahmed', 'Khalid', 'Mariam', 'Noura', 'Yousef', 'Hassan Al Mansoori', 'Layla', 'Saeed', 'Bright Harbour Traders', 'Al Barsha Grocery', 'Al Barsha', 'Al Ain Family Farms', 'Al Ain', 'Liwa', 'Gulf Mills']),
  br: P('br', 'São Paulo', 'BRL', 5, ['Tax', 17], ['Ana', 'Miguel', 'Júlia', 'Gabriel', 'Rafael', 'Maria', 'Beatriz', 'Lucas', 'João Silva', 'Larissa', 'Pedro', 'Bright Harbour Traders', 'Mercearia Pinheiros', 'Pinheiros', 'Fazenda Vale Verde', 'Vale Verde', 'Holambra', 'Moinho Paulista']),
  mx: P('mx', 'Mexico City', 'MXN', 18, ['IVA', 16], ['Sofía', 'Mateo', 'Valentina', 'Diego', 'Santiago', 'Guadalupe', 'Camila', 'Emiliano', 'José Hernández', 'Ximena', 'Luis', 'Bright Harbour Traders', 'Abarrotes Coyoacán', 'Coyoacán', 'Rancho El Bajío', 'El Bajío', 'Celaya', 'Molinos del Bajío']),
};

/** Visitor countries (ISO 3166 alpha-2, as Cloudflare reports them) to the profile that fits best. */
const COUNTRY_PROFILE: Record<string, ProfileId> = {
  // Only where the profile's currency is the country's own, so a visitor never sees a neighbour's money.
  NG: 'ng', GH: 'gh', KE: 'ke', ZA: 'za', GB: 'gb', US: 'us', CA: 'ca',
  DE: 'de', AT: 'de', FR: 'fr', BE: 'fr', LU: 'fr', IN: 'in', AE: 'ae', BR: 'br', MX: 'mx',
};
export const profileFor = (country: string | null | undefined): ProfileId => COUNTRY_PROFILE[(country ?? '').toUpperCase()] ?? 'global';

/** The pricing country the footer switcher uses, for a profile. */
export function pricingCountryFor(id: ProfileId): 'global' | 'ng' | 'latam' {
  return id === 'ng' ? 'ng' : id === 'br' || id === 'mx' ? 'latam' : 'global';
}
