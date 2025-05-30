// Shared source options for both calculator and redemptions pages
export const sourceOptions = [
  {
    label: 'Credit Card',
    options: [ 'Chase', 'Amex', 'Citi', 'Bilt', 'Capital One', 'Wells Fargo', 'Bank of America', 'Discover', 'US Bank', 'Barclays' ].sort()
  },
  {
    label: 'Airline',
    options: [ 
      'American Airlines', 
      'Delta Air Lines', 
      'United Airlines', 
      'Southwest Airlines', 
      'Alaska Airlines', 
      'JetBlue Airways', 
      'Hawaiian Airlines', 
      'Spirit Airlines', 
      'Frontier Airlines', 
      'Allegiant Air',
      'Air Canada',
      'Air France',
      'British Airways',
      'Lufthansa',
      'KLM',
      'Emirates',
      'Qatar Airways',
      'Singapore Airlines',
      'Cathay Pacific',
      'Japan Airlines',
      'All Nippon Airways',
      'Turkish Airlines',
      'Virgin Atlantic',
      'Virgin Australia'
    ].sort()
  },
  {
    label: 'Hotel',
    options: [ 
      'Marriott Bonvoy',
      'Hilton Honors', 
      'World of Hyatt', 
      'IHG One Rewards',
      'Wyndham Rewards',
      'Choice Privileges',
      'Best Western Rewards',
      'Accor Live Limitless',
      'Radisson Rewards',
      'Sonesta Travel Pass'
    ].sort()
  }
];

// Point programs with reference values for the calculator
// Organized by category and sorted by value (highest to lowest within each category)
export const pointPrograms = [
  // Credit Cards (sorted by reference value, highest first)
  { label: 'Chase Ultimate Rewards', value: 'chase', ref: 0.02 },
  { label: 'Amex Membership Rewards', value: 'amex', ref: 0.02 },
  { label: 'Capital One Miles', value: 'capitalone', ref: 0.018 },
  { label: 'Citi ThankYou Points', value: 'citi', ref: 0.018 },
  { label: 'Bilt Rewards', value: 'bilt', ref: 0.015 },
  { label: 'Wells Fargo Rewards', value: 'wellsfargo', ref: 0.01 },
  { label: 'Bank of America Points', value: 'boa', ref: 0.01 },
  { label: 'Discover Cashback Bonus', value: 'discover', ref: 0.01 },
  { label: 'US Bank Points', value: 'usbank', ref: 0.01 },
  { label: 'Barclays Arrival Miles', value: 'barclays', ref: 0.01 },
  
  // Airlines (sorted by reference value, highest first)
  { label: 'Southwest Rapid Rewards', value: 'southwest', ref: 0.015 },
  { label: 'British Airways Avios', value: 'britishairways', ref: 0.015 },
  { label: 'Singapore Airlines KrisFlyer', value: 'singapore', ref: 0.015 },
  { label: 'Alaska Airlines Mileage Plan', value: 'alaska', ref: 0.014 },
  { label: 'JetBlue TrueBlue', value: 'jetblue', ref: 0.013 },
  { label: 'Air France-KLM Flying Blue', value: 'flyingblue', ref: 0.013 },
  { label: 'Virgin Atlantic Flying Club', value: 'virgin', ref: 0.013 },
  { label: 'American Airlines AAdvantage', value: 'american', ref: 0.012 },
  { label: 'United MileagePlus', value: 'united', ref: 0.012 },
  { label: 'Air Canada Aeroplan', value: 'aircanada', ref: 0.012 },
  { label: 'Qatar Airways Privilege Club', value: 'qatar', ref: 0.012 },
  { label: 'Delta SkyMiles', value: 'delta', ref: 0.011 },
  { label: 'Lufthansa Miles & More', value: 'lufthansa', ref: 0.011 },
  { label: 'Emirates Skywards', value: 'emirates', ref: 0.010 },
  { label: 'Hawaiian Airlines HawaiianMiles', value: 'hawaiian', ref: 0.009 },
  { label: 'Spirit Airlines Free Spirit', value: 'spirit', ref: 0.008 },
  { label: 'Frontier Airlines Miles', value: 'frontier', ref: 0.008 },
  
  // Hotels (sorted by reference value, highest first)
  { label: 'World of Hyatt', value: 'hyatt', ref: 0.023 },
  { label: 'Wyndham Rewards', value: 'wyndham', ref: 0.01 },
  { label: 'IHG One Rewards', value: 'ihg', ref: 0.009 },
  { label: 'Choice Privileges', value: 'choice', ref: 0.008 },
  { label: 'Best Western Rewards', value: 'bestwestern', ref: 0.008 },
  { label: 'Accor Live Limitless', value: 'accor', ref: 0.008 },
  { label: 'Radisson Rewards', value: 'radisson', ref: 0.008 },
  { label: 'Sonesta Travel Pass', value: 'sonesta', ref: 0.008 },
  { label: 'Marriott Bonvoy', value: 'marriott', ref: 0.007 },
  { label: 'Hilton Honors', value: 'hilton', ref: 0.006 },
]; 