#!/usr/bin/env node

/**
 * Database Setup Script for Lab Management System
 * This script helps set up the initial database structure and data
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Setting up Lab Management System database...\n')

  try {
    // 1. Create initial tenant (Super Admin organization)
    console.log('📋 Creating initial tenant...')
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: 'super-admin-tenant',
        name: 'Super Admin Organization',
        slug: 'super-admin',
        subscription_type: 'LIFETIME',
        subscription_status: 'ACTIVE',
        features: ['all']
      })
      .select()
      .single()

    if (tenantError && !tenantError.message.includes('duplicate')) {
      throw tenantError
    }

    console.log('✅ Tenant created successfully')

    // 2. Create Super Admin user
    console.log('👤 Creating Super Admin user...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: 'super-admin-user',
        email: 'shaniparacha2021@gmail.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        tenant_id: 'super-admin-tenant'
      })
      .select()
      .single()

    if (userError && !userError.message.includes('duplicate')) {
      throw userError
    }

    console.log('✅ Super Admin user created successfully')

    // 3. Create sample lab tenant
    console.log('🏥 Creating sample lab tenant...')
    const { data: labTenant, error: labError } = await supabase
      .from('tenants')
      .insert({
        name: 'ABC Medical Laboratory',
        slug: 'abc-medical-lab',
        subscription_type: 'TRIAL',
        subscription_status: 'ACTIVE',
        features: ['patient_management', 'test_management', 'report_generation']
      })
      .select()
      .single()

    if (labError && !labError.message.includes('duplicate')) {
      throw labError
    }

    console.log('✅ Sample lab tenant created successfully')

    // 4. Create sample lab admin
    console.log('👨‍💼 Creating sample lab admin...')
    const { data: labAdmin, error: labAdminError } = await supabase
      .from('users')
      .insert({
        email: 'admin@abcmedicallab.com',
        name: 'Dr. John Smith',
        role: 'ADMIN',
        tenant_id: labTenant.id
      })
      .select()
      .single()

    if (labAdminError && !labAdminError.message.includes('duplicate')) {
      throw labAdminError
    }

    console.log('✅ Sample lab admin created successfully')

    // 5. Create sample test template
    console.log('🧪 Creating sample test template...')
    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert({
        tenant_id: labTenant.id,
        name: 'Complete Blood Count (CBC)',
        description: 'A complete blood count test to measure different components of blood',
        price: 25.00,
        parameters: [
          {
            id: 'hemoglobin',
            name: 'Hemoglobin',
            type: 'NUMBER',
            unit: 'g/dL',
            normal_range: '12.0 - 15.5',
            required: true
          },
          {
            id: 'white_blood_cells',
            name: 'White Blood Cells',
            type: 'NUMBER',
            unit: 'cells/μL',
            normal_range: '4,500 - 11,000',
            required: true
          },
          {
            id: 'platelets',
            name: 'Platelets',
            type: 'NUMBER',
            unit: 'cells/μL',
            normal_range: '150,000 - 450,000',
            required: true
          }
        ]
      })
      .select()
      .single()

    if (testError && !testError.message.includes('duplicate')) {
      throw testError
    }

    console.log('✅ Sample test template created successfully')

    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📊 Summary:')
    console.log('   - Super Admin Organization created')
    console.log('   - Super Admin user: shaniparacha2021@gmail.com')
    console.log('   - Sample lab: ABC Medical Laboratory')
    console.log('   - Sample admin: admin@abcmedicallab.com')
    console.log('   - Sample test: Complete Blood Count (CBC)')
    console.log('\n🚀 You can now start using the application!')

  } catch (error) {
    console.error('❌ Error setting up database:', error.message)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()
