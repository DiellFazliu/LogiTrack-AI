// backend/src/modules/ai/knowledge-base.ts
export interface KnowledgeChunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    topic: string;
    keywords?: string[];
  };
}

export const knowledgeChunks: KnowledgeChunk[] = [
  // ==================== AUTHENTICATION (5) ====================
  // Replace or add this chunk in knowledgeChunks array
  {
    id: "friendly_greeting",
    text: "👋 Hello! Welcome to LogiTrack! I'm your AI assistant, here to make your logistics management easy and enjoyable. Whether you need help creating a shipment, tracking a delivery, managing drivers, or using the AI route optimizer – just ask! How can I brighten your day today? 😊",
    metadata: { source: "feature", topic: "greeting", keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "greetings", "howdy"] },
  },
  {
    id: "login",
    text: "To log in to LogiTrack, go to the /login page. Enter your email address and password, then click 'Login'. If you have forgotten your password, click the 'Forgot Password' link to receive a reset email. After successful login, you will be redirected to your role-based dashboard.",
    metadata: { source: "user_guide", topic: "authentication", keywords: ["login", "sign in", "log in"] },
  },
  {
    id: "logout",
    text: "To log out, click on your profile avatar or name in the top-right corner of the navigation bar, then select 'Logout' from the dropdown menu. You will be signed out and redirected to the login page.",
    metadata: { source: "user_guide", topic: "authentication", keywords: ["logout", "sign out", "log out"] },
  },
  {
    id: "forgot_password",
    text: "If you forgot your password, on the login page click the 'Forgot Password' link. Enter your registered email address and submit. You will receive an email with a password reset link. Click the link and set a new password (minimum 6 characters).",
    metadata: { source: "user_guide", topic: "authentication", keywords: ["forgot password", "reset password"] },
  },
  {
    id: "change_password",
    text: "To change your password while logged in, go to your Profile page (click your avatar → Profile). Enter your current password and your new password (minimum 6 characters), then click 'Save Changes'. You will be asked to log in again afterwards.",
    metadata: { source: "user_guide", topic: "authentication", keywords: ["change password", "update password"] },
  },
  {
    id: "profile",
    text: "Your Profile page allows you to update your personal information: name, email address, phone number, and password. To access it, click your avatar in the top-right corner and select 'Profile'.",
    metadata: { source: "user_guide", topic: "authentication", keywords: ["profile", "update profile"] },
  },

  // ==================== SHIPMENTS (expanded) ====================
  {
    id: "create_shipment",
    text: "To create a new shipment, go to the 'Create Shipment' page (available for Dispatchers, Company Admins, and Customers). Fill in the following fields:\n- Pickup Address: full street address\n- Delivery Address: full destination address\n- Weight (kg): optional\n- Volume (m³): optional\n- Priority: low, normal, high, or urgent\n- Express Delivery: checkbox for faster shipping\n- Notes: special instructions for the driver\nAfter creation, you can assign a driver and vehicle later from the shipment details page.",
    metadata: { source: "feature", topic: "shipments", keywords: ["create shipment", "new shipment"] },
  },
  {
    id: "track_shipment",
    text: "You can track a shipment using the public tracking page at /track/{trackingNumber} – no login required. Logged‑in users can also see all their shipments in the dashboard and click 'View' to see real‑time status and location.",
    metadata: { source: "feature", topic: "shipments", keywords: ["track shipment", "tracking number"] },
  },
  {
    id: "shipment_statuses",
    text: "Each shipment has a status that changes throughout its lifecycle:\n- pending: just created, not yet picked up\n- picked_up: driver has collected the package\n- in_transit: on the way to delivery address\n- delivered: successfully delivered\n- failed: delivery attempt failed\n- cancelled: cancelled by admin or customer\nYou can update the status from the shipment details page (allowed for drivers and dispatchers).",
    metadata: { source: "feature", topic: "shipments", keywords: ["shipment status", "status"] },
  },
  {
    id: "shipment_priority",
    text: "Shipments can have four priority levels: low, normal, high, urgent. Urgent shipments are prioritized and may be assigned to faster drivers or express routes. The estimated delivery date is calculated based on priority – urgent may be delivered in 1 day, while low priority may take 3–5 days.",
    metadata: { source: "feature", topic: "shipments", keywords: ["priority", "urgent", "high priority"] },
  },
  {
    id: "express_delivery",
    text: "Express delivery is a checkbox when creating a shipment. It signals that the shipment should be delivered as quickly as possible, often within 24 hours. Express shipments are highlighted in the dispatcher and driver dashboards with an 'Express' badge.",
    metadata: { source: "feature", topic: "shipments", keywords: ["express", "fast delivery"] },
  },
  {
    id: "assign_driver_to_shipment",
    text: "To assign a driver to a shipment, open the shipment details page. If no driver is assigned, you will see an 'Assign Driver' button. Click it, select an available driver from the list, and confirm. The driver will receive a notification (if implemented) and see the shipment in their dashboard.",
    metadata: { source: "feature", topic: "shipments", keywords: ["assign driver", "driver assignment"] },
  },
  {
    id: "assign_vehicle_to_shipment",
    text: "Similarly, you can assign a vehicle to a shipment. On the shipment details page, click 'Assign Vehicle' (if no vehicle is assigned) and choose an available vehicle that matches the cargo capacity requirements.",
    metadata: { source: "feature", topic: "shipments", keywords: ["assign vehicle", "vehicle assignment"] },
  },
  {
    id: "export_shipments",
    text: "On the Shipments list page, you can export the current filtered view to a CSV file. Click the 'Export to CSV' button – the file will be downloaded automatically containing all shipment fields: tracking number, customer, status, priority, weight, volume, driver, created date, estimated delivery.",
    metadata: { source: "feature", topic: "shipments", keywords: ["export shipments", "csv"] },
  },
  {
    id: "shipment_filtering",
    text: "The shipments list page allows filtering by status (pending, picked_up, in_transit, delivered, failed, cancelled), priority (low, normal, high, urgent), date range (start and end dates), and search by tracking number or customer name. You can combine multiple filters to narrow down results.",
    metadata: { source: "feature", topic: "shipments", keywords: ["filter", "search shipments"] },
  },
  {
    id: "waybill",
    text: "A waybill is a document that accompanies a shipment. It contains the tracking number, pickup and delivery addresses, and a QR code. Drivers can sign the waybill digitally from the shipment details page (if the waybill is generated). Once signed, the signature is stored and a PDF can be downloaded.",
    metadata: { source: "feature", topic: "shipments", keywords: ["waybill", "document", "signature"] },
  },

  // ==================== DRIVERS (expanded) ====================
  {
    id: "add_driver",
    text: "To add a new driver, go to the 'Drivers' page and click 'Add Driver'. Fill in the driver's personal information: name, email, password (minimum 6 chars), license number, phone, address (optional), and hire date. The system will automatically create a user account with the 'driver' role and link it to the driver record. The driver can then log in using the provided email and password.",
    metadata: { source: "feature", topic: "drivers", keywords: ["add driver", "create driver", "new driver"] },
  },
  {
    id: "edit_driver",
    text: "You can edit a driver's information from the drivers list by clicking the 'Edit' (pencil) icon on the driver card. You can update the license number, phone number, address, hire date, and status. The associated user account (name, email) can be updated separately from the Users section.",
    metadata: { source: "feature", topic: "drivers", keywords: ["edit driver", "update driver"] },
  },
  {
    id: "driver_status",
    text: "Drivers have a status that indicates their availability:\n- available: free and ready for new assignments\n- on_duty: currently working but may be busy\n- on_break: temporarily unavailable\n- off_duty: not working\n- sick: on sick leave\n- vacation: on annual leave\nDispatchers can change the status from the drivers list using the dropdown menu. Drivers can also update their own status (if permitted).",
    metadata: { source: "feature", topic: "drivers", keywords: ["driver status", "change driver status"] },
  },
  {
    id: "driver_performance",
    text: "Driver performance metrics are shown on the driver card: total deliveries (completed shipments) and rating (average customer rating from 0 to 5 stars). More detailed driver performance reports can be found in the Reports section under 'Driver Performance Report'.",
    metadata: { source: "feature", topic: "drivers", keywords: ["driver performance", "driver rating", "deliveries"] },
  },
  {
    id: "driver_location",
    text: "Drivers can update their current location from the Driver Dashboard (Update Location page). The location can be entered manually (latitude/longitude) or automatically using the browser's geolocation. The last known location is visible to dispatchers and company admins for real‑time tracking.",
    metadata: { source: "feature", topic: "drivers", keywords: ["driver location", "update location", "gps"] },
  },

  // ==================== VEHICLES (expanded) ====================
  {
    id: "add_vehicle",
    text: "To add a vehicle, go to the 'Vehicles' page and click 'Add Vehicle'. Fill in the following details:\n- License plate (format: 01-123-KS)\n- Type: truck, van, motorcycle, car, trailer\n- Brand and model\n- Year\n- Color (optional)\n- Capacity in kg and m³\n- Fuel type: diesel, petrol, electric, hybrid, LPG\n- Status: available, in_use, maintenance, repair, out_of_service\n- Mileage (km)\n- Last and next maintenance dates\n- Insurance and registration expiry dates.",
    metadata: { source: "feature", topic: "vehicles", keywords: ["add vehicle", "create vehicle", "new vehicle"] },
  },
  {
    id: "vehicle_status",
    text: "Vehicle statuses help manage fleet availability:\n- available: ready for assignment\n- in_use: currently assigned to a shipment\n- maintenance: undergoing scheduled maintenance\n- repair: in repair shop\n- out_of_service: not operational\nYou can change the status from the vehicle card dropdown or from the edit form.",
    metadata: { source: "feature", topic: "vehicles", keywords: ["vehicle status", "change vehicle status"] },
  },
  {
    id: "vehicle_maintenance",
    text: "You can track maintenance dates for each vehicle: last maintenance (when it was last serviced) and next maintenance (when the next service is due). The system will show a reminder on the vehicle card when next maintenance is approaching. Keep these dates updated to ensure vehicle reliability.",
    metadata: { source: "feature", topic: "vehicles", keywords: ["maintenance", "vehicle maintenance"] },
  },
  {
    id: "vehicle_capacity",
    text: "Each vehicle has two capacity values: capacity in kilograms (kg) and capacity in cubic meters (m³). When assigning a vehicle to a shipment, the system checks if the shipment's total weight and volume do not exceed the vehicle's limits. This helps prevent overloading.",
    metadata: { source: "feature", topic: "vehicles", keywords: ["capacity", "weight limit", "volume limit"] },
  },
  {
    id: "vehicle_fuel_types",
    text: "Supported fuel types: diesel, petrol, electric, hybrid, LPG. Fuel type is informational for fleet management and may be used in future reporting (e.g., fuel consumption tracking).",
    metadata: { source: "feature", topic: "vehicles", keywords: ["fuel type", "diesel", "electric"] },
  },

  // ==================== WAREHOUSES (expanded) ====================
  {
    id: "add_warehouse",
    text: "To add a warehouse, go to 'Warehouses' → 'Add Warehouse'. Fill in:\n- Name: e.g., 'Main Warehouse'\n- Address: full street address\n- Capacity (m²): total storage area\n- Manager name and phone number (optional)\n- GPS coordinates (latitude, longitude) – useful for route optimization.\nWarehouses can be used as pickup points for shipments.",
    metadata: { source: "feature", topic: "warehouses", keywords: ["add warehouse", "create warehouse"] },
  },
  {
    id: "warehouse_coordinates",
    text: "Including GPS coordinates (latitude and longitude) for a warehouse helps the AI Route Optimizer calculate accurate distances when the warehouse is used as a pickup or delivery point. You can find coordinates using Google Maps.",
    metadata: { source: "feature", topic: "warehouses", keywords: ["warehouse coordinates", "gps"] },
  },
  {
    id: "warehouse_capacity",
    text: "Warehouse capacity is measured in square meters (m²). It represents the total storage area available. This is informational for now; future versions may include inventory management.",
    metadata: { source: "feature", topic: "warehouses", keywords: ["capacity", "storage"] },
  },

  // ==================== PRODUCTS (expanded) ====================
  {
    id: "add_product",
    text: "To add a product to your catalog, go to 'Products' → 'Add Product'. Fill in:\n- SKU (Stock Keeping Unit): unique identifier (e.g., PROD-001)\n- Name: product name\n- Description: optional details\n- Category: e.g., Electronics, Furniture, etc.\n- Weight (kg) and Volume (m³) – used for shipment calculations\n- Hazardous Material: checkbox if the product is dangerous\n- Fragile: checkbox if the product is breakable.\nProducts help categorize shipments and calculate capacity.",
    metadata: { source: "feature", topic: "products", keywords: ["add product", "create product"] },
  },
  {
    id: "product_categories",
    text: "You can group products by categories (e.g., Electronics, Clothing, Food). Categories help with filtering and reporting. To assign a category, simply type the category name when adding/editing a product – new categories are automatically created.",
    metadata: { source: "feature", topic: "products", keywords: ["product category", "categories"] },
  },
  {
    id: "hazardous_fragile_products",
    text: "Products flagged as hazardous or fragile require special handling. Hazardous products may have restrictions on certain vehicles or routes. Fragile products should be handled with care. Dispatchers and drivers see these flags on shipment details.",
    metadata: { source: "feature", topic: "products", keywords: ["hazardous", "fragile", "dangerous goods"] },
  },

  // ==================== REPORTS & ANALYTICS (expanded) ====================
  {
    id: "reports_overview",
    text: "The Reports page provides key business metrics:\n- Total shipments, delivered, pending, in‑transit\n- On‑time delivery rate\n- Active drivers and total drivers\n- Available vehicles and total vehicles\n- Total revenue (calculated as €50 per delivered shipment)\n- Average driver rating\nYou can also generate custom reports by date range and export them as CSV or JSON.",
    metadata: { source: "feature", topic: "reports", keywords: ["reports", "analytics", "statistics"] },
  },
  {
    id: "generate_custom_report",
    text: "To generate a custom report, select a start date and end date, choose a report type (shipment, driver, or financial), then click 'Generate Report'. The report will be saved and you can view/download it later.",
    metadata: { source: "feature", topic: "reports", keywords: ["custom report", "generate report"] },
  },
  {
    id: "export_report",
    text: "Once a report is generated, you can download it as a file. Click the 'Download' button next to the saved report. The file will be in JSON format (or CSV if you choose).",
    metadata: { source: "feature", topic: "reports", keywords: ["export report", "download report"] },
  },
  {
    id: "revenue_calculation",
    text: "Total revenue is calculated automatically as €50 per delivered shipment. This is a fixed placeholder value; in a real deployment, you can connect a pricing engine or integrate with a payment gateway.",
    metadata: { source: "feature", topic: "reports", keywords: ["revenue", "money", "income"] },
  },

  // ==================== AI ROUTE OPTIMIZER (expanded) ====================
  {
    id: "ai_route_optimizer_howto",
    text: "The AI Route Optimizer helps drivers and dispatchers find the most efficient order of stops. How to use:\n1. Open the Route Optimizer page (for drivers: /driver/route-optimizer; for dispatchers: /ai/optimize-route).\n2. Click on the map to add points (pickup, delivery, or warehouse). Each click adds a marker.\n3. You can choose the point type from the left panel (green= pickup, red= delivery, blue= warehouse).\n4. After adding at least 2 points, click 'Optimize Route'.\n5. The AI returns the optimal order of points, total distance, total time, and recommendations.\nThe route is shown on the map and step‑by‑step instructions are listed below.",
    metadata: { source: "feature", topic: "ai", keywords: ["route optimizer", "ai route", "optimize route"] },
  },
  {
    id: "ai_route_optimizer_benefits",
    text: "Using the AI Route Optimizer can save fuel, reduce delivery time, and improve customer satisfaction by finding the shortest or fastest route. It considers real‑road network data (via OpenRouteService) and traffic conditions (if available).",
    metadata: { source: "feature", topic: "ai", keywords: ["route optimizer benefits", "ai benefits"] },
  },
  {
    id: "ai_delay_prediction",
    text: "The AI can predict potential delays for a shipment based on current traffic, weather, and historical data. To use it, go to the AI section or shipment details and click 'Predict Delay'. The AI returns a delay probability (e.g., Low 15%), estimated delay time, and reasons. This helps dispatchers proactively notify customers.",
    metadata: { source: "feature", topic: "ai", keywords: ["delay prediction", "delay", "prediction"] },
  },

  // ==================== ROLES & PERMISSIONS (expanded) ====================
  {
    id: "roles_super_admin",
    text: "Super Admin has full system access. They can manage all organizations, users, view all shipments, drivers, vehicles, and system settings. They can also create other Super Admins (requires secret key). Super Admins see a dedicated dashboard with system‑wide statistics.",
    metadata: { source: "user_guide", topic: "roles", keywords: ["super admin", "super_admin"] },
  },
  {
    id: "roles_company_admin",
    text: "Company Admin manages a single organization. They can view and manage users, drivers, vehicles, warehouses, products, and shipments within their company. They can also generate reports and update company settings. They cannot see data from other organizations.",
    metadata: { source: "user_guide", topic: "roles", keywords: ["company admin", "company_admin"] },
  },
  {
    id: "roles_dispatcher",
    text: "Dispatcher focuses on shipment management. They can create, edit, assign drivers/vehicles to shipments, update shipment status, use the AI Route Optimizer, and view drivers and vehicles. Dispatchers cannot manage users or company settings.",
    metadata: { source: "user_guide", topic: "roles", keywords: ["dispatcher"] },
  },
  {
    id: "roles_driver",
    text: "Driver can only see shipments assigned to them. They can update shipment status (picked up, in transit, delivered) and update their current location (for real‑time tracking). Drivers also have access to the Route Optimizer for planning their deliveries.",
    metadata: { source: "user_guide", topic: "roles", keywords: ["driver"] },
  },
  {
    id: "roles_customer",
    text: "Customers can create their own shipments, track them, and view shipment history. They cannot see other users' data. Their dashboard shows only their own shipments.",
    metadata: { source: "user_guide", topic: "roles", keywords: ["customer"] },
  },

  // ==================== COMPANY SETTINGS (expanded) ====================
  {
    id: "company_settings",
    text: "Company Admins can update company settings from the 'Settings' page. Options include:\n- Company name, email, phone, address\n- Logo URL (for branding)\n- Notification preferences: enable/disable in‑app notifications and email notifications.\nChanges are saved by clicking 'Save Changes'.",
    metadata: { source: "feature", topic: "settings", keywords: ["company settings", "settings"] },
  },
  {
    id: "plan_information",
    text: "In company settings, you can see your current subscription plan (Free, Basic, Pro, Enterprise) and usage statistics (users used / max users). There is an 'Upgrade Plan' button to change your subscription (payment integration to be implemented).",
    metadata: { source: "feature", topic: "settings", keywords: ["plan", "subscription", "upgrade"] },
  },

  // ==================== DASHBOARDS (expanded) ====================
  {
    id: "dispatcher_dashboard",
    text: "The Dispatcher Dashboard shows key performance indicators: total shipments, in‑transit, delivered, pending, and available drivers/vehicles. It also provides quick action links: Create Shipment, Assign Driver, and View All Shipments.",
    metadata: { source: "dashboard", topic: "dispatcher", keywords: ["dispatcher dashboard"] },
  },
  {
    id: "driver_dashboard",
    text: "The Driver Dashboard displays the driver's assigned shipments, their status, and quick actions: Update Location (for real‑time tracking), View My Shipments, and Route Optimizer. It also shows performance stats (total deliveries, rating).",
    metadata: { source: "dashboard", topic: "driver", keywords: ["driver dashboard"] },
  },
  {
    id: "customer_dashboard",
    text: "The Customer Dashboard shows the customer's recent shipments with statuses and allows them to create new shipments, track existing ones, and view shipment history.",
    metadata: { source: "dashboard", topic: "customer", keywords: ["customer dashboard"] },
  },
  {
    id: "company_dashboard",
    text: "The Company Dashboard provides an overview of the entire company: total users, drivers, vehicles, shipments, and shipment completion rates. Recent shipments are listed with a link to view details.",
    metadata: { source: "dashboard", topic: "company", keywords: ["company dashboard"] },
  },
  {
    id: "super_admin_dashboard",
    text: "The Super Admin Dashboard shows system‑wide statistics: total organizations, total users, total shipments, active subscriptions, plus quick actions to manage organizations, users, and system settings.",
    metadata: { source: "dashboard", topic: "super_admin", keywords: ["super admin dashboard"] },
  },

  // ==================== FAQ & TROUBLESHOOTING (expanded) ====================
  {
    id: "faq_cannot_login",
    text: "If you cannot log in, check that your email and password are correct. Use the 'Forgot Password' link to reset your password. If you still cannot log in, contact your company administrator to check if your account is active.",
    metadata: { source: "faq", topic: "troubleshooting", keywords: ["cannot login", "login failed"] },
  },
  {
    id: "faq_shipment_not_showing",
    text: "If a shipment you created does not appear in your list, check the filters (status, date range) to ensure you are not hiding it. Refresh the page. If it still does not appear, contact support.",
    metadata: { source: "faq", topic: "troubleshooting", keywords: ["shipment not showing", "missing shipment"] },
  },
  {
    id: "faq_assign_driver_no_drivers",
    text: "When trying to assign a driver to a shipment, if no drivers appear in the list, ensure that you have at least one driver added in the Drivers section and that the driver's status is 'available' (or that they are active).",
    metadata: { source: "faq", topic: "troubleshooting", keywords: ["no drivers available", "assign driver empty"] },
  },
  {
    id: "faq_route_optimizer_no_result",
    text: "If the AI Route Optimizer does not return a route, make sure you have added at least 2 points on the map. Also check that your internet connection is working because the optimizer uses external mapping services.",
    metadata: { source: "faq", topic: "troubleshooting", keywords: ["route optimizer not working", "no route"] },
  },
  {
    id: "faq_export_csv_not_working",
    text: "If CSV export does not start, check that your browser allows downloads from this site. Try refreshing the page and exporting again. If the list has many rows, the export may take a few seconds.",
    metadata: { source: "faq", topic: "troubleshooting", keywords: ["export failed", "csv not downloading"] },
  },
  {
    id: "faq_waybill_not_generated",
    text: "Waybills are generated automatically when a shipment is created. If a waybill is missing, go to the shipment details page and click 'Generate Waybill'. If the error persists, contact support.",
    metadata: { source: "faq", topic: "troubleshooting", keywords: ["waybill missing", "no waybill"] },
  },

  // ==================== ADDITIONAL FEATURES ====================
  {
    id: "notifications",
    text: "LogiTrack supports in‑app notifications. When a shipment status changes or a driver is assigned, you may receive a notification. The notification bell icon in the navbar shows unread notifications. You can mark them as read individually or all at once.",
    metadata: { source: "feature", topic: "notifications", keywords: ["notification", "bell", "alert"] },
  },
  {
    id: "pagination",
    text: "Most list pages (shipments, drivers, vehicles, warehouses, products) use pagination to improve performance. You can navigate between pages using the 'Previous' and 'Next' buttons. The current page and total number of items are displayed.",
    metadata: { source: "feature", topic: "ui", keywords: ["pagination", "pages", "previous", "next"] },
  },
  {
    id: "search_functionality",
    text: "Each list page has a search box that allows you to filter results by keywords. For shipments, you can search by tracking number or customer name. For drivers, by name or license number. For vehicles, by license plate, brand, or model. The search is case‑insensitive.",
    metadata: { source: "feature", topic: "ui", keywords: ["search", "filter", "find"] },
  },
  {
    id: "date_pickers",
    text: "Date pickers are used to filter reports and shipments by date range. You can select a start date and an end date. The date format is YYYY-MM-DD. Click the calendar icon or type the date manually.",
    metadata: { source: "feature", topic: "ui", keywords: ["date picker", "calendar", "date range"] },
  },
  {
    id: "loading_spinner",
    text: "While data is being fetched from the server, a loading spinner (animated circle) is displayed. This indicates that the request is in progress. If the spinner stays for more than 10 seconds, there may be a network issue.",
    metadata: { source: "feature", topic: "ui", keywords: ["loading", "spinner", "loading indicator"] },
  },
  {
    id: "error_handling",
    text: "When an API request fails, an error alert is shown at the top of the page with a descriptive message. You can dismiss the alert by clicking the 'X' button. Common errors include network issues, authentication problems, or missing data.",
    metadata: { source: "feature", topic: "ui", keywords: ["error", "alert", "error message"] },
  },
  {
    id: "confirm_dialog",
    text: "Before performing destructive actions (like deleting a shipment, driver, vehicle, or product), LogiTrack shows a confirmation dialog. You must confirm the action to proceed. This prevents accidental deletions.",
    metadata: { source: "feature", topic: "ui", keywords: ["confirm", "delete confirmation", "are you sure"] },
  },

  // ==================== ADDITIONAL FAQ (more troubleshooting) ====================
  {
    id: "faq_browser_compatibility",
    text: "LogiTrack works best with modern browsers: Chrome, Firefox, Edge, and Safari. Please ensure your browser is up‑to‑date. Some features (like map click for route optimizer) may not work in older browsers.",
    metadata: { source: "faq", topic: "troubleshooting", keywords: ["browser", "compatibility", "chrome", "firefox"] },
  },
  {
    id: "faq_map_not_loading",
    text: "If the map in the Route Optimizer does not load, check your internet connection. The map uses OpenStreetMap tiles and requires external access. Also, ensure that you have not blocked JavaScript or tracking scripts.",
    metadata: { source: "faq", topic: "troubleshooting", keywords: ["map not loading", "route optimizer map"] },
  },
  {
    id: "faq_email_notifications_not_received",
    text: "Email notifications are sent from the system email address. If you are not receiving them, check your spam folder. Also verify that your email address is correct in your profile. If the problem persists, contact your system administrator.",
    metadata: { source: "faq", topic: "troubleshooting", keywords: ["email not received", "notification email"] },
  },
];