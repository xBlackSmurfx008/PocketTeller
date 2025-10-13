# Complete UI Inventory - All Pages, Buttons & Components
## Comprehensive Checklist for Android & Web Feature Parity

**Created:** October 13, 2025  
**Purpose:** Document EVERY page, button, form, and interactive element from iOS  
**Use:** Verify 100% UI parity on Android and Web

---

## 📱 Total Page Count: 25 Pages

### ✅ iOS Status: All 25 pages working
### 🟡 Android Status: Needs verification of all 25 pages
### 🟢 Web Status: Needs verification of all 25 pages

---

## 🏠 PUBLIC PAGES (5 pages)

### 1. Landing Page (`/`)
**Purpose:** Marketing homepage

**Sections:**
- [ ] Hero section with headline
- [ ] Value propositions
- [ ] Features showcase
- [ ] Social proof / testimonials
- [ ] Pricing preview
- [ ] Final CTA
- [ ] Trusted by marquee

**Buttons/Links:**
- [ ] "Get Started" (CTA button)
- [ ] "Try Demo" button
- [ ] "Sign Up" button
- [ ] "Login" link
- [ ] App Store download button
- [ ] Google Play download button
- [ ] Footer navigation links
- [ ] "For Institutions" link
- [ ] "For Non-Profits" link
- [ ] "Contact" button/link

**Forms:**
- [ ] Waitlist signup form (email input)
- [ ] Contact form (if on page)

**Navigation:**
- [ ] Public header with logo
- [ ] Navigation menu
- [ ] Mobile hamburger menu
- [ ] Footer with links

---

### 2. Authentication Page (`/auth`)
**Purpose:** Login and signup

**Tabs/Modes:**
- [ ] Login tab
- [ ] Sign Up tab
- [ ] Toggle between login/signup

**Login Section:**
- [ ] Email input field
- [ ] Password input field
- [ ] "Show/Hide Password" toggle
- [ ] "Remember Me" checkbox
- [ ] "Forgot Password?" link
- [ ] "Login" button
- [ ] "Login with Magic Link" button (if available)
- [ ] "Try Demo Instead" button

**Sign Up Section:**
- [ ] Email input field
- [ ] Password input field
- [ ] Confirm Password input field
- [ ] "Show/Hide Password" toggles
- [ ] Terms & Privacy checkbox
- [ ] "Sign Up" button
- [ ] "Already have account? Login" link

**Social Auth (if implemented):**
- [ ] "Continue with Google" button
- [ ] "Continue with Apple" button

**Error States:**
- [ ] Email validation errors
- [ ] Password strength indicator
- [ ] Login failure messages
- [ ] Signup error messages

---

### 3. Demo Page (`/demo`)
**Purpose:** Try app with sample data

**Header:**
- [ ] "Demo Mode" indicator
- [ ] "Sign Up for Real Account" button
- [ ] "Exit Demo" button

**Content:**
- [ ] Demo welcome message
- [ ] Sample data loaded indicator
- [ ] Access to all features (read-only)
- [ ] "Upgrade to Full Account" prompts

---

### 4. Privacy Policy (`/privacy`)
**Purpose:** Privacy policy page

**Components:**
- [ ] Privacy policy content (text)
- [ ] Navigation header
- [ ] Footer
- [ ] "Back to Home" link
- [ ] Table of contents (if long)
- [ ] Print button (optional)

---

### 5. Terms of Service (`/terms`)
**Purpose:** Terms and conditions

**Components:**
- [ ] Terms content (text)
- [ ] Navigation header
- [ ] Footer
- [ ] "Back to Home" link
- [ ] Table of contents (if long)
- [ ] Print button (optional)

---

## 🔐 AUTH FLOW PAGES (3 pages)

### 6. Email Confirmation (`/confirm`)
**Purpose:** Verify email after signup

**Components:**
- [ ] Confirmation message
- [ ] "Email Sent" indicator
- [ ] "Resend Email" button
- [ ] Email address display
- [ ] "Change Email" link (if applicable)
- [ ] Loading indicator during verification
- [ ] Success message
- [ ] Error message (if verification fails)
- [ ] "Continue to Dashboard" button

---

### 7. Reset Password (`/reset-password`)
**Purpose:** Reset forgotten password

**Step 1: Request Reset:**
- [ ] Email input field
- [ ] "Send Reset Link" button
- [ ] "Back to Login" link
- [ ] Success message ("Email sent")

**Step 2: Enter New Password (if token in URL):**
- [ ] New password input field
- [ ] Confirm password input field
- [ ] "Show/Hide Password" toggles
- [ ] Password strength indicator
- [ ] "Reset Password" button
- [ ] Success message
- [ ] "Login with New Password" button

---

### 8. Test Page (`/test`)
**Purpose:** Testing/debugging page

**Components:**
- [ ] Environment variable display
- [ ] API connection test buttons
- [ ] Database connection test
- [ ] Feature flags display
- [ ] Debug information
- [ ] Clear cache button
- [ ] Reset demo data button

---

## 🏡 MAIN APP PAGES (10 pages)

### 9. Dashboard/Home (`/home`)
**Purpose:** Main overview of finances

