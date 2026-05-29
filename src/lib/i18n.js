// Bilingual strings — Odia first, English second
// Usage: t('farmerLedger') => { or: 'ମଛୁଆ ଖାତା', en: 'Farmer Ledger' }

export const strings = {
  // App
  appName:        { or: 'AquaFlow', en: 'AquaFlow' },
  tagline:        { or: 'ମାଛ ବ୍ୟବସାୟ ପ୍ରଣାଳୀ', en: 'Fish Dealer Management System' },

  // Auth
  login:          { or: 'ଲଗଇନ', en: 'Login' },
  logout:         { or: 'ଲଗଆଉଟ', en: 'Logout' },
  register:       { or: 'ନଥିଭୁକ୍ତ', en: 'Register' },
  email:          { or: 'ଇମେଲ', en: 'Email' },
  password:       { or: 'ପାସୱାର୍ଡ', en: 'Password' },
  phone:          { or: 'ଫୋନ', en: 'Phone' },
  forgotPassword: { or: 'ପାସୱାର୍ଡ ଭୁଲିଗଲେ?', en: 'Forgot Password?' },
  dealerName:     { or: 'ବ୍ୟବସାୟ ନାମ', en: 'Business Name' },
  ownerName:      { or: 'ମାଲିକ ନାମ', en: 'Owner Name' },

  // Navigation
  dashboard:      { or: 'ଡ୍ୟାସ୍‌ବୋର୍ଡ', en: 'Dashboard' },
  farmers:        { or: 'ମଛୁଆ', en: 'Farmers' },
  farmerLedger:   { or: 'ମଛୁଆ ଖାତା', en: 'Farmer Ledger' },
  materials:      { or: 'ସ୍ଟକ', en: 'Stock & Materials' },
  vendors:        { or: 'ବିକ୍ରେତା', en: 'Vendors' },
  harvest:        { or: 'ଫସଲ', en: 'Harvest' },
  dispatch:       { or: 'ଡ଼ିସ୍ପ୍ୟାଚ', en: 'Dispatch' },
  expenses:       { or: 'ଖର୍ଚ', en: 'Expenses' },
  reports:        { or: 'ରିପୋର୍ଟ', en: 'Reports' },
  settings:       { or: 'ସେଟିଂ', en: 'Settings' },

  // Farmer
  farmerName:     { or: 'ମଛୁଆ ନାମ', en: 'Farmer Name' },
  village:        { or: 'ଗ୍ରାମ', en: 'Village' },
  pondAcres:      { or: 'ପୋଖରୀ ଏକର', en: 'Pond Acres' },
  outstanding:    { or: 'ବକେୟା', en: 'Outstanding' },
  addFarmer:      { or: 'ମଛୁଆ ଯୋଗ', en: 'Add Farmer' },

  // Ledger
  creditGiven:    { or: 'ଋଣ ଦିଆଗଲା', en: 'Credit Given' },
  cashAdvance:    { or: 'ନଗଦ ଅଗ୍ରୀମ', en: 'Cash Advance' },
  harvestRecover: { or: 'ଫସଲ ଆଦାୟ', en: 'Harvest Recovery' },
  cashPayment:    { or: 'ନଗଦ ଦେୟ', en: 'Cash Payment' },
  adjustment:     { or: 'ସଂଶୋଧନ', en: 'Adjustment' },
  addEntry:       { or: 'ଏଣ୍ଟ୍ରି ଯୋଗ', en: 'Add Entry' },
  amount:         { or: 'ରାଶି', en: 'Amount' },
  description:    { or: 'ବିବରଣ', en: 'Description' },
  date:           { or: 'ତାରିଖ', en: 'Date' },
  balance:        { or: 'ଜମା', en: 'Balance' },
  owes:           { or: 'ଦେବାକୁ ଅଛି', en: 'Owes Dealer' },
  credit:         { or: 'ଉଧାର', en: 'Credit' },
  debit:          { or: 'ଆଦାୟ', en: 'Debit' },

  // Common
  save:           { or: 'ସଞ୍ଚୟ', en: 'Save' },
  cancel:         { or: 'ବାତିଲ', en: 'Cancel' },
  edit:           { or: 'ସଂଶୋଧ', en: 'Edit' },
  delete:         { or: 'ବିଲୋପ', en: 'Delete' },
  search:         { or: 'ଖୋଜ', en: 'Search' },
  loading:        { or: 'ଲୋଡ଼ ହେଉଛି...', en: 'Loading...' },
  noData:         { or: 'କୌଣସି ତଥ୍ୟ ନାହିଁ', en: 'No data found' },
  total:          { or: 'ମୋଟ', en: 'Total' },
  print:          { or: 'ପ୍ରିଣ୍ଟ', en: 'Print' },
  view:           { or: 'ଦେଖ', en: 'View' },

  // Status
  active:         { or: 'ସକ୍ରିୟ', en: 'Active' },
  inactive:       { or: 'ନିଷ୍କ୍ରିୟ', en: 'Inactive' },
  paid:           { or: 'ଦିଆ ଗଲା', en: 'Paid' },
  pending:        { or: 'ବାକି ଅଛି', en: 'Pending' },

  // Roles
  owner:          { or: 'ମାଲିକ', en: 'Owner' },
  manager:        { or: 'ମ୍ୟାନେଜର', en: 'Manager' },
  accountant:     { or: 'ହିସାବ ରକ୍ଷକ', en: 'Accountant' },
  fieldAgent:     { or: 'ଫିଲ୍ଡ ଏଜେଣ୍ଟ', en: 'Field Agent' },
}

// Hook usage: const { lang } = useLang()
// t(key) => shows odia if lang='or', english if lang='en'
export const t = (key, lang = 'or') => {
  const entry = strings[key]
  if (!entry) return key
  return entry[lang] || entry.en || key
}

// Dual label component helper
export const dual = (key) => strings[key] || { or: key, en: key }
