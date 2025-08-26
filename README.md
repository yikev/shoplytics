# 🛒 Shoplytics

Shoplytics is a **Next.js 15** demo application for order and customer analytics.  
It features a modern dashboard with KPIs, charts, recent orders, and full CRUD-like views for browsing and managing orders.  
Built with **Next.js App Router**, **Prisma**, **NextAuth**, **Mantine UI**, and **Recharts**.

---

## ✨ Features

- 🔐 **Authentication** with NextAuth  
- 📊 **Dashboard** with KPIs, sales charts, and recent orders widget  
- 📂 **Orders Management**  
  - Search, filter, and sort orders  
  - Pagination with URL sync (shareable filters)  
  - Order detail view with full line-item breakdown  
  - Update order status with **optimistic UI**  
- 👥 **Customer Segments** (high / mid / low scoring via RFM-style logic)  
- ⚡ **Modern UI** using Mantine components with Suspense, Skeletons, and Client/Server components  

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/shoplytics.git
cd shoplytics
```
### 2. Install dependencies
```bash
npm install
# or
yarn install
```
### 3. Set up environment
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```
### 4. Set up the database
```bash
npx prisma migrate dev
npx prisma db seed
```
### 5. Run the development server
```bash
npm run dev
````

Visit http://localhost:3000 🎉

🛠 Tech Stack
	•	Next.js 15 (App Router, Server & Client Components)
	•	Prisma ORM
	•	NextAuth.js Authentication
	•	Mantine React components
	•	Recharts for data visualizations
	•	TypeScript

📦 Deployment

The easiest way to deploy is via Vercel:
```
vercel
```
Shoplytics will auto-optimize using Next.js build and deploy globally.

📜 License

MIT © 2025 Kevin Yi

```
---

👉 This makes the project look professional:  
- Gives context (*what is Shoplytics?*)  
- Quick start instructions  
- Tech stack highlight  
- Deployment steps  

Do you want me to also add a **demo section with screenshots/GIF placeholders** so your README looks portfolio-ready for recruiters?
```