**Header:**
- [ ] App logo
- [ ] User profile avatar/menu
- [ ] Notification bell icon
- [ ] Settings gear icon
- [ ] Theme toggle button

**Financial Summary Section:**
- [ ] Total balance card
- [ ] Income card
- [ ] Expenses card
- [ ] Net position card
- [ ] Time period selector (month/year)

**Account Selector:**
- [ ] Dropdown to switch accounts
- [ ] "All Accounts" option
- [ ] Individual account options
- [ ] Account balance display in dropdown

**Quick Actions:**
- [ ] "Add Bank" button
- [ ] "Add Transaction" button
- [ ] "View Budget" button
- [ ] "Ask AI Coach" button

**Recent Transactions Widget:**
- [ ] Last 10 transactions list
- [ ] Transaction category icons
- [ ] Amount display
- [ ] Date display
- [ ] "View All" button

**Spending Insights Widget:**
- [ ] Pie chart of spending by category
- [ ] Top spending categories list
- [ ] "View Details" button

**Upcoming Bills Widget:**
- [ ] Next 3-5 bills list
- [ ] Due date display
- [ ] Amount display
- [ ] "Pay" button (if applicable)
- [ ] "View All Bills" button

**Goals Progress Widget:**
- [ ] Active goals list
- [ ] Progress bars
- [ ] Target amounts
- [ ] "View All Goals" button

**Bottom Navigation:**
- [ ] Home icon/button (active)
- [ ] Transactions icon/button
- [ ] Budget icon/button
- [ ] Goals icon/button
- [ ] More/Menu icon/button

---

### 10. Transactions Page (`/transactions`)
**Purpose:** View and manage all transactions

**Header:**
- [ ] "Transactions" title
- [ ] Account selector dropdown
- [ ] Search icon/button
- [ ] Filter icon/button
- [ ] Export icon/button

**Filters Bar:**
- [ ] Quick date filters (buttons):
  - [ ] Last 30 days
  - [ ] Last 60 days
  - [ ] Last 90 days
  - [ ] Last 6 months
  - [ ] Last 12 months
  - [ ] Last 24 months
  - [ ] Custom range
- [ ] Category filter dropdown
- [ ] Amount range slider
- [ ] Clear filters button

**Custom Date Range Modal:**
- [ ] Start date picker
- [ ] End date picker
- [ ] "Apply" button
- [ ] "Cancel" button

**Search Bar:**
- [ ] Search input field
- [ ] Search icon
- [ ] Clear search button
- [ ] Search suggestions dropdown

**Sort Options:**
- [ ] Sort dropdown with options:
  - [ ] Date (newest first)
  - [ ] Date (oldest first)
  - [ ] Amount (high to low)
  - [ ] Amount (low to high)
  - [ ] Category (A-Z)

**Bulk Actions Bar:**
- [ ] "Select All" checkbox
- [ ] "Categorize Selected" button
- [ ] "Delete Selected" button
- [ ] Selected count display

**Transaction List:**
- [ ] Transaction items with:
  - [ ] Checkbox for bulk selection
  - [ ] Merchant/description
  - [ ] Date
  - [ ] Amount (with + or -)
  - [ ] Category tag
  - [ ] Category icon
  - [ ] Edit icon button
  - [ ] Delete icon button
- [ ] Pagination controls:
  - [ ] Previous page button
  - [ ] Page number display
  - [ ] Next page button
  - [ ] Items per page selector
- [ ] Infinite scroll (alternative to pagination)
- [ ] Pull-to-refresh (mobile)

**Add Transaction Button:**
- [ ] Floating action button (FAB)
- [ ] Opens add transaction modal

**Add/Edit Transaction Modal:**
- [ ] Merchant/description input
- [ ] Amount input
- [ ] Date picker
- [ ] Category dropdown
- [ ] Type selector (income/expense)
- [ ] Account selector (if multiple)
- [ ] Notes textarea (optional)
- [ ] Receipt upload button (optional)
- [ ] "Save" button
- [ ] "Cancel" button
- [ ] "Delete" button (edit mode only)

**Export Modal:**
- [ ] Format selector (CSV/PDF)
- [ ] Date range selector
- [ ] Include filters checkbox
- [ ] "Export" button
- [ ] "Cancel" button

**Sync Status:**
- [ ] Last synced timestamp
- [ ] "Sync Now" button
- [ ] Sync in progress indicator

**Empty State:**
- [ ] "No transactions" illustration
- [ ] "Add Bank" button
- [ ] "Add Manual Transaction" button

---

### 11. Budget Page (`/budget`)
**Purpose:** Plan and track budget

**Header:**
- [ ] "Budget" title
- [ ] Month/year selector
- [ ] Previous month button
- [ ] Next month button
- [ ] "Add Category" button

**Budget Summary Cards:**
- [ ] Total budgeted amount
- [ ] Total spent amount
- [ ] Remaining amount
- [ ] Percentage used progress bar
- [ ] Over/under budget indicator

**Budget Categories List:**
Each category card shows:
- [ ] Category name
- [ ] Category icon
- [ ] Budgeted amount input/display
- [ ] Spent amount display
- [ ] Remaining amount
- [ ] Progress bar
- [ ] Color coding (green/yellow/red)
- [ ] Edit button
- [ ] Delete button
- [ ] Expand/collapse details

