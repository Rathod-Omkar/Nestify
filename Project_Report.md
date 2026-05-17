# Project Report: Nestify - Accommodation Booking Platform

## Chapter 1: Introduction

### 1.1 Problem Statement
Traditional accommodation booking platforms often lack dedicated features focusing on women's safety and environmental sustainability. Furthermore, many platforms suffer from a lack of rigorous verification for property listings, leading to trust and safety issues for guests. There is a need for a secure platform where listings are thoroughly vetted by administrators, and specific safety and sustainability metrics are highlighted.

### 1.2 Objectives
* To develop a secure, robust, and user-friendly accommodation booking platform using the MVC architecture.
* To implement a unique "Women Safety Rating" system that ensures integrity by allowing only female guests to rate properties, and strictly only after their stay is completed.
* To integrate a "Sustainability Score" based on a structured checklist (e.g., solar power, waste segregation) that must be verified by administrators with uploaded evidence.
* To provide a comprehensive Admin Dashboard for vetting listings through document verification (Aadhar card, electricity bills, sales deeds), managing users, and maintaining audit logs.

### 1.3 Scope
The system covers the entire lifecycle of a property rental platform:
* User registration, authentication, and profile management.
* Property listing creation by hosts with image and document uploads.
* Booking request system with automatic conflict detection to prevent double-booking.
* An Admin workflow for reviewing, approving, or rejecting listings.
* Specialized rating systems including general property reviews, women safety tags, and calculated sustainability scores.
* An in-app notification system to keep users updated on their booking and listing statuses.

---

## Chapter 2: Design

### 2.1 System Architecture
The application is built using the **MVC (Model-View-Controller)** architecture to ensure a clean separation of concerns:
* **Model**: Defines the database schema and data logic using MongoDB and Mongoose.
* **View**: Handles the user interface and presentation logic using EJS (Embedded JavaScript) templates, HTML, CSS, and Bootstrap.
* **Controller**: Contains the business logic, processing incoming requests from routes, interacting with the models, and rendering the appropriate views.
The system uses **Node.js** and **Express.js** for the backend server environment.

### 2.2 Database Design
The MongoDB database consists of several interconnected collections:
* **Users**: Stores user details, encrypted passwords (via Passport-Local Mongoose), gender, and contact info.
* **Listings**: Contains property details, pricing, location, images, uploaded verification documents, sustainability checklist, and embedded arrays for safety and property ratings.
* **Bookings**: Links a Guest (User) to a Listing and an Owner (User). Stores check-in/check-out dates, status (pending, accepted, rejected, cancelled), and total price.
* **Reviews**: Stores general property reviews linked to specific bookings.
* **Admins**: Stores administrator credentials and roles.
* **Notifications**: Manages in-app alerts for users regarding booking and listing updates.
* **AuditLogs**: Tracks administrative actions (approvals/rejections) for accountability.

---

## Chapter 3: Implementation

### 3.1 Frontend Development
* **Technologies**: EJS templates, HTML5, Vanilla CSS, and Bootstrap 5 for responsive, mobile-friendly design.
* **User Experience**: Implemented a dynamic light/dark mode theme toggle. Used `connect-flash` to provide immediate visual feedback (success/error alerts) for user actions.
* **Interactive Elements**: Integrated `flatpickr` for calendar date selection on the booking page, dynamically disabling dates that are already booked or pending to prevent overlapping requests.

### 3.2 Backend Development
* **Server Setup**: Built with Node.js and Express.js.
* **Authentication**: Implemented robust session management and authentication using `passport` and `passport-local`.
* **File Handling**: Used `multer` to handle multipart/form-data for uploading listing images and verification documents safely.
* **Data Integrity**: Implemented centralized error handling wrapping all asynchronous routes. Used atomic MongoDB operations (`$set`, `$exists`, `$ne`) to prevent race conditions and duplicate submissions in the women safety rating feature.

### 3.3 Integration
* Connected frontend forms securely to backend RESTful endpoints.
* Integrated the sustainability rating utility to automatically calculate scores based on checked features, which the admin can override during the verification process.
* Integrated environment variables (`dotenv`) to securely manage database URIs and session secrets.

---

## Chapter 4: Testing

### 4.1 Test Cases
1. **User Authentication**: Verify that users can securely sign up, log in, and log out. Test access control middleware ensuring protected routes are inaccessible to unauthenticated users.
2. **Listing Verification Workflow**: Test that a host can upload a listing with documents. Verify that the listing remains hidden until an admin reviews the documents, adjusts the sustainability checklist, and approves it.
3. **Booking Conflict Detection**: Attempt to book dates that overlap with an already "accepted" or "pending" booking to ensure the system blocks the request.
4. **Women Safety Rating Constraints**: Verify that male users cannot see the rating form. Verify that female users cannot submit a rating before the check-out date has passed. Verify that duplicate rating submissions are blocked.
5. **Admin User Management**: Test the cascading deletion of a user and ensure all associated listings are also removed from the database.

### 4.2 Results
* The authentication and authorization middleware successfully secures the application.
* The booking conflict logic correctly identifies overlapping dates and prevents double bookings.
* Atomic database queries successfully enforce the one-rating-per-booking rule for women's safety, and correctly calculate average ratings.
* The application runs stably with the global error handler catching unforeseen exceptions and preventing server crashes.

---

## Chapter 5: Conclusion

### 5.1 Summary
Nestify successfully demonstrates a modern accommodation booking platform that prioritizes user safety and environmental awareness. By implementing rigorous administrative verification processes, automated booking conflict resolution, and specialized, strictly-enforced rating systems, the project meets its objectives of creating a trustworthy and feature-rich rental application.

### 5.2 Future Enhancements
* **Payment Integration**: Integrate a real payment gateway (like Stripe or Razorpay) to process transactions instead of just recording the total price.
* **Map Integration**: Add Mapbox or Google Maps API to display exact listing locations and allow location-based searching.
* **Real-time Chat**: Implement Socket.io to allow direct, real-time messaging between guests and hosts.
* **Email Verification**: Add OTP or link-based email verification during user sign-up using Nodemailer.

---

## Chapter 6: References
* Node.js Official Documentation (nodejs.org)
* Express.js Framework Documentation (expressjs.com)
* MongoDB and Mongoose ODM Documentation (mongoosejs.com)
* Bootstrap 5 Documentation (getbootstrap.com)
* Passport.js Authentication Middleware (passportjs.org)

---

## Chapter 7: Appendices
*(College specific content: Attach screenshots of the application, including the home page, booking calendar, admin dashboard, and women safety rating form here).*

---

## Chapter 8: Annexure - Progress Sheet
*(College specific content: Attach signed progress sheets from the project guide/mentor here).*
