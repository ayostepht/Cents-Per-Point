# Source Options Update Summary

## Overview
Updated the source options across the application to include all major airlines and hotels, ensuring consistency between the calculator and redemptions page.

## Changes Made

### 1. Created Shared Constants File
- **File**: `frontend-vite/src/constants/sourceOptions.js`
- **Purpose**: Centralized source options to ensure consistency across all pages
- **Contains**: 
  - `sourceOptions`: Categorized list of credit cards, airlines, and hotels
  - `pointPrograms`: List with reference values for the calculator

### 2. Expanded Source Options

#### Credit Cards (Added 5 new options)
- Wells Fargo Rewards
- Bank of America Points  
- Discover Cashback Bonus
- US Bank Points
- Barclays Arrival Miles

#### Airlines (Expanded from 5 to 24 options)
**US Airlines:**
- American Airlines, Delta Air Lines, United Airlines
- Southwest Airlines, Alaska Airlines, JetBlue Airways
- Hawaiian Airlines, Spirit Airlines, Frontier Airlines
- Allegiant Air

**International Airlines:**
- Air Canada, Air France, British Airways
- Lufthansa, KLM, Emirates, Qatar Airways
- Singapore Airlines, Cathay Pacific, Japan Airlines
- All Nippon Airways, Turkish Airlines
- Virgin Atlantic, Virgin Australia

#### Hotels (Expanded from 4 to 10 options)
**Major Hotel Loyalty Programs:**
- Marriott Bonvoy, Hilton Honors, World of Hyatt
- IHG One Rewards, Wyndham Rewards, Choice Privileges
- Best Western Rewards, Accor Live Limitless
- Radisson Rewards, Sonesta Travel Pass

*Note: Individual hotel brands that are part of larger loyalty programs (e.g., St. Regis, Ritz-Carlton are part of Marriott Bonvoy) are not listed separately to avoid redundancy.*

### 3. Updated Files
- `frontend-vite/src/pages/Redemptions.jsx`: Now imports from shared constants
- `frontend-vite/src/pages/ShouldIBookIt.jsx`: Now imports from shared constants  
- `example`: Updated SOURCE_OPTIONS and COMMONLY_ACCEPTED_POINT_VALUES

### 4. Reference Values Added
Added commonly accepted cent-per-point values for all new programs in the calculator, based on industry standards and current market valuations.

### 5. Calculator Organization Improvements
- **Sorted by Value**: Point programs are now organized by reference value (highest to lowest) within each category
- **Grouped by Category**: Calculator dropdown uses optgroups to separate Credit Cards, Airlines, and Hotels
- **Value Display**: Each option shows the commonly accepted value (e.g., "~2.0¢/pt") for quick reference
- **Logical Order**: 
  - Credit Cards: Chase UR & Amex MR (2.0¢) → Capital One & Citi (1.8¢) → Bilt (1.5¢) → Others (1.0¢)
  - Airlines: Southwest, British Airways, Singapore (1.5¢) → Alaska (1.4¢) → Premium carriers → Budget carriers
  - Hotels: World of Hyatt (2.3¢) → Wyndham (1.0¢) → Mid-tier programs → Marriott & Hilton (0.7-0.6¢)

## Benefits
1. **Consistency**: Both calculator and redemptions page now have identical source options
2. **Comprehensive Coverage**: Includes all major US and international airlines and hotel chains
3. **Maintainability**: Single source of truth for all source options
4. **Industry Standard**: Covers all major loyalty programs users would want to track

## Technical Implementation
- Used ES6 imports/exports for clean module structure
- Alphabetically sorted all options for better UX
- Maintained backward compatibility with existing data
- Applied consistent naming conventions across all programs 