**Category Details (expanded):**
- [ ] Transactions in this category
- [ ] Spending trend chart
- [ ] Comparison to previous months

**Add Category Modal:**
- [ ] Category name input
- [ ] Category icon picker
- [ ] Budget amount input
- [ ] Color picker
- [ ] "Save" button
- [ ] "Cancel" button

**Budget vs Actual Chart:**
- [ ] Bar chart showing budgeted vs spent
- [ ] Toggle between categories/months

**Share Budget:**
- [ ] "Share Budget" button
- [ ] Opens share modal

**Share Budget Modal:**
- [ ] Email option
- [ ] SMS option
- [ ] Email input field
- [ ] Phone input field
- [ ] Message preview
- [ ] "Send" button
- [ ] "Cancel" button
- [ ] "Copy Link" button

**Budget Settings:**
- [ ] Auto-rollover toggle
- [ ] Alert threshold slider
- [ ] Currency settings

---

### 12. Goals Page (`/goals`)
**Purpose:** Set and track financial goals

**Header:**
- [ ] "Goals" title
- [ ] "Add Goal" button
- [ ] Filter dropdown (active/completed/all)

**Goals List:**
Each goal card shows:
- [ ] Goal title
- [ ] Goal category icon
- [ ] Target amount
- [ ] Current amount
- [ ] Progress bar
- [ ] Percentage complete
- [ ] Target date
- [ ] Days remaining
- [ ] Edit button
- [ ] Delete button
- [ ] Mark complete button
- [ ] Add task button

**Goal Details (expanded/clicked):**
- [ ] Full description
- [ ] Progress chart
- [ ] Task list:
  - [ ] Task item with checkbox
  - [ ] Task description
  - [ ] Task due date
  - [ ] Edit task button
  - [ ] Delete task button
- [ ] "Add Task" button
- [ ] Milestone markers
- [ ] Contribution history

**Add Goal Modal:**
- [ ] Goal title input
- [ ] Description textarea
- [ ] Target amount input
- [ ] Current amount input
- [ ] Target date picker
- [ ] Category selector
- [ ] Icon picker
- [ ] "Save" button
- [ ] "Cancel" button

**Add Task Modal (within goal):**
- [ ] Task description input
- [ ] Due date picker
- [ ] Priority selector
- [ ] "Save" button
- [ ] "Cancel" button

**Empty State:**
- [ ] "No goals yet" illustration
- [ ] "Create Your First Goal" button
- [ ] Goal ideas/suggestions

---

### 13. AI Coach / Chat (`/chat`, `/chat/:threadId`)
**Purpose:** Financial coaching conversations

**Header:**
- [ ] "AI Financial Coach" title
- [ ] New conversation button
- [ ] Conversation history button/menu
- [ ] Settings icon

**Sidebar (Desktop) / Drawer (Mobile):**
- [ ] Recent conversations list:
  - [ ] Conversation title/preview
  - [ ] Timestamp
  - [ ] Click to open
  - [ ] Delete button
- [ ] "New Conversation" button
- [ ] "Clear History" button

**Chat Interface:**
- [ ] Message history (scrollable)
- [ ] Message bubbles:
  - [ ] User messages (right-aligned)
  - [ ] AI messages (left-aligned)
  - [ ] AI avatar icon
  - [ ] User avatar icon
  - [ ] Timestamp
  - [ ] Copy message button
  - [ ] Regenerate response button (AI)
- [ ] Typing indicator when AI is responding
- [ ] "AI is thinking" animation

**Message Input Area:**
- [ ] Text input field (multiline)
- [ ] Character count (if limited)
- [ ] "Send" button
- [ ] Attachment button
- [ ] Camera button
- [ ] Emoji button (optional)
- [ ] Voice input button (optional)

**File Upload Modal:**
- [ ] Drag & drop area
- [ ] "Browse Files" button
- [ ] File type filter (PDF, images)
- [ ] Preview of selected file
- [ ] "Upload" button
- [ ] "Cancel" button
- [ ] Upload progress bar

**Camera Capture:**
- [ ] Camera viewfinder
- [ ] Capture button
- [ ] Switch camera button (front/back)
- [ ] Cancel button
- [ ] Preview captured image
- [ ] Retake button
- [ ] Use photo button

**Education Panel (optional sidebar):**
- [ ] Financial tips
- [ ] Related articles
- [ ] Quick actions
- [ ] Suggested questions

**Conversation Context:**
- [ ] Current financial data display
- [ ] Account balances
- [ ] Recent transactions
- [ ] Budget summary
- [ ] User preferences

**Empty State:**
- [ ] Welcome message
- [ ] Suggested questions/prompts
- [ ] Feature highlights
- [ ] "Start Conversation" button

---

### 14. Account Details Page (`/account`)
**Purpose:** View specific account details

**Header:**
- [ ] Account name
- [ ] Institution logo
- [ ] Back button
- [ ] Settings icon
- [ ] Disconnect button

**Account Summary:**
- [ ] Current balance (large display)
- [ ] Available balance
- [ ] Account number (masked)
- [ ] Account type
- [ ] "Show/Hide Balance" toggle
- [ ] Last synced timestamp
- [ ] "Sync Now" button

