/**
 * Names for the hotel, restaurant and shop stories, per country profile. Dishes are what a local place would serve.
 * The global names must stay unique across every part (they are swapped back by name inside app screens).
 */
export const INDUSTRY_PARTS = [
  'hotel', 'hotelCity', 'housekeeper', 'earlyGuest', 'lunchGuest', 'company', 'movingGuest',
  'restaurant', 'restaurantPlace', 'chef', 'host', 'floorManager', 'partyFamily', 'dishMain', 'dishGrill', 'dishSide', 'sideIngredient', 'fish', 'dishLate',
  'store', 'storePlace', 'owner', 'cashier', 'regular', 'branchRoad', 'branch2',
] as const;
export type IndustryPart = (typeof INDUSTRY_PARTS)[number];

const row = (s: string): Record<IndustryPart, string> => {
  const v = s.split('|').map((x) => x.trim());
  if (v.length !== INDUSTRY_PARTS.length) throw new Error(`Industry names need ${INDUSTRY_PARTS.length} values, got ${v.length}: ${s.slice(0, 40)}`);
  return Object.fromEntries(INDUSTRY_PARTS.map((p, i) => [p, v[i]!])) as Record<IndustryPart, string>;
};

//   hotel | city | housekeeper | early guest | lunch guest | company | moving guest
//   restaurant | place | chef | host | floor manager | party | main dish | grill dish | side | side's ingredient | fish | late main
//   shop | town | owner | cashier | regular | branch road | second branch
export const INDUSTRY_NAMES = {
  global: row(`Harbourview Hotel | Bayside | Marta | Mr Novak | Mrs Lindqvist | Northgate Logistics | Mrs Duarte
    | Juniper Kitchen | Old Town | Marco | Aisha | Nadia | the Bennetts | grilled chicken bowl | steak skewers | garlic bread | dough | sea bass | mushroom risotto
    | Maple & Co. Home | Westbrook | Clara | Lily | Mrs Whitfield | Mill Road | Park Lane`),
  ng: row(`Marina Court Hotel | Calabar | Blessing | Mr Okafor | Mrs Okon | Ikom Cocoa Growers | Mrs Bassey
    | Red Tile Kitchen | Bodija, Ibadan | Femi | Amaka | Bola | the Okafors | jollof rice and chicken | suya platter | moi moi | beans | croaker | ofada rice
    | Adaeze Home and Electronics | Enugu | Adaeze | Chiamaka | Mrs Okafor | Ogui Road | Garden Avenue`),
  gh: row(`Labadi Beach Lodge | Accra | Adwoa | Mr Mensah | Mrs Owusu | Volta Cocoa Traders | Mrs Asante
    | Chez Afua Kitchen | Osu | Kwaku | Akua | Yaa | the Boatengs | jollof rice and chicken | kebab platter | kelewele | plantain | tilapia | waakye
    | Makola Home and Electronics | Kumasi | Afia | Adjoa | Mrs Darko | Adum Road | Kejetia Lane`),
  ke: row(`Mara View Hotel | Mombasa | Wairimu | Mr Kariuki | Mrs Wanjala | Kericho Tea Estates | Mrs Ochieng
    | Kilimani Kitchen | Kilimani | Juma | Nafula | Atieno | the Kimanis | nyama choma and ugali | beef skewers | samosas | flour | tilapia | pilau
    | Tumaini Home and Electronics | Kisumu | Achieng | Mumbua | Mrs Otieno | Market Street | Lake Road`),
  za: row(`Atlantic Bay Hotel | Cape Town | Nomsa | Mr van der Merwe | Mrs Botha | Karoo Wine Traders | Mrs Naidoo
    | Bo-Kaap Kitchen | Bo-Kaap | Lwazi | Ayanda | Busi | the Pillays | bobotie | sosaties | vetkoek | dough | snoek | bunny chow
    | Rosebank Home and Electronics | Durban | Lindiwe | Nandi | Mrs Govender | Florida Road | Musgrave Road`),
  gb: row(`The Harbour Hotel | Brighton | Amelia | Mr Taylor | Mrs Davies | Pennine Freight | Mrs Evans
    | The Copper Kettle | Shoreditch | George | Isla | Freya | the Robinsons | chicken pie | lamb skewers | Yorkshire puddings | batter | haddock | beef Wellington
    | Hartley Home and Electronics | Leeds | Hannah | Ruby | Mrs Clarke | Briggate | Kirkgate`),
  us: row(`The Lakeshore Inn | San Diego | Maria | Mr Johnson | Mrs Miller | Pacific Freight Co. | Mrs Garcia
    | Oak & Ember Grill | North Park | Tyler | Madison | Kayla | the Andersons | fried chicken and waffles | BBQ ribs | cornbread | cornmeal | catfish | shrimp and grits
    | Lakeside Home and Electronics | Austin | Jessica | Ashley | Mrs Thompson | Congress Avenue | South Lamar`),
  ca: row(`Harbourfront Hotel | Vancouver | Isabelle | Mr Tremblay | Mrs Roy | Prairie Grain Co. | Mrs Gagnon
    | Maple Leaf Bistro | Gastown | Antoine | Ava | Zoe | the Leblancs | poutine | pork skewers | bannock | flour | salmon | tourtière
    | Northern Home and Electronics | Calgary | Megan | Brooke | Mrs Wilson | Stephen Avenue | Kensington Road`),
  de: row(`Hotel am Hafen | Hamburg | Katarina | Herr Schneider | Frau Fischer | Elbe Logistik | Frau Weber
    | Gasthaus zur Linde | Altona | Maximilian | Sophie | Lea | the Beckers | schnitzel | bratwurst | pretzels | dough | trout | beef roulade
    | Wagner Haus und Technik | Munich | Julia | Laura | Frau Hoffmann | Leopoldstraße | Sendlinger Straße`),
  fr: row(`Hôtel du Port | Marseille | Inès | M. Dubois | Mme Moreau | Provence Transports | Mme Laurent
    | Bistrot des Halles | Croix-Rousse | Mathieu | Jade | Zoé | the Bernards | coq au vin | lamb brochettes | gougères | choux pastry | sea bream | bouillabaisse
    | Maison Lefèvre | Lille | Émilie | Lina | Mme Petit | rue Nationale | rue de Béthune`),
  in: row(`Sea Breeze Residency | Goa | Sunita | Mr Sharma | Mrs Iyer | Assam Tea Traders | Mrs Reddy
    | Spice Route Kitchen | Koramangala | Rajesh | Neha | Divya | the Mehtas | chicken biryani | paneer tikka | samosas | potatoes | pomfret | butter chicken
    | Shree Home and Electronics | Pune | Meera | Sneha | Mrs Kulkarni | FC Road | MG Road`),
  ae: row(`Marina Pearl Hotel | Abu Dhabi | Joy | Mr Al Hashimi | Mrs Al Zaabi | Gulf Date Traders | Mrs Haddad
    | Dar Al Saffron Kitchen | Jumeirah | Rami | Hessa | Reem | the Al Suwaidis | chicken machboos | lamb kebabs | hummus | chickpeas | hammour | lamb ouzi
    | Al Noor Home and Electronics | Sharjah | Amna | Shamma | Mrs Al Ketbi | Al Wahda Street | Al Majaz Road`),
  br: row(`Hotel Beira-Mar | Salvador | Francisca | Sr. Oliveira | Sra. Souza | Café do Vale Exportadora | Sra. Costa
    | Cozinha da Vila | Vila Madalena | Rodrigo | Fernanda | Bruna | the Almeidas | feijoada | picanha skewers | pão de queijo | cheese dough | tilapia | moqueca
    | Casa Lima Utilidades | Belo Horizonte | Patrícia | Letícia | Sra. Ribeiro | Rua da Bahia | Avenida Afonso Pena`),
  mx: row(`Hotel Playa Azul | Cancún | Lupita | Sr. Ramírez | Sra. Torres | Café de Chiapas | Sra. Flores
    | Cocina La Doña | Roma Norte | Alejandro | Daniela | Fernanda | the Moraleses | chicken mole | tacos al pastor | tamales | masa | red snapper | cochinita pibil
    | Casa Hogar y Electrónica | Guadalajara | Verónica | Andrea | Sra. Castillo | Avenida Chapultepec | Calle Morelos`),
} as const;
