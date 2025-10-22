import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to Super Admin login page
  redirect('/super-admin/login')
}