**Account Tabs:**
- [ ] Transactions tab (active by default)
- [ ] Overview tab
- [ ] Statements tab (if available)
- [ ] Settings tab

**Transactions Tab:**
- [ ] Filtered transaction list for this account
- [ ] All transaction list features (see Transactions page)

**Overview Tab:**
- [ ] Spending by category chart
- [ ] Monthly spending trend
- [ ] Income vs expenses
- [ ] Top merchants
- [ ] Statistics summary

**Statements Tab:**
- [ ] Available statements list
- [ ] Date range for each
- [ ] Download button
- [ ] View button

**Settings Tab:**
- [ ] Account nickname input
- [ ] Color picker
- [ ] Icon picker
- [ ] Exclude from totals toggle
- [ ] Disconnect account button
- [ ] Save button

**Disconnect Account Modal:**
- [ ] Warning message
- [ ] "Keep transactions" checkbox
- [ ] "Disconnect" button
- [ ] "Cancel" button

---

### 15. Bills Page (if separate, or in Dashboard)
**Purpose:** Track and manage bills

**Header:**
- [ ] "Bills" title
- [ ] "Add Bill" button
- [ ] Filter dropdown (upcoming/overdue/paid/all)

**Bills Summary:**
- [ ] Total bills due this month
- [ ] Amount due
- [ ] Next bill due date
- [ ] Overdue count (if any)

**Bills List:**
Each bill card shows:
- [ ] Bill name/merchant
- [ ] Amount
- [ ] Due date
- [ ] Payment status
- [ ] Recurring indicator
- [ ] Edit button
- [ ] Delete button
- [ ] "Mark Paid" button
- [ ] Set reminder button

**Add Bill Modal:**
- [ ] Bill name input
- [ ] Amount input
- [ ] Due date picker
- [ ] Recurring checkbox
- [ ] Frequency selector (monthly/weekly/yearly)
- [ ] Auto-pay toggle
- [ ] Category selector
- [ ] Notes textarea
- [ ] "Save" button
- [ ] "Cancel" button

**Calendar View (optional):**
- [ ] Monthly calendar
- [ ] Bills marked on dates
- [ ] Click date to see bills

**Reminders:**
- [ ] Notification preferences
- [ ] Days before reminder slider

---

### 16. Subscription Page (`/subscription`)
**Purpose:** Manage PocketTeller subscription

**Header:**
- [ ] "Subscription" title
- [ ] Current plan badge

**Current Plan Section:**
- [ ] Plan name (Free/Monthly/Yearly)
- [ ] Price display
- [ ] Billing period
- [ ] Next billing date
- [ ] Features included list
- [ ] "Manage Subscription" button (if paid)
- [ ] "Cancel Subscription" button (if paid)

**Available Plans:**
Each plan card shows:
- [ ] Plan name
- [ ] Price
- [ ] Billing period
- [ ] Discount badge (if yearly)
- [ ] Free trial indicator
- [ ] Feature list with checkmarks
- [ ] "Select Plan" button
- [ ] "Current Plan" indicator (if active)

**Promo Code:**
- [ ] Promo code input field
- [ ] "Apply" button
- [ ] Success/error message
- [ ] Discount display

**Checkout (Stripe):**
- [ ] Stripe checkout integration
- [ ] Payment method entry
- [ ] Billing info form
- [ ] Order summary
- [ ] Terms acceptance checkbox
- [ ] "Subscribe" button
- [ ] "Cancel" button

**Customer Portal:**
- [ ] Link to Stripe customer portal
- [ ] "Manage Payment Methods" button
- [ ] "View Invoices" button
- [ ] "Update Billing Info" button

**Referral Section:**
- [ ] Referral program info
- [ ] Current rewards balance
- [ ] "Submit Suggestion" button
- [ ] Referral history

**Billing History:**
- [ ] Past invoices list
- [ ] Date
- [ ] Amount
- [ ] Status
- [ ] Download button

---

### 17. Shared Budget View (`/share/budget/:token`)
**Purpose:** View shared budget (public link)

**Components:**
- [ ] Budget overview (read-only)
- [ ] Month/year display
- [ ] Budget categories with amounts
- [ ] Spending breakdown chart
- [ ] Total budgeted vs spent
- [ ] No edit capabilities
- [ ] "Get Your Own Account" CTA button
- [ ] PocketTeller branding

---

### 18. For Institutions (`/for-institutions`)
**Purpose:** Marketing to financial institutions

**Sections:**
- [ ] Hero section
- [ ] Value propositions for institutions
- [ ] Features showcase
- [ ] Integration options
- [ ] Pricing for institutions
- [ ] Case studies/testimonials
- [ ] "Request Demo" button
- [ ] "Contact Sales" button
- [ ] Contact form

---

### 19. For Non-Profits (`/for-nonprofits`)
**Purpose:** Marketing to non-profit organizations

**Sections:**
- [ ] Hero section
- [ ] Value propositions for non-profits
- [ ] Features showcase
- [ ] Discounted pricing
- [ ] Success stories
- [ ] "Apply for Discount" button
- [ ] "Contact Us" button
- [ ] Contact form

---

## ⚙️ SETTINGS PAGES (7 pages)

### 20. Settings Hub (`/settings`)
**Purpose:** Main settings navigation

