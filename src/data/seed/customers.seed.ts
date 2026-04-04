import { DEMO_CUSTOMER_BVN, DEMO_CUSTOMER_ID, SEED_ACCOUNTS } from "@/data/seed/accounts.seed";

export interface SeedCustomer {
  id: string;
  firstName: string;
  lastName: string;
  bvn: string;
  phone: string;
  email: string;
  nationality: string;
  kycStatus: "Completed" | "Pending Review" | "Enhanced Due Diligence";
  riskTier: "Low" | "Medium" | "High";
  accounts: string[];
  dateOfBirth: string;
  address: string;
}

const customerDirectory = [
  ["Adaobi", "Chukwu", "Nigeria", "Completed", "Low", "14A Admiralty Way, Lekki Phase 1, Lagos"],
  ["Ifeanyi", "Okafor", "Nigeria", "Completed", "Medium", "8 Opebi Road, Ikeja, Lagos"],
  ["Ngozi", "Umeh", "Nigeria", "Completed", "Low", "22 Gwarinpa Estate, Abuja"],
  ["Tunde", "Bello", "Nigeria", "Completed", "Medium", "5 Bode Thomas Street, Surulere, Lagos"],
  ["Kemi", "Afolabi", "Nigeria", "Completed", "Low", "19 Isaac John Street, GRA, Ikeja"],
  ["Amina", "Yusuf", "Nigeria", "Pending Review", "Medium", "17 Ahmadu Bello Way, Kaduna"],
  ["Chidinma", "Nnaji", "Nigeria", "Completed", "Low", "4 Independence Layout, Enugu"],
  ["Boluwatife", "Adeniran", "Nigeria", "Completed", "Low", "31 Ring Road, Ibadan"],
  ["Emeka", "Obi", "Nigeria", "Enhanced Due Diligence", "High", "9 Presidential Road, Enugu"],
  ["Halima", "Sani", "Nigeria", "Pending Review", "Medium", "11 Murtala Mohammed Way, Kano"],
  ["Kojo", "Mensah", "Ghana", "Completed", "Low", "7 Airport Residential, Accra"],
  ["Efua", "Boateng", "Ghana", "Completed", "Medium", "18 Osu Ringway, Accra"],
  ["Kwame", "Asare", "Ghana", "Completed", "Low", "2 Liberation Road, Accra"],
  ["Akinyi", "Otieno", "Kenya", "Completed", "Low", "14 Upper Hill Close, Nairobi"],
  ["Brian", "Mwangi", "Kenya", "Completed", "Medium", "33 Waiyaki Way, Nairobi"],
  ["Lerato", "Khumalo", "South Africa", "Enhanced Due Diligence", "High", "5 Rivonia Road, Sandton"],
  ["Sipho", "Dlamini", "South Africa", "Completed", "Medium", "22 Jan Smuts Avenue, Johannesburg"],
  ["Aissatou", "Ndiaye", "Senegal", "Completed", "Low", "14 Rue Moussé Diop, Dakar"],
  ["Cheikh", "Sarr", "Senegal", "Pending Review", "Medium", "8 Plateau Avenue, Dakar"],
  ["Claude", "Uwimana", "Rwanda", "Completed", "Low", "16 KG 7 Ave, Kigali"],
  ["Diane", "Mukamana", "Rwanda", "Completed", "Low", "4 KN 5 Road, Kigali"],
  ["Mutale", "Phiri", "Zambia", "Completed", "Medium", "11 Cairo Road, Lusaka"],
  ["Thandiwe", "Zulu", "Zambia", "Completed", "Low", "7 Kabulonga Road, Lusaka"],
  ["Fatima", "Balde", "Guinea-Bissau", "Pending Review", "Medium", "3 Avenida Combatentes, Bissau"],
  ["Jean", "Mukendi", "DR Congo", "Enhanced Due Diligence", "High", "10 Boulevard du 30 Juin, Kinshasa"],
] as const;

export const SEED_CUSTOMERS: SeedCustomer[] = customerDirectory.map((entry, index) => {
  const [firstName, lastName, nationality, kycStatus, riskTier, address] = entry;
  const id = index === 0 ? DEMO_CUSTOMER_ID : `cust-${String(index + 1).padStart(3, "0")}`;
  const bvn = index === 0 ? DEMO_CUSTOMER_BVN : `22${String(index + 1).padStart(9, "0")}`;
  const accounts =
    index === 0
      ? SEED_ACCOUNTS.map((account) => account.accountNumber)
      : [`30${String(index + 1).padStart(8, "0")}`];

  return {
    id,
    firstName,
    lastName,
    bvn,
    phone: `+23480${String(10000000 + index * 137).padStart(8, "0")}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@panafrika.demo`,
    nationality,
    kycStatus,
    riskTier,
    accounts,
    dateOfBirth: new Date(1984 + (index % 12), (index * 2) % 12, 5 + (index % 20)).toISOString(),
    address,
  };
});
