const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...')

    // 1. Create the Super Admin user
    console.log('📝 Creating Super Admin user...')
    
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        id: 'super-admin-user',
        email: 'shaniparacha2021@gmail.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        password_hash: hashedPassword,
        is_active: true
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ Error creating user:', userError)
      return
    }

    console.log('✅ Super Admin user created/updated:', user.email)

    // 2. Create initial activity log
    console.log('📝 Creating initial activity log...')
    
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        email: user.email,
        action: 'ACCOUNT_CREATED',
        ip_address: '127.0.0.1',
        user_agent: 'System Setup'
      })

    if (logError) {
      console.error('❌ Error creating activity log:', logError)
    } else {
      console.log('✅ Initial activity log created')
    }

    // 3. Clean up any old verification codes
    console.log('🧹 Cleaning up old verification codes...')
    
    const { error: cleanupError } = await supabase
      .from('verification_codes')
      .delete()
      .eq('user_id', user.id)

    if (cleanupError) {
      console.error('❌ Error cleaning up verification codes:', cleanupError)
    } else {
      console.log('✅ Old verification codes cleaned up')
    }

    console.log('🎉 Database setup completed successfully!')
    console.log('📧 Email: shaniparacha2021@gmail.com')
    console.log('🔑 Password: admin123')

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()