**Header:**
- [ ] "Settings" title
- [ ] Back button
- [ ] User profile display

**Settings Categories List:**
- [ ] Profile settings card/button
- [ ] Banking settings card/button
- [ ] Notifications settings card/button
- [ ] Appearance settings card/button
- [ ] Security settings card/button
- [ ] Data management card/button
- [ ] Help & Support card/button
- [ ] About section card/button

**Quick Actions:**
- [ ] Log out button
- [ ] Theme toggle
- [ ] Language selector (if multi-language)

**Account Section:**
- [ ] Account status display
- [ ] Subscription status
- [ ] Storage usage (if applicable)

---

### 21. Profile Settings (`/settings/profile`)
**Purpose:** Manage user profile

**Profile Photo:**
- [ ] Current photo display
- [ ] "Change Photo" button
- [ ] Photo upload modal:
  - [ ] Upload from device
  - [ ] Take photo
  - [ ] Remove photo option
  - [ ] Crop tool
  - [ ] Save/Cancel

**Personal Information:**
- [ ] Full name input
- [ ] Email display (read-only or editable)
- [ ] Phone number input
- [ ] Date of birth picker
- [ ] Address inputs (optional)
- [ ] "Save Changes" button

**Email Preferences:**
- [ ] Change email button
- [ ] Verify email button (if unverified)

**Password:**
- [ ] "Change Password" button
- [ ] Opens password change modal:
  - [ ] Current password input
  - [ ] New password input
  - [ ] Confirm new password input
  - [ ] Password strength indicator
  - [ ] "Update Password" button
  - [ ] "Cancel" button

**Delete Account:**
- [ ] "Delete Account" button
- [ ] Opens confirmation modal:
  - [ ] Warning message
  - [ ] "I understand" checkbox
  - [ ] Password confirmation input
  - [ ] "Permanently Delete" button
  - [ ] "Cancel" button

---

### 22. Banking Settings (`/settings/banking`)
**Purpose:** Manage connected banks

**Header:**
- [ ] "Banking Settings" title
- [ ] "Add Bank" button
- [ ] Back button

**Connected Accounts List:**
Each bank connection shows:
- [ ] Institution name
- [ ] Institution logo
- [ ] Connection status indicator
- [ ] Last synced timestamp
- [ ] Number of accounts connected
- [ ] "Sync Now" button
- [ ] "Manage" button
- [ ] "Disconnect" button

**Manage Bank Modal:**
- [ ] Institution name
- [ ] Connected accounts list:
  - [ ] Account name
  - [ ] Account type
  - [ ] Last 4 digits
  - [ ] Status
  - [ ] Enable/disable toggle
- [ ] "Update Login" button (if credentials expired)
- [ ] "Disconnect All" button
- [ ] "Close" button

**Plaid Settings:**
- [ ] Auto-sync toggle
- [ ] Sync frequency selector
- [ ] Include pending transactions toggle
- [ ] Transaction limit (free tier display)

**Security:**
- [ ] Plaid security information display
- [ ] Encryption status indicator
- [ ] Token rotation info

**Add Bank (Plaid Link):**
- [ ] Plaid Link widget integration
- [ ] Institution search
- [ ] Login credentials entry
- [ ] MFA handling
- [ ] Account selection
- [ ] Success confirmation

---

### 23. Notifications Settings (`/settings/notifications`)
**Purpose:** Configure notification preferences

**Header:**
- [ ] "Notifications" title
- [ ] Back button
- [ ] "Mark All Read" button

**Push Notifications:**
- [ ] Enable push notifications toggle
- [ ] Permission status display
- [ ] "Request Permission" button (if needed)

**Email Notifications:**
- [ ] Enable email notifications toggle
- [ ] Email address display

**Notification Types:**
Each notification type has toggle:
- [ ] Bill reminders
- [ ] Budget alerts (over limit)
- [ ] Goal milestones
- [ ] Large transactions
- [ ] Weekly summary
- [ ] Monthly report
- [ ] Marketing emails
- [ ] Product updates
- [ ] Security alerts

**Notification Schedule:**
- [ ] Quiet hours toggle
- [ ] Start time picker
- [ ] End time picker
- [ ] Days of week selector

**Notification Inbox:**
- [ ] Recent notifications list
- [ ] Read/unread indicator
- [ ] Notification title
- [ ] Timestamp
- [ ] Mark read button
- [ ] Delete button
- [ ] Clear all button

---

### 24. Appearance Settings (`/settings/appearance`)
**Purpose:** Customize look and feel

**Theme:**
- [ ] Theme selector:
  - [ ] Light theme option
  - [ ] Dark theme option
  - [ ] System default option
  - [ ] Auto (based on time) option
- [ ] Theme preview

**Accent Color:**
- [ ] Accent color picker
- [ ] Preset color options
- [ ] Custom color selector
- [ ] Preview display

**Layout:**
- [ ] Compact view toggle
- [ ] Comfortable view toggle
- [ ] Expanded view toggle
- [ ] Card style selector

**Font Size:**
- [ ] Font size slider
- [ ] Preview text display
- [ ] Reset to default button

**Currency Display:**
- [ ] Currency symbol position selector
- [ ] Decimal places selector
- [ ] Thousands separator selector

**Dashboard Customization:**
- [ ] Show/hide widgets toggles:
  - [ ] Recent transactions
  - [ ] Spending insights
  - [ ] Upcoming bills
  - [ ] Goals progress
  - [ ] Financial summary
- [ ] Widget order customization (drag & drop)

**Language (if multi-language):**
- [ ] Language selector dropdown
- [ ] Available languages list

---

### 25. Security Settings (`/settings/security`)
**Purpose:** Manage security settings

**Header:**
- [ ] "Security" title
- [ ] Back button
- [ ] Security status indicator

**Password & Authentication:**
- [ ] Change password button
- [ ] Password last changed date
- [ ] Password strength indicator

**Two-Factor Authentication:**
- [ ] Enable 2FA toggle
- [ ] 2FA status indicator
- [ ] Setup 2FA button
- [ ] QR code display (setup)
- [ ] Backup codes display
- [ ] Download backup codes button

**Biometric Authentication:**
- [ ] Enable fingerprint toggle (Android)
- [ ] Enable Face ID toggle (iOS)
- [ ] Enable face unlock toggle (Android)
- [ ] Test biometric button

**Sessions:**
- [ ] Active sessions list:
  - [ ] Device name
  - [ ] Location (approximate)
  - [ ] Last active timestamp
  - [ ] Browser/app info
  - [ ] "Revoke" button
- [ ] "Log Out All Devices" button

**Login History:**
- [ ] Recent login attempts
- [ ] Date/time
- [ ] Location
- [ ] Device
- [ ] Success/failure indicator
- [ ] "Report suspicious activity" button

**Security Alerts:**
- [ ] Email on new login toggle
- [ ] Email on password change toggle
- [ ] Email on bank connection toggle
- [ ] Email on large transaction toggle

**Data Encryption:**
- [ ] Encryption status display
- [ ] Bank token encryption info
- [ ] Data security details

**Account Recovery:**
- [ ] Recovery email display
- [ ] Update recovery email button
- [ ] Recovery phone display
- [ ] Update recovery phone button

---

### 26. Data Management Settings (`/settings/data`)
**Purpose:** Manage user data

**Header:**
- [ ] "Data Management" title
- [ ] Back button

**Export Data:**
- [ ] "Export All Data" button
- [ ] Format selector (JSON/CSV)
- [ ] Date range selector
- [ ] Include transactions checkbox
- [ ] Include budgets checkbox
- [ ] Include goals checkbox
- [ ] Include conversations checkbox
- [ ] "Generate Export" button
- [ ] Download link (when ready)

**Import Data:**
- [ ] "Import Data" button (if feature exists)
- [ ] File upload area
- [ ] Format selector
- [ ] Preview imported data
- [ ] "Confirm Import" button

**Data Storage:**
- [ ] Storage used display
- [ ] Storage limit display (if applicable)
- [ ] Breakdown by data type

**Clear Data:**
- [ ] Clear cache button
- [ ] Clear conversation history button
- [ ] Clear notifications button
- [ ] Confirmation modals for each

**Delete Account:**
- [ ] "Delete My Account" button
- [ ] Opens confirmation modal:
  - [ ] Warning about permanent deletion
  - [ ] Data retention policy info
  - [ ] "Download my data first" link
  - [ ] "I understand" checkbox
  - [ ] Password confirmation
  - [ ] "Permanently Delete Account" button
  - [ ] "Cancel" button

**Privacy:**
- [ ] Privacy policy link
- [ ] Data usage explanation
- [ ] Third-party data sharing info
- [ ] Opt-out options

---

## 🔔 NOTIFICATION INBOX (Overlay/Modal)

**Access:**
- [ ] Bell icon in header
- [ ] Badge with unread count

**Notification List:**
- [ ] Recent notifications
- [ ] Read/unread indicator
- [ ] Notification icon/category
- [ ] Title
- [ ] Message preview
- [ ] Timestamp
- [ ] Click to view details
- [ ] Mark as read button
- [ ] Delete button

**Actions:**
- [ ] "Mark All as Read" button
- [ ] "Clear All" button
- [ ] Filter by type dropdown
- [ ] View all notifications link

---

## 📱 GLOBAL UI COMPONENTS

### Navigation

**Top Navigation Bar (Desktop):**
- [ ] App logo/home link
- [ ] Navigation menu items
- [ ] Search bar
- [ ] Notification bell
- [ ] User profile dropdown
- [ ] Settings icon
- [ ] Theme toggle

**Bottom Navigation Bar (Mobile):**
- [ ] Home icon/button
- [ ] Transactions icon/button
- [ ] Budget icon/button
- [ ] Goals icon/button
- [ ] More/Menu icon/button
- [ ] Active indicator
- [ ] Badge counts (if applicable)

**Hamburger Menu (Mobile):**
- [ ] Menu icon/button
- [ ] Slide-out drawer with:
  - [ ] All navigation items
  - [ ] User profile section
  - [ ] Settings link
  - [ ] Log out button
  - [ ] App version display

**Breadcrumbs (Desktop):**
- [ ] Current page hierarchy
- [ ] Clickable parent pages
- [ ] Current page (not clickable)

### Modals & Dialogs

