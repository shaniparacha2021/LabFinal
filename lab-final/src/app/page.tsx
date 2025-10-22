import { 
  Shield, 
  Users, 
  Database, 
  Zap, 
  Lock, 
  Globe, 
  BarChart3, 
  FileText,
  CheckCircle,
  ArrowRight
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              LabFinal
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#tech-stack" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
              Tech Stack
            </a>
            <a href="#architecture" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
              Architecture
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          SaaS Lab Management System
          </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Complete multi-tenant laboratory management platform with role-based access control, 
          dynamic test templates, and comprehensive reporting.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
          <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors">
            View Demo
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-8 w-8 text-blue-600" />,
                title: "Multi-Tenant Architecture",
                description: "Complete data isolation with role-based access control for Super Admin, Admin, and Users."
              },
              {
                icon: <FileText className="h-8 w-8 text-green-600" />,
                title: "Dynamic Test Templates",
                description: "Build custom test templates with nested parameters and subgroups for comprehensive lab testing."
              },
              {
                icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
                title: "Analytics Dashboard",
                description: "Real-time analytics and reporting for all user roles with customizable dashboards."
              },
              {
                icon: <Lock className="h-8 w-8 text-red-600" />,
                title: "Two-Factor Authentication",
                description: "Enhanced security with 2FA support using TOTP for secure login and data protection."
              },
              {
                icon: <Database className="h-8 w-8 text-orange-600" />,
                title: "Patient Management",
                description: "Complete patient registration, test management, and report generation with PDF support."
              },
              {
                icon: <Zap className="h-8 w-8 text-yellow-600" />,
                title: "Real-time Updates",
                description: "Live updates and notifications across all devices with Supabase real-time subscriptions."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech-stack" className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Technology Stack
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Frontend & Backend
              </h3>
              <div className="space-y-4">
                {[
                  { name: "Next.js 14", description: "React framework with App Router and TypeScript" },
                  { name: "Tailwind CSS", description: "Utility-first CSS framework for rapid UI development" },
                  { name: "Radix UI", description: "Accessible component primitives for React" },
                  { name: "React Hook Form", description: "Performant forms with easy validation" },
                  { name: "Zustand", description: "Lightweight state management" },
                  { name: "TanStack Query", description: "Powerful data synchronization for React" }
                ].map((tech, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">{tech.name}</span>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{tech.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Database & Infrastructure
              </h3>
              <div className="space-y-4">
                {[
                  { name: "Supabase", description: "PostgreSQL database with real-time and auth" },
                  { name: "Prisma", description: "Type-safe database ORM with migrations" },
                  { name: "Row Level Security", description: "Database-level multi-tenancy isolation" },
                  { name: "Vercel", description: "Serverless deployment platform" },
                  { name: "GitHub", description: "Version control and CI/CD" },
                  { name: "Cloudflare", description: "CDN and DNS management" }
                ].map((tech, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">{tech.name}</span>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{tech.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Architecture Overview
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg mb-4">
                  <Globe className="h-12 w-12 text-blue-600 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Frontend (Vercel)
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Next.js application with TypeScript, Tailwind CSS, and responsive design
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg mb-4">
                  <Database className="h-12 w-12 text-green-600 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Backend (API Routes)
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Serverless API routes with authentication and business logic
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg mb-4">
                  <Shield className="h-12 w-12 text-purple-600 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Database (Supabase)
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  PostgreSQL with Row Level Security for multi-tenant data isolation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6" />
            <span className="text-xl font-bold">LabFinal</span>
          </div>
          <p className="text-gray-400 mb-4">
            SaaS-based Lab Management System - Built with Next.js, TypeScript, and Supabase
          </p>
          <p className="text-sm text-gray-500">
            Repository: LabFinal | Username: shaniparacha2021 | Email: shaniparacha2021@gmail.com
          </p>
        </div>
      </footer>
    </div>
  )
}