**Generic Modal:**
- [ ] Modal overlay (dims background)
- [ ] Modal content area
- [ ] Close button (X)
- [ ] Title
- [ ] Content area
- [ ] Action buttons (primary/secondary)
- [ ] Keyboard support (Esc to close)
- [ ] Click outside to close

**Confirmation Dialog:**
- [ ] Warning icon
- [ ] Title
- [ ] Message
- [ ] "Confirm" button
- [ ] "Cancel" button

**Loading Dialog:**
- [ ] Loading spinner
- [ ] "Please wait" message
- [ ] Progress indicator (if applicable)

### Toast Notifications

**Success Toast:**
- [ ] Success icon
- [ ] Success message
- [ ] Auto-dismiss (3-5 seconds)
- [ ] Close button

**Error Toast:**
- [ ] Error icon
- [ ] Error message
- [ ] Auto-dismiss or persist
- [ ] Close button

**Info Toast:**
- [ ] Info icon
- [ ] Info message
- [ ] Auto-dismiss
- [ ] Close button

**Warning Toast:**
- [ ] Warning icon
- [ ] Warning message
- [ ] Action button (optional)
- [ ] Close button

### Loading States

**Page Loading:**
- [ ] Full-page spinner
- [ ] Skeleton screens
- [ ] Progress bars

**Component Loading:**
- [ ] Inline spinners
- [ ] Shimmer effects
- [ ] "Loading..." text

**Button Loading:**
- [ ] Disabled state
- [ ] Spinner inside button
- [ ] Text change ("Loading...")

### Empty States

**Generic Empty State:**
- [ ] Illustration/icon
- [ ] Title
- [ ] Description
- [ ] Call-to-action button

**No Data States:**
- [ ] "No transactions yet"
- [ ] "No budgets created"
- [ ] "No goals set"
- [ ] "No bills added"
- [ ] Each with relevant CTA

### Error States

**Page Error:**
- [ ] Error illustration
- [ ] Error message
- [ ] "Try Again" button
- [ ] "Go Home" button

**404 Not Found:**
- [ ] 404 illustration
- [ ] "Page not found" message
- [ ] "Return Home" button
- [ ] Suggested pages links

**Network Error:**
- [ ] Offline indicator
- [ ] "No internet connection" message
- [ ] "Retry" button

**API Error:**
- [ ] Error message
- [ ] Error code (for support)
- [ ] "Try Again" button
- [ ] "Contact Support" link

### Form Components

**Input Fields:**
- [ ] Label
- [ ] Placeholder text
- [ ] Input field
- [ ] Validation icon (check/x)
- [ ] Error message (if invalid)
- [ ] Helper text
- [ ] Required indicator (*)
- [ ] Character counter (if limited)

**Dropdown/Select:**
- [ ] Label
- [ ] Selected value display
- [ ] Dropdown arrow icon
- [ ] Options list
- [ ] Search in dropdown (if many options)
- [ ] Empty state ("No options")

**Checkbox:**
- [ ] Checkbox input
- [ ] Label
- [ ] Checked/unchecked state
- [ ] Disabled state

**Radio Buttons:**
- [ ] Radio button input
- [ ] Label
- [ ] Selected/unselected state
- [ ] Group of related options

**Toggle/Switch:**
- [ ] Switch element
- [ ] On/off state
- [ ] Label
- [ ] Disabled state

**Date Picker:**
- [ ] Input field
- [ ] Calendar icon
- [ ] Calendar modal
- [ ] Month/year selector
- [ ] Day selection
- [ ] Today button
- [ ] Clear button
- [ ] Apply button

**File Upload:**
- [ ] Upload area
- [ ] "Browse" button
- [ ] Drag & drop support
- [ ] File preview
- [ ] Remove file button
- [ ] Upload progress bar
- [ ] File type validation
- [ ] File size validation

### Charts & Visualizations

**Pie Chart:**
- [ ] Category breakdown
- [ ] Legend
- [ ] Hover tooltips
- [ ] Click to filter

**Bar Chart:**
- [ ] Monthly comparisons
- [ ] Axis labels
- [ ] Hover tooltips
- [ ] Click interactions

**Line Chart:**
- [ ] Trend over time
- [ ] Axis labels
- [ ] Hover tooltips
- [ ] Multiple series support

**Progress Bar:**
- [ ] Filled portion
- [ ] Percentage display
- [ ] Color coding (green/yellow/red)
- [ ] Label

**Gauge/Meter:**
- [ ] Current value indicator
- [ ] Min/max labels
- [ ] Color coding

### Accessibility Features

**Screen Reader Support:**
- [ ] ARIA labels on all buttons
- [ ] ARIA descriptions on complex components
- [ ] ARIA live regions for dynamic content
- [ ] Proper heading hierarchy

**Keyboard Navigation:**
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Keyboard shortcuts work
- [ ] Skip navigation link
- [ ] Escape closes modals

**Color & Contrast:**
- [ ] Sufficient contrast ratios (WCAG AA)
- [ ] Don't rely on color alone
- [ ] High contrast mode support

**Text:**
- [ ] Resizable text (zoom support)
- [ ] Clear, readable fonts
- [ ] Adequate line spacing

---

## 🎨 THEME & STYLING

### Color Palette

**Light Theme:**
- [ ] Primary color (violet #7C3AED)
- [ ] Background colors
- [ ] Text colors
- [ ] Border colors
- [ ] Success green
- [ ] Error red
- [ ] Warning amber
- [ ] Info blue

**Dark Theme:**
- [ ] All light theme colors adapted
- [ ] Darker backgrounds
- [ ] Lighter text
- [ ] Adjusted borders
- [ ] Maintain WCAG contrast ratios

### Typography

**Font Sizes:**
- [ ] Heading 1 (h1)
- [ ] Heading 2 (h2)
- [ ] Heading 3 (h3)
- [ ] Heading 4 (h4)
- [ ] Body text
- [ ] Small text
- [ ] Caption text

**Font Weights:**
- [ ] Regular
- [ ] Medium
- [ ] Semibold
- [ ] Bold

### Spacing System

**Consistent Spacing:**
- [ ] 4px base unit
- [ ] 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px
- [ ] Applied consistently across all components

### Responsive Breakpoints

**Breakpoints:**
- [ ] Mobile: < 640px
- [ ] Tablet: 640px - 1024px
- [ ] Desktop: > 1024px
- [ ] Large desktop: > 1280px

**Responsive Behaviors:**
- [ ] Mobile: Single column, stacked layout
- [ ] Tablet: 2-column where appropriate
- [ ] Desktop: Multi-column, sidebar layouts
- [ ] All components adapt properly

---

## 🔍 ANDROID-SPECIFIC TESTING CHECKLIST

### UI Components to Verify
- [ ] All pages render correctly
- [ ] All buttons are clickable
- [ ] All forms accept input
- [ ] All modals open and close
- [ ] All dropdowns work
- [ ] All date pickers function
- [ ] All charts render
- [ ] All images load

### Navigation
- [ ] Bottom navigation works
- [ ] Back button behavior correct
- [ ] Deep linking works (if implemented)
- [ ] Navigation drawer works
- [ ] Tab navigation works

### Material Design
- [ ] Follows Material Design 3 guidelines
- [ ] Ripple effects on buttons
- [ ] Elevation shadows correct
- [ ] Transitions smooth
- [ ] Touch targets 48dp minimum

### Android-Specific Features
- [ ] Camera access works
- [ ] File picker works
- [ ] Share intent works
- [ ] Status bar theming
- [ ] Navigation bar theming
- [ ] Splash screen displays
- [ ] Pull-to-refresh works

### Performance
- [ ] No jank on scrolling
- [ ] Smooth animations (60fps)
- [ ] Fast page transitions
- [ ] No memory leaks
- [ ] App doesn't crash

---

## 🌐 WEB-SPECIFIC TESTING CHECKLIST

### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

### Desktop Features
- [ ] Keyboard shortcuts work
- [ ] Right-click context menus (if implemented)
- [ ] Hover states
- [ ] Multi-column layouts
- [ ] Proper use of screen space

### Web-Specific Features
- [ ] URLs work correctly
- [ ] Browser back/forward buttons work
- [ ] Bookmarking works
- [ ] Sharing via browser share API
- [ ] Copy to clipboard works
- [ ] Print functionality (if implemented)

### Responsive Design
- [ ] All pages responsive
- [ ] Works on all screen sizes
- [ ] Touch targets adequate on mobile
- [ ] No horizontal scrolling (unintended)

---

## 📊 TESTING TRACKING

### Overall Progress Tracking

**iOS (Baseline):**
- Total pages: 26 ✅
- Total components: 500+ ✅
- Status: 100% Complete

**Android:**
- Total pages to test: 26
- Pages tested: ___
- Components tested: ___
- Issues found: ___
- Status: ____%

**Web:**
- Total pages to test: 26
- Pages tested: ___
- Components tested: ___
- Issues found: ___
- Status: ____%

---

## 🎯 PRIORITY TESTING ORDER

### Phase 1: Critical Pages (Do First)
1. [ ] Authentication (`/auth`)
2. [ ] Dashboard (`/home`)
3. [ ] Transactions (`/transactions`)
4. [ ] Settings Hub (`/settings`)
5. [ ] Plaid bank connection flow

### Phase 2: Core Features
6. [ ] Budget page
7. [ ] Goals page
8. [ ] AI Coach / Chat
9. [ ] Profile settings
10. [ ] Banking settings

### Phase 3: Secondary Pages
11. [ ] Bills management
12. [ ] Account details
13. [ ] Subscription page
14. [ ] Notifications settings
15. [ ] Appearance settings

### Phase 4: Final Pages
16. [ ] Security settings
17. [ ] Data management settings
18. [ ] Public pages (landing, terms, privacy)
19. [ ] For institutions/non-profits pages
20. [ ] All remaining pages

---

## 🚀 QUICK START

### For Android Testing:
```bash
# Build and deploy
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk

# Use this document to verify every page and button
```

### For Web Testing:
```bash
# Build and run
npm run build
npm run preview

# Open in all browsers and verify every page
```

---

**Total UI Elements to Verify:** 1000+ (buttons, forms, pages, components)

**This is your complete checklist** - verify every item on both Android and Web!

---

Last Updated: October 13, 2025  
Status: Complete UI Inventory  
Use this to ensure 100% UI/UX parity across all